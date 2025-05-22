const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Service URLs
const USER_SERVICE = 'http://localhost:3000/api/auth';
const PROJECT_SERVICE = 'http://localhost:3001/api';
const NOTIFICATION_SERVICE = 'http://localhost:3003';
const REPORT_SERVICE = 'http://localhost:3004/api';
const CHAT_SERVICE = 'http://localhost:3002/api';
const CHATBOT_SERVICE = 'http://127.0.0.1:8000';
// Proxy config

app.use('/users', (req, res, next) => {
    console.log(`[Gateway] Request tới /users:`, req.method, req.url);
    next();
    }, createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/users': '' },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // Log the request details
        console.log(`[Gateway] Proxying request to ${USER_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Gateway] Proxy error: ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));

app.use('/project', (req, res, next) => {
  console.log(`[Gateway] Request tới /service1:`, req.method, req.url);
  next();
}, createProxyMiddleware({
  target: PROJECT_SERVICE,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    // Log the request details
    console.log(`[Gateway] Proxying request to ${PROJECT_SERVICE}${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[Gateway] Proxy error: ${err.message}`);
    res.status(500).send('Proxy error');
  }
}));

app.use('/notification', createProxyMiddleware({
    target: NOTIFICATION_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/notification': '' },
}));

app.use('/report', (req, res, next) => {
    console.log(`[Gateway] Request tới /report:`, req.method, req.url);
    next();
}, createProxyMiddleware({
    target: REPORT_SERVICE,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // Log the request details
        console.log(`[Gateway] Proxying request to ${REPORT_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Gateway] Proxy error: ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));

app.use('/chat', (req, res, next) => {
    console.log(`[Gateway] Request tới /chat:`, req.method, req.url);
    next();
}, createProxyMiddleware({
    target: CHAT_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/chat': '' },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // Log the request details
        console.log(`[Gateway] Proxying request to ${CHAT_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Gateway] Proxy error: ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));
app.use('/bots', (req, res, next) => {
    console.log(`[Gateway] Request tới /chatbot:`, req.method, req.url);
    next();
}, createProxyMiddleware({
    target: CHATBOT_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/bots': '' },
    logLevel: 'debug',
    timeout: 60000,
    proxyTimeout: 60000,
    onProxyReq: (proxyReq, req, res) => {
        // Log the request details
        console.log(`[Gateway] Proxying request to ${CHATBOT_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Gateway] Proxy error: ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));
// Health check
app.get('/', (req, res) => {
    res.send('API Gateway is running');
});

// Start gateway
const PORT = 2000;
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});
