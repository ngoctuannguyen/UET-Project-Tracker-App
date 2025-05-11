const readline = require('readline');
const { io } = require('socket.io-client');

// Kết nối đến server WebSocket
const socket = io('http://localhost:3000');

// Tạo giao diện nhập liệu trên terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let username = '';

// Nhập tên người dùng
rl.question('Enter your username: ', (name) => {
  username = name;
  group_id = "d8f08250-555b-4e90-9a1b-473940951b22";
  console.log(`Welcome, ${username} to group ${group_id}! Start chatting...\n`);
  user_id = "111";
  // Lắng nghe tin nhắn từ server
  socket.on('receive-message', (data) => {
    if (data.username !== username) {
      console.log(`${data.username}: ${data.message}`);
    }
  });

  // Nhập tin nhắn
  rl.on('line', (message) => {
    socket.emit('send-message', { group_id: group_id, sender_name: username, text: message, sender_id: "111"});
  });

  rl.on("close", (user_id) => {
    socket.disconnect();
    console.log("Disconnected from the server.");
  });

});