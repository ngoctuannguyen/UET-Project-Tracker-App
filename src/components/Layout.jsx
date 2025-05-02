// layout/Layout.jsx
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ChatWindowGroup from "@/components/ChatWindow-group";
import ChatWindowAI from "@/components/ChatWindow-AIchat";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [chatGroupVisible, setChatGroupVisible] = useState(false);
  const [chatAIVisible, setChatAIVisible] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar 
          onOpenGroupChat={() => setChatGroupVisible(!chatGroupVisible)} 
          onOpenChat={() => setChatAIVisible(!chatAIVisible)} 
        />
        <main className="flex-1 p-4 overflow-auto">
          <Outlet />
        </main>
      </div>
      {chatGroupVisible && <ChatWindowGroup onClose={() => setChatGroupVisible(false)} />}
      {chatAIVisible && <ChatWindowAI onClose={() => setChatAIVisible(false)} />}
    </div>
  );
};

export default Layout;
