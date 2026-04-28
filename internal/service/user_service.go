package service

import (
	"echblog/db"
	"echblog/internal/model"
	"echblog/pkg/jwt"
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct{}

var UserSrv = new(UserService) //实例外面直接使用它来调用方法

// Register 用户注册
func (s *UserService) Register(username, password, email string) (*model.User, error) {
	// 1. 检查用户名或邮箱是否已存在
	var count int64
	db.DB.Model(&model.User{}).Where("username = ? OR email = ?", username, email).Count(&count)
	if count > 0 {
		return nil, errors.New("用户名或邮箱已存在")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}
	user := &model.User{
		Username: username,
		Password: string(hashedPassword),
		Email:    email,
	}

	user.Password = string(hashedPassword) // 把加密后的密码存入结构体
	//      调用数据库，生成并执行 INSERT 语句（必须传入结构体指针）
	if err := db.DB.Create(user).Error; err != nil {
		return nil, err
	}
	return user, nil
}

// Login 用户登录
func (s *UserService) Login(username, password string) (string, error) {
	var user model.User //                                                           查询第一条匹配记录
	if err := db.DB.Where("username = ? ", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound { //记录不存在，或密码错误
			return "", errors.New("用户名或密码错误")
		}
		return "", err
	}
	// 校验密码（使用 bcrypt 对比明文和加密后的密码）
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", errors.New("用户名或密码错误")
	}
	// 生成 JWT Token
	token, err := jwt.GenerateToken(user.ID, user.Username) //登录成功后生产jwt token
	if err != nil {
		return "", err
	}

	return token, nil
}

// UpdateProfile 更新用户资料（昵称、简介等，不支持修改用户名）
func (s *UserService) UpdateProfile(userID uint, nickname, bio string) (*model.User, error) {
	var user model.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}
	user.Nickname = nickname
	user.Bio = bio
	if err := db.DB.Save(&user).Error; err != nil {
		return nil, errors.New("资料更新失败")
	}
	return &user, nil
}

// GetUserByID 根据 ID 获取用户信息
func (s *UserService) GetUserByID(userID uint) (*model.User, error) {
	var user model.User
	if err := db.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}
	return &user, nil
}
