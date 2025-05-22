// app.js
const express = require('express');
const rabbitMQConsumer = require('./rabbitmq/rabbitmq');
const {handleMessage, checkDueDatesAndNotify} = require('./controller/controller')
const cron = require('node-cron');
const cors = require('cors');
const notificationRouter = require('./routers/router');
const app = express();
const PORT = process.env.PORT || 3003;

app.get('/', (_, res) => res.send('🚀 Notification Service Running'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));
app.use('/', notificationRouter);
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    rabbitMQConsumer.connect(handleMessage);
    // Schedule the notification check every 24 hours
    cron.schedule('00 7 * * *', () => {
    checkDueDatesAndNotify()
        .then(() => console.log('✅ 7:00 AM Notification Check Done'))
        .catch(err => console.error('❌ Cron Error:', err));
}, {
    timezone: "Asia/Ho_Chi_Minh"
});
});
