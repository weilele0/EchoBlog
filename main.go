package main

import (
	"echblog/config"
	"echblog/db"
	"echblog/pkg/redis"
	"echblog/routers"
	"fmt"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. 加载配置
	config.LoadConfig()
	// 2. 初始化数据库
	db.InitDB()
	// 3. 初始化 Redis
	redis.InitRedis()
	r := gin.Default()
	// 静态文件服务
	r.Static("/web", "./web")
	// 注册路由（后面会实现）
	routers.SetupRouter(r)

	fmt.Println("🚀 EchoBlog 服务启动成功 → http://localhost:8080")
	r.Run(":8080")
	r.Static("/web", "./web")
}
