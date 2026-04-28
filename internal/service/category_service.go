package service

import (
	"echblog/db"
	"echblog/internal/model"
)

type CategoryService struct{}

var CategorySrv = new(CategoryService)

func (s *CategoryService) GetAllCategories() ([]model.Category, error) {
	var categories []model.Category
	err := db.DB.Find(&categories).Error
	return categories, err
}
