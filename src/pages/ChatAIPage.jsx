import React, { useState } from "react";

// 📦 Dữ liệu mẫu cho các đoạn chat cũ
const sampleConversations = [
  { id: 1, title: "Tư vấn dự án CRM" },
  { id: 2, title: "Ý tưởng giao diện mới" },
  { id: 3, title: "Gợi ý task tuần sau" },
];

const mockResponses = {
  "Tư vấn dự án CRM": [
    { sender: "you", content: "Tôi cần gợi ý tính năng cho CRM." },
    { sender: "ai", content: "Bạn có thể thêm nhắc việc, phân quyền, báo cáo..." },
  ],
  "Ý tưởng giao diện mới": [
    { sender: "you", content: "Thiết kế sao cho thân thiện?" },
    { sender: "ai", content: "Dùng tone sáng, nút lớn, icon rõ ràng." },
  ],
  "Gợi ý task tuần sau": [
    { sender: "you", content: "Tuần sau nên làm gì?" },
    { sender: "ai", content: "Tập trung cải thiện onboarding và sửa bug còn lại." },
  ],
};

const AIChatPage = () => {
  const [search, setSearch] = useState("");
  const [chats, setChats] = useState(sampleConversations);
  const [selectedChat, setSelectedChat] = useState(sampleConversations[0]);
  const [messages, setMessages] = useState(
    mockResponses[sampleConversations[0].title] || []
  );
  const [input, setInput] = useState("");

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setMessages(mockResponses[chat.title] || []);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "you", content: input };
    const aiReply = { sender: "ai", content: `AI: ${input} 🤖` };

    const newMessages = [...messages, userMessage, aiReply];
    setMessages(newMessages);
    setInput("");
  };

  const handleNewChat = () => {
    const newChat = {
      id: chats.length + 1,
      title: `Chat ${chats.length + 1}`,
    };
    setChats([newChat, ...chats]);
    setSelectedChat(newChat);
    setMessages([]);
  };

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 p-4 border-r bg-white shadow">
        <h2 className="text-xl font-bold mb-4">AI Chats</h2>
        <button
          onClick={handleNewChat}
          className="mb-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          + New Chat
        </button>
        <input
          type="text"
          placeholder="Search..."
          className="w-full mb-4 p-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`w-full text-left p-2 rounded ${
                selectedChat.id === chat.id
                  ? "bg-blue-100 font-semibold"
                  : "hover:bg-gray-100"
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col p-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">
          {selectedChat.title}
        </h1>

        <div className="flex-1 bg-white p-4 rounded shadow overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 ${
                msg.sender === "you" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  msg.sender === "you"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="mt-4 flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatPage;
