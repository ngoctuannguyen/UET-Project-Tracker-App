const axios = require('axios'); // Import axios for HTTP requests

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New user connected');

    // Handle joining a group
    socket.on('join-group', (groupId) => {
      socket.join(groupId);
      console.log(`User joined group ${groupId}`);
    });

    // Handle sending a message
    socket.on('send-message', async (messageData) => {
      try {
      
        const response = await axios.post('http://localhost:3000/api/messages', messageData);
        
        if (response.status !== 201) {
          throw new Error('Failed to save message to the database');
        }
        else {
          console.log('Message saved successfully:', response.data);
        }

        io.to(messageData.group_id).emit('new-message', response.data);

        // Broadcast the message to the group
      } catch (error) {
        console.error('Error handling message:', error.message);
        socket.emit('error', { message: 'Failed to send message', details: error.message });
      }
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`);
    });
  });
};