package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	MySQL struct {
		Host     string `mapstructure:"host"`
		Port     string `mapstructure:"port"`
		User     string `mapstructure:"user"`
		Password string `mapstructure:"password"`
		DBName   string `mapstructure:"dbname"`
	} `mapstructure:"mysql"` //把 yaml 文件里的字段，自动映射到 Go 结构体里
	Redis struct {
		Addr     string `mapstructure:"addr"`
		Password string `mapstructure:"password"`
		DB       int    `mapstructure:"db"`
	} `mapstructure:"redis"`
	JWT struct { //登录 token 密钥、过期时间
		Secret string `mapstructure:"secret"`
		Expire int    `mapstructure:"expire"` // 小时
	} `mapstructure:"jwt"`
}

// 全局配置实例
var GlobalConfig Config

func LoadConfig() {
	//告诉viper 去哪读配置
	viper.SetConfigName("config")   // 文件名：config
	viper.SetConfigType("yaml")     // 文件类型：yaml
	viper.AddConfigPath("./config") // 找 config 文件夹下的
	// 设置默认值
	viper.SetDefault("mysql.host", "127.0.0.1")
	viper.SetDefault("mysql.port", 3306)
	viper.SetDefault("mysql.user", "root")
	viper.SetDefault("mysql.password", "123456")
	viper.SetDefault("mysql.dbname", "echoblog")
	viper.SetDefault("redis.addr", "localhost:6379")
	viper.SetDefault("redis.password", "123456")
	viper.SetDefault("redis.db", 0)
	viper.SetDefault("jwt.secret", "echoblog-secret-key-2026")
	viper.SetDefault("jwt.expire", 24)

	if err := viper.ReadInConfig(); err != nil { //去读取 config.yaml 文件
		fmt.Println("未找到 config.yaml，使用默认配置")
	}

	if err := viper.Unmarshal(&GlobalConfig); err != nil { //把配置文件放入全局变量里
		//如果格式不对，直接抛出异常，防止进程带病运行
		panic("配置解析失败: " + err.Error())
	}

	fmt.Println("✅ 配置加载成功")
}
