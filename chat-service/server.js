// filepath: D:\UET-Project-Tracker-App\backend\chat-service\server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io"); // Hoặc import Server từ socket.io
const cors = require("cors"); // <<< THÊM DÒNG NÀY
const routes = require("./routes/chatRoutes"); // Giả sử bạn có file routes
const socketHandler = require("./socket/socketHandler"); // Giả sử bạn có file socketHandler
const RabbitMQService = require('./rabbitmq/rabbitmq');

const app = express();
const server = http.createServer(app);

// --- Cấu hình CORS ---
// Cách 1: Cho phép tất cả các nguồn (đơn giản nhất cho môi trường phát triển)
app.use(cors());

// Cách 2: Chỉ cho phép nguồn cụ thể của frontend (tốt hơn cho production)
// const frontendOrigin = 'http://localhost:PORT_CUA_FLUTTER_APP'; // Thay PORT_CUA_FLUTTER_APP bằng cổng thực tế Flutter đang chạy, ví dụ 50884 từ log của bạn
// app.use(cors({
//   origin: frontendOrigin
// }));
// --- Kết thúc cấu hình CORS ---

app.use(express.json()); // Đảm bảo có dòng này để parse JSON request bodies

// Khởi tạo Socket.IO (ví dụ)
const io = new Server(server, {
  cors: {
    origin: "*", // Hoặc frontendOrigin nếu bạn muốn chặt chẽ hơn cho Socket.IO
    methods: ["GET", "POST"],
  },
});
socketHandler(io); // Gọi hàm xử lý socket

// Sử dụng routes API
app.use("/api", routes); // Đường dẫn cơ sở cho API của bạn

try {
  RabbitMQService.connect();
  RabbitMQService.consumeEvents();
} catch (error) {
  console.error('Error connecting to RabbitMQ:', error);
}

const PORT = process.env.PORT || 3002; // Đảm bảo chat-service chạy trên port 3002
server.listen(PORT, () => {
  console.log(`Chat service server running on port ${PORT}`);
});
