const amqp = require('amqplib');
const axios = require('axios');
const retry = require('async-retry');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'projects';
        this.connectionUrl = "amqps://vascfdnt:jtd5jMuRX4CH6Nt6L-xbquo8NczYn-Mk@armadillo.rmq.cloudamqp.com/vascfdnt";
    }

    async connect() {
        if (this.connection && this.channel) return;

        this.connection = await amqp.connect(this.connectionUrl);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

        this.connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
            this.connection = null;
            this.channel = null;
        });

        this.connection.on('close', () => {
            console.warn('RabbitMQ connection closed. Reconnecting...');
            this.connection = null;
            this.channel = null;
            setTimeout(() => this.connect(), 5000);
        });

        console.log('Connected to RabbitMQ');
    }

    async handleEvent(routingKey, event) {
        const apiBase = 'http://localhost:3002/api';

        await retry(async (bail) => {
            switch (routingKey) {
                case 'event.project.employee.added': {
                    const { projectId, employeeId } = event.payload;
                    await axios.put(`${apiBase}/internal/groups/${projectId}/members`,
                            { member: employeeId });
                    break;
                }
                case 'event.project.employee.removed': {
                    const { projectId, employeeId } = event.payload;
                    await axios.delete(`${apiBase}/internal/groups/${projectId}/members`, { 
                        data: { 
                            member: employeeId 
                        }});
                    break;
                }
                case 'event.project.admin.changed': {
                    const { projectId, leaderId } = event.payload;
                    await axios.put(`${apiBase}/internal/groups/${projectId}/change-admin`, { admin: leaderId });
                    break;
                }
                default:
                    console.warn('Unknown event type:', routingKey);
                    bail(new Error('Unknown event type'));
            }
        }, {
            retries: 3,
            minTimeout: 1000,
            onRetry: (err, attempt) => {
                console.warn(`Retry ${attempt} for ${routingKey}: ${err.message}`);
            }
        });
    }

    async consumeEvents() {
        await this.connect();

        const queue = await this.channel.assertQueue('chat-service', { exclusive: false });
        await this.channel.bindQueue(queue.queue, this.exchange, 'event.project.employee.*');

        this.channel.consume(queue.queue, async (msg) => {
            if (!msg) return;

            const event = JSON.parse(msg.content.toString());
            const routingKey = msg.fields.routingKey;

            console.log(`Received event: ${routingKey}`, event);

            try {
                await this.handleEvent(routingKey, event);
                this.channel.ack(msg);
            } catch (err) {
                console.error('Error handling message:', err.message);
                this.channel.nack(msg, false, false); // không retry nữa
            }
        });

        console.log('Consumer is listening for project events...');
    }
}

module.exports = new RabbitMQService();
