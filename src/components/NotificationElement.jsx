// NotificationElement.jsx
import React from "react";

const NotificationElement = ({ notification, onClick }) => {
  return (
    <li
      className="bg-white shadow-lg rounded-xl px-8 py-6 flex items-center text-lg cursor-pointer hover:bg-gray-50 transition"
      onClick={onClick}
    >
      <span className="text-gray-700">{notification.content}</span>
    </li>
  );
};

export default NotificationElement;
