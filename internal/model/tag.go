package model

import "time"

type Tag struct {
	ID        uint   `gorm:"primarykey"`
	Name      string `gorm:"size:50;uniqueIndex;not null"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
