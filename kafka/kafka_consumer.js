const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'chat-app',
  brokers: ['localhost:9092'], // Replace with your Kafka broker(s)
});

const consumer = kafka.consumer({ groupId: 'chat-app-group' });

const connectConsumer = async () => {
  await consumer.connect();
  console.log('Kafka Consumer connected');
};

const subscribeToTopic = async (topic, callback) => {
  await consumer.subscribe({ topic, fromBeginning: true });
  console.log(`Subscribed to topic "${topic}"`);

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const parsedMessage = JSON.parse(message.value.toString());
    },
  });
};

module.exports = { connectConsumer, subscribeToTopic };