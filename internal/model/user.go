package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint   `gorm:"primarykey" json:"id"`
	Username  string `gorm:"size:50;uniqueIndex;not null" json:"username"` //唯一不能重复
	Email     string `gorm:"size:100;uniqueIndex;not null"`
	Password  string `gorm:"size:255;not null"`
	Nickname  string `gorm:"size:50" json:"nickname"`
	Avatar    string `gorm:"size:255"`  //头像图片地址
	Bio       string `gorm:"type:text"` //长文本//个人简介
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"` //软删除，增加索引
}

func (User) TableName() string {
	return "users"
}
