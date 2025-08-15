import React, { useState, useContext, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import testMemImg from "../../../../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import { FaUserSlash } from "react-icons/fa";
import { AuthContext } from "../../../../Auth/AuthContext";
import axiosInstance from "../../../../AxiosInctance/AxiosInctance";
import { io } from "socket.io-client";
import dayjs from "dayjs";
import InviteMemberModal from "../../../Modals/InviteMemberModal";
import { FaRegComments, FaRegFolderOpen } from "react-icons/fa";

const sidebarVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
};

const TaskChatSidebar = ({ isOpen, onClose, task }) => {
    const { members: companyMembers } = useContext(AuthContext);
    const [members, setMembers] = useState(task?.members || []);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [messageInput, setMessageInput] = useState("");
    const [userId, setUserId] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [activeTab, setActiveTab] = useState("chat"); // "chat" or "files"
    const messagesEndRef = useRef(null); // Add ref for auto-scroll
    const chatContainerRef = useRef(null); // Ref for chat container
    const [showScrollButton, setShowScrollButton] = useState(false);
    // Placeholder for files (replace with real logic as needed)
    const [files, setFiles] = useState([]); // [{id, name, url, uploadedAt, uploadedBy}]

    // Keep members in sync with task prop
    useEffect(() => {
        setMembers(task?.members || []);
    }, [task]);

    // Open modal and set selected members to current task members
    const handleOpenMemberModal = () => {
        setSelectedMemberIds((task?.members || []).map((m) => m.id));
        setShowMemberModal(true);
    };

    // Toggle member selection
    const handleToggleMember = (memberId) => {
        setSelectedMemberIds((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    // Save selected members to task
    const handleSaveMembers = async () => {
        if (!task?.id) return;
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            await axiosInstance.patch(
                `/task/${task.id}`,
                { members: selectedMemberIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update local members state for immediate UI feedback
            const updatedMembers =
                companyMembers?.filter((m) => selectedMemberIds.includes(m.id)) || [];
            setMembers(updatedMembers);
            setShowMemberModal(false);
        } catch {
            // Optionally show error
        }
        setIsSaving(false);
    };
    useEffect(() => {
        if (isOpen && task?.id) {
            const token = localStorage.getItem("token");
            const socketInstance = io("https://eventify.preview.uz/chat", {
                query: { token, chatId: task.chat.id },
                transports: ["websocket"],
            });

            setSocket(socketInstance);

            socketInstance.on("connect", () => console.log("Connected to chat"));
            socketInstance.on(`messagesInChat${task.chat.id}`, setMessages);
            socketInstance.on(`onlineUsersInChat${task.chat.id}`, setOnlineUsers);
            socketInstance.on("newMessage", (msg) => {
                setMessages((prev) => [...prev, msg]);
            });

            return () => {
                socketInstance.disconnect();
            };
        }
    }, [isOpen, task?.id]);
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !socket) return;
        socket.emit("chatMessage", { content: messageInput.trim() });
        setMessageInput("");
    };

    useEffect(() => {
        // Fetch current user id from /user/info API
        const fetchUserId = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const res = await axiosInstance.get("/user/info", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserId(res.data?.id);
            } catch {
                setUserId(null);
            }
        };
        fetchUserId();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Show scroll-to-bottom button if user is not at the bottom
    useEffect(() => {
        const chatDiv = chatContainerRef.current;
        if (!chatDiv) return;
        const handleScroll = () => {
            const threshold = 80; // px from bottom
            const atBottom =
                chatDiv.scrollHeight - chatDiv.scrollTop - chatDiv.clientHeight < threshold;
            setShowScrollButton(!atBottom);
        };
        chatDiv.addEventListener("scroll", handleScroll);
        // Initial check
        handleScroll();
        return () => chatDiv.removeEventListener("scroll", handleScroll);
    }, [isOpen, messages.length]);

    const handleScrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-[#23272F] shadow-2xl z-[9999] flex flex-col border-l border-gray3"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={sidebarVariants}
                    transition={{ type: "tween", duration: 0.35 }}
                >
                    {/* Header */}
                    <div className="flex flex-col px-6 py-4 border-b border-gray3 bg-[#23272F]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-lg text-white">
                                    {task?.name || "Task Chat"}
                                </span>
                                <div
                                    className="flex items-center -space-x-4 cursor-pointer"
                                    onClick={handleOpenMemberModal}
                                    title="Edit members"
                                    style={{ minHeight: "32px" }}
                                >
                                    {(!members || members.length === 0) ? (
                                        <FaUserSlash
                                            className="text-gray4 w-7 h-7"
                                            title="No members exist"
                                        />
                                    ) : (
                                        members.map((member, index) => (
                                            <img
                                                key={member.id}
                                                src={
                                                    member.user?.avatar?.path
                                                        ? `https://eventify.preview.uz/${member.user.avatar.path}`
                                                        : testMemImg
                                                }
                                                alt={member.user?.firstName || "Member"}
                                                className="w-8 h-8 rounded-full border-2 border-[#23272F] object-cover"
                                                style={{ zIndex: members.length - index }}
                                                title={member.user?.firstName || ""}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                            <button
                                className="text-gray4 hover:text-pink2 text-2xl"
                                onClick={onClose}
                            >
                                <IoClose />
                            </button>
                        </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex border-b border-gray3 bg-[#23272F]">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 font-semibold text-sm transition ${
                                activeTab === "chat"
                                    ? "text-pink2 border-b-2 border-pink2"
                                    : "text-gray4"
                            }`}
                            onClick={() => setActiveTab("chat")}
                        >
                            <FaRegComments /> Chat
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 font-semibold text-sm transition ${
                                activeTab === "files"
                                    ? "text-pink2 border-b-2 border-pink2"
                                    : "text-gray4"
                            }`}
                            onClick={() => setActiveTab("files")}
                        >
                            <FaRegFolderOpen /> Files
                        </button>
                    </div>
                    {/* Tab Content */}
                    {activeTab === "chat" && (
                        <>
                            {/* Member selection modal (always openable) */}
                            {showMemberModal && (
                                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
                                    <div className="bg-grayDash rounded-lg shadow-lg p-4 w-full max-w-[400px] min-h-[220px]">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="font-bold text-lg text-white">
                                                Select Members
                                            </div>
                                            <button
                                                className="text-gray4 hover:text-pink2 text-xl"
                                                onClick={() => setShowMemberModal(false)}
                                            >
                                                <IoClose />
                                            </button>
                                        </div>
                                        <div className="max-h-[160px] overflow-y-auto mb-4">
                                            {!companyMembers || companyMembers.length === 0 ? (
                                                <div className="text-gray4 text-center py-6">
                                                    No company members found.
                                                </div>
                                            ) : (
                                                companyMembers.map((member) => (
                                                    <label
                                                        key={member.id}
                                                        className="flex items-center gap-3 py-2 cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMemberIds.includes(member.id)}
                                                            onChange={() => handleToggleMember(member.id)}
                                                            className="accent-pink2 w-5 h-5"
                                                        />
                                                        <img
                                                            src={
                                                                member.user?.avatar?.path
                                                                    ? `https://eventify.preview.uz/${member.user.avatar.path}`
                                                                    : testMemImg
                                                            }
                                                            alt={member.user?.firstName || "Member"}
                                                            className="w-7 h-7 rounded-full object-cover border-2 border-[#23272F]"
                                                        />
                                                        <span className="text-white">
                                                            {member.user?.firstName || "NoName"}{" "}
                                                            {member.user?.lastName || ""}
                                                        </span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                className="w-full h-9 rounded bg-pink2 text-white font-semibold hover:bg-pink transition mb-2"
                                                onClick={() => {
                                                    setShowMemberModal(false);
                                                    setShowInviteModal(true);
                                                }}
                                            >
                                                Invite
                                            </button>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="px-4 py-2 rounded bg-gray3 text-white"
                                                    onClick={() => setShowMemberModal(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="px-4 py-2 rounded bg-pink2 text-white font-semibold disabled:opacity-60"
                                                    onClick={handleSaveMembers}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? "Saving..." : "Save"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Invite member modal */}
                            <InviteMemberModal
                                isOpen={showInviteModal}
                                onClose={() => setShowInviteModal(false)}
                            />
                            {/* Chat messages */}
                            <div
                                className="flex-1 overflow-y-auto px-4 py-4 bg-[#23272F] custom-scrollbar relative"
                                ref={chatContainerRef}
                            >
                                {messages.length === 0 ? (
                                    <div className="text-gray4 text-center mt-10">
                                        <p>No chat messages yet.</p>
                                        <p className="text-sm mt-2">Start a conversation for this task!</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {messages.map((m, idx) => {
                                            console.log(m);
                                            const isOwn = m.user?.id === userId || m.userId === userId;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}
                                                >
                                                    {/* Other's avatar on left */}
                                                    {!isOwn && (
                                                        <img
                                                            src={
                                                                m.user?.avatar?.path
                                                                    ? `https://eventify.preview.uz/${m.user.avatar.path}`
                                                                    : testMemImg
                                                            }
                                                            alt={m.user?.firstName || "User"}
                                                            className="w-8 h-8 rounded-full border-2 border-[#23272F] object-cover"
                                                        />
                                                    )}
                                                    <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                                                        <div
                                                            className={`
                                                                px-4 py-2 rounded-2xl
                                                                ${isOwn
                                                                    ? "bg-[#353945] text-white rounded-br-none"
                                                                    : "bg-[#2A2D36] text-white rounded-bl-none"
                                                                }
                                                                shadow
                                                            `}
                                                        >
                                                            <span className="font-semibold text-[15px]">
                                                                {m.user?.firstName || m.userId}
                                                            </span>
                                                            <div className="text-[15px] mt-1 break-words">
                                                                {m.content}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray4 mt-1">
                                                            {dayjs(m.createdAt).format("HH:mm, MMM D")}
                                                        </span>
                                                    </div>
                                                    {/* Own avatar on right */}
                                                    {isOwn && (
                                                        <img
                                                            src={
                                                                m.user?.avatar?.path
                                                                    ? `https://eventify.preview.uz/${m.user.avatar.path}`
                                                                    : testMemImg
                                                            }
                                                            alt={m.user?.firstName || "User"}
                                                            className="w-8 h-8 rounded-full border-2 border-[#23272F] object-cover"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} /> {/* Auto-scroll anchor */}
                                    </div>
                                )}
                                {showScrollButton && (
                                    <button
                                        onClick={handleScrollToBottom}
                                        className="fixed right-8 bottom-32 z-[10001] bg-pink2 text-white rounded-full shadow-lg p-2 hover:bg-pink-600 transition"
                                        style={{
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            opacity: showScrollButton ? 1 : 0,
                                            transform: showScrollButton ? "translateY(0)" : "translateY(20px)",
                                            pointerEvents: showScrollButton ? "auto" : "none",
                                            transition: "opacity 0.3s, transform 0.3s"
                                        }}
                                        title="Scroll to bottom"
                                    >
                                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                                            <path d="M12 19V5M12 19l7-7M12 19l-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {/* Message input & online users */}
                            <div className="p-4 border-t border-gray3 bg-[#23272F]">
                                <form className="flex gap-2" onSubmit={handleSendMessage}>
                                    <input
                                        type="text"
                                        className="flex-1 rounded-lg px-3 py-2 bg-gray3 text-white border-none outline-none focus:ring-2 focus:ring-pink2 transition"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="bg-pink2 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition"
                                    >
                                        Send
                                    </button>
                                </form>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="text-xs text-gray4">Online:</span>
                                    {onlineUsers.length > 0 ? (
                                        <div className="flex -space-x-2">
                                            {onlineUsers.map((u) => (
                                                <img
                                                    key={u.user?.id || u.user?.firstName}
                                                    src={
                                                        u.user?.avatar?.path
                                                            ? `https://eventify.preview.uz/${u.user.avatar.path}`
                                                            : testMemImg
                                                    }
                                                    alt={u.user?.firstName || "User"}
                                                    className="w-6 h-6 rounded-full border-2 border-[#23272F] object-cover"
                                                    title={u.user?.firstName || ""}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray4 ml-1">No one online</span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                    {activeTab === "files" && (
                        <div className="flex-1 flex flex-col px-4 py-4 bg-[#23272F] custom-scrollbar">
                            {/* Files List */}
                            {(!files || files.length === 0) ? (
                                <div className="text-gray4 text-center mt-10">
                                    <p>No files uploaded for this task.</p>
                                    <p className="text-sm mt-2">Upload files to share with task members.</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {files.map((file) => (
                                        <li key={file.id} className="flex items-center gap-3 bg-[#2A2D36] rounded-lg px-3 py-2">
                                            <FaRegFolderOpen className="text-pink2" />
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-white hover:underline"
                                            >
                                                {file.name}
                                            </a>
                                            <span className="text-xs text-gray4 ml-auto">
                                                {file.uploadedBy?.user?.firstName || "User"} • {dayjs(file.uploadedAt).format("MMM D, HH:mm")}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {/* File Upload (placeholder) */}
                            <div className="mt-6">
                                <label className="block text-sm text-gray4 mb-2">Upload file</label>
                                <input
                                    type="file"
                                    className="block w-full text-sm text-gray4 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-pink2 file:text-white hover:file:bg-pink"
                                    // onChange={handleFileUpload} // Implement upload logic as needed
                                    disabled
                                />
                                <span className="text-xs text-gray4 mt-1 block">File upload coming soon.</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TaskChatSidebar;


