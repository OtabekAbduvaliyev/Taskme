import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiUserPlus, FiLock, FiBriefcase, FiSave, FiEdit2, FiCamera, FiEye, FiEyeOff, FiX, FiTrash2 } from 'react-icons/fi';
import axiosInstance from '../../AxiosInctance/AxiosInctance';
import { AuthContext } from '../../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmationModal from '../Modals/DeleteConfirmationModal';
import dayjs from 'dayjs';
import defImg from "../../assets/default-avatar-icon-of-social-media-user-vector.jpg";

const Settings = () => {
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

  // responsive helper: true when viewport is >= md (768px)
  const [isMdUp, setIsMdUp] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  useEffect(() => {
    const onResize = () => setIsMdUp(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    name: ''
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
          name: res.data.name 
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
        name: res.data.name 
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
      navigate(-1);
      // Optionally navigate or show toast
    } catch (err) {
      // handle error
    } finally {
      setCompanyLoading(false);
    }
  };

  // Invitations (lightweight management)
  const [invitations, setInvitations] = useState([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== "invitations") return;
    const fetchInvitations = async () => {
      setInvitationsLoading(true);
      try {
        // fetch invitations endpoint (returns array of invitation objects)
        const res = await axiosInstance.get("/member/invitations", {
           headers: { Authorization: `Bearer ${token}` }
         });
        const arr = Array.isArray(res.data) ? res.data : [];
        // store returned invitations as-is; UI will show status and ids
        setInvitations(arr);
      } catch (err) {
        setInvitations([]);
      } finally {
        setInvitationsLoading(false);
      }
    };
    fetchInvitations();
  }, [activeTab, token]);

  const handleInvitationAction = async (memberId, newStatus) => {
    try {
      await axiosInstance.patch(`/member/status/${memberId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // remove from local list
      setInvitations(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error("Error updating invitation status:", err);
    }
  };

  // Add: cancel invite action
  const handleCancelInvitation = async (inviteId) => {
    try {
      // Call cancel invite endpoint
      await axiosInstance.patch(`/member/cancel-invite/${inviteId}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update local state to reflect canceled status
      setInvitations(prev => prev.map(inv => inv.id === inviteId ? { ...inv, status: 'CANCELED' } : inv));
    } catch (err) {
      console.error("Error cancelling invitation:", err);
    }
  };

  const tabContent = {
    profile: (
      <div className="space-y-6 py-3">
        {/* Card wrapper */}
        <div className="bg-[#141416] border border-[#2E2E2E] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-pink2/20 flex items-center justify-center text-white font-semibold">
                <FiUser size={20} />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">Profile</div>
                <div className="text-sm text-gray2">Edit your personal information and avatar</div>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-2 rounded-md font-medium transition ${
                  isEditing ? 'bg-transparent text-pink2 border border-pink2' : 'bg-pink2 text-black'
                }`}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="md:col-span-1 flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-pink2/10 flex items-center justify-center">
                {avatarPreview || userData?.avatar?.path ? (
                  <img
                    src={avatarPreview || `https://eventify.preview.uz/${userData.avatar.path}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">{userData?.email?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#23272F] text-pink2 rounded-md flex items-center gap-2"
                >
                  <FiCamera />
                  Upload
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm text-[#C4E1FE] mb-1">Email</label>
                <input
                  type="email"
                  value={userData?.email || ''}
                  readOnly
                  className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg py-2 px-3 text-white opacity-80 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#C4E1FE] mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full bg-[#111111] border rounded-lg py-2 px-3 text-white ${!isEditing ? 'opacity-70 cursor-not-allowed' : 'border-[#2E2E2E] focus:border-pink2'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#C4E1FE] mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full bg-[#111111] border rounded-lg py-2 px-3 text-white ${!isEditing ? 'opacity-70 cursor-not-allowed' : 'border-[#2E2E2E] focus:border-pink2'}`}
                  />
                </div>
              </div>

              <div className="bg-[#0F0F10] border border-[#232323] rounded-lg p-3">
                <h4 className="text-sm text-[#C4E1FE] mb-2">Roles & Companies</h4>
                <div className="space-y-2">
                  {userData?.roles?.map((role) => (
                    <div key={role.id} className="flex items-center justify-between bg-[#141416] p-2 rounded-md">
                      <div>
                        <div className="text-sm text-pink2 font-medium">{role.type}</div>
                        <div className="text-xs text-gray2">{role.company?.name}</div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded bg-[#232323] text-[#C4E1FE]">{role.member?.status || 'ACTIVE'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end">
                  <motion.button
                    onClick={handleSave}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2 bg-pink2 text-black rounded-lg font-semibold"
                  >
                    <FiSave className="inline mr-2" />
                    Save Changes
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    security: (
      <div className="space-y-6 py-3">
        <div className="bg-[#141416] border border-[#2E2E2E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B1B1B] flex items-center justify-center text-pink2">
                <FiLock />
              </div>
              <div>
                <div className="text-lg font-semibold text-white">Security</div>
                <div className="text-sm text-gray2">Change your password</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#C4E1FE] mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className="w-full bg-[#0B0C0F] border border-[#222] rounded-lg py-2 px-3 pr-12 text-white"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray2" onClick={() => setShowCurrentPassword(v => !v)} tabIndex={-1}>
                  {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#C4E1FE] mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="w-full bg-[#0B0C0F] border border-[#222] rounded-lg py-2 px-3 pr-12 text-white"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray2" onClick={() => setShowNewPassword(v => !v)} tabIndex={-1}>
                  {showNewPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleChangePassword} className="px-4 py-2 bg-pink2 rounded-md font-medium text-black">
                <FiSave className="inline mr-2" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    ),
    upgrade: (
      <div className="space-y-6 py-3">
        <div className="bg-[#141416] border border-[#2E2E2E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B1B1B] flex items-center justify-center text-pink2"><FiBriefcase /></div>
              <div>
                <div className="text-lg font-semibold text-white">Upgrade Plan</div>
                <div className="text-sm text-gray2">Choose a plan that fits your team</div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-gray2">Current Plan</div>
            <div className="text-xl font-bold text-pink2">{currentPlan?.name || 'Unknown'}</div>
          </div>

          {plansLoading ? (
            <div className="text-gray2">Loading plans...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map(plan => (
                <div key={plan.id} className={`p-4 rounded-lg border ${plan.name === currentPlan?.name ? 'border-pink2 bg-pink2/6' : 'border-black bg-black'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-white">{plan.name}</div>
                      <div className="text-sm text-gray2">{plan.description}</div>
                    </div>
                    <div className="text-xl font-extrabold text-pink2">{plan.price === 0 ? 'Free' : `$${plan.price}/mo`}</div>
                  </div>

                  <ul className="text-xs text-gray2 mt-3 list-disc pl-4 space-y-1">
                    <li>Max Workspaces: {plan.maxWorkspaces}</li>
                    <li>Max Sheets: {plan.maxSheets}</li>
                    <li>Max Tasks: {plan.maxTasks}</li>
                    <li>Max Members: {plan.maxMembers}</li>
                  </ul>

                  <div className="mt-4 flex justify-end">
                    {plan.name === currentPlan?.name ? (
                      <span className="px-3 py-1 bg-[#232323] rounded text-xs text-pink2">Current</span>
                    ) : (
                      <button onClick={() => navigate('/subscriptions')} className="px-3 py-1 bg-pink2 text-black rounded font-medium">
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
    company: (
      <div className="space-y-6 py-3">
        <div className="bg-[#141416] border border-[#2E2E2E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B1B1B] flex items-center justify-center text-pink2"><FiBriefcase /></div>
              <div>
                <div className="text-lg font-semibold text-white">Company Settings</div>
                <div className="text-sm text-gray2">Manage company details and workspace</div>
              </div>
            </div>
            <div>
              <button onClick={() => setCompanyEdit(!companyEdit)} className={`px-3 py-2 rounded-md transition ${companyEdit ? 'bg-transparent text-pink2 border border-pink2' : 'bg-pink2 text-black'}`}>
                {companyEdit ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>

          {companyLoading ? (
            <div className="text-gray2">Loading company info...</div>
          ) : !companyData ? (
            <div className="text-gray2">No company info found.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#C4E1FE] mb-1">Company Name</label>
                <input
                  type="text"
                  name="name"
                  value={companyForm.name}
                  onChange={handleCompanyChange}
                  disabled={!companyEdit}
                  className={`w-full bg-[#0B0C0F] border rounded-lg py-2 px-3 text-white ${!companyEdit ? 'opacity-70 cursor-not-allowed' : 'border-[#2E2E2E] focus:border-pink2'}`}
                />
              </div>

              {companyEdit && (
                <div className="flex justify-end gap-3">
                  <motion.button onClick={handleCompanyUpdate} whileHover={{ scale: 1.02 }} className="px-4 py-2 bg-pink2 text-black rounded-md font-medium">
                    <FiSave className="inline mr-2" /> Save
                  </motion.button>
                </div>
              )}

              <div className="border-t border-[#232323] pt-4 flex justify-end">
                <motion.button onClick={() => setShowDeleteModal(true)} whileHover={{ scale: 1.02 }} className="px-3 py-2 bg-red-600 text-white rounded-md">
                  <FiTrash2 className="inline mr-2" /> Delete Company
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    invitations: (
      <div className="space-y-4 py-3">
        <div className="bg-[#141416] border border-[#2E2E2E] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B1B1B] flex items-center justify-center text-pink2"><FiUserPlus /></div>
              <div>
                <div className="text-lg font-semibold text-white">Invitations</div>
                <div className="text-sm text-gray2">Manage pending invitations</div>
              </div>
            </div>
          </div>

          {invitationsLoading ? (
            <div className="text-gray2">Loading invitations…</div>
          ) : invitations.length === 0 ? (
            <div className="text-gray2">No invitations found.</div>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between bg-[#0B0C0F] p-3 rounded-md border border-[#1F1F1F]">
                  <div className="flex items-center gap-3">
                    <img
                      src={inv.user?.avatar?.path ? `https://eventify.preview.uz/${inv.user.avatar.path}` : defImg}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-sm text-white font-medium">
                        {inv.user?.firstName ? `${inv.user.firstName} ${inv.user.lastName || ""}` : inv.userId || inv.notificationId || inv.id}
                      </div>
                      <div className="text-xs text-gray2">
                        {inv.companyId ? `Company: ${inv.companyId}` : ''} {inv.taskId ? `• Task: ${inv.taskId}` : ''}
                      </div>
                      <div className="text-xs text-gray2">{inv.createdAt ? dayjs(inv.createdAt).format('MMM D, YYYY HH:mm') : ''}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-xs px-2 py-1 rounded bg-[#232323] text-[#C4E1FE]">{inv.status || '-'}</div>
                    {inv.status !== 'CANCELED' && (
                      <button onClick={() => handleCancelInvitation(inv.id)} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] px-4 sm:px-6 lg:px-10 py-8">
      <div
        className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-stretch"
        style={{ height: isMdUp ? 'calc(100vh - 4rem)' : 'auto' }} // fixed-height layout only on md+
      >
        {/* Sidebar */}
        <aside className="w-full md:w-72 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg p-3 sm:p-4 flex flex-col gap-6 h-full">
          <div className="flex items-center gap-3">
            {/* make sidebar avatar keep its visual height too */}
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-pink2/20 flex items-center justify-center"
              style={{ minWidth: '48px', minHeight: '48px' }}
            >
              {avatarPreview || userData?.avatar?.path ? (
                <img
                  src={avatarPreview || `https://eventify.preview.uz/${userData?.avatar?.path}`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  style={{ minWidth: '48px', minHeight: '48px' }}
                />
              ) : (
                <span className="text-lg font-bold text-white">{userData?.email?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold">{userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}` : userData?.email}</div>
              <div className="text-xs text-[#C4E1FE] truncate">{userData?.email}</div>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {[ 
              { id: 'profile', icon: FiUser, label: 'Profile' },
              { id: 'security', icon: FiLock, label: 'Security' },
              { id: 'upgrade', icon: FiBriefcase, label: 'Upgrade' },
              { id: 'company', icon: FiBriefcase, label: 'Company' },
              { id: 'invitations', icon: FiUserPlus, label: 'Invitations' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  activeTab === tab.id ? 'bg-pink2/10 text-pink2' : 'text-[#C4E1FE] hover:bg-white/5'
                }`}
              >
                <tab.icon />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* bottom area: member info + Back to work button */}
          <div className="mt-auto flex flex-col gap-3">
            <div className="text-sm text-[#C4E1FE]">
              <div className="mb-2">Member since:</div>
              <div className="text-xs text-gray2">{userData?.createdAt ? dayjs(userData.createdAt).format('MMM YYYY') : '-'}</div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-pink2 text-white rounded-lg font-semibold hover:opacity-95"
            >
              Back to work
            </button>
          </div>
        </aside>

        {/* Main content pane - enable its own vertical scroll on right side */}
        <main
          className="flex-1 bg-[#1E1E1E]/60 border border-[#3A3A3A] rounded-lg p-4 sm:p-6 overflow-y-auto custom-scrollbar h-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            {/* optional: keep small helper button or leave empty to emphasize page */}
          </div>

          <div>
            {tabContent[activeTab]}
          </div>
        </main>
      </div>

      {/* Render delete confirmation modal inline */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleCompanyDelete}
          title="Delete Company"
          message="Are you sure you want to delete this company? This action cannot be undone."
        />
      )}
    </div>
   );
 };
 
 export default Settings;

