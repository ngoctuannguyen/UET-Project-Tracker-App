const express = require('express');
const http = require('http');
const routes = require('./routes/route');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use('/api', routes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});