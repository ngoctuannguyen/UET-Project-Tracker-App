const amqp = require('amqplib');

class RabbitMQConsumer {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'projects';
        this.connectionUrl = "amqps://vascfdnt:jtd5jMuRX4CH6Nt6L-xbquo8NczYn-Mk@armadillo.rmq.cloudamqp.com/vascfdnt";
    }

    async connect(onMessage) {
        try {
            this.connection = await amqp.connect(this.connectionUrl);
            this.channel = await this.connection.createChannel();

            await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

            const q = await this.channel.assertQueue('', { exclusive: true });

            // Bind các routing keys liên quan đến project
            await this.channel.bindQueue(q.queue, this.exchange, 'event.project.created');
            await this.channel.bindQueue(q.queue, this.exchange, 'event.project.deleted');
            // Bind các routing keys liên quan đến task
            await this.channel.bindQueue(q.queue, this.exchange, 'event.project.task.created');
            await this.channel.bindQueue(q.queue, this.exchange, 'event.project.task.removed');
            await this.channel.bindQueue(q.queue, this.exchange, 'event.project.task.updated');

            console.log('[*] Waiting for task events in Report Service...');

            this.channel.consume(q.queue, (msg) => {
                if (msg.content) {
                    const data = JSON.parse(msg.content.toString());
                    const routingKey = msg.fields.routingKey;

                    console.log(` [x] Received '${routingKey}':`, data);

                    // Gọi xử lý tùy theo loại sự kiện
                    onMessage(routingKey, data);
                }
            }, {
                noAck: true
            });
        } catch (error) {
            console.error('RabbitMQ consumer error:', error);
            setTimeout(() => this.connect(onMessage), 5000);
        }
    }
}

module.exports = new RabbitMQConsumer();
