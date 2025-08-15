import React, { useEffect, useState, useRef, useContext } from "react";
import { HiOutlineBell } from "react-icons/hi2";
import { IoPersonAddOutline } from "react-icons/io5";
import { IoMdMore } from "react-icons/io";
import { HiMenuAlt2 } from "react-icons/hi";
import defImg from "../../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiUserPlus,
  FiCheck,
  FiUser,
  FiFileText,
  FiBell,
} from "react-icons/fi";
import InviteMemberModal from "../Modals/InviteMemberModal";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { notificationSound } from "../../assets/sounds/notification";
import NotificationDetailModal from "../Notifications/NotificationDetailModal";
import { AuthContext } from "../../Auth/AuthContext";

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const token = localStorage.getItem("token");
  const { id, sheetId } = useParams();

  const [notifications, setNotifications] = useState([]);
  const [previousCount, setPreviousCount] = useState(0);
  const audioRef = useRef(new Audio(notificationSound));
  const notificationRef = useRef(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null); // Add this ref
  const { changeCompany } = useContext(AuthContext);
  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get("/notification", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newNotifications = response?.data?.notifications || [];

      // Play sound if there are new unread notifications
      const newUnreadCount = newNotifications.filter((n) => !n.isRead).length;
      if (newUnreadCount > previousCount && previousCount !== 0) {
        audioRef.current.play().catch(console.error);
      }
      setPreviousCount(newUnreadCount);
      setNotifications(newNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Add event listener for profile dropdown close on outside click
    const handleProfileDropdownClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleProfileDropdownClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleProfileDropdownClickOutside);
    };
  }, [showProfileDropdown]);

  const recentNotifications = notifications.slice(0, 3);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "INVITATION":
        return <FiUserPlus className="text-lg text-pink2" />;
      case "MENTION":
        return <FiUser className="text-lg text-blue-400" />;
      case "UPDATE":
        return <FiFileText className="text-lg text-purple-400" />;
      case "TASK":
        return <FiCheck className="text-lg text-pink2" />;
      default:
        return <FiBell className="text-lg text-[#777C9D]" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    return format(timestamp, "h:mm a");
  };

  const { isLoading, error, data } = useQuery({
    queryKey: ["userinfo"],
    queryFn: async () =>
      await axiosInstance.get("/user/info", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
  });

  const {
    isLoading: workspacedownloading,
    error: wwrkerror,
    data: workspacelocation,
    refetch: refetchWorkspace,
  } = useQuery({
    queryKey: ["location", id],
    queryFn: async () =>
      await axiosInstance.get(`/workspace/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    enabled: !!id,
  });

  const {
    isLoading: sheetdownloading,
    error: sheetError,
    data: sheetlocation,
    refetch: refetchsheet,
  } = useQuery({
    queryKey: ["sheetlocation", sheetId],
    queryFn: async () =>
      await axiosInstance.get(`/sheet/${sheetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    enabled: !!sheetId,
  });

  useEffect(() => {
    if (sheetId) {
      refetchsheet();
    }
  }, [sheetId, refetchsheet]);

  useEffect(() => {
    if (id) {
      refetchWorkspace();
    }
  }, [id, refetchWorkspace]);

  const user = data?.data || {};
  useEffect(() => {
    if (user?.roles && user?.selectedRole) {
      const foundRole = user.roles.find((i) => user.selectedRole === i.id);
      setSelectedRole(foundRole);
      // You may keep or remove the console logs as needed for debugging
      console.log(user);
      console.log({ userrole: foundRole });
      console.log({ selectedRole: foundRole });
    }
    // Only run when user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleNotificationClick = (id) => {
    setSelectedNotificationId(id);
    setShowDetailModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="relative py-4 lg:py-6 xl:py-[30px] flex flex-col lg:flex-row items-start lg:items-center justify-between mx-4 lg:mx-6 xl:mx-[35px] border-b border-grayDash font-radioCanada">
      {/* Breadcrumb + Mobile Controls */}
      <div className="breadcrumb text-pink2 mb-4 lg:mb-0 min-w-0 w-full flex items-center justify-between gap-2">
        <h1 className="text-responsive-lg font-[500] truncate">
          {(!id && !sheetId) ? (
            "Dashboard"
          ) : (
            !workspacedownloading ? workspacelocation?.data.name : "Loading"
          )}
          {sheetId && id && (
            <>
              {" / "}
              {!sheetdownloading && sheetlocation?.data?.name
                ? sheetlocation.data.name
                : sheetdownloading
                  ? "Loading sheet..."
                  : "No sheet"}
            </>
          )}
        </h1>
        {/* Mobile buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            aria-label="Toggle sidebar"
            onClick={() => onToggleSidebar && onToggleSidebar()}
            className="p-2 rounded-xl hover:bg-[#2A2A2A] text-[#C4E1FE]"
          >
            <HiMenuAlt2 size={22} />
          </button>
          <button
            aria-label="Toggle menu"
            onClick={toggleMenu}
            className="p-2 rounded-xl hover:bg-[#2A2A2A] text-[#C4E1FE]"
          >
            <IoMdMore size={22} />
          </button>
        </div>
      </div>

      {/* Navigation Actions */}
      <div
        className={`navActions ${isMenuOpen ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-5 xl:gap-[12px] w-full lg:w-auto`}
      >
        <div className="flex items-center gap-3">
          {/* Notification Icon */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 hover:bg-[#2A2A2A] rounded-xl transition-colors"
            >
              <HiOutlineBell
                size={24}
                className="text-[#777C9D] hover:text-white transition-colors"
              />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-pink2 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
                >
                  {unreadCount}
                </motion.div>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-[380px] min-h-[220px] bg-[#1E1E1E] rounded-xl shadow-lg border border-[#2A2A2A] overflow-hidden z-50"
                  style={{ minHeight: "220px", maxHeight: "400px" }}
                >
                  {/* Header */}
                  <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HiOutlineBell size={20} className="text-[#777C9D]" />
                      <h3 className="text-white font-medium">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-pink2/10 text-pink2 text-xs px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate("/notifications")}
                      className="text-sm text-[#777C9D] hover:text-white transition-colors"
                    >
                      View all
                    </button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {recentNotifications.length === 0 ? (
                      <div className="p-8 text-center text-[#777C9D] flex flex-col items-center gap-3">
                        <HiOutlineBell size={24} />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#2A2A2A]">
                        {recentNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 flex items-start gap-3 hover:bg-[#2A2A2A] transition-colors cursor-pointer ${!notification.isRead ? "bg-[#2A2A2A]/50" : ""
                              }`}
                            onClick={() =>
                              handleNotificationClick(notification.id)
                            }
                          >
                            <div className="mt-1 flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm break-words">
                                {notification.text}
                              </p>
                              <p className="text-[#777C9D] text-xs mt-1">
                                {formatTimestamp(
                                  new Date(notification.createdAt)
                                )}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 rounded-full bg-pink2 mt-2 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedRole?.type === "AUTHOR" && (
            <div
              onClick={() => setIsInviteModalOpen(true)}
              className="invite flex items-center text-white bg-grayDash px-3 lg:px-[12px] py-2 lg:py-[7px] rounded-[9px] cursor-pointer gap-2 lg:gap-[9px] hover:bg-gray transition-all duration-300 w-full lg:w-auto h-[40px]"
            >
              <IoPersonAddOutline className="text-xl lg:text-[24px]" />
              <p className="text-responsive-xs">Invite</p>
            </div>
          )}

          <div className="relative">
            <div
              className="profile flex items-center bg-grayDash rounded-[9px] py-2 lg:py-[7px] px-3 lg:px-[12px] gap-2 lg:gap-[9px] hover:bg-gray transition-all duration-300 cursor-pointer w-full lg:w-auto h-[40px]"
              onClick={() => setShowProfileDropdown((v) => !v)}
            >
              <div className="flex-1 lg:flex-none">
                <p className="text-[11px] lg:text-[12px] text-white">
                  {user?.firstName ? user.firstName : user.email}
                </p>
                <div className="flex gap-[3px]">
                  <span className="text-[10px] lg:text-[11px] text-pink2">
                    {selectedRole?.company?.name}
                  </span>
                  <p className="text-[10px] lg:text-[11px] text-white">
                    {selectedRole?.company?.plan
                      ? selectedRole?.company?.plan?.name
                      : "Free plan"}
                  </p>
                </div>
              </div>
              <div className="profileImg w-6 h-6 lg:w-[26px] ml-auto lg:ml-0">
                <img
                  src={
                    user?.avatar?.path
                      ? `https://eventify.preview.uz/${user.avatar.path}`
                      : defImg
                  }
                  alt="Profile"
                  className="w-[26px] h-[26px] rounded-full object-cover"
                />
              </div>
            </div>
            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div
                ref={profileDropdownRef}
                className="absolute right-0 mt-2 w-64 bg-black rounded-xl shadow-lg border border-[#2A2A2A] z-50"
              >
                <div className="p-4 border-b border-[#2A2A2A]">
                  <p className="text-white font-semibold mb-2">Your Companies</p>
                  <ul className="space-y-2">
                    {(user?.roles || [])
                      .filter((role) => role.member?.status !== "CANCELLED")
                      .map((role) => (
                        <li key={role.company.id}>
                          <button
                            className={`w-full text-left px-3 py-2 rounded-lg text-[#C4E1FE] hover:bg-pink2/10 transition ${selectedRole?.company?.id === role.company.id
                                ? "bg-pink2/20"
                                : ""
                              }`}
                            onClick={() => {
                              changeCompany({ roleId: role.id });
                              setSelectedRole(role);
                              setShowProfileDropdown(false);
                            }}
                          >
                            {role.company.name}{" "}
                            <span className="text-xs text-[#777C9D]">
                              ({role.company.plan?.name || "Free plan"})
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="p-4">
                  <button
                    className="w-full bg-pink2 text-white py-2 rounded-lg font-semibold hover:bg-pink2/90 transition"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
      <NotificationDetailModal
        notificationId={selectedNotificationId}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
};

export default Navbar;
