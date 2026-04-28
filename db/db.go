package db

import (
	"echblog/config"
	"echblog/internal/model"
	"fmt"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB //全局数据库连接对象

func InitDB() {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		config.GlobalConfig.MySQL.User,
		config.GlobalConfig.MySQL.Password,
		config.GlobalConfig.MySQL.Host,
		config.GlobalConfig.MySQL.Port,
		config.GlobalConfig.MySQL.DBName,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("❌ 数据库连接失败: " + err.Error())
	}
	//控制 MySQL 连接数量，防止太多请求把数据库压崩
	sqlDB, _ := DB.DB()
	sqlDB.SetMaxIdleConns(10)           // 最大空闲连接
	sqlDB.SetMaxOpenConns(100)          // 最大同时连接数
	sqlDB.SetConnMaxLifetime(time.Hour) // 连接最大存活时间

	fmt.Println("✅ GORM 成功连接到数据库：", config.GlobalConfig.MySQL.DBName)
	DB.AutoMigrate(&model.User{}, &model.Category{}, &model.Post{}, &model.Tag{})
	fmt.Println("✅ 所有表结构迁移完成")
}
