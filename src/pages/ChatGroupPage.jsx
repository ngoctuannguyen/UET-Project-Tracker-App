import React, { useState, useEffect, useRef } from "react";
import GroupChatInfo from "../components/GroupChatInfo";

// 👥 Danh sách group chat mẫu
const sampleGroups = [
  { id: 1, name: "Frontend Team", members: ["Alice", "NTN", "VCL"] },
  { id: 2, name: "Backend Team", members: ["Bob", "You"] },
  { id: 3, name: "UI/UX Design", members: ["Charlie", "You"] },
];

// 💬 Tin nhắn mẫu
const sampleMessages = {
  1: [
    { sender: "Alice", content: "Hello Frontend team!" },
    { sender: "You", content: "Hi Alice!" },
  ],
  2: [
    { sender: "Bob", content: "Backend ready?" },
    { sender: "You", content: "Yes, all set!" },
  ],
  3: [
    { sender: "Charlie", content: "Mockup done!" },
    { sender: "You", content: "Looks great!" },
  ],
};

const ChatGroupPage = () => {
  const [groups, setGroups] = useState(sampleGroups);
  const [selectedGroupId, setSelectedGroupId] = useState(1);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState(sampleMessages[selectedGroupId] || []);
  const [input, setInput] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages(sampleMessages[selectedGroupId] || []);
  }, [selectedGroupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { sender: "You", content: input.trim() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    sampleMessages[selectedGroupId] = updatedMessages;
    setInput("");
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentGroup = groups.find((g) => g.id === selectedGroupId);

  const handleAddMember = () => {
    if (!newMember.trim()) return;
    if (currentGroup.members.includes(newMember.trim())) {
      alert("Thành viên đã tồn tại trong nhóm!");
      return;
    }
    const updatedGroups = groups.map((g) =>
      g.id === selectedGroupId
        ? { ...g, members: [...g.members, newMember.trim()] }
        : g
    );
    setGroups(updatedGroups);
    setNewMember("");
    setShowAddMember(false);
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar group list */}
      <div className="w-64 bg-white shadow-lg p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Group Chats</h2>
        <input
          type="text"
          placeholder="Search group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-160px)]">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`w-full text-left p-2 rounded-lg ${
                selectedGroupId === group.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {currentGroup?.name}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow hover:from-blue-600 hover:to-blue-800 transition font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v2a4 4 0 01-3 3.87M6 8a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
              Xem thành viên
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white p-4 rounded-lg shadow overflow-y-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 ${
                msg.sender === "You" ? "text-right" : "text-left"
              }`}
            >
              <div className="text-sm text-gray-500">{msg.sender}</div>
              <div
                className={`inline-block px-4 py-2 rounded-lg ${
                  msg.sender === "You"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="mt-4 flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </form>

        {/* Modal xem thành viên */}
        {showMembers && (
        <div className="absolute inset-0 flex items-center justify-end pr-12 z-20">
          <GroupChatInfo
            members={currentGroup.members}
            onClose={() => setShowMembers(false)}
          />
        </div>
        )}
      </div>
    </div>
  );
};

export default ChatGroupPage;