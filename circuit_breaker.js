const axios = require("axios");
const CircuitBreaker = require("opossum");

// Hàm gọi tới một service bất kỳ
async function callService(url) {
    const response = await axios.get(url);
    return response.data;
}

// Cấu hình circuit breaker
const options = {
    timeout: 3000, // 3s timeout cho mỗi request
    errorThresholdPercentage: 50, // 50% lỗi thì mở circuit
    resetTimeout: 5000 // 5s sau thử lại
};

// Tạo circuit breaker cho từng service
const chatbotBreaker = new CircuitBreaker(() => callService("http://localhost:3001/health"), options);
const projectBreaker = new CircuitBreaker(() => callService("http://localhost:3002/health"), options);
const reportBreaker = new CircuitBreaker(() => callService("http://localhost:3003/health"), options);
const userBreaker = new CircuitBreaker(() => callService("http://localhost:3000/health"), options);

// Lắng nghe sự kiện để log trạng thái circuit breaker
[chatbotBreaker, projectBreaker, reportBreaker, userBreaker].forEach((breaker, idx) => {
    const names = ["chatbot", "project", "report", "user"];
    breaker.on("open", () => console.warn(`Circuit for ${names[idx]}-service OPENED`));
    breaker.on("halfOpen", () => console.info(`Circuit for ${names[idx]}-service HALF-OPEN`));
    breaker.on("close", () => console.info(`Circuit for ${names[idx]}-service CLOSED`));
    breaker.on("fallback", () => console.warn(`Fallback triggered for ${names[idx]}-service`));
});

// Ví dụ kiểm tra trạng thái các service
async function checkAllServices() {
    try {
        const chatbot = await chatbotBreaker.fire();
        console.log("Chatbot service healthy:", chatbot);
    } catch (err) {
        console.error("Chatbot service error:", err.message);
    }

    try {
        const project = await projectBreaker.fire();
        console.log("Project service healthy:", project);
    } catch (err) {
        console.error("Project service error:", err.message);
    }

    try {
        const report = await reportBreaker.fire();
        console.log("Report service healthy:", report);
    } catch (err) {
        console.error("Report service error:", err.message);
    }

    try {
        const user = await userBreaker.fire();
        console.log("User service healthy:", user);
    } catch (err) {
        console.error("User service error:", err.message);
    }
}

// Chạy kiểm tra mỗi 10 giây
setInterval(checkAllServices, 10000);
console.log("Circuit breaker monitor started.");

// Nếu muốn export breaker để dùng ở nơi khác:
module.exports = { chatbotBreaker, projectBreaker, reportBreaker, userBreaker };