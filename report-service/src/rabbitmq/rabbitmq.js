const amqp = require("amqplib");

const createEvent = (eventType, payload) => ({
  event_type: eventType,
  timestamp: new Date().toISOString(),
  payload,
});

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = "projects";
    this.connectionUrl =
      "amqps://vascfdnt:jtd5jMuRX4CH6Nt6L-xbquo8NczYn-Mk@armadillo.rmq.cloudamqp.com/vascfdnt";
  }

  async #ensureConnected() {
    // Phương thức private để kết nối nếu cần
    if (!this.channel || !this.connection) {
      try {
        this.connection = await amqp.connect(this.connectionUrl);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, "topic", {
          durable: true,
        });
        console.log(
          "[Report Service] Connected to RabbitMQ and asserted exchange."
        );
      } catch (error) {
        console.error("[Report Service] RabbitMQ connection error:", error);
        // Cân nhắc retry hoặc throw lỗi để được xử lý ở nơi gọi
        this.channel = null;
        this.connection = null; // Reset
        throw error; // Ném lỗi ra để nơi gọi xử lý retry
      }
    }
  }

  async publishEvent(routingKey, message) {
    try {
      await this.#ensureConnected();
      const bufferedMessage = Buffer.from(JSON.stringify(message));
      this.channel.publish(this.exchange, routingKey, bufferedMessage, {
        persistent: true,
      });
      console.log(
        `[Report Service] Event published to ${routingKey}:`,
        message
      );
    } catch (error) {
      console.error("[Report Service] Error publishing event:", error);
      // Xử lý lỗi, có thể thử kết nối lại và publish lại
      throw error;
    }
  }

  async connect(onMessage) {
    try {
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, "topic", {
        durable: true,
      });

      const q = await this.channel.assertQueue("", { exclusive: true });

      // Bind các routing keys liên quan đến project
      await this.channel.bindQueue(
        q.queue,
        this.exchange,
        "event.project.created"
      );
      await this.channel.bindQueue(
        q.queue,
        this.exchange,
        "event.project.deleted"
      );
      // Bind các routing keys liên quan đến task
      await this.channel.bindQueue(
        q.queue,
        this.exchange,
        "event.project.task.created"
      );
      await this.channel.bindQueue(
        q.queue,
        this.exchange,
        "event.project.task.removed"
      );
      await this.channel.bindQueue(
        q.queue,
        this.exchange,
        "event.project.task.updated"
      );

      console.log("[*] Waiting for task events in Report Service...");

      this.channel.consume(
        q.queue,
        (msg) => {
          if (msg.content) {
            const data = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            console.log(` [x] Received '${routingKey}':`, data);

            // Gọi xử lý tùy theo loại sự kiện
            onMessage(routingKey, data);
          }
        },
        {
          noAck: true,
        }
      );
    } catch (error) {
      console.error("RabbitMQ consumer error:", error);
      setTimeout(() => this.connect(onMessage), 5000);
    }
  }
}

module.exports = { rabbitMQService: new RabbitMQService(), createEvent }; // Export instance và helper
