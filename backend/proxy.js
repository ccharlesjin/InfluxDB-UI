// const express = require('express');
// const { createProxyMiddleware } = require('http-proxy-middleware');
// const cookieParser = require('cookie-parser');
// const fs = require('fs');
// const https = require('https');

// require('dotenv').config();

// const app = express();

// const jwt = require('jsonwebtoken');

// // 日志
// const morgan = require('morgan');
// const accessLogStream = fs.createWriteStream('logs/access.log', { flags: 'a' });
// app.use(morgan('combined', { stream: accessLogStream }));

// // 使用cookie-parser中间件
// app.use(cookieParser());

// // 加载私钥
// const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_FILE);
// // 加载自签名的CA证书
// const ca = fs.readFileSync(process.env.SSL_ROOT_CRT_FILE);

// // 创建一个带有自定义CA的HTTPS Agent
// const agent = new https.Agent({
//   ca: ca  // 手动添加自签名证书到可信任列表
// });

// // 加载SSL证书
// const sslOptions = {
//     key: fs.readFileSync(process.env.SSL_KEY_FILE),
//     cert: fs.readFileSync(process.env.SSL_CRT_FILE),
// };

// // 解析cookie中的session_token
// function extractAuthTokenFromCookie(req, res) {
//     const token = req.cookies['session_token'];
//     if (token) {
//         try {
//             // 使用你的public key进行验证和解码
//             const decoded = jwt.verify(token, privateKey, { algorithms: ['RS256'] });
//             req.user = decoded.sub;  // 提取用户信息
//             console.log('X-WEBAUTH-USER:', decoded.sub);
//             req.influxDB_token = decoded.influxDB_token;  // 其他需要的payload
//             console.log('JWT Decoding succeeded:', decoded);
//             console.log('X-WEBAUTH-USER:', req.user);
//             return req.user;
//         } catch (err) {
//             console.log('JWT Decoding failed:', err);
//             return null;
//         }
//     } else {
//         console.log('No session_token cookie found');
//         return null;
//     }
// }

// // app.use('/grafana', createProxyMiddleware({
// //     target: 'https:localhost:4000/grafana',
// //     changeOrigin: true,
// //     secure: false,
// //     onError: (err, req, res, target) => {
// //         res.writeHead(500, {
// //             'Content-Type': 'application/json',
// //         });
// //         res.end({ message: 'Something went wrong on proxy request. Please retry.' });
// //     },
// //     onProxyReq: (proxyReq, req, res) => {
// //         proxyReq.setHeader('Authorization', `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcyODg0MTE1NSwiZXhwIjoxNzQ0MzkzMTU1LCJyb2xlIjoiYWRtaW4ifQ.gk7uggLLy2mN6FyY4hLtOMkaeFCzhXHIrNW893zcZvr5PPY4SBB8OkVNoBZzFo9cVGYeArGJwiMjDEMeR-9YoRUS9fs3kdU3nZaM62PEp-EI22Gotts46Nv9HwphbFgulKiOd49t4EEJHItE13OiyaaFUk7g69gM2-hVy4slEEdhq7eVJEy1NHyeifL7Hh3t5R5k2y_zVHZbZzZnAAz_SwbtkFAPXmmk4JVBJbB3BQgzczhuAS2i90uJ66TN7djcihX9d4fUxKnDA4bl5Jl2_tDEQiVVfuCaELJi-9ppbN0eZI5eig2xZoWodnpv910cZ7cbFBNpMVMUxEUrWlAHEQ`);
// //     }
// // }));

// // 设置代理规则
// // const grafanaProxy = createProxyMiddleware({
// //   target: 'https://localhost:4000/grafana',
// //   changeOrigin: true,
// //   httpsAgent: agent,
// //   secure: false,
// //   ws: false,  // 开启WebSocket支持
// //   logger: console,
// //   on: {
// //         ProxyReq: (proxyReq, req, res) => {
// //             // proxyReq.setHeader('X-WEBAUTH-USER', `admin`);
// //             // proxyReq.setHeader('X-WEBAUTH-USER', `admin`);
// //             proxyReq.setHeader('Authorization', `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcyODg0MTE1NSwiZXhwIjoxNzQ0MzkzMTU1LCJyb2xlIjoiYWRtaW4ifQ.gk7uggLLy2mN6FyY4hLtOMkaeFCzhXHIrNW893zcZvr5PPY4SBB8OkVNoBZzFo9cVGYeArGJwiMjDEMeR-9YoRUS9fs3kdU3nZaM62PEp-EI22Gotts46Nv9HwphbFgulKiOd49t4EEJHItE13OiyaaFUk7g69gM2-hVy4slEEdhq7eVJEy1NHyeifL7Hh3t5R5k2y_zVHZbZzZnAAz_SwbtkFAPXmmk4JVBJbB3BQgzczhuAS2i90uJ66TN7djcihX9d4fUxKnDA4bl5Jl2_tDEQiVVfuCaELJi-9ppbN0eZI5eig2xZoWodnpv910cZ7cbFBNpMVMUxEUrWlAHEQ`);
// //         },
// //     },
// // });

// // 设置代理规则
// const grafanaProxy = createProxyMiddleware({
//     target: 'https://localhost:4000/grafana',
//     changeOrigin: true,
//     httpsAgent: agent,
//     secure: false,
//     ws: false,  // 开启WebSocket支持
//     logger: console,
//     on: {
//           ProxyReq: (proxyReq, req, res) => {
//               // console.log('Proxying HTTP request to:', proxyReq.path);
//               // const authToken = extractAuthTokenFromCookie(req, res);
//               // console.log(`X-WEBAUTH-USER in proxy: ${authToken}`);
//               // if (authToken) {
//                   proxyReq.setHeader('X-WEBAUTH-USER', `admin`);
//                   proxyReq.setHeader('Authorization', `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcyODg0MTE1NSwiZXhwIjoxNzQ0MzkzMTU1LCJyb2xlIjoiYWRtaW4ifQ.gk7uggLLy2mN6FyY4hLtOMkaeFCzhXHIrNW893zcZvr5PPY4SBB8OkVNoBZzFo9cVGYeArGJwiMjDEMeR-9YoRUS9fs3kdU3nZaM62PEp-EI22Gotts46Nv9HwphbFgulKiOd49t4EEJHItE13OiyaaFUk7g69gM2-hVy4slEEdhq7eVJEy1NHyeifL7Hh3t5R5k2y_zVHZbZzZnAAz_SwbtkFAPXmmk4JVBJbB3BQgzczhuAS2i90uJ66TN7djcihX9d4fUxKnDA4bl5Jl2_tDEQiVVfuCaELJi-9ppbN0eZI5eig2xZoWodnpv910cZ7cbFBNpMVMUxEUrWlAHEQ`);
//                   // console.log(`X-WEBAUTH-USER in proxy: admin`);
//               // } else{
//               //     console.log('No session_token cookie found');
//               // }
//           },
//           ProxyRes: (proxyRes, req, res) => {
//             // console.log('Proxying HTTP request to:', proxyReq.path);
//             // const authToken = extractAuthTokenFromCookie(req, res);
//             // console.log(`X-WEBAUTH-USER in proxy: ${authToken}`);
//             // if (authToken) {
//                 proxyRes.setHeader('X-WEBAUTH-USER', `admin`);
//                 proxyRes.setHeader('Authorization', `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcyODg0MTE1NSwiZXhwIjoxNzQ0MzkzMTU1LCJyb2xlIjoiYWRtaW4ifQ.gk7uggLLy2mN6FyY4hLtOMkaeFCzhXHIrNW893zcZvr5PPY4SBB8OkVNoBZzFo9cVGYeArGJwiMjDEMeR-9YoRUS9fs3kdU3nZaM62PEp-EI22Gotts46Nv9HwphbFgulKiOd49t4EEJHItE13OiyaaFUk7g69gM2-hVy4slEEdhq7eVJEy1NHyeifL7Hh3t5R5k2y_zVHZbZzZnAAz_SwbtkFAPXmmk4JVBJbB3BQgzczhuAS2i90uJ66TN7djcihX9d4fUxKnDA4bl5Jl2_tDEQiVVfuCaELJi-9ppbN0eZI5eig2xZoWodnpv910cZ7cbFBNpMVMUxEUrWlAHEQ`);
//                 // console.log(`X-WEBAUTH-USER in proxy: admin`);
//             // } else{
//             //     console.log('No session_token cookie found');
//             // }
//         },
//       },
//   });

// const grafanaLiveProxy = createProxyMiddleware({
//     target: 'https://localhost:4000/grafana/api/live/ws',
//     changeOrigin: true,
//     ws: true,  // 开启WebSocket支持
//     secure: false,
//     httpsAgent: agent,
//     logger: console,
//     on: {
//         ProxyReq: (proxyReq, req, res) => {
//             console.log('Proxying HTTP request to:', proxyReq.path);
//             const authToken = extractAuthTokenFromCookie(req, res);
//             console.log(`X-WEBAUTH-USER in proxy: ${authToken}`);
//             if (authToken) {
//                 proxyReq.setHeader('X-WEBAUTH-USER', `${authToken}`);
//                 proxyReq.setHeader('Authorization', `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTcyODg0MTE1NSwiZXhwIjoxNzQ0MzkzMTU1LCJyb2xlIjoiYWRtaW4ifQ.gk7uggLLy2mN6FyY4hLtOMkaeFCzhXHIrNW893zcZvr5PPY4SBB8OkVNoBZzFo9cVGYeArGJwiMjDEMeR-9YoRUS9fs3kdU3nZaM62PEp-EI22Gotts46Nv9HwphbFgulKiOd49t4EEJHItE13OiyaaFUk7g69gM2-hVy4slEEdhq7eVJEy1NHyeifL7Hh3t5R5k2y_zVHZbZzZnAAz_SwbtkFAPXmmk4JVBJbB3BQgzczhuAS2i90uJ66TN7djcihX9d4fUxKnDA4bl5Jl2_tDEQiVVfuCaELJi-9ppbN0eZI5eig2xZoWodnpv910cZ7cbFBNpMVMUxEUrWlAHEQ`);
//                 console.log(`X-WEBAUTH-USER in proxy: ${authToken}`);
//             } else{
//                 console.log('No session_token cookie found');
//             }
//         },
//     },
//   });

// // 应用代理中间件
// app.use('/grafana', grafanaProxy);

// // WebSocket路由
// app.use('/grafana/api/live/ws', grafanaLiveProxy);

// // 启动HTTPS服务器
// https.createServer(sslOptions, app).listen(3001, () => {
//   console.log('HTTPS Server running on port 3001');
// });
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