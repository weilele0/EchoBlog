package model

import "time"

type Post struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	UserID     uint      `gorm:"index;not null" json:"user_id"`  //作者ID
	CategoryID uint      `gorm:"index" json:"category_id"`       // 分类ID
	Title      string    `gorm:"size:200;not null" json:"title"` // 标题
	Content    string    `gorm:"type:longtext" json:"content"`   // 内容
	CoverImage string    `gorm:"size:255" json:"cover_image"`    // 封面图
	Status     int       `gorm:"default:0" json:"status"`        // 0=草稿,1=发布
	Views      int       `gorm:"default:0" json:"views"`         // 浏览量
	CreatedAt  time.Time `json:"created_at"`                     // 创建时间
	UpdatedAt  time.Time `json:"updated_at"`                     // 更新时间

	// 关联关系
	User     User     `gorm:"foreignKey:UserID" json:"user"`
	Category Category `gorm:"foreignKey:CategoryID" json:"category"`
	Tags     []Tag    `gorm:"many2many:post_tags;" json:"tags"` //多对多
}

// TableName 指定表名
func (Post) TableName() string {
	return "posts"
}
