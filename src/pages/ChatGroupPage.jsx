import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
// import { useNavigate } from "react-router-dom"; // Bỏ comment nếu bạn cần điều hướng

// --- URL Configuration ---
const CHAT_SERVICE_API_URL = "http://localhost:3002/api";
const SOCKET_SERVER_URL = "http://localhost:3002"; 

const ChatGroupPage = () => {
  // ... (các state và refs giữ nguyên) ...
  const [currentUser, setCurrentUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);


  // 1. Lấy thông tin người dùng và token từ localStorage (giữ nguyên)
  useEffect(() => {
    try {
      const storedAuthData = localStorage.getItem('authData');
      console.log("ChatGroupPage - Stored Auth Data from localStorage:", storedAuthData);
      if (storedAuthData) {
        const parsedAuthData = JSON.parse(storedAuthData);
        console.log("ChatGroupPage - Parsed Auth Data:", parsedAuthData);
        if (parsedAuthData.token && parsedAuthData.user && parsedAuthData.user.uid && parsedAuthData.user.displayName) {
          setCurrentUser(parsedAuthData.user);
          setIdToken(parsedAuthData.token);
          console.log("ChatGroupPage - Set currentUser:", parsedAuthData.user);
          console.log("ChatGroupPage - Set idToken:", parsedAuthData.token);
        } else {
          console.warn("ChatGroupPage - Auth data in localStorage is incomplete. User might need to login.");
        }
      } else {
        console.warn("ChatGroupPage - No auth data found in localStorage. User might need to login.");
      }
    } catch (error) {
      console.error("ChatGroupPage - Error parsing auth data from localStorage:", error);
    }
    setAuthChecked(true);
  }, []);

  // 2. Kết nối Socket.IO và xử lý sự kiện
  useEffect(() => {
    if (!currentUser || !SOCKET_SERVER_URL || !idToken) {
        console.log("ChatGroupPage - Socket connection skipped: currentUser, SOCKET_SERVER_URL or idToken missing.", {currentUser, SOCKET_SERVER_URL, idToken});
        return;
    }
    console.log("ChatGroupPage - Attempting to connect to Socket.IO server:", SOCKET_SERVER_URL, "for user:", currentUser.uid);

    // Ngắt kết nối socket cũ nếu có trước khi tạo mới (quan trọng khi selectedGroupId thay đổi)
    if (socketRef.current) {
        console.log("ChatGroupPage - Disconnecting existing socket before reconnecting.");
        socketRef.current.disconnect();
    }

    socketRef.current = io(SOCKET_SERVER_URL, {
      query: { userId: currentUser.uid }, // Gửi userId qua query để server có thể biết
      // auth: { token: idToken } // Nếu bạn implement auth cho socket connection
    });

    socketRef.current.on("connect", () => {
      console.log("ChatGroupPage - SOCKET EVENT: Connected to Socket.IO server:", SOCKET_SERVER_URL, "Socket ID:", socketRef.current.id);
      // Tự động join group hiện tại nếu có sau khi kết nối thành công
      if (selectedGroupId) {
        console.log(`ChatGroupPage - SOCKET EVENT: Re-joining group ${selectedGroupId} after (re)connect.`);
        socketRef.current.emit("join-group", selectedGroupId);
      }
    });

    socketRef.current.on("new-message", (newMessageObject) => {
      console.log("ChatGroupPage - SOCKET EVENT: Received 'new-message' from server:", JSON.stringify(newMessageObject, null, 2));
      console.log("ChatGroupPage - SOCKET EVENT: Current selectedGroupId:", selectedGroupId);

      if (newMessageObject && newMessageObject.group_id && newMessageObject.id) { // Kiểm tra có id
        if (newMessageObject.group_id === selectedGroupId) {
          setMessages((prevMessages) => {
            // Kiểm tra xem tin nhắn đã tồn tại trong state chưa bằng ID
            if (prevMessages.some(msg => msg.id === newMessageObject.id)) {
              console.warn("ChatGroupPage - SOCKET EVENT: Message with ID", newMessageObject.id, "already exists in state. Not adding again.");
              return prevMessages; // Không thêm nếu đã tồn tại
            }
            console.log("ChatGroupPage - SOCKET EVENT: Adding new message (ID:", newMessageObject.id, ") to state for selected group:", selectedGroupId);
            return [...prevMessages, newMessageObject];
          });
        } else {
          console.log("ChatGroupPage - SOCKET EVENT: Received message for a different group. Current:", selectedGroupId, "Received for:", newMessageObject.group_id);
        }
      } else {
        console.warn("ChatGroupPage - SOCKET EVENT: Received invalid newMessageObject (missing group_id or id):", newMessageObject);
      }
    });
    
    socketRef.current.on("send-message-error", (errorData) => {
        console.error("ChatGroupPage - SOCKET EVENT: Received 'send-message-error' from server:", errorData);
        // Hiển thị thông báo lỗi cho người dùng nếu cần
        alert(`Lỗi gửi tin nhắn: ${errorData.details || errorData.message}`);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("ChatGroupPage - SOCKET EVENT: Connection error:", err.message, err.data ? err.data : '');
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("ChatGroupPage - SOCKET EVENT: Disconnected from Socket.IO server. Reason:", reason);
    });

    return () => {
      if (socketRef.current) {
        console.log("ChatGroupPage - Cleanup: Disconnecting from Socket.IO server.");
        socketRef.current.off("connect");
        socketRef.current.off("new-message");
        socketRef.current.off("send-message-error");
        socketRef.current.off("connect_error");
        socketRef.current.off("disconnect");
        socketRef.current.disconnect();
      }
    };
  }, [currentUser, idToken, selectedGroupId]); // Thêm selectedGroupId vào dependency array để socket có thể join lại group khi selectedGroupId thay đổi

  // 3. Lấy danh sách nhóm chat (giữ nguyên)
  useEffect(() => {
    if (!currentUser || !idToken) {
      console.log("ChatGroupPage - fetchGroups: currentUser or idToken is missing. Skipping fetch.", { currentUser, idToken });
      if (authChecked) setLoadingGroups(false);
      return;
    }
    console.log("ChatGroupPage - fetchGroups: Fetching groups for user:", currentUser.uid);

    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await axios.get(`${CHAT_SERVICE_API_URL}/users/${currentUser.uid}/groups`, {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        console.log("ChatGroupPage - fetchGroups API Response:", response);
        
        const fetchedGroups = response.data || [];
        setGroups(fetchedGroups);
        
        if (fetchedGroups.length > 0) {
          if (!selectedGroupId || !fetchedGroups.find(g => g.id === selectedGroupId)) {
             setSelectedGroupId(fetchedGroups[0].id);
             console.log("ChatGroupPage - fetchGroups: Auto-selected first group:", fetchedGroups[0].id);
          } else {
            console.log("ChatGroupPage - fetchGroups: Kept current selected group:", selectedGroupId);
          }
        } else {
          setSelectedGroupId(null);
          setMessages([]); 
          console.log("ChatGroupPage - fetchGroups: No groups found for user.");
        }
      } catch (error) {
        console.error("ChatGroupPage - Error fetching groups:", error.response ? error.response.data : error.message);
        setGroups([]);
        setSelectedGroupId(null);
        setMessages([]);
      } finally {
        setLoadingGroups(false);
      }
    };
    if(authChecked) { 
        fetchGroups();
    }
  }, [currentUser, idToken, authChecked]);

  // 4. Lấy tin nhắn cho nhóm đã chọn VÀ tham gia phòng socket
  useEffect(() => {
    if (!selectedGroupId || !currentUser || !idToken ) {
      console.log("ChatGroupPage - joinAndFetchMessages: selectedGroupId, currentUser, or idToken is missing. Skipping.", { selectedGroupId, currentUser, idToken });
      if (selectedGroupId) setLoadingMessages(false); 
      if (!selectedGroupId) setMessages([]); 
      return;
    }
    
    const joinAndFetchMessages = async () => {
      setLoadingMessages(true);
      setMessages([]); // Xóa tin nhắn cũ trước khi fetch tin nhắn mới cho group mới
      console.log(`ChatGroupPage - joinAndFetchMessages: Attempting to join group ${selectedGroupId} and fetch messages.`);

      // Tham gia phòng socket cho group đã chọn
      if (socketRef.current && socketRef.current.connected) {
          console.log(`ChatGroupPage - Emitting 'join-group' for ${selectedGroupId} by user ${currentUser.uid}`);
          socketRef.current.emit("join-group", selectedGroupId); 
      } else {
          console.warn(`ChatGroupPage - Cannot emit 'join-group' for ${selectedGroupId}: Socket not connected or not available. Will attempt to join on (re)connect.`);
      }

      try {
        const response = await axios.get(
          `${CHAT_SERVICE_API_URL}/groups/${selectedGroupId}/messages`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );
        console.log(`ChatGroupPage - fetchMessages API Response for group ${selectedGroupId}:`, response);
        setMessages(response.data || []);
      } catch (error) {
        console.error(`ChatGroupPage - Error fetching messages for group ${selectedGroupId}:`, error.response ? error.response.data : error.message);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    joinAndFetchMessages();

  }, [selectedGroupId, currentUser, idToken]); // Chỉ phụ thuộc vào selectedGroupId, currentUser, idToken

  // Cuộn xuống tin nhắn mới nhất (giữ nguyên)
  useEffect(() => {
    if (messages.length > 0) { // Chỉ cuộn nếu có tin nhắn
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSelectGroup = (groupId) => {
    if (selectedGroupId === groupId) return;
    console.log("ChatGroupPage - User selected group:", groupId);
    // Khi chọn group mới, selectedGroupId sẽ thay đổi,
    // useEffect cho socket connection sẽ chạy lại và join group mới (nếu socket đã connect)
    // useEffect cho joinAndFetchMessages cũng sẽ chạy lại để fetch tin nhắn và emit join-group
    setSelectedGroupId(groupId);
  };

  // 5. Gửi tin nhắn (giữ nguyên, nhưng đảm bảo sender_name được gửi)
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedGroupId || !currentUser ) {
        console.warn("ChatGroupPage - Send message aborted: Missing input, selectedGroupId, or currentUser.");
        return;
    }
    if (!socketRef.current || !socketRef.current.connected) {
        console.error("ChatGroupPage - Cannot send message: Socket not connected.");
        alert("Không thể gửi tin nhắn: Mất kết nối tới server. Vui lòng thử lại.");
        return;
    }

    const messageData = {
      group_id: selectedGroupId,
      text: input.trim(),
      sender_id: currentUser.uid, // Lấy từ currentUser đã xác thực
      sender_name: currentUser.displayName || "Người dùng ẩn danh", // Đảm bảo có sender_name
    };
    
    console.log("ChatGroupPage - CLIENT EMIT: Emitting 'send-message' to server:", JSON.stringify(messageData, null, 2));
    socketRef.current.emit("send-message", messageData);
    setInput("");
  };

  // ... (phần render JSX giữ nguyên, nhưng chú ý key của message) ...
  const filteredGroups = groups.filter((group) =>
    (group.group_name || group.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const currentGroup = groups.find((g) => g.id === selectedGroupId);

  if (!authChecked) {
    return <div className="h-screen flex items-center justify-center text-gray-500">Kiểm tra xác thực...</div>;
  }

  if (!currentUser || !idToken) {
    return <div className="h-screen flex items-center justify-center text-gray-500">Vui lòng đăng nhập để sử dụng tính năng chat.</div>;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar group list */}
      <div className="w-72 bg-white shadow-lg p-4 border-r flex flex-col">
        <h2 className="text-xl font-bold mb-4 text-gray-700">Group Chats</h2>
        <input
          type="text"
          placeholder="Tìm kiếm nhóm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        {loadingGroups ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Đang tải danh sách nhóm...</p>
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 pr-1">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${
                    selectedGroupId === group.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {group.group_name || group.name || "Unnamed Group"}
                </button>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Không tìm thấy nhóm nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-100 p-6">
        {selectedGroupId && currentGroup ? (
          <>
            <div className="bg-white shadow rounded-t-lg p-4 mb-0.5">
                <h1 className="text-xl font-semibold text-gray-800">
                {currentGroup.group_name || currentGroup.name || "Chat Room"}
                </h1>
            </div>

            <div className="flex-1 bg-white p-4 shadow rounded-b-lg overflow-y-auto mb-4 custom-scrollbar">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">Đang tải tin nhắn...</p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => ( // Sử dụng msg.id làm key
                  <div
                    key={msg.id} // QUAN TRỌNG: Sử dụng ID duy nhất của tin nhắn làm key
                    className={`mb-3 flex ${
                      msg.sender_id === currentUser.uid ? "justify-end" : "justify-start" 
                    }`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                        msg.sender_id === currentUser.uid
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.sender_id !== currentUser.uid && (
                        <p className={`text-xs font-semibold mb-0.5 ${msg.sender_id === currentUser.uid ? 'text-blue-100' : 'text-gray-600'}`}>
                            {msg.sender_name || "Unknown User"}
                        </p>
                      )}
                      <p className="text-sm">{msg.text}</p>
                      {/* Timestamp (nếu có và muốn hiển thị) */}
                      {/* <p className={`text-xs mt-1 ${msg.sender_id === currentUser.uid ? 'text-blue-200' : 'text-gray-400'} text-right`}>
                        {msg.timestamp && msg.timestamp.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : '')}
                      </p> */}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center">
                    <p className="text-gray-500">Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="mt-auto flex items-center space-x-3 bg-white p-3 rounded-lg shadow"
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!selectedGroupId || loadingMessages}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
                disabled={!selectedGroupId || !input.trim() || loadingMessages}
              >
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-gray-500">
              {loadingGroups ? "Đang tải danh sách nhóm..." : "Chọn một nhóm để bắt đầu trò chuyện."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatGroupPage;