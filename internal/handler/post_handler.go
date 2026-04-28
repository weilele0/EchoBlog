package handler

import (
	"net/http"
	"strconv"

	"echblog/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PostHandler struct{}

var PostHdl = new(PostHandler)

// CreatePost 发布文章
func (h *PostHandler) CreatePost(c *gin.Context) {
	userID, _ := c.Get("user_id") // 从 JWT 中间件获取
	// 定义前端传过来的格式
	var req struct {
		Title      string `json:"title" binding:"required"`
		Content    string `json:"content" binding:"required"`
		CategoryID uint   `json:"category_id"`
		TagIDs     []uint `json:"tag_ids"`
	}
	// 把前端传的 JSON 绑定到结构体
	/*读取前端传过来的 JSON
	自动把里面的字段，塞进你定义的 req 结构体*/ //失败
	if err := c.ShouldBindJSON(&req); err != nil {
		//返回错误信息
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	//从JWT获取的用户ID  传入的标题
	post, err := service.PostSrv.CreatePost(userID.(uint), req.Title, req.Content, req.CategoryID, req.TagIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "文章发布成功",
		"post":    post,
	})
}

// GetPostList 获取文章列表
func (h *PostHandler) GetPostList(c *gin.Context) {
	//DefaultQuery = 有值用值，没值用默认
	//Query = 有值用值，没值为空
	//       //把字符串转成数字  获取前端传来的页码   没传默认1
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	//                           获取每页显示多少条
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	//                                分类id，不传就没有
	categoryID, _ := strconv.Atoi(c.Query("category_id"))
	//调用服务层的方法          传入参数
	posts, total, err := service.PostSrv.GetPostList(page, pageSize, uint(categoryID), 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts, //文章列表数组
		"total": total, //符合条件的总数
		"page":  page,
	})
}

// GetPostByID 获取文章详情
func (h *PostHandler) GetPostByID(c *gin.Context) {
	// 1. 从URL里获取文章ID
	idStr := c.Param("id")
	// 2. 把字符串ID转成数字ID        ID      十进制    UINT32
	id, err := strconv.ParseUint(idStr, 10, 32)
	//strconv.ParseUint(...) 是 专门把【字符串】转成【无符号整数】的函数
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的文章ID"})
		return
	}

	post, err := service.PostSrv.GetPostByID(uint(id))
	if err != nil {
		//记录没找到，查询不到就触发这个
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "文章不存在"})
			return
		}
		//服务器错误或其他错误，不是查不到
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"post": post,
	})
}

// UpdatePost 编辑文章
func (h *PostHandler) UpdatePost(c *gin.Context) {
	//获取当前登录的用户id
	userID, _ := c.Get("user_id")
	//获取传入的要修改的文章id/把 URL 里的字符串 id 转成无符号数字  10进制  32位
	postID, _ := strconv.ParseUint(c.Param("id"), 10, 32)
	//c.param  从url路径里获取id
	//strconv.parseuint()把字符串转换为无符号整数
	var req struct { //接收前端 JSON 数据的模板
		Title      string `json:"title" binding:"required"`
		Content    string `json:"content" binding:"required"`
		CategoryID uint   `json:"category_id"`
		TagIDs     []uint `json:"tag_ids"`
	}
	//前端传进来的数据自动装入刚才定义的结构体
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	//调用服务层去修改文章
	err := service.PostSrv.UpdatePost(userID.(uint), uint(postID), req.Title, req.Content, req.CategoryID, req.TagIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "文章编辑成功"})
}

// DeletePost 删除文章
func (h *PostHandler) DeletePost(c *gin.Context) {
	userID, _ := c.Get("user_id")
	postID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

	err := service.PostSrv.DeletePost(userID.(uint), uint(postID))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "文章删除成功"})
}

// GetMyPosts 获取我的文章列表
func (h *PostHandler) GetMyPosts(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	posts, err := service.PostSrv.GetMyPosts(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
	})
}
