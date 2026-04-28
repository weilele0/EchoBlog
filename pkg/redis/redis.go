package redis

import (
	"context"
	"echblog/config"
	"fmt"

	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func InitRedis() {
	Client = redis.NewClient(&redis.Options{
		Addr:     config.GlobalConfig.Redis.Addr,
		Password: config.GlobalConfig.Redis.Password,
		DB:       config.GlobalConfig.Redis.DB,
	})

	// 测试连接
	if err := Client.Ping(context.Background()).Err(); err != nil {
		panic("❌ Redis 连接失败: " + err.Error())
	}

	fmt.Println("✅ Redis 连接成功")
}
