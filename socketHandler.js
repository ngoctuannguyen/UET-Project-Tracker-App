const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

io.on("connection", function(socket) {

    socket.on("join_group", function(groupId) {
        socket.join(groupId);
        console.log(`User joined group: ${groupId}`);
    });

    socket.on("send_message", function(data) {
        const { groupId, message } = data;
        io.to(groupId).emit("receive_message", message);
        console.log(`Message sent to group ${groupId}: ${message}`);
    });

    socket.on("create_group", function(groupId) {
        socket.join(groupId);
        console.log(`Group created: ${groupId}`);
    });

    socket.on("leave_group", function(groupId) {
        socket.leave(groupId);
        console.log(`User left group: ${groupId}`);
    });

    socket.on("remove_group", function(groupId) {
        socket.leave(groupId);
        console.log(`Group ${groupId} removed`);
    });

    socket.on("add_user", function(data) {
        const { groupId, userId } = data;
        socket.join(groupId);
        console.log(`User ${userId} added to group: ${groupId}`);
    });

    socket.on("remove_user", function(data) {
        const { groupId, userId } = data;
        socket.leave(groupId);
        console.log(`User ${userId} removed from group: ${groupId}`);
    });

    socket.on("add_admin", function(data) {
        const { groupId, userId } = data;
        console.log(`User ${userId} made admin of group: ${groupId}`);
    });

    socket.on("remove_admin", function(data) {
        const { groupId, userId } = data;
        console.log(`User ${userId} removed as admin of group: ${groupId}`);
    });

    socket.on("find_group", function(groupId) {
        console.log(`Finding group: ${groupId}`);
    });

    socket.on("update_group", function(data) {
        const { groupId, newName } = data;
        console.log(`Group ${groupId} updated to ${newName}`);
    });

    socket.on("delete_group", function(groupId) {
        socket.leave(groupId);
        console.log(`Group ${groupId} deleted`);
    });

    socket.on("")

    socket.on("rename_group", function(data) {
        
        const { groupId, newName } = data;
        console.log(`Group ${groupId} renamed to ${newName}`);
    });

    socket.on("change_group", function(data) {
        const { groupId, roomName } = data;
        console.log(`User changed room from ${groupId} to ${roomName}`);
    });

    socket.on("disconnect", function() {
        console.log("User disconnected");
    });
});