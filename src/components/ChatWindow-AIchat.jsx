// components/ChatWindow-AIchat.jsx
import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ChatWindowAI = ({ onClose }) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const containerRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={containerRef} className="fixed right-4 top-20 bottom-4 w-[350px] md:w-[500px] bg-white rounded-2xl shadow-xl flex flex-col z-50">
      <div className="flex flex-1">
        {sidebarVisible ? (
          <div className="w-1/3 bg-gray-100 p-4">
            <button onClick={() => setSidebarVisible(false)}>
              <ChevronLeft size={20} />
            </button>
            <div className="mt-4 space-y-2">
              <div className="p-2 bg-white rounded-xl shadow">Chatbot</div>
            </div>
          </div>
        ) : (
          <button onClick={() => setSidebarVisible(true)} className="bg-gray-100 px-2 py-1">
            <ChevronRight size={20} />
          </button>
        )}

        <div className="flex-1 flex flex-col">
          <div className="p-4 flex-1 overflow-auto">
            <div className="text-sm mb-2">AI Chat: Hello Admin, welcome back</div>
            <div className="text-sm text-right mb-2">Me: Do me this work</div>
          </div>
          <div className="p-4 border-t flex items-center gap-2">
            <input
              type="text"
              placeholder="Message"
              className="flex-1 px-3 py-2 border rounded-full"
            />
            <button className="bg-teal-500 text-white rounded-full p-2">Send</button>
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-black"
      >
        ✕
      </button>
    </div>
  );
};

export default ChatWindowAI;
