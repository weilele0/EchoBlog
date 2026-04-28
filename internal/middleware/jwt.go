package middleware

import (
	"echblog/pkg/jwt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) { //中间件的标准函数
		//它是 HTTP 标准认证头，专门用来传递身份凭证token
		authHeader := c.GetHeader("Authorization") //从请求中读取Authorization
		if authHeader == "" {                      //没读到，说明401没授权
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    http.StatusUnauthorized, //返回状态码
				"message": "请求头中缺少 Authorization Token",
			})
			c.Abort() //中断请求
			return
		}
		//严格校验 Authorization 头必须是 Bearer <token> 标准格式
		//解析Token，读到了，就下来  （要切割的字符串  分隔符  切几份   ）返回[]string
		parts := strings.SplitN(authHeader, " ", 2) //SplitN切割字符串，
		//长度不等于2，并且第一段类型为bearer，则格式非法
		if !(len(parts) == 2 && parts[0] == "Bearer") { // 一种 HTTP 标准认证方案（认证类型）
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Token 格式错误，必须为 Bearer 类型",
			})
			c.Abort()
			return
		}
		//claims=Bearer eyJhbGciOiJIUz 第一段为类型 第二段为token字符串
		// 解析 Token
		//自己写的解析的方法   解析第二段
		claims, err := jwt.ParseToken(parts[1]) //返回结构体或者错误信息
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "无效的 Token 或 Token 已过期",
			})
			c.Abort()
			return
		}

		// 把用户信息存入 Context，供后续 handler 使用
		//存入到gin.Context结构体内部的一个map里
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		//校验通过，让请求去访问真正的接口
		c.Next() // 继续执行后续 handler
	}
}
