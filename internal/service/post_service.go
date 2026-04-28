package service

import (
	"context"
	"echblog/db"
	"echblog/internal/model"
	"echblog/pkg/redis"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

type PostService struct{}

var PostSrv = new(PostService)

// CreatePost 发布文章
func (s *PostService) CreatePost(userID uint, title, content string, categoryID uint, tagIDs []uint) (*model.Post, error) {
	post := &model.Post{
		UserID:     userID,
		Title:      title,
		Content:    content,
		CategoryID: categoryID,
		Status:     1, // 默认已发布
	}

	// 创建文章
	//写入到数据库中
	if err := db.DB.Create(post).Error; err != nil {
		return nil, err
	}

	// 添加标签（多对多）
	//如果前端传来的标签
	if len(tagIDs) > 0 {
		//创建一个标签结构体的切片
		var tags []model.Tag
		db.DB.Find(&tags, tagIDs) //数据库查出来放入tags里
		//多对多   给这个文章绑定  关联的是文章结构体里的tags字段  刚才的标签追加给这篇文章
		db.DB.Model(post).Association("Tags").Append(tags)
	}
	keys, _ := redis.Client.Keys(context.Background(), "posts:list:*").Result()
	if len(keys) > 0 {
		redis.Client.Del(context.Background(), keys...)
	} //清楚缓存
	return post, nil
}

// GetPostList 获取文章列表（支持分页）第几页   每页几条      分类id
func (s *PostService) GetPostList(page, pageSize int, categoryID uint, tagID uint) ([]model.Post, int64, error) {
	cacheKey := fmt.Sprintf("posts:list:%d:%d:%d", page, pageSize, categoryID)
	cached, err := redis.Client.Get(context.Background(), cacheKey).Result()
	if err == nil && cached != "" { //缓存命中
		var result struct {
			Posts []model.Post `json:"posts"`
			Total int64        `json:"total"` //符合添加的文章总数
		}
		json.Unmarshal([]byte(cached), &result) //反序列化
		return result.Posts, result.Total, nil
	}

	var posts []model.Post //存放查询出来的文章列表
	var total int64        //存放文章总数量
	// 调用数据库    指定操作的表           只查已发布的文章
	query := db.DB.Model(&model.Post{}).Where("status = ?", 1)
	//如果传了分类id 就只查该分类下的
	if categoryID > 0 {
		query = query.Where("category_id = ?", categoryID)
	}

	// 先统计总数
	//符合条件的文章总数
	query.Count(&total)

	// 分页查询 + 预加载关联
	//关联查询    把文章的者 分类 标签一起查出来
	err1 := query.Preload("User").Preload("Category").Preload("Tags").
		Order("created_at DESC").      //创建时间倒序
		Offset((page - 1) * pageSize). //实现分页功能
		//能实现第二页跳过第一页的数据开始，等于设置偏移量
		Limit(pageSize).   //每页取几条
		Find(&posts).Error //把查寻到的结果放入posts里

	if err1 != nil {
		return nil, 0, err
	}

	// 3. 把结果存入 Redis 缓存（5 分钟过期）
	cacheData := struct {
		Posts []model.Post `json:"posts"`
		Total int64        `json:"total"`
	}{Posts: posts, Total: total} //把数据库刚才获取的两个结果，打包成一个结构体

	cacheJSON, _ := json.Marshal(cacheData) //序列化结构体
	redis.Client.Set(context.Background(), cacheKey, cacheJSON, 5*time.Minute)

	return posts, total, nil
}

// GetPostByID 获取文章详情（带阅读量缓存）
func (s *PostService) GetPostByID(id uint) (*model.Post, error) {
	var post model.Post
	detailCacheKey := fmt.Sprintf("post:detail:%d", id) //文章内容key
	viewCacheKey := fmt.Sprintf("post:views:%d", id)    //阅读量key

	// 1. 读取文章缓存
	cached, err := redis.Client.Get(context.Background(), detailCacheKey).Result()
	if err == nil && cached != "" { //缓存命中
		json.Unmarshal([]byte(cached), &post) //字符串转回到结构体中
	} else {
		// 没缓存 → 读数据库
		err = db.DB.Preload("User").Preload("Category").Preload("Tags").First(&post, id).Error
		if err != nil {
			return nil, err
		}
		postJSON, _ := json.Marshal(post) //结构体内容转为json字符串
		//把文章 存进redis缓存中
		redis.Client.Set(context.Background(), detailCacheKey, postJSON, 30*time.Minute)
	}
	//阅读量+1
	redis.Client.Incr(context.Background(), viewCacheKey)
	//获取最新的阅读量
	views, _ := redis.Client.Get(context.Background(), viewCacheKey).Int64()
	//把最新的阅读量赋值给结构体，返回给前端
	post.Views = int(views)
	// 异步同步数据库
	go func() {
		db.DB.Model(&model.Post{}).Where("id = ?", id).UpdateColumn("views", views)
	}()
	return &post, nil
}

// UpdatePost 编辑文章（仅作者本人可编辑）
func (s *PostService) UpdatePost(userID uint, postID uint, title, content string, categoryID uint, tagIDs []uint) error {
	// UpdatePost 编辑文章（仅作者本人可编辑）
	// 功能：作者修改自己的文章（标题、内容、分类、标签）
	/*func (s *PostService) UpdatePost(
	userID uint,      // 当前登录的用户ID（是谁在改文章）
	postID uint,      // 要改的文章ID
	title string,     // 新标题
	content string,   // 新内容
	categoryID uint,  // 新分类ID
	tagIDs []uint,    // 新标签ID列表
	*/
	var post model.Post
	//根据文章id先找到文章放入到post结构体里
	if err := db.DB.First(&post, postID).Error; err != nil {
		return err
	}
	// 权限检查：只能编辑自己的文章
	if post.UserID != userID {
		return errors.New("无权限编辑该文章")
	}

	post.Title = title
	post.Content = content
	post.CategoryID = categoryID
	//修改好的文章保存到数据库中
	if err := db.DB.Save(&post).Error; err != nil {
		return err
	}
	// 更新标签
	if len(tagIDs) > 0 {
		var tags []model.Tag
		db.DB.Find(&tags, tagIDs)
		//操作的是这篇文章    操作文章里的标签            替换为新的标签
		db.DB.Model(&post).Association("Tags").Replace(tags)
	}
	keys, _ := redis.Client.Keys(context.Background(), "posts:list:*").Result() //清除缓存
	if len(keys) > 0 {
		redis.Client.Del(context.Background(), keys...)
	}
	return nil
}

// DeletePost 删除文章（仅作者本人可删除）
func (s *PostService) DeletePost(userID uint, postID uint) error {
	var post model.Post
	//根据文章id查询文章
	if err := db.DB.First(&post, postID).Error; err != nil {
		return err
	}
	//检查作者id和登录id是不是一样
	if post.UserID != userID {
		return errors.New("无权限删除该文章")
	}
	//删除文章
	keys, _ := redis.Client.Keys(context.Background(), "posts:list:*").Result()
	if len(keys) > 0 {
		redis.Client.Del(context.Background(), keys...)
	}
	return db.DB.Delete(&post).Error
}

// GetMyPosts 获取当前用户的所有文章
func (s *PostService) GetMyPosts(userID uint) ([]model.Post, error) {
	var posts []model.Post
	err := db.DB.Preload("Category").Preload("Tags").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&posts).Error
	return posts, err
}
