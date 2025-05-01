const express = require('express');
const http = require('http');
const routes = require('./routes/route');
const { connectProducer } = require("./kafka/kafka_producer");
const { connectConsumer, subscribeToTopic } = require("./kafka/kafka_consumer");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3001;

try {
  await connectProducer();
  await connectConsumer();
  await subscribeToTopic("project", (message) => {
    console.log('Processing message:', message);
  });
} catch (error) {
  console.error('Error connecting to Kafka:', error);
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});