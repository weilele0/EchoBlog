package handler

import (
	"echblog/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct{}

var UserHdl = new(UserHandler)

// Register 用户注册
func (h *UserHandler) Register(c *gin.Context) {
	var req struct { //临时承载 JSON 入参，用完即销毁，不污染全局。
		Username string `json:"username" binding:"required"`    //Gin 参数校验规则
		Password string `json:"password" binding:"required"`    //必须传入
		Email    string `json:"email" binding:"required,email"` //必须符合邮箱格式
	}
	///读取请求中application/json数据 把json字符串解析并填充到给的结构体指针中
	//自动执行结构体中的校验
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	//调用服务层的注册，传入刚刚被转换后的结构体中的数据
	user, err := service.UserSrv.Register(req.Username, req.Password, req.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "注册成功",
		"user":    user,
	})
}

// Login 用户登录
func (h *UserHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := service.UserSrv.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
	})
}
func (h *UserHandler) GetMe(c *gin.Context) {
	//如果exists为false说明没有信息
	userID, exists := c.Get("user_id") //中间件中设置的set
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "未登录"})
		return
	}
	//如果上面通过说明有值直接取出name
	username, _ := c.Get("username")

	// 查询数据库获取完整的用户信息（含昵称、简介等）
	user, err := service.UserSrv.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户信息失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":     200,
		"message":  "获取成功",
		"user_id":  userID,
		"username": username,
		"nickname": user.Nickname,
		"bio":      user.Bio,
	})
}

// UpdateProfile 更新用户资料（昵称、简介）
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "未登录"})
		return
	}

	var req struct {
		Nickname string `json:"nickname"` // 可选，留空则清空昵称
		Bio      string `json:"bio"`      // 可选
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数错误"})
		return
	}

	// 昵称长度限制
	if len(req.Nickname) > 20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "昵称最多 20 个字符"})
		return
	}
	// 简介长度限制
	if len(req.Bio) > 200 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "简介最多 200 个字符"})
		return
	}

	user, err := service.UserSrv.UpdateProfile(userID.(uint), req.Nickname, req.Bio)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "资料更新成功",
		"user": gin.H{
			"user_id":  user.ID,
			"username": user.Username,
			"nickname": user.Nickname,
			"bio":      user.Bio,
		},
	})
}
