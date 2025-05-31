const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true, // cần nếu dùng withCredentials
}));app.use(express.json());

// Rate limiter
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Retry Wrapper
const createProxyWithRetry = (options, retries = 3) => {
    const proxy = createProxyMiddleware(options);
    return async (req, res, next) => {
        let attempt = 0;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        while (attempt < retries) {
            try {
                return proxy(req, res, next);
            } catch (err) {
                console.error(`[Retry] Attempt ${attempt + 1} failed: ${err.message}`);
                attempt++;
                if (attempt >= retries) {
                    return res.status(502).json({ error: "Service unavailable after retries." });
                }
                await delay(1000 * attempt); // exponential backoff
            }
        }
    };
};

// Service URLs
const USER_SERVICE = 'http://localhost:3000/api/auth';
const PROJECT_SERVICE = 'http://localhost:3001/api';
const NOTIFICATION_SERVICE = 'http://localhost:3003';
const REPORT_SERVICE = 'http://localhost:3004/api';
const CHAT_SERVICE = 'http://localhost:3002/api';
const CHATBOT_SERVICE = 'http://127.0.0.1:8000';

// Proxy configs
app.use('/users', (req, res, next) => {
    console.log(`[Gateway] Request tới /users:`, req.method, req.url);
    next();
}, createProxyWithRetry({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/users': '' },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Forwarding to ${USER_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Proxy Error] ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));

app.use('/project', (req, res, next) => {
    console.log(`[Gateway] Request tới /project:`, req.method, req.url);
    next();
}, createProxyWithRetry({
    target: PROJECT_SERVICE,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Forwarding to ${PROJECT_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Proxy Error] ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));

app.use('/notification', createProxyWithRetry({
    target: NOTIFICATION_SERVICE,
    changeOrigin: true,
}));

app.use('/report', (req, res, next) => {
    console.log(`[Gateway] Request tới /report:`, req.method, req.url);
    next();
}, createProxyWithRetry({
    target: REPORT_SERVICE,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Forwarding to ${REPORT_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Proxy Error] ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));

app.use('/chat', (req, res, next) => {
    console.log(`[Gateway] Request tới /chat:`, req.method, req.url);
    next();
}, createProxyWithRetry({
    target: CHAT_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/chat': '' },
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Forwarding to ${CHAT_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Proxy Error] ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));

app.use('/bots', (req, res, next) => {
    console.log(`[Gateway] Request tới /bots:`, req.method, req.url);
    next();
}, createProxyWithRetry({
    target: CHATBOT_SERVICE,
    changeOrigin: true,
    pathRewrite: { '^/bots': '' },
    logLevel: 'debug',
    timeout: 60000,
    proxyTimeout: 60000,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] Forwarding to ${CHATBOT_SERVICE}${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Proxy Error] ${err.message}`);
        res.status(500).send('Proxy error');
    }
}));

// Health check
app.get('/', (req, res) => {
    res.send('API Gateway is running');
});

// Start server
const PORT = 2000;
app.listen(PORT, () => {
    console.log(`✅ API Gateway is running on port ${PORT}`);
});
