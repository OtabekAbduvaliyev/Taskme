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
import { MdOutlineHistory } from "react-icons/md"; // Add icon for activity log

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
    const [activeTab, setActiveTab] = useState("chat"); // "chat", "files", "activity"
    const messagesEndRef = useRef(null); // Add ref for auto-scroll
    const chatContainerRef = useRef(null); // Ref for chat container
    const [showScrollButton, setShowScrollButton] = useState(false);
    // Placeholder for files (replace with real logic as needed)
    const [files, setFiles] = useState([]); // [{id, name, path, uploadedAt, uploadedBy}]
    const [activityLogs, setActivityLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({}); // key: filename -> percent

    // public host for direct file URLs (used in <img src> and direct links)
    const FILE_HOST = "https://eventify.preview.uz";
    // upload endpoint (use axiosInstance for uploads)
    const UPLOAD_ENDPOINT = "task/upload";

    // max allowed file size (100 MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    // helper to format max size for messages
    const formatMaxSize = () => "100 MB";

    // helper to build public URL
    const getFileUrl = (file) => {
        const rawPath = file?.path || file?.url || "";
        const cleaned = rawPath.replace(/^\/+/, "");
        return `${FILE_HOST}/${cleaned}`;
    };

    // Download helper: fetch file as blob then download (ensures download works cross-origin)
    const downloadFile = async (file, e) => {
        if (e && typeof e.stopPropagation === "function") e.stopPropagation();
        try {
            const url = getFileUrl(file);
            const res = await fetch(url);
            if (!res.ok) throw new Error("Network response was not ok");
            const blob = await res.blob();
            const filename = file.originalName || file.name || (file.path?.split?.("/").pop?.()) || "file";
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    // Keep members in sync with task prop
    useEffect(() => {
        setMembers(task?.members || []);
    }, [task]);

    // Fetch files when sidebar opens or task changes
    useEffect(() => {
        const fetchFiles = async () => {
            if (!isOpen || !task?.id) return;
            try {
                const token = localStorage.getItem("token");
                const res = await axiosInstance.get(`/task/${task.id}/files`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                // Expecting array of files; fallback to []
                setFiles(Array.isArray(res.data) ? res.data : (res.data?.files || []));
            } catch (e) {
                console.error("Error fetching files:", e);
                setFiles([]);
            }
        };
        fetchFiles();
    }, [isOpen, task?.id]);

    // Listen for uploads from other components (SheetTableItem) and merge returned files
    useEffect(() => {
        const handler = (e) => {
            if (!e?.detail) return;
            const { taskId, files: returned } = e.detail || {};
            if (!taskId || taskId !== task?.id) return;
            if (!Array.isArray(returned) || returned.length === 0) return;
            // prepend returned files while avoiding duplicate ids
            setFiles((prev) => {
                const existingIds = new Set(prev.map(f => f.id));
                const newFiles = returned.filter(f => f && f.id && !existingIds.has(f.id));
                return newFiles.length ? [...newFiles, ...prev] : prev;
            });
        };
        window.addEventListener("taskFilesUpdated", handler);
        return () => window.removeEventListener("taskFilesUpdated", handler);
    }, [task?.id]);

    // Open modal and set selected members to current task members
    const handleOpenMemberModal = () => {
        setSelectedMemberIds((task?.members || []).map((m) => m.id));
        setShowMemberModal(true);
    };

    // delete file directly from Files tab (no confirmation)
    const deleteFileFromTask = async (file) => {
        if (!file?.id || !task?.id) return;
        try {
            const token = localStorage.getItem("token");
            await axiosInstance.delete(`/task/${task.id}/files`, {
                data: { fileIds: [file.id] },
                headers: { Authorization: `Bearer ${token}` },
            });
            setFiles((prev) => prev.filter((f) => f.id !== file.id));
        } catch (e) {
            console.error("Error deleting file:", e);
        }
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
            // notify other components (SheetTableItem etc.) about member update
            try {
                window.dispatchEvent(new CustomEvent("taskMembersUpdated", {
                    detail: { taskId: task.id, members: updatedMembers }
                }));
            } catch (e) { /* ignore */ }
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

    // Fetch activity logs when tab is switched to "activity"
    useEffect(() => {
        if (activeTab === "activity" && task?.id) {
            setIsLoadingLogs(true);
            const token = localStorage.getItem("token");
            axiosInstance
                .get(`/log/task/${task.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(res => setActivityLogs(res.data || []))
                .catch(() => setActivityLogs([]))
                .finally(() => setIsLoadingLogs(false));
        }
    }, [activeTab, task?.id]);

    // Add state to track expanded activity items
    const [expandedLogs, setExpandedLogs] = useState([]);

    const toggleExpandLog = (id) => {
        setExpandedLogs((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // new: upload queue for modern UI (per-file progress / preview)
    const [uploadQueue, setUploadQueue] = useState([]); // { id, file, preview, size, progress, status }

    // utility: format bytes
    const formatBytes = (bytes) => {
        if (!bytes) return "0 B";
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    // Upload a single file and update queue progress
    const uploadSingle = async (item) => {
        // do not attempt to upload items that already have an error (e.g. oversized)
        if (item.status === "error") return;
        setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 0 } : q)));
        const form = new FormData();
        form.append("files", item.file);
        form.append("taskId", task.id);

        try {
            const token = localStorage.getItem("token");
            const res = await axiosInstance.post(UPLOAD_ENDPOINT, form, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    if (!progressEvent.total) return;
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q)));
                },
            });

            // merge server-returned files into files list
            const returned =
                (res?.data && (res.data.data || res.data.files || (Array.isArray(res.data) ? res.data : null))) || [];

            if (returned && returned.length) {
                setFiles((prev) => [...returned, ...prev]);
            }

            setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done", progress: 100 } : q)));
        } catch (err) {
            console.error("Upload failed for", item.file.name, err);
            setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: err?.message || "Upload failed" } : q)));
        } finally {
            // release preview URL after a short delay so UI shows thumbnail briefly
            setTimeout(() => {
                setUploadQueue((prev) => prev.filter((q) => q.id !== item.id || q.status !== "done"));
            }, 1200);
        }
    };

    // updated: handle file input change to enqueue files and upload individually
    const handleFileChange = async (e) => {
        const selected = Array.from(e.target.files || []);
        if (!selected.length || !task?.id) return;

        const items = selected.map((file, idx) => {
            const id = `${Date.now()}_${idx}`;
            const isTooLarge = file.size > MAX_FILE_SIZE;
            return {
                id,
                file,
                preview: /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name) ? URL.createObjectURL(file) : null,
                size: file.size,
                progress: 0,
                status: isTooLarge ? "error" : "queued",
                // add readable error for oversized files
                error: isTooLarge ? `File exceeds ${formatMaxSize()}` : undefined,
            };
        });

        // add to queue and start uploading each
        setUploadQueue((prev) => [...items, ...prev]);
        // clear input
        e.target.value = "";

        // upload sequentially (or concurrently if you prefer)
        for (const it of items) {
            // skip items already marked as error (oversized etc.)
            if (it.status === "error") continue;
            if (!task?.id) break;
            /* eslint-disable no-await-in-loop */
            await uploadSingle(it);
            /* eslint-enable no-await-in-loop */
        }
    };

    // drag-n-drop handlers
    const handleDrop = (e) => {
        e.preventDefault();
        if (!e.dataTransfer) return;
        const files = Array.from(e.dataTransfer.files || []);
        // create a fake input event shape
        const fakeEvent = { target: { files } };
        handleFileChange(fakeEvent);
    };
    const handleDragOver = (e) => e.preventDefault();

    // cleanup previews on unmount
    useEffect(() => {
        return () => {
            uploadQueue.forEach((q) => {
                if (q.preview) URL.revokeObjectURL(q.preview);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 font-semibold text-sm transition ${
                                activeTab === "activity"
                                    ? "text-pink2 border-b-2 border-pink2"
                                    : "text-gray4"
                            }`}
                            onClick={() => setActiveTab("activity")}
                        >
                            <MdOutlineHistory /> Activity Log
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
                            {/* Drag & Drop area */}
                            <div
                                className="border-2 border-dashed border-[#2A2D36] rounded-lg p-4 mb-4 flex flex-col md:flex-row items-center gap-4"
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                role="button"
                                tabIndex={0}
                                onKeyDown={() => {}}
                            >
                                <div className="flex-1 text-center md:text-left">
                                    <div className="text-white font-semibold">Drag & drop files here</div>
                                    <div className="text-gray4 text-sm mt-1">
                                        or click to select files. Supports images, docs and more.
                                        <span className="block text-xs text-gray4 mt-1">Max file size: <span className="text-white font-medium">{formatMaxSize()}</span></span>
                                    </div>
                                </div>
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                    <div className="px-3 py-2 bg-pink2 text-white rounded-md font-medium">
                                        Select files <span className="text-xs ml-2 opacity-90">({formatMaxSize()} max)</span>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Upload queue (in-progress and recently finished) */}
                            {uploadQueue.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-white font-semibold mb-2">Uploading</div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {uploadQueue.map((q) => (
                                            <div key={q.id} className="flex items-center gap-3 bg-[#1F1F1F] rounded-lg px-3 py-2">
                                                <div className="w-12 h-12 rounded overflow-hidden bg-[#111] flex items-center justify-center border border-[#2A2D36]">
                                                    {q.preview ? <img src={q.preview} alt={q.file.name} className="w-full h-full object-cover" /> : <FaRegFolderOpen className="text-pink2 w-6 h-6" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white truncate">{q.file.name}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="h-2 bg-[#2A2D36] rounded-md flex-1 overflow-hidden">
                                                            <div style={{ width: `${q.progress}%` }} className={`h-2 bg-pink2 rounded-md transition-all`} />
                                                        </div>
                                                        <div className="text-xs text-gray4 whitespace-nowrap">{q.progress}%</div>
                                                        <div className="text-xs text-gray4">· {formatBytes(q.size)}</div>
                                                    </div>
                                                    {q.status === "error" && (
                                                        <div className="text-xs text-red-500 mt-1">
                                                            {q.error || "Upload failed"}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    {q.status === "uploading" ? (
                                                        <button className="text-gray4 px-2 py-1 rounded" title="Uploading" disabled>…</button>
                                                    ) : q.status === "error" ? (
                                                        <button onClick={() => uploadSingle(q)} className="text-yellow-400 px-2 py-1 rounded" title="Retry">Retry</button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Files List */}
                            {(!files || files.length === 0) ? (
                                <div className="text-gray4 text-center mt-10">
                                    <p>No files uploaded for this task.</p>
                                    <p className="text-sm mt-2">Upload files to share with task members.</p>
                                </div>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {files.map((file) => {
                                        const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.path || file.url || "");
                                        const url = getFileUrl(file);
                                        return (
                                            <li key={file.id} className="flex items-center gap-3 bg-[#2A2D36] rounded-lg px-3 py-2">
                                                <div className="w-12 h-12 rounded overflow-hidden bg-[#1f1f1f] flex items-center justify-center border border-[#2A2D36] flex-shrink-0">
                                                    {isImage ? (
                                                        <img src={url} alt={file.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FaRegFolderOpen className="text-pink2 w-6 h-6" />
                                                    )}
                                                </div>
            
                                                {/* Main info: filename (truncated) and timestamp underneath */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white truncate">{file.originalName || file.name || file.path?.split?.("/").pop?.() || "file"}</div>
                                                    <div className="text-xs text-gray4 mt-1">
                                                        {file.createdAt ? dayjs(file.createdAt).format("MMM D, HH:mm") : (file.uploadedAt ? dayjs(file.uploadedAt).format("MMM D, HH:mm") : "")}
                                                    </div>
                                                </div>
            
                                                {/* Actions: download + delete — always visible on the right */}
                                                <div className="flex items-center gap-2 ml-2">
                                                    <button
                                                        onClick={(e) => downloadFile(file, e)}
                                                        className="text-gray4 px-2 py-1 rounded hover:text-white bg-transparent"
                                                        title="Download"
                                                    >
                                                        ⬇
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteFileFromTask(file); }}
                                                        className="text-red-500 px-2 py-1 rounded hover:text-red-400"
                                                        title="Delete"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                    {activeTab === "activity" && (
                        <div className="flex-1 flex flex-col px-4 py-4 bg-[#23272F] custom-scrollbar overflow-y-auto pb-4">
                            <div className="font-bold text-lg text-white mb-4">Activity Log</div>
                            {isLoadingLogs ? (
                                <div className="text-gray4 text-center mt-10">Loading...</div>
                            ) : (
                                <>
                                    {(!activityLogs || activityLogs.length === 0) ? (
                                        <div className="text-gray4 text-center mt-10">
                                            <p>No activity logs found for this task.</p>
                                        </div>
                                    ) : (
                                        <ul className="flex flex-col gap-3">
                                            {activityLogs.map((log, idx) => {
                                                const id = log.id || idx;
                                                const user = log.user || {};
                                                const avatarSrc = user.avatar?.path
                                                    ? `https://eventify.preview.uz/${user.avatar.path}`
                                                    : testMemImg;
                                                // Compose a short action summary; prefer provided action/description, fallback to updatedKey info
                                                const actionSummary =
                                                    log.action ||
                                                    log.description ||
                                                    (log.updatedKey
                                                        ? `Changed "${log.updatedKey}"`
                                                        : "Updated");

                                                return (
                                                    <li
                                                        key={id}
                                                        className="bg-[#2A2D36] rounded-lg px-3 py-2 flex flex-col"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <img
                                                                src={avatarSrc}
                                                                alt={user.firstName || "User"}
                                                                className="w-10 h-10 rounded-full border-2 border-[#23272F] object-cover flex-shrink-0"
                                                            />
                                                            <div className="flex-1">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div>
                                                                        <div className="text-white text-sm font-semibold">
                                                                            {user.firstName || "User"} {user.lastName || ""}
                                                                        </div>
                                                                        <div className="text-gray4 text-xs">
                                                                            {user.email || ""}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-gray4 text-xs">
                                                                        {dayjs(log.createdAt).format("MMM D, HH:mm")}
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleExpandLog(id)}
                                                                    className="w-full text-left mt-2"
                                                                    aria-expanded={expandedLogs.includes(id)}
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="text-white text-sm break-words">
                                                                            {actionSummary}
                                                                        </div>
                                                                        <div className="text-gray4">
                                                                            {/* simple chevron/arrow that rotates when open */}
                                                                            <svg
                                                                                className={`w-4 h-4 transform transition-transform ${expandedLogs.includes(id) ? "rotate-90" : ""}`}
                                                                                viewBox="0 0 24 24"
                                                                                fill="none"
                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                            >
                                                                                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                </button>

                                                                {expandedLogs.includes(id) && (
                                                                    <div className="mt-3 bg-[#23272F] rounded-md p-3 text-sm text-white">
                                                                        {/* Show old -> new with pointer icon */}
                                                                        <div className="flex items-center gap-2 break-words">
                                                                            <div className="text-gray4">Old:</div>
                                                                            <div className="text-white font-medium">
                                                                                {typeof log.oldValue === "string" && log.oldValue !== "" ? log.oldValue : (log.oldValue ?? "—")}
                                                                            </div>
                                                                            <div className="text-pink2 px-1">
                                                                                {/* pointer icon */}
                                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                                                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                    <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="text-white font-medium">
                                                                                {typeof log.newValue === "string" && log.newValue !== "" ? log.newValue : (log.newValue ?? "—")}
                                                                            </div>
                                                                        </div>
                                                                        {log.updatedKey && (
                                                                            <div className="text-gray4 text-xs mt-2">
                                                                                Field: <span className="text-white">{log.updatedKey}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TaskChatSidebar;



