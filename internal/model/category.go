package model

import "time"

type Category struct {
	ID          uint      `gorm:"primarykey"`                   //分类ID
	Name        string    `gorm:"size:50;uniqueIndex;not null"` //分类名称
	Description string    `gorm:"type:text"`                    //分类描述
	CreatedAt   time.Time //创建时间
	UpdatedAt   time.Time //更新时间
}
