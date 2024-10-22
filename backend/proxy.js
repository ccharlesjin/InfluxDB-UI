const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const https = require('https');
const httpProxy = require('http-proxy');  // 引入 http-proxy 模块
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const ca = fs.readFileSync(process.env.SSL_ROOT_CRT_FILE);
// 创建一个带有自定义CA的HTTPS Agent
const agent = new https.Agent({
  ca: ca  // 手动添加自签名证书到可信任列表
});
// SSL证书和密钥路径
const sslOptions = {
    key: fs.readFileSync(process.env.SSL_KEY_FILE),
    cert: fs.readFileSync(process.env.SSL_CRT_FILE),
};

// 创建代理服务器实例
const proxy = httpProxy.createProxyServer({
    ws: true,      // 启用WebSocket支持
    secure: false, // 禁用SSL验证（如果使用自签名证书）
    changeOrigin: true, // 允许修改Origin头
});

// 使用 cookie-parser 中间件
app.use(cookieParser());

// 创建 HTTPS 服务器
const server = https.createServer(sslOptions, app);

// 提取解码后的 cookie，并设置自定义 header
app.use((req, res, next) => {
    const token = req.cookies['session_token'];
    if (token) {
        try {
            const decodedCookie = jwt.verify(token, fs.readFileSync(process.env.PRIVATE_KEY_FILE), { algorithms: ['RS256'] });
            console.log('Decoded Cookie:', decodedCookie);

            // 提取 user_id (influxDB_token)
            const userId = decodedCookie.influxDB_token;

            if (userId) {
                // 设置自定义的 HTTP 头
                req.headers['X-WEBAUTH-USER'] = userId;
                console.log('Set custom header: X-WEBAUTH-USER:', userId);
            }
        } catch (err) {
            console.error('JWT Verification Failed:', err);
        }
    }
    next();
});

// 处理普通 HTTP 请求
app.use('/grafana/', (req, res) => {
    console.log('Proxying HTTP request to:', req.url);
    
    const protocol = req.protocol || 'https';

    // 设置 CORS 头部
    res.setHeader('Access-Control-Allow-Origin', 'https://localhost:3000'); // 前端地址
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Authorization, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // 如果是OPTIONS预检请求，立即返回成功响应
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    // 转发普通 HTTP 请求
    proxy.web(req, res, {
        target: 'https://localhost:4000/grafana/',
        // secure: false, // 自签名证书，禁用验证
        changeOrigin: true, // 修改请求头中的Origin
        agent: agent,
        headers: {
            'X-WEBAUTH-USER': req.headers['X-WEBAUTH-USER'], // 设置用户头部
            'X-Real-IP': req.connection.remoteAddress,
            'X-Forwarded-For': req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            'X-Forwarded-Proto': protocol // 确保有一个默认值
        }
    });
});

// 设置 WebSocket 代理
// server.on('upgrade', (req, socket, head) => {
//     if (req.url === '/grafana/api/live/ws') {
//         console.log('Handling WebSocket upgrade for /api/live/ws');
//         proxy.ws(req, socket, head, {
//             target: 'https://localhost:4000/',
//             agent: agent,
//             // secure: false, // 自签名证书，禁用验证
//             changeOrigin: true,
//             headers: {
//                 'Upgrade': 'websocket',
//                 'Connection': 'Upgrade',
//                 'X-WEBAUTH-USER': req.headers['X-WEBAUTH-USER'] || 'admin',
//                 'X-Real-IP': req.connection.remoteAddress,
//                 'X-Forwarded-For': req.headers['x-forwarded-for'] || req.connection.remoteAddress,
//                 'X-Forwarded-Proto': req.protocol || 'https'
//             }
//         });
//     }
// });

// 启动 HTTPS 服务器
server.listen(3001, () => {
    console.log('HTTPS server running on https://localhost:3001');
});
