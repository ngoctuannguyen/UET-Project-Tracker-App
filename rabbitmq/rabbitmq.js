const amqp = require('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.exchange = 'projects';
        this.connectionUrl = "amqps://vascfdnt:jtd5jMuRX4CH6Nt6L-xbquo8NczYn-Mk@armadillo.rmq.cloudamqp.com/vascfdnt"
    }

    async connect() {
        try {
            this.connection = await amqp.connect(this.connectionUrl);
            this.channel = await this.connection.createChannel();
            
            await this.channel.assertExchange(this.exchange, 'topic', {
                durable: true,
                internal: true
            });

            console.log('Connected to RabbitMQ');
        } catch (error) {
            console.error('RabbitMQ connection error:', error);
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
            console.error('Error publishing event:', error);
            throw error;
        }
    }
}

console.log(new RabbitMQService().connect());

module.exports = new RabbitMQService();