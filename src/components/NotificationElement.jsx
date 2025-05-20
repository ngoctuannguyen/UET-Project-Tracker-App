import React from "react";

const NotificationElement = ({ notification }) => {
  return (
    <li className="bg-white shadow-lg rounded-xl px-8 py-6 flex items-center text-lg">
      <span className="text-gray-700">{notification.content}</span>
    </li>
  );
};

export default NotificationElement;