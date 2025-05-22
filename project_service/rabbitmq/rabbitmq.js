const amqp = require("amqplib");
const axios = require("axios"); // Đảm bảo đã import
const retry = require("async-retry"); // Đảm bảo đã import
const { Project } = require("../model/model"); // Import Project model

async function getUIDbyUserID(userId) {
  console.warn(
    `[Project Service] getUIDbyUserID called with ${userId}. This is a placeholder. Implement actual logic.`
  );
  return userId;
}

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = "projects";
    this.connectionUrl =
      "amqps://vascfdnt:jtd5jMuRX4CH6Nt6L-xbquo8NczYn-Mk@armadillo.rmq.cloudamqp.com/vascfdnt";
  }

  async connect() {
    try {
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, "topic", {
        durable: true,
      });

      console.log("Connected to RabbitMQ");
    } catch (error) {
      console.error("RabbitMQ connection error:", error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publishEvent(routingKey, message) {
    if (!this.channel) {
      await this.connect();
    }

    try {
      await this.channel.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      console.log(`Event published to ${routingKey}`);
    } catch (error) {
      console.error("Error publishing event:", error);
      throw error;
    }
  }

  async handleEvent(routingKey, event) {
    const chatBase = "http://localhost:3002/api"; // Giữ nguyên nếu bạn vẫn dùng cho chat-service

    await retry(
      async (bail) => {
        switch (routingKey) {
          case "event.project.created": {
            // ... (logic cho chat service như cũ) ...
            const { project, uid } = event.payload;
            const groupChatData = {
              admin: [uid],
              members: project.employee_list,
              group_name: project.project_name,
              created_by: project.project_leader,
              group_id: project.project_id,
              uid: uid,
            };
            await axios.post(`${chatBase}/internal/groups`, groupChatData);
            break;
          }
          case "event.project.employee.added": {
            // ... (logic cho chat service như cũ) ...
            const { projectId, employeeId } = event.payload;
            const employee_uid = await getUIDbyUserID(employeeId);
            await axios.put(
              `${chatBase}/internal/groups/${projectId}/members`,
              { member: employee_uid }
            );
            break;
          }
          case "event.project.employee.removed": {
            // ... (logic cho chat service như cũ) ...
            const { projectId, employeeId } = event.payload;
            const employee_uid = await getUIDbyUserID(employeeId);
            await axios.delete(
              `${chatBase}/internal/groups/${projectId}/members`,
              {
                data: {
                  member: employee_uid,
                },
              }
            );
            break;
          }
          case "event.project.leader.updated": {
            // ... (logic cho chat service như cũ) ...
            const { projectId, admin } = event.payload;
            const admin_uid = await getUIDbyUserID(admin);
            await axios.put(
              `${chatBase}/internal/groups/${projectId}/change-admin`,
              { leaderId: admin_uid }
            );
            break;
          }
          case "event.report.task.updated": {
            // Sự kiện từ report-service
            const {
              productCode,
              componentCode,
              is_completed,
              product_progress,
            } = event.payload;
            console.log(
              `[Project Service] Received event.report.task.updated for component ${componentCode} in project ${productCode}. New product progress: ${product_progress}%`
            );
            try {
              // 1. Cập nhật trạng thái của task (component)
              await Project.updateTaskStatusFromReport(
                productCode, // projectId trong project-service
                componentCode, // taskId trong project-service
                is_completed
              );
              console.log(
                `[Project Service] Task ${componentCode} status in project ${productCode} updated to "${is_completed}" based on report.`
              );

              // 2. Cập nhật progress_progress của project
              if (product_progress !== undefined && productCode) {
                // Kiểm tra product_progress có tồn tại không
                await Project.updateProjectProgress(
                  productCode,
                  product_progress
                );
                console.log(
                  `[Project Service] Project ${productCode} progress_progress updated to ${product_progress}%.`
                );
              } else {
                console.warn(
                  `[Project Service] product_progress or productCode missing in event payload for project ${productCode}. Progress not updated.`
                );
              }
            } catch (modelError) {
              console.error(
                `[Project Service] Error processing event.report.task.updated for ${componentCode}/${productCode}:`,
                modelError.message
              );
              if (modelError.message.includes("not found")) {
                bail(
                  new Error(
                    `Project ${productCode} or Task ${componentCode} not found for report update.`
                  )
                );
              } else {
                throw modelError; // Thử lại cho các lỗi khác
              }
            }
            break;
          }
          default:
            console.warn(
              "[Project Service] Unknown event type for this consumer:",
              routingKey
            );
            bail(
              new Error(
                `Unknown event type for project-service consumer: ${routingKey}`
              )
            );
        }
      },
      {
        retries: 3,
        minTimeout: 1000,
        onRetry: (err, attempt) => {
          console.warn(
            `[Project Service] Retry ${attempt} for ${routingKey}: ${err.message}`
          );
        },
      }
    );
  }

  async consumeEvents() {
    await this.connect();
    const queueName = "project-service-main-queue";
    const queue = await this.channel.assertQueue(queueName, {
      durable: true,
      exclusive: false,
    });
    console.log(`[Project Service] Consumer asserted queue: ${queue.queue}`);

    // Bindings cho chat service
    await this.channel.bindQueue(
      queue.queue,
      this.exchange,
      "event.project.employee.*"
    );
    await this.channel.bindQueue(
      queue.queue,
      this.exchange,
      "event.project.leader.*"
    );
    await this.channel.bindQueue(
      queue.queue,
      this.exchange,
      "event.project.created"
    );

    // Bind queue với routing key từ report-service
    await this.channel.bindQueue(
      queue.queue,
      this.exchange,
      "event.report.task.updated" // Routing key cho sự kiện cập nhật task từ report
    );
    console.log(
      `[Project Service] Bound queue ${queue.queue} to event.report.task.updated`
    );

    this.channel.consume(queue.queue, async (msg) => {
      if (!msg) return;
      const event = JSON.parse(msg.content.toString());
      const routingKey = msg.fields.routingKey;
      console.log(`[Project Service] Received event: ${routingKey}`, event);
      try {
        await this.handleEvent(routingKey, event);
        this.channel.ack(msg);
      } catch (err) {
        console.error("[Project Service] Error handling message:", err.message);
        this.channel.nack(msg, false, false);
      }
    });
    console.log(
      `[Project Service] Consumer is listening for events on queue ${queue.queue}...`
    );
  }
}

module.exports = new RabbitMQService();
