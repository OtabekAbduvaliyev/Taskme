import React, { useEffect, useState, useRef, useContext } from "react";
import ReactDOM from "react-dom";
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
  const portalRef = useRef(null);
  const profileRef = useRef(null);
  const profilePortalRef = useRef(null);
   // use left instead of right to anchor under the bell reliably on narrow screens
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 16, width: 380 });
  const [profileDropdownStyle, setProfileDropdownStyle] = useState({ top: 0, left: 16, width: 300 });
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { changeCompany, showToast } = useContext(AuthContext);

  // NEW: state to show full-screen company-switching overlay
  const [companySwitching, setCompanySwitching] = useState(false);

  // helper: promise delay
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

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
      const target = event.target;
      const clickedInBell = notificationRef.current && notificationRef.current.contains(target);
      const clickedInPortal = portalRef.current && portalRef.current.contains(target);
      const clickedInProfile = profileRef.current && profileRef.current.contains(target);
      const clickedInProfilePortal = profilePortalRef.current && profilePortalRef.current.contains(target);
      // close notifications if click outside bell/portal
      if (!clickedInBell && !clickedInPortal) {
        setShowNotifications(false);
      }
      // close profile dropdown if click outside profile button/portal
      if (!clickedInProfile && !clickedInProfilePortal) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // compute portal position when dropdown opens
  useEffect(() => {
    if (!showNotifications) return;
    const computePos = () => {
      if (!notificationRef.current) return;
      const rect = notificationRef.current.getBoundingClientRect();
      const top = rect.bottom + 8 + window.scrollY;
      // Desktop: keep a moderate width relative to viewport; Mobile: use larger fraction so it feels full-width
      const width = window.innerWidth < 768
        ? Math.min(420, Math.max(260, window.innerWidth * 0.9))
        : Math.min(420, Math.max(300, window.innerWidth * 0.28));
      // Anchor strategy:
      // - mobile / narrow screens: anchor to the left edge of the bell (rect.left)
      // - desktop / wide screens: align the dropdown's right edge with the bell's right edge
      let left;
      if (window.innerWidth < 1024) {
        left = rect.left;
      } else {
        left = rect.right - width;
      }
      // Clamp so dropdown never overflows viewport (8px padding)
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setDropdownStyle({ top, left, width });
    };
    computePos();
    window.addEventListener("resize", computePos);
    window.addEventListener("scroll", computePos, true);
    return () => {
      window.removeEventListener("resize", computePos);
      window.removeEventListener("scroll", computePos, true);
    };
  }, [showNotifications]);

  // compute profile portal position when profile dropdown opens
  useEffect(() => {
    if (!showProfileDropdown) return;
    const computePos = () => {
      if (!profileRef.current) return;
      const rect = profileRef.current.getBoundingClientRect();
      const top = rect.bottom + 8 + window.scrollY;
      const width = Math.min(360, Math.max(220, window.innerWidth < 768 ? window.innerWidth * 0.9 : 320));
      let left;
      if (window.innerWidth < 1024) {
        left = rect.left;
      } else {
        left = rect.right - width;
      }
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setProfileDropdownStyle({ top, left, width });
    };
    computePos();
    window.addEventListener("resize", computePos);
    window.addEventListener("scroll", computePos, true);
    return () => {
      window.removeEventListener("resize", computePos);
      window.removeEventListener("scroll", computePos, true);
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
              className="relative p-2.5 hover:bg-gray4 rounded-xl transition-colors"
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
            {/*
              Render dropdown into root via portal to avoid z-index/stacking issues.
              portalRef used so outside-click detection ignores clicks inside this portal.
            */}
            {showNotifications &&
              ReactDOM.createPortal(
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    ref={portalRef}
                    style={{
                      position: "fixed",
                      top: dropdownStyle.top,
                      left: dropdownStyle.left,
                      width: dropdownStyle.width,
                      zIndex: 11000,
                      minHeight: 220,
                      maxHeight: 400,
                    }}
                  >
                    <div
                      className="bg-black rounded-xl shadow-lg border border-[#2A2A2A] overflow-hidden"
                      style={{ width: "100%", maxHeight: 400 }}
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
                          onClick={() => {
                            setShowNotifications(false);
                            navigate("/notifications");
                          }}
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
                                onClick={() => {
                                  setShowNotifications(false);
                                  handleNotificationClick(notification.id);
                                }}
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
                    </div>
                  </motion.div>
                </AnimatePresence>,
                (typeof document !== "undefined" && document.getElementById("root")) || document.body
              )}
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

          <div className="relative" ref={profileRef}>
            <div
              className="profile flex items-center bg-grayDash rounded-[9px] py-2 lg:py-[7px] px-3 lg:px-[12px] gap-2 lg:gap-[9px] hover:bg-gray transition-all duration-300 cursor-pointer w-full lg:w-auto h-[40px]"
              onClick={() => setShowProfileDropdown((v) => !v)}
            >
              <div className="flex-1 lg:flex-none">
                <p className="text-[11px] lg:text-[12px] text-white">
                  {user?.firstName ? user.firstName : user.email}
                </p>
                <div className="flex gap-[3px]">
                  {/* company name uses same color as logout button */}
                  <span className="text-[10px] lg:text-[11px] font-semibold text-pink2">
                    {selectedRole?.company?.name}
                  </span>
                  <p className="text-[10px] lg:text-[11px] text-white">
                    {selectedRole?.company?.plan
                      ? selectedRole?.company?.plan?.name
                      : "Free"}
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
            {/* Profile Dropdown rendered via portal so position and z-index match notifications */}
            {showProfileDropdown &&
              ReactDOM.createPortal(
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    ref={profilePortalRef}
                    style={{
                      position: "fixed",
                      top: profileDropdownStyle.top,
                      left: profileDropdownStyle.left,
                      width: profileDropdownStyle.width,
                      zIndex: 11000,
                    }}
                  >
                    <div className="bg-black rounded-xl shadow-lg border border-[#2A2A2A] overflow-hidden">
                      <div className="p-4 border-b border-[#2A2A2A]">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white font-semibold">Your Companies</p>
                          {/* removed color-picker — company color is fixed */}
                        </div>
                        <ul className="space-y-2">
                          {(user?.roles || [])
                            .filter((role) => role.member?.status !== "CANCELLED")
                            .map((role) => (
                              <li key={role.company.id} className="flex items-center gap-2">
                                <button
                                  className={`w-full text-left px-3 py-2 rounded-lg text-[#C4E1FE] hover:bg-white/5 transition flex items-center justify-between`}
                                  onClick={async () => {
                                    // Show overlay and immediately reflect selection in UI
                                    setCompanySwitching(true);
                                    setSelectedRole(role);
                                    setShowProfileDropdown(false);
 
                                    try {
                                     // Start changeCompany and also start a 6s minimum timer
                                    // tell changeCompany not to show toast immediately; we will show it after minWait
                                    const changePromise = changeCompany({ roleId: role.id }, { deferToast: true });
                                    const minWaitPromise = delay(5000);
 
                                    // wait for change to complete
                                    const changeResult = await changePromise;
 
                                    // fetch workspaces after change; wait for both fetch and min wait
                                    const token = localStorage.getItem("token");
                                    const wsReq = axiosInstance.get("/workspace", {
                                      headers: { Authorization: `Bearer ${token}` },
                                    });
 
                                    const [wsRes] = await Promise.all([wsReq, minWaitPromise]);
 
                                    const wsList = Array.isArray(wsRes.data) ? wsRes.data : (wsRes.data?.workspaces || []);
                                    const firstWs = wsList && wsList.length ? wsList[0] : null;
                                    if (firstWs && (firstWs.id || firstWs._id)) {
                                      navigate(`/dashboard/workspace/${firstWs.id || firstWs._id}`, { replace: true });
                                    } else {
                                      navigate("/dashboard", { replace: true });
                                    }
 
                                    // After the minimum wait AND change completion, show toast to user
                                    if (changeResult && changeResult.success) {
                                      showToast("success", changeResult.message || "Company switched successfully");
                                    } else {
                                      showToast("error", changeResult?.message || "Failed to change company");
                                    }
                                   } catch (err) {
                                     // fallback: ensure at least 6s elapsed before hiding and navigate to dashboard
                                     try { await delay(6000); } catch {}
                                     navigate("/dashboard", { replace: true });
                                   } finally {
                                     setCompanySwitching(false);
                                   }
                                 }}
                               >
                                  <div className="flex items-center gap-3">
                                    {/* fixed pink dot to match logout button color */}
                                    <span className="w-3 h-3 rounded-full bg-pink2" />
                                    <div>
                                      <div className="font-medium text-white">{role.company.name}</div>
                                      <div className="text-xs text-[#777C9D]">({role.company.plan?.name || "Free plan"})</div>
                                    </div>
                                  </div>
                                  {/* selected company indicator */}
                                  {selectedRole?.id === role.id ? (
                                    <div className="ml-2 flex items-center text-pink2">
                                      <FiCheck />
                                    </div>
                                  ) : null}
                                </button>
                                {/* quick color picker per company */}

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
                  </motion.div>
                </AnimatePresence>,
                (typeof document !== "undefined" && document.getElementById("root")) || document.body
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
      {/* NEW: Full-screen company-switching overlay (rooted on html via document.documentElement) */}
      {companySwitching &&
        (typeof document !== "undefined"
          ? ReactDOM.createPortal(
              <div
                role="status"
                aria-live="polite"
                className="fixed inset-0 z-[12000] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
                // ensure overlay sits on top of everything
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-white animate-spin" />
                  <div className="text-white text-sm">Switching company… please wait</div>
                </div>
              </div>,
              // mount on <html> element (rooted on html as requested) if available, otherwise body
              (typeof document !== "undefined" && document.documentElement) || document.body
            )
          : null)}
    </div>
  );
};

export default Navbar;

