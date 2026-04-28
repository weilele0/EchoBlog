package jwt

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// 加密用来签名的
var jwtSecret = []byte("echoblog-secret-key-2026") // 建议后续放到 config 中

type Claims struct {
	UserID               uint   `json:"user_id"`  //用户ID
	Username             string `json:"username"` //用户名
	jwt.RegisteredClaims        // JWT 标准字段（过期时间、签发时间等）
} //Token 里藏着用户信息，后端解析后就能知道谁在请求接口

// GenerateToken 生成 JWT Token
func GenerateToken(userID uint, username string) (string, error) {
	//设置过期时间
	expireTime := time.Now().Add(24 * time.Hour) // 24小时过期
	//实例化结构体
	claims := Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			//把go的时间准换成jwt的时间格式
			ExpiresAt: jwt.NewNumericDate(expireTime), //过期时间
			IssuedAt:  jwt.NewNumericDate(time.Now()), //签发时间
			Issuer:    "echoblog",                     //签发人
		},
	}
	//  新建一个jwt  token      //加密算法      token的内容
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	//用密钥把内容签名加密最终得到字符串   //密钥
	return token.SignedString(jwtSecret)
}

// ParseToken 解析 JWT Token
func ParseToken(tokenString string) (*Claims, error) {
	//               解析并验证字符串   前端穿过来的加密字符串 解析成claims结构体自动填充到结构体里
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		//jwt库自己传入token//回调函数//固定写法
		func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})
	//解析出错，直接返回错误
	if err != nil {
		return nil, err
	}
	//上面返回的是空接口类型，所以需要重新判断类型     //jwt库自带的最终检查
	if claims, ok := token.Claims.(*Claims); ok && token.Valid { //检查签名是否未过期，未被篡改，格式合法
		return claims, nil
	}

	return nil, jwt.ErrTokenInvalidClaims //jwt错误类型  calims无效，token不合法
}
