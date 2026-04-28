package routers

import (
	"echblog/internal/handler"
	"echblog/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {
	// ==================== 公开接口（不需要登录） ====================
	api := r.Group("/api")
	{
		// 用户公开接口
		api.POST("/user/register", handler.UserHdl.Register)
		api.POST("/user/login", handler.UserHdl.Login)

		// 文章公开接口
		api.GET("/posts", handler.PostHdl.GetPostList)            // 文章列表
		api.GET("/posts/:id", handler.PostHdl.GetPostByID)        // 文章详情
		api.GET("/categories", handler.CategoryHdl.GetCategories) // 分类列表
	}

	// ==================== 需要登录的接口 ====================
	auth := r.Group("/api")
	auth.Use(middleware.JWTAuthMiddleware()) // JWT 中间件
	{
		auth.GET("/user/me", handler.UserHdl.GetMe)
		auth.PUT("/user/profile", handler.UserHdl.UpdateProfile) // 更新个人资料

		// 需要登录的文章操作
		auth.POST("/posts", handler.PostHdl.CreatePost)       // 发布文章
		auth.PUT("/posts/:id", handler.PostHdl.UpdatePost)    // 编辑文章
		auth.DELETE("/posts/:id", handler.PostHdl.DeletePost) // 删除文章

		// 我的文章
		auth.GET("/my/posts", handler.PostHdl.GetMyPosts)
	}
}
