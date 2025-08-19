import React, { Fragment, useEffect, useState } from 'react';
import { MdAdminPanelSettings, MdPerson, MdSearch, MdDelete, MdEdit, MdVisibility, MdClose } from 'react-icons/md';
import axiosInstance from '../../../AxiosInctance/AxiosInctance';
import { Dropdown } from 'antd';
import Toast from '../../../Components/Modals/Toast';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'deleted', label: 'Deleted' },
];

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isAdmin, setIsAdmin] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    isAdmin: false,
    isBlocked: false,
  });
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const fetchUsers = () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    axiosInstance.get('/admin/users', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        page,
        limit,
        sortBy: sortBy || undefined,
        sortOrder,
        status: status || undefined,
        isActive: isActive !== '' ? isActive : undefined,
        isAdmin: isAdmin !== '' ? isAdmin : undefined,
        search: search || undefined,
        email: email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }
    })
      .then(res => {
        setUsers(res.data.users || []);
        // Use pagination object from API response
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setPage(res.data.pagination.page || 1);
        } else {
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [status, isActive, isAdmin, page, limit, sortBy, sortOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSort = (field) => {
    setSortBy(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleDropdown = (userId) => {
    setShowDropdown(showDropdown === userId ? null : userId);
  };

  const handleViewUser = (userId) => {
    setModalLoading(true);
    setShowModal(true);
    const token = localStorage.getItem('token');
    axiosInstance.get(`/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setModalUser(res.data.user || res.data);
        setModalLoading(false);
      })
      .catch(() => {
        setModalUser(null);
        setModalLoading(false);
      });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalUser(null);
  };

  const handleDeleteUserClick = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
    setShowDropdown(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type });
  };

  const handleDeleteUser = async (hardDelete) => {
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.delete(`/admin/users/${deleteUserId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { hardDelete }
      });
      showToast('User deleted successfully.', 'success');
      setShowDeleteModal(false);
      setDeleteUserId(null);
      fetchUsers();
    } catch {
      showToast('Failed to delete user.', 'error');
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteUserId(null);
  };

  const handleEditUserClick = (user) => {
    setEditUserId(user.id || user._id);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      isAdmin: !!user.isAdmin,
      isBlocked: !!user.isBlocked,
    });
    setShowEditModal(true);
    setShowDropdown(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBlockToggle = async (newBlockedStatus) => {
    setEditLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.post(`/admin/users/${editUserId}/block`, {
        isBlocked: newBlockedStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setEditForm(prev => ({ ...prev, isBlocked: newBlockedStatus }));
      showToast(`User ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully.`, 'success');
      fetchUsers();
    } catch {
      showToast('Failed to update block status.', 'error');
    }
    setEditLoading(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.put(`/admin/users/${editUserId}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        isAdmin: editForm.isAdmin
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      showToast('User updated successfully.', 'success');
      setShowEditModal(false);
      setEditUserId(null);
      fetchUsers();
    } catch {
      showToast('Failed to update user.', 'error');
    }
    setEditLoading(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditUserId(null);
  };

  // Modal outside click handler
  useEffect(() => {
    const handleClick = (e) => {
      if (
        showModal &&
        e.target.classList.contains('modal-bg')
      ) handleCloseModal();
      if (
        showDeleteModal &&
        e.target.classList.contains('modal-bg')
      ) handleCloseDeleteModal();
      if (
        showEditModal &&
        e.target.classList.contains('modal-bg')
      ) handleCloseEditModal();
    };
    if (showModal || showDeleteModal || showEditModal) {
      window.addEventListener('mousedown', handleClick);
    }
    return () => window.removeEventListener('mousedown', handleClick);
  }, [showModal, showDeleteModal, showEditModal]);

  // Antd dropdown menu items
  const dropdownItems = (user) => [
    {
      key: 'edit',
      label: (
        <span className="flex items-center gap-2 text-grayDash" onClick={() => handleEditUserClick(user)}>
          <MdEdit /> Edit
        </span>
      ),
    },
    {
      key: 'delete',
      label: (
        <span className="flex items-center gap-2 text-selectRed1" onClick={() => handleDeleteUserClick(user.id || user._id)}>
          <MdDelete /> Delete
        </span>
      ),
    },
    {
      key: 'view',
      label: (
        <span className="flex items-center gap-2 text-grayDash" onClick={() => handleViewUser(user.id || user._id)}>
          <MdVisibility /> View
        </span>
      ),
    },
  ];

  return (
    <div className="w-full">
      <h2 className="text-2xl font-radioCanada text-white mb-8">Admin Users</h2>

      {/* Responsive filter: grid so controls wrap on small screens */}
      <form
        onSubmit={handleSearch}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 items-center bg-grayDash rounded-xl px-4 py-4"
      >
        <div className="flex items-center gap-2 bg-gray3 rounded-lg px-3 py-2 col-span-1 sm:col-span-2 md:col-span-1">
          <MdSearch className="text-white2" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white2 placeholder:text-white2 w-full"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select value={isActive} onChange={e => setIsActive(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          <option value="">Active Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select value={isAdmin} onChange={e => setIsAdmin(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          <option value="">Admin Status</option>
          <option value="true">Admin</option>
          <option value="false">User</option>
        </select>
        <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />
        <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />
        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />

        {/* Filter button spans full width on small screens */}
        <div className="col-span-1 sm:col-span-2 md:col-span-1">
          <button type="submit" className="w-full bg-pink2 text-white rounded-lg px-6 py-2 font-radioCanada hover:bg-pink transition-colors">
            Filter
          </button>
        </div>
      </form>

      <div className="mb-4">
        <label className="text-white2 mr-2">Items per page:</label>
        <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading && <div className="text-white2">Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !users.length && <div className="text-white2">No users found.</div>}

      {/* Mobile list view: visible on small screens, hidden on md+ */}
      {!loading && users.length > 0 && (
        <div className="space-y-4 md:hidden">
          {users.map(user => (
            <div key={user.id || user._id} className="bg-grayDash rounded-xl p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <MdPerson className="text-pink2" />
                  <div className="text-white font-semibold">{user.firstName} {user.lastName}</div>
                </div>
                <div className="text-white2 text-sm mt-2">{user.email}</div>
                <div className="text-white2 text-xs mt-1">Role: {user.isAdmin ? 'Admin' : 'User'}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => handleViewUser(user.id || user._id)} className="bg-gray3 text-white2 rounded-md px-3 py-1 text-sm">View</button>
                <button onClick={() => handleEditUserClick(user)} className="bg-gray3 text-white2 rounded-md px-3 py-1 text-sm">Edit</button>
                <button onClick={() => handleDeleteUserClick(user.id || user._id)} className="bg-selectRed1 text-white rounded-md px-3 py-1 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table view: hidden on small screens (md+) */}
      {!loading && !!users.length && (
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full bg-grayDash rounded-xl">
            <thead>
              <tr className="bg-gray3 text-white2">
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('email')}>Email</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('firstName')}>First Name</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('lastName')}>Last Name</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('isAdmin')}>Role</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <Fragment key={user.id || user._id}>
                  <tr className="border-b text-white2 border-gray4 hover:bg-gray3 transition">
                    <td className="py-2 px-4 flex items-center gap-2 ">
                      <MdPerson className="text-pink2" />
                      <span>{user.email}</span>
                    </td>
                    <td className="py-2 px-4">{user.firstName}</td>
                    <td className="py-2 px-4">{user.lastName}</td>
                    <td className="py-2 px-4 flex items-center gap-1">
                      {user.isAdmin ? <MdAdminPanelSettings className="text-yellow" /> : <MdPerson className="text-white2" />}
                      <span>{user.isAdmin ? 'Admin' : 'User'}</span>
                    </td>
                    <td className="py-2 px-4 relative">
                      <Dropdown
                        menu={{ items: dropdownItems(user) }}
                        trigger={['click']}
                        placement="bottomRight"
                        overlayClassName="bg-grayDash"
                      >
                        <button className="bg-gray4 text-white2 rounded-full px-2 py-1 hover:bg-pink2 transition">
                          <MdEdit />
                        </button>
                      </Dropdown>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-6 flex gap-2 items-center justify-center">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="bg-grayDash text-white2 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-white2">Page {page} of {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
          className="bg-grayDash text-white2 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
      {/* Modals */}
      {showModal && (
        <div className="modal-bg fixed top-0 left-0 right-0 bottom-0 bg-grayDash bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-grayDash rounded-2xl px-8 py-8 min-w-[350px] max-w-[90vw] max-h-[90vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-white hover:text-pink2 transition-colors" 
              onClick={handleCloseModal}
            >
              <MdClose size={24} />
            </button>
            {modalLoading && <div className="text-white2">Loading...</div>}
            {!modalLoading && modalUser && (
              <div>
                <h3 className="text-xl font-radioCanada text-white mb-4">User Details</h3>
                <div className="text-white2 space-y-2">
                  <div><strong>Email:</strong> {modalUser.email}</div>
                  <div><strong>First Name:</strong> {modalUser.firstName}</div>
                  <div><strong>Last Name:</strong> {modalUser.lastName}</div>
                  <div><strong>Status:</strong> {modalUser.status}</div>
                  <div><strong>Is Admin:</strong> {modalUser.isAdmin ? 'Yes' : 'No'}</div>
                  {Array.isArray(modalUser.activityLogs) && (
                    <div className="mt-4">
                      <strong>Activity Logs:</strong>
                      <ul className="list-disc pl-5">
                        {modalUser.activityLogs.map((log, idx) => (
                          <li key={log.id || idx}>
                            <div>Type: {log.type}</div>
                            <div>Description: {log.description}</div>
                            <div>Timestamp: {log.timestamp}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!modalLoading && !modalUser && <div className="text-selectRed1">Failed to load user details.</div>}
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="modal-bg fixed top-0 left-0 right-0 bottom-0 bg-grayDash bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-grayDash rounded-2xl px-8 py-8 min-w-[300px] max-w-[90vw] relative">
            <button 
              className="absolute top-4 right-4 text-white hover:text-pink2 transition-colors" 
              onClick={handleCloseDeleteModal}
            >
              <MdClose size={24} />
            </button>
            <h3 className="text-xl font-radioCanada text-white mb-2">Delete User</h3>
            <p className="text-white2 mb-4">Choose delete type for this user:</p>
            <div className="flex gap-4 mt-2">
              <button
                className="bg-gray3 text-white2 rounded-lg px-4 py-2 font-radioCanada hover:bg-gray2 transition-colors"
                onClick={() => handleDeleteUser(false)}
              >
                Soft Delete
              </button>
              <button
                className="bg-selectRed1 text-white rounded-lg px-4 py-2 font-radioCanada hover:bg-red-700 transition-colors"
                onClick={() => handleDeleteUser(true)}
              >
                Hard Delete
              </button>
              <button
                className="bg-gray4 text-white2 rounded-lg px-4 py-2 font-radioCanada ml-auto"
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="modal-bg fixed top-0 left-0 right-0 bottom-0 bg-grayDash bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-grayDash rounded-2xl px-8 py-8 min-w-[350px] max-w-[90vw] relative">
            <button 
              className="absolute top-4 right-4 text-white hover:text-pink2 transition-colors" 
              onClick={handleCloseEditModal}
            >
              <MdClose size={24} />
            </button>
            <h3 className="text-xl font-radioCanada text-white mb-4">Edit User</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-white2 block mb-1">First Name:</label>
                <input
                  type="text"
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditInputChange}
                  required
                  className="bg-gray3 text-white2 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-white2 block mb-1">Last Name:</label>
                <input
                  type="text"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditInputChange}
                  required
                  className="bg-gray3 text-white2 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-white2 block mb-1">Email:</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditInputChange}
                  required
                  className="bg-gray3 text-white2 rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div>
                <label className="text-white2 block mb-1">Is Admin:</label>
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={editForm.isAdmin}
                  onChange={handleEditInputChange}
                  className="mr-2"
                />
                <span className="text-white2">{editForm.isAdmin ? 'Admin' : 'User'}</span>
              </div>
              <div>
                <label className="text-white2 block mb-1">Block Status:</label>
                <select
                  value={editForm.isBlocked ? 'true' : 'false'}
                  onChange={e => handleBlockToggle(e.target.value === 'true')}
                  disabled={editLoading}
                  className="bg-gray3 text-white2 rounded-lg px-3 py-2 w-full"
                >
                  <option value="false">Unblocked</option>
                  <option value="true">Blocked</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={editLoading}
                className="bg-pink2 text-white rounded-lg px-6 py-2 font-radioCanada hover:bg-pink transition-colors w-full"
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}
      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(t => ({ ...t, isOpen: false }))}
      />
    </div>
  );
};

export default AdminUsers;

