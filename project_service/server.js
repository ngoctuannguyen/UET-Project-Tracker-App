const express = require("express");
const http = require("http");
const routes = require("./routes/route");
const RabbitMQService = require("./rabbitmq/rabbitmq");

const app = express();
const server = http.createServer(app);
const cors = require("cors");

app.use(express.json());

const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/api", routes);

try {
  RabbitMQService.connect();
  RabbitMQService.consumeEvents();
} catch (error) {
  console.error("Error connecting to RabbitMQ:", error);
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
