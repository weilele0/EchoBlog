package handler

import (
	"echblog/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct{}

var CategoryHdl = new(CategoryHandler)

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	categories, err := service.CategorySrv.GetAllCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}
