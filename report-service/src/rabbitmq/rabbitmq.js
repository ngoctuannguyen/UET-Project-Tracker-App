const amqp = require('amqplib');
const axios = require('axios');
const retry = require('async-retry');
const {
    addComponent,
    deleteComponent,
    deleteProduct,
    addProduct,
    updateProgress,
    updateStatus,
    updateComponent
} = require('../services/productAndComponentService');

class RabbitMQConsumer {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'projects';
        this.connectionUrl = 'amqps://vascfdnt:jtd5jMuRX4CH6Nt6L-xbquo8NczYn-Mk@armadillo.rmq.cloudamqp.com/vascfdnt';

        this.reportServiceBaseURL = 'http://localhost:3004/api';
        this.routingKeys = [
            'event.project.created',
            'event.project.deleted',
            'event.project.updated',
            'event.project.task.created',
            'event.project.task.updated',
            'event.project.task.removed',
            'event.project.employee.added',
            'event.project.employee.removed',
            'event.project.leader.updated'
        ];
    }

    async connect() {
        try {
            this.connection = await amqp.connect(this.connectionUrl);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

            const queue = await this.channel.assertQueue('report-service', { durable: true });

            for (const key of this.routingKeys) {
                await this.channel.bindQueue(queue.queue, this.exchange, key);
            }

            this.channel.consume(queue.queue, async (msg) => {
                if (!msg) return;

                const event = JSON.parse(msg.content.toString());
                const routingKey = msg.fields.routingKey;

                console.log(` [x] Received '${routingKey}'`);

                try {
                    await this.handleEvent(routingKey, event);
                    this.channel.ack(msg);
                } catch (error) {
                    console.error('Error handling event:', error.message);
                    this.channel.nack(msg, false, false); // Không retry nữa
                }
            });

            console.log('[*] Report service is consuming project events...');
        } catch (err) {
            console.error('RabbitMQ connection error:', err.message);
            setTimeout(() => this.connect(), 5000); // Thử lại sau 5s
        }
    }

    async handleEvent(routingKey, event) {
        await retry(async () => {
            switch (routingKey) {
                case 'event.project.created': {
                    const { project, uid } = event.payload;
                    await addProduct(project);
                    break;
                }
                case 'event.project.updated':
                case 'event.project.task.created': {
                    const { newTask, projectId} = event.payload;
                    await addComponent(newTask, projectId);
                    break;
                }
                case 'event.project.task.updated': {
                    const { projectId, task_id, data } = event.payload; 
                    await updateComponent(projectId, task_id, data);
                    break;
                }
                case 'event.project.task.removed':
                    const { projectId, taskId, data } = event.payload;
                    await deleteComponent(projectId, taskId, data);
                    break;
                default:
                    throw new Error(`Unhandled routing key: ${routingKey}`);
            }
        }, {
            retries: 3,
            minTimeout: 1000,
            onRetry: (err, attempt) => {
                console.warn(`Retry ${attempt} - ${routingKey}: ${err.message}`);
            }
        });
    }
}

module.exports = new RabbitMQConsumer();
