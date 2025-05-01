const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    retry: {
        initialRetryTime: 100,
        retries: 8
        }, 
    clientId: 'project-service',
    brokers: ['localhost:9092'], // Replace with your Kafka broker(s)
});

const producer = kafka.producer();

const connectProducer = async () => {
  await producer.connect();
  console.log('Kafka Producer connected');
};

const sendMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`Message sent to topic "${topic}":`, message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

module.exports = { connectProducer, sendMessage };