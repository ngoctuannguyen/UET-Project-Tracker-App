const amqp = require("amqplib");
const retry = require("async-retry"); // Giữ lại retry của đồng đội

const axios = require("axios");

const {
  addComponent,
  deleteComponent,
  deleteProduct,
  addProduct,
  // updateProgress,
  // updateStatus,
  updateComponent,
} = require("../services/productAndComponentService");

// Hàm createEvent từ code của bạn
const createEvent = (eventType, payload) => ({
  event_type: eventType,
  timestamp: new Date().toISOString(),
  payload,
});

class RabbitMQService {
  // Đổi tên class
  constructor() {
    this.connection = null;
    this.channel = null;
    this.exchange = "projects"; // Chung exchange
    this.connectionUrl =
      "amqps://vascfdnt:jtd5jMuRX4CH6Nt6L-xbquo8NczYn-Mk@armadillo.rmq.cloudamqp.com/vascfdnt";

    this.consumerRoutingKeys = [
      "event.project.created",
      "event.project.deleted",
      "event.project.updated",
      "event.project.task.created",
      "event.project.task.updated",
      "event.project.task.removed",
      "event.project.employee.added",
      "event.project.employee.removed",
      "event.project.leader.updated",
    ];
    this.consumerQueueName = "report-service-consumer-queue"; // Đặt tên cụ thể cho queue consumer
  }

  async #ensureConnected() {
    if (!this.channel || !this.connection || this.connection.closeEmitted) {
      try {
        console.log("[Report Service RabbitMQ] Attempting to connect...");
        this.connection = await amqp.connect(this.connectionUrl);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, "topic", {
          durable: true,
        });
        console.log(
          "[Report Service RabbitMQ] Connected and exchange asserted."
        );

        this.connection.on("error", (err) => {
          console.error(
            "[Report Service RabbitMQ] Connection error:",
            err.message
          );
          this.channel = null;
          this.connection = null;
        });
        this.connection.on("close", () => {
          console.warn(
            "[Report Service RabbitMQ] Connection closed. Attempting to reconnect..."
          );
          this.channel = null;
          this.connection = null;
          // Không gọi #ensureConnected hoặc startConsuming ở đây để tránh vòng lặp vô hạn khi lỗi kết nối ban đầu
          // Việc retry sẽ được quản lý bởi nơi gọi (ví dụ: startConsuming)
        });
      } catch (error) {
        console.error(
          "[Report Service RabbitMQ] Connection/Channel setup error:",
          error.message
        );
        this.channel = null;
        this.connection = null;
        throw error;
      }
    }
  }

  // --- Phần Publisher
  async publishEvent(routingKey, message) {
    try {
      await this.#ensureConnected(); // Đảm bảo đã kết nối để publish
      const bufferedMessage = Buffer.from(JSON.stringify(message));
      this.channel.publish(this.exchange, routingKey, bufferedMessage, {
        persistent: true,
      });
      console.log(
        `[Report Service RabbitMQ] Event published to ${routingKey}:`,
        message.event_type
      );
    } catch (error) {
      console.error(
        "[Report Service RabbitMQ] Error publishing event:",
        error.message
      );
      // Cân nhắc việc ném lỗi ra để service gọi nó có thể retry
      throw error;
    }
  }

  // --- Phần Consumer
  async startConsuming() {
    // Đổi tên connect của consumer thành startConsuming
    try {
      await this.#ensureConnected();

      // Sử dụng tên queue đã định nghĩa trong constructor
      const queue = await this.channel.assertQueue(this.consumerQueueName, {
        durable: true,
      });

      for (const key of this.consumerRoutingKeys) {
        await this.channel.bindQueue(queue.queue, this.exchange, key);
      }
      console.log(
        `[Report Service RabbitMQ] Consumer queue '${queue.queue}' bound to keys:`,
        this.consumerRoutingKeys.join(", ")
      );

      this.channel.consume(queue.queue, async (msg) => {
        if (!msg) {
          console.warn("[Report Service RabbitMQ] Received an empty message.");
          return;
        }

        const eventContent = msg.content.toString();
        const routingKey = msg.fields.routingKey;
        let eventData;

        try {
          eventData = JSON.parse(eventContent);
          console.log(
            `[Report Service RabbitMQ] Received event '${routingKey}':`,
            eventData.event_type
          );
          await this.handleConsumedEvent(routingKey, eventData); // Đổi tên hàm xử lý
          this.channel.ack(msg);
        } catch (error) {
          console.error(
            `[Report Service RabbitMQ] Error processing event '${routingKey}' (Payload: ${eventContent}):`,
            error.message
          );
          // Quyết định nack và requeue hay không.
          // Nếu lỗi là do nội dung tin nhắn (ví dụ JSON parse error), không nên requeue.
          // Nếu lỗi là tạm thời (ví dụ DB offline), có thể requeue.
          // Hiện tại, nack(msg, false, false) nghĩa là không requeue.
          this.channel.nack(msg, false, false);
        }
      });

      console.log(
        `[*] Report service consumer is listening on queue '${this.consumerQueueName}'...`
      );
    } catch (err) {
      console.error(
        "[Report Service RabbitMQ] Consumer connection/setup error:",
        err.message
      );
      // Thử kết nối lại sau một khoảng thời gian
      console.log(
        "[Report Service RabbitMQ] Retrying consumer connection in 5 seconds..."
      );
      setTimeout(() => this.startConsuming(), 5000);
    }
  }

  async handleConsumedEvent(routingKey, event) {
    // Đổi tên từ handleEvent để tránh nhầm với hàm publish
    // Logic xử lý sự kiện từ project-service (giữ nguyên của đồng đội bạn, có thể cần điều chỉnh payload)
    await retry(
      async (bail) => {
        // Thêm bail để có thể dừng retry nếu lỗi không thể phục hồi
        try {
          switch (routingKey) {
            case "event.project.created": {
              console.log(
                "[Report Service] Handling event.project.created:",
                event.payload
              );
              // Đồng đội const { project, uid } = event.payload; await addProduct(project);
              // Code mình: event.payload["project_id"], event.payload["project_name"], event.payload["project_status"]
              // Cần thống nhất payload từ project-service hoặc điều chỉnh ở đây
              const projectData = event.payload.project || event.payload; // Ưu tiên cấu trúc của đồng đội
              if (
                projectData &&
                projectData.project_id &&
                projectData.project_name
              ) {
                await addProduct(
                  projectData.project_id,
                  projectData.project_name,
                  projectData.project_status || "not started",
                  projectData.project_progress || 0,
                  projectData.created_at,
                  projectData.project_due
                );
                console.log(
                  `[Report Service] Product ${projectData.project_id} processed from project.created event.`
                );
              } else {
                console.warn(
                  "[Report Service] Insufficient data for event.project.created:",
                  event.payload
                );
                bail(new Error("Insufficient data for project.created")); // Dừng retry nếu thiếu dữ liệu cơ bản
              }
              break;
            }
            case "event.project.deleted": {
              // Thêm case này từ code của bạn
              console.log(
                "[Report Service] Handling event.project.deleted:",
                event.payload
              );
              const deletedProjectCode = event.payload.project_id;
              if (deletedProjectCode) {
                await deleteProduct(deletedProjectCode);
                console.log(
                  `[Report Service] Product ${deletedProjectCode} processed from project.deleted event.`
                );
              } else {
                console.warn(
                  "[Report Service] Missing project_id for event.project.deleted:",
                  event.payload
                );
                bail(new Error("Missing project_id for project.deleted"));
              }
              break;
            }
            case "event.project.updated": // Đồng đội bạn có
              console.log(
                "[Report Service] Handling event.project.updated:",
                event.payload
              );
              // Cần làm rõ project-service gửi gì và report-service cần làm gì khi project được update
              // Ví dụ: cập nhật tên, due_date, status của product
              // const { projectId, dataToUpdate } = event.payload;
              // await Product.update(dataToUpdate, { where: { productCode: projectId } });
              break;
            case "event.project.task.created": {
              console.log(
                "[Report Service] Handling event.project.task.created:",
                event.payload
              );
              // Đồng đội bạn: const { task, projectId } = event.payload; await addComponent(task, projectId);
              // Code của bạn: event.payload["project_task"][event.payload["project_task"].length - 1];
              // Thống nhất payload hoặc điều chỉnh
              const taskData =
                event.payload.task ||
                (Array.isArray(event.payload.project_task) &&
                event.payload.project_task.length > 0
                  ? event.payload.project_task[
                      event.payload.project_task.length - 1
                    ]
                  : null);
              const projectId =
                event.payload.projectId || event.payload.project_id;

              if (
                taskData &&
                taskData.task_id &&
                taskData.work_description &&
                projectId
              ) {
                await addComponent(
                  taskData.task_id,
                  taskData.work_description,
                  projectId,
                  taskData.status || "not started",
                  taskData.employeeId || null
                );
                console.log(
                  `[Report Service] Component ${taskData.task_id} for project ${projectId} processed from task.created event.`
                );
              } else {
                console.warn(
                  "[Report Service] Insufficient data for event.project.task.created:",
                  event.payload
                );
                bail(new Error("Insufficient data for task.created"));
              }
              break;
            }
            case "event.project.task.updated": {
              console.log(
                "[Report Service] Handling event.project.task.updated:",
                event.payload
              );
              // Đồng đội bạn: const { projectId, taskId, data } = event.payload; await updateComponent(projectId, taskId, data);
              // Code của bạn: lấy status từ mảng project_task rồi gọi updateStatus, updateProgress
              // Đây là nơi cần hợp nhất cẩn thận. updateComponent của đồng đội có thể đã bao gồm logic này.
              // Nếu project-service gửi toàn bộ task object đã update:
              const { projectId, taskId, data } = event.payload; // data ở đây là toàn bộ task object mới hoặc các trường cần update
              if (projectId && taskId && data) {
                // Giả sử data chứa các trường cần thiết như is_completed (hoặc status), employeeId, name...
                // Hàm updateComponent của đồng đội bạn cần được kiểm tra xem nó làm gì.
                // Nếu nó chỉ cập nhật các trường cơ bản, bạn cần gọi thêm updateProgress.
                await updateComponent(projectId, taskId, data); // data có thể là { status: 'done', name: 'new name'}
                console.log(
                  `[Report Service] Component ${taskId} in project ${projectId} processed from task.updated event.`
                );
                // Sau khi updateComponent, nếu status thay đổi, cần tính lại progress của product
                // const component = await Component.findOne({ where: { componentCode: taskId, productCode: projectId } });
                // if (component) {
                //   const { updateProgress } = require('../services/reportService'); // Import local để tránh circular dependency nếu có
                //   await updateProgress(projectId);
                // }
              } else {
                console.warn(
                  "[Report Service] Insufficient data for event.project.task.updated:",
                  event.payload
                );
                bail(new Error("Insufficient data for task.updated"));
              }
              break;
            }
            case "event.project.task.removed": {
              console.log(
                "[Report Service] Handling event.project.task.removed:",
                event.payload
              );
              // Đồng đội bạn: const { projectId, taskId, data } = event.payload; await deleteComponent(projectId, taskId, data);
              // Code của bạn: event.task_id; deleteReportbyComponentId(taskId); deleteComponent(taskId);
              // Thống nhất payload. Giả sử project-service gửi taskId và projectId.
              const taskIdToRemove =
                event.payload.taskId || event.payload.task_id;
              const projectIdForTask =
                event.payload.projectId || event.payload.project_id;

              if (taskIdToRemove && projectIdForTask) {
                const {
                  deleteReportbyComponentId,
                } = require("../services/reportService"); // Import local
                await deleteReportbyComponentId(taskIdToRemove); // Xóa report trước
                await deleteComponent(projectIdForTask, taskIdToRemove); // Rồi xóa component
                console.log(
                  `[Report Service] Component ${taskIdToRemove} and its reports processed from task.removed event.`
                );
              } else {
                console.warn(
                  "[Report Service] Insufficient data for event.project.task.removed:",
                  event.payload
                );
                bail(new Error("Insufficient data for task.removed"));
              }
              break;
            }
            // Các case khác từ đồng đội bạn (employee.added, employee.removed, leader.updated)
            case "event.project.employee.added":
              console.log(
                "[Report Service] Handling event.project.employee.added:",
                event.payload
              );
              // const { projectId, employeeId, taskId } = event.payload;
              // Logic gán employee cho task (component) trong report-service
              // await Component.update({ employeeId: employeeId }, { where: { componentCode: taskId, productCode: projectId } });
              break;
            case "event.project.employee.removed":
              console.log(
                "[Report Service] Handling event.project.employee.removed:",
                event.payload
              );
              // const { projectId, taskId, employeeId } = event.payload;
              // Logic bỏ gán employee khỏi task (component)
              // await Component.update({ employeeId: null }, { where: { componentCode: taskId, productCode: projectId, employeeId: employeeId } });
              break;
            case "event.project.leader.updated":
              console.log(
                "[Report Service] Handling event.project.leader.updated:",
                event.payload
              );
              // const { projectId, newLeaderId } = event.payload;
              // report-service có thể không cần lưu trữ leader của project, nhưng có thể log hoặc làm gì đó nếu cần.
              break;
            default:
              console.warn(
                "[Report Service] Unknown routing key in handleConsumedEvent:",
                routingKey
              );
              // Không nên bail ở đây, chỉ là không xử lý
              break;
          }
        } catch (error) {
          console.error(
            `[Report Service] Error in handleConsumedEvent for ${routingKey}:`,
            error.message,
            error.stack
          );
          if (
            error.message.includes("not found") ||
            error.message.includes("Insufficient data")
          ) {
            // Lỗi do dữ liệu không tìm thấy hoặc thiếu, không nên retry mãi
            bail(error); // Dừng retry
          }
          throw error; // Ném lỗi để retry xử lý các lỗi tạm thời (DB connection, network...)
        }
      },
      {
        retries: 3, // Giảm số lần retry để tránh tắc nghẽn nếu lỗi kéo dài
        minTimeout: 1000, // Tăng thời gian chờ giữa các lần retry
        factor: 1.5,
        onRetry: (err, attempt) => {
          console.warn(
            `[Report Service RabbitMQ] Retry ${attempt} for ${routingKey} due to: ${err.message}`
          );
        },
      }
    );
  }
}

// Export instance và helper function
module.exports = { rabbitMQService: new RabbitMQService(), createEvent };
