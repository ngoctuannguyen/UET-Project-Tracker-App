const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const rateLimit = require("express-rate-limit");
const throttle = require("express-throttle");
const retry = require("express-retry");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

// 1. Middleware bảo mật cơ bản
app.use(helmet());
app.use(cors());
app.use(express.json());

// 2. Cấu hình Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // Giới hạn 1000 requests/IP
  standardHeaders: true,
  legacyHeaders: false,
});

const serviceLimiters = {
  chatbot: rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 100,
    message: "Quá nhiều request tới Chatbot Service"
  }),
  user: rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: "Quá nhiều request tới User Service"
  })
};

// 3. Throttling Configuration
const throttlingOptions = {
  burst: 10,  // Số request ban đầu
  period: "1s", // Cửa sổ thời gian
  throttle: { // Cấu hình riêng cho từng service
    "/chatbot": { 
      burst: 5,
      period: "2s"
    },
    "/user": {
      burst: 15,
      period: "1s"
    }
  }
};

// 4. Retry Policy
const retryOptions = {
  retries: 3, // Số lần thử lại
  factor: 2, // Hệ số exponential backoff
  minTimeout: 1000, // Thời gian chờ tối thiểu
  maxTimeout: 5000, // Thời gian chờ tối đa
  onRetry: (error, attempt) => {
    console.log(`Retry attempt ${attempt} for ${error.config.url}`);
  }
};

// 5. Proxy Configuration với retry
const createProxyWithRetry = (options) => {
  const proxy = createProxyMiddleware(options);
  return retry(proxy, retryOptions);
};

// 6. Áp dụng tất cả middleware
app.use(globalLimiter);
app.use(throttle(throttlingOptions));

// 7. Route-specific configuration
app.use("/chatbot", 
  serviceLimiters.chatbot,
  createProxyWithRetry({
    target: "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: { "^/chatbot": "/" },
    onError: (err, req, res) => {
      res.status(503).json({ error: "Chatbot Service Unavailable" });
    }
  })
);

app.use("/project",
  createProxyWithRetry({
    target: "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: { "^/project": "/" },
    onError: (err, req, res) => {
      res.status(504).json({ error: "Project Service Timeout" });
    }
  })
);

app.use("/report",
  createProxyWithRetry({
    target: "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: { "^/report": "/" },
    timeout: 10000 // 10s timeout
  })
);

app.use("/user",
  serviceLimiters.user,
  createProxyWithRetry({
    target: "http://localhost:3000",
    changeOrigin: true,
    pathRewrite: { "^/user": "/" },
    proxyTimeout: 5000
  })
);

// 8. Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// 9. Xử lý lỗi global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.GATEWAY_PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway đang chạy tại http://localhost:${PORT}`);
});