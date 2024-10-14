const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const https = require('https');
const httpProxy = require('http-proxy');
require('dotenv').config();

const app = express();

const jwt = require('jsonwebtoken');

// 使用cookie-parser中间件
app.use(cookieParser());

// 加载私钥
const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_FILE);
// 加载自签名的CA证书
const ca = fs.readFileSync(process.env.SSL_ROOT_CRT_FILE);

// 创建一个带有自定义CA的HTTPS Agent
const agent = new https.Agent({
  ca: ca  // 手动添加自签名证书到可信任列表
});

// 加载SSL证书
const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_FILE),
    cert: fs.readFileSync(process.env.SSL_CRT_FILE),
};

const proxy = httpProxy.createProxyServer({ secure: false }); // 创建代理服务器

// 使用 cookie-parser 解析客户端发送的 Cookie
app.use(cookieParser());

// 提取解码后的 cookie，并设置自定义 header
app.use((req, res, next) => {
    const token = req.cookies['session_token'];
    if (token) {
    const decodedCookie = jwt.verify(token, privateKey, { algorithms: ['RS256'] });
    console.log('Decoded Cookie:', decodedCookie);

    // 提取 user_id（假设解码后的字符串是 "user_id=12345; session_id=abcde"）
    const userId = decodedCookie.influxDB_token;

    if (userId) {
      // 设置自定义的 HTTP 头
      req.headers['X-WEBAUTH-USER'] = userId;
      console.log('Set custom header: X-WEBAUTH-USER:', userId);
    }
  }

  next();
});

// 使用 https 代理请求
app.use('/grafana/', (req, res) => {
  proxy.web(req, res, { target: 'https://localhost:4000/grafana/', changeOrigin: true });
});

// 创建 HTTPS 服务器
https.createServer(sslOptions, app).listen(3001, () => {
  console.log('HTTPS proxy server running on port 3001');
});