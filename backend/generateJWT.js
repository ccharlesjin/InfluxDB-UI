const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();
// 加载私钥
const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_FILE);

// 定义JWT的payload
const payload = {
  sub: 'admin',  // 用户ID或用户名
  iat: Math.floor(Date.now() / 1000),  // JWT的签发时间
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30 * 6),  // 6个月的过期时间
  role: 'admin'  // 可以加入其他自定义字段，如用户角色
};

// 生成JWT Token
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

console.log("Generated long-term JWT Token: ", token);