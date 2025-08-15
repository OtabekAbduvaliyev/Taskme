import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiBriefcase, FiSave, FiEdit2, FiCamera, FiEye, FiEyeOff, FiArrowLeft, FiX, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../AxiosInctance/AxiosInctance';
import { AuthContext } from '../../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactDOM from "react-dom";
import DeleteConfirmationModal from '../Modals/DeleteConfirmationModal';

const Settings = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('token');
  const { updatePassword } = useContext(AuthContext);
  const navigate = useNavigate();

  // Password visibility state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get('/user/info', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
        // Update form with user data
        setForm(prev => ({
          ...prev,
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || ''
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('avatar', file); // 'avatar' matches backend expectation

        await axiosInstance.patch('user/change-avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });

        // Refetch user data to get updated avatar
        const response = await axiosInstance.get('/user/info', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data);
        setAvatarPreview(null);
        setAvatarFile(null);
      } catch (error) {
        console.error('Error uploading avatar:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      await axiosInstance.patch('/user/update', {
        firstName: form.firstName,
        lastName: form.lastName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsEditing(false);
      const response = await axiosInstance.get('/user/info', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!form.currentPassword || !form.newPassword) {
      alert('Please fill in both current and new password.');
      return;
    }
    try {
      await updatePassword({
        oldPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      // Error handled in context
    }
  };

  // Upgrade tab: fetch plans and current plan
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    if (activeTab !== "upgrade") return;
    const token = localStorage.getItem("token");
    setPlansLoading(true);
    Promise.all([
      axiosInstance.get("/company/current-plan", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      axiosInstance.get("/plan", {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])
      .then(([currentRes, plansRes]) => {
        setCurrentPlan(currentRes.data);
        setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      })
      .finally(() => setPlansLoading(false));
  }, [activeTab]);

  // Company tab state
  const [companyData, setCompanyData] = useState(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    isBlocked: false
  });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyEdit, setCompanyEdit] = useState(false);

  useEffect(() => {
    if (activeTab !== "company") return;
    const fetchCompany = async () => {
      setCompanyLoading(true);
      try {
        // Use company/{id} instead of company/current
        if (!userData?.roles?.[0]?.company?.id) {
          setCompanyData(null);
          setCompanyLoading(false);
          return;
        }
        const companyId = userData.roles[0].company.id;
        const res = await axiosInstance.get(`/company/${companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompanyData(res.data);
        setCompanyForm({
          name: res.data.name || '',
          description: res.data.description || '',
          isBlocked: !!res.data.isBlocked
        });
      } catch (err) {
        setCompanyData(null);
      } finally {
        setCompanyLoading(false);
      }
    };
    fetchCompany();
  }, [activeTab, userData]);

  const handleCompanyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCompanyForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCompanyUpdate = async () => {
    if (!companyData?.id) return;
    setCompanyLoading(true);
    try {
      await axiosInstance.put(`/workspace/${companyData.id}`, companyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyEdit(false);
      // Refetch company info
      const res = await axiosInstance.get('/company/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyData(res.data);
      setCompanyForm({
        name: res.data.name || '',
        description: res.data.description || '',
        isBlocked: !!res.data.isBlocked
      });
    } catch (err) {
      // handle error
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleCompanyDelete = async () => {
    if (!companyData?.id) return;
    setCompanyLoading(true);
    try {
      await axiosInstance.delete(`/company/${companyData.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyData(null);
      setShowDeleteModal(false);
      onClose();
      // Optionally navigate or show toast
    } catch (err) {
      // handle error
    } finally {
      setCompanyLoading(false);
    }
  };

  const tabContent = {
    profile: (
      <div className="space-y-6 py-3">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#23272F] text-pink2 hover:bg-pink2/10 transition-colors"
          >
            <FiEdit2 />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-pink2/20 flex items-center justify-center">
              {avatarPreview || userData?.avatar?.path ? (
                <img
                  src={avatarPreview || `https://eventify.preview.uz/${userData.avatar.path}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {userData?.email?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-pink2 text-white p-2 rounded-full hover:bg-pink2/80 transition-colors"
              >
                <FiCamera size={16} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Email field - always readonly */}
        <div className="relative group">
          <label className="block text-[#C4E1FE] mb-2 font-medium">Email</label>
          <input
            type="email"
            value={userData?.email || ''}
            readOnly
            className="w-full bg-[#23272F] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white opacity-70 cursor-not-allowed"
          />
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <label className="block text-[#C4E1FE] mb-2 font-medium">First Name</label>
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full bg-[#23272F] border-2 ${
                isEditing ? 'border-[#3A3A3A] focus:border-pink2' : 'border-transparent'
              } rounded-xl py-3 px-4 text-white transition-all ${
                !isEditing ? 'cursor-not-allowed opacity-70' : ''
              }`}
            />
          </div>
          <div className="relative group">
            <label className="block text-[#C4E1FE] mb-2 font-medium">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full bg-[#23272F] border-2 ${
                isEditing ? 'border-[#3A3A3A] focus:border-pink2' : 'border-transparent'
              } rounded-xl py-3 px-4 text-white transition-all ${
                !isEditing ? 'cursor-not-allowed opacity-70' : ''
              }`}
            />
          </div>
        </div>

        {/* Roles section */}
        <div className="bg-[#23272F]/50 rounded-xl p-4 border border-[#3A3A3A]">
          <h3 className="text-[#C4E1FE] font-medium mb-3">Roles & Companies</h3>
          <div className="space-y-3">
            {userData?.roles?.map((role) => (
              <div key={role.id} className="flex items-center justify-between bg-[#1E1E1E] p-3 rounded-lg">
                <div>
                  <span className="text-pink2 font-medium">{role.type}</span>
                  <p className="text-[#C4E1FE] text-sm">{role.company?.name}</p>
                </div>
                <span className="text-xs bg-pink2/20 text-pink2 px-2 py-1 rounded">
                  {role.member?.status || 'ACTIVE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isEditing && (
          <motion.button
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl font-bold text-lg"
          >
            <FiSave className="inline mr-2" />
            Save Changes
          </motion.button>
        )}
      </div>
    ),
    security: (
      <div className="space-y-6">
        <div className="relative group">
          <label className="block text-[#C4E1FE] mb-2 font-medium">Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full bg-[#23272F] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray"
              onClick={() => setShowCurrentPassword((v) => !v)}
              tabIndex={-1}
            >
              {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
        <div className="relative group">
          <label className="block text-[#C4E1FE] mb-2 font-medium">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full bg-[#23272F] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all pr-12"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray2"
              onClick={() => setShowNewPassword((v) => !v)}
              tabIndex={-1}
            >
              {showNewPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
        <button
          onClick={handleChangePassword}
          className="w-full py-4 bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2"
        >
          <FiSave className="inline" />
          Change Password
        </button>
      </div>
    ),
    upgrade: (
      <div className="space-y-6 py-3">
        <h2 className="text-2xl font-bold text-white mb-4">Upgrade Plan</h2>
        <p className="text-[#C4E1FE] mb-6">
          Unlock more features and increase your limits by upgrading your plan.
        </p>
        {plansLoading ? (
          <div className="text-white2 mb-6">Loading plans...</div>
        ) : (
          <div>
            <div className="mb-4">
              <span className="font-semibold text-white">Current Plan: </span>
              <span className="text-pink2 font-bold">
                {currentPlan?.name || "Unknown"}
              </span>
            </div>
            <div className="flex flex-col gap-6">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`w-full rounded-xl p-6 border-2 ${
                    plan.name === currentPlan?.name
                      ? "border-pink2 bg-pink2/10"
                      : "border-gray4 bg-[#23272F]"
                  } flex flex-col items-start`}
                >
                  <div className="text-xl font-bold text-white mb-1">{plan.name}</div>
                  <div className="text-pink2 text-2xl font-extrabold mb-2">
                    {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                  </div>
                  <div className="text-white2 text-sm mb-2">{plan.description}</div>
                  <ul className="text-xs text-white2 mb-3 text-left w-full list-disc pl-4">
                    <li>Max Workspaces: {plan.maxWorkspaces}</li>
                    <li>Max Sheets: {plan.maxSheets}</li>
                    <li>Max Tasks: {plan.maxTasks}</li>
                    <li>Max Members: {plan.maxMembers}</li>
                    <li>Max Viewers: {plan.maxViewers}</li>
                  </ul>
                  {plan.name === currentPlan?.name ? (
                    <span className="px-4 py-1 rounded bg-pink2 text-white font-semibold text-xs">
                      Current Plan
                    </span>
                  ) : (
                    <button
                      onClick={() => navigate('/subscriptions')}
                      className="mt-2 px-4 py-2 bg-pink2 text-white rounded-lg font-semibold hover:bg-pink transition"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    company: (
      <div className="space-y-6 py-3">
        <h2 className="text-2xl font-bold text-white mb-4">Company Settings</h2>
        {companyLoading ? (
          <div className="text-white2 mb-6">Loading company info...</div>
        ) : !companyData ? (
          <div className="text-white2 mb-6">No company info found.</div>
        ) : (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setCompanyEdit(!companyEdit)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#23272F] text-pink2 hover:bg-pink2/10 transition-colors"
              >
                <FiEdit2 />
                {companyEdit ? 'Cancel' : 'Edit Company'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[#C4E1FE] mb-2 font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={companyForm.name}
                  onChange={handleCompanyChange}
                  disabled={!companyEdit}
                  className={`w-full bg-[#23272F] border-2 ${
                    companyEdit ? 'border-[#3A3A3A] focus:border-pink2' : 'border-transparent'
                  } rounded-xl py-3 px-4 text-white transition-all ${
                    !companyEdit ? 'cursor-not-allowed opacity-70' : ''
                  }`}
                />
              </div>
              <div>
                <label className="block text-[#C4E1FE] mb-2 font-medium">Description</label>
                <input
                  type="text"
                  name="description"
                  value={companyForm.description}
                  onChange={handleCompanyChange}
                  disabled={!companyEdit}
                  className={`w-full bg-[#23272F] border-2 ${
                    companyEdit ? 'border-[#3A3A3A] focus:border-pink2' : 'border-transparent'
                  } rounded-xl py-3 px-4 text-white transition-all ${
                    !companyEdit ? 'cursor-not-allowed opacity-70' : ''
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center mb-4">
              <label className="text-[#C4E1FE] font-medium mr-3">Blocked</label>
              <input
                type="checkbox"
                name="isBlocked"
                checked={companyForm.isBlocked}
                onChange={handleCompanyChange}
                disabled={!companyEdit}
                className="w-5 h-5 accent-pink2"
              />
            </div>
            {companyEdit && (
              <motion.button
                onClick={handleCompanyUpdate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl font-bold text-lg mb-4"
              >
                <FiSave className="inline mr-2" />
                Save Company Changes
              </motion.button>
            )}
            <motion.button
              onClick={() => setShowDeleteModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-400 text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 w-fit"
              style={{ minWidth: 0 }}
            >
              <FiTrash2 className="inline" />
              Delete
            </motion.button>
          </div>
        )}
      </div>
    )
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-10 w-full max-w-full sm:max-w-2xl lg:max-w-4xl mx-0 sm:mx-4 my-4 sm:my-8 custom-scrollbar"
          style={{ maxHeight: '100vh', overflowY: 'auto' }}
        >
          <div className="bg-[#1E1E1E]/60 backdrop-blur-xl rounded-lg sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#3A3A3A] shadow-2xl relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-pink2 hover:text-white bg-[#23272F] rounded-full p-2 transition-colors"
              aria-label="Close"
            >
              <FiX size={22} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Settings</h1>
            {/* Tabs */}
            <div className="flex space-x-4 sm:space-x-6 mb-6 sm:mb-8 border-b border-[#3A3A3A] pb-3 sm:pb-4 overflow-x-auto custom-scrollbar whitespace-nowrap">
              {[
                { id: 'profile', icon: FiUser, label: 'Profile' },
                { id: 'security', icon: FiLock, label: 'Security' },
                { id: 'upgrade', icon: FiBriefcase, label: 'Upgrade' },
                { id: 'company', icon: FiBriefcase, label: 'Company' } // <-- Add Company tab
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base shrink-0 ${
                    activeTab === tab.id
                      ? 'text-pink2 bg-pink2/10'
                      : 'text-[#C4E1FE] hover:text-white'
                  }`}
                >
                  <tab.icon />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            {/* Tab Content */}
            <div className="mb-8">
              {tabContent[activeTab]}
            </div>
          </div>
        </motion.div>
        {/* DeleteConfirmationModal rendered in modal-root */}
        {ReactDOM.createPortal(
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleCompanyDelete}
            title="Delete Company"
            message="Are you sure you want to delete this company? This action cannot be undone."
          />,
          document.getElementById("modal-root")
        )}
      </div>
    </AnimatePresence>
  );
};

export default Settings;
