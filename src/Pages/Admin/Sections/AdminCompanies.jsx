import React, { Fragment, useEffect, useState } from 'react';
import { MdSearch, MdDelete, MdEdit, MdVisibility, MdBusiness, MdWorkspaces, MdGroup, MdTask, MdClose } from 'react-icons/md';
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

const AdminCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isBlocked, setIsBlocked] = useState('');
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  // plans loaded from API for the plan select
  const [plans, setPlans] = useState([]);
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
  const [actionLoading, setActionLoading] = useState(false);
  const [viewCompany, setViewCompany] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    isBlocked: false,
    planId: '',
    authorId: ''
  });
  const [deleteCompanyId, setDeleteCompanyId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const fetchCompanies = () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    axiosInstance.get('/admin/companies', {
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
        isBlocked: isBlocked !== '' ? isBlocked : undefined,
        search: search || undefined,
        name: name || undefined,
        planId: planId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }
    })
      .then(res => {
        setCompanies(res.data.companies || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
          setPage(res.data.pagination.page || 1);
        } else {
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load companies.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line
  }, [status, isActive, isBlocked, name, planId, page, limit, sortBy, sortOrder]);

  // fetch plans for the plan select (mount)
  useEffect(() => {
    const token = localStorage.getItem('token');
    axiosInstance.get('/plan', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        // API returns an array of plans
        setPlans(res.data || []);
      })
      .catch(() => {
        // silent fail; keep plans empty
        setPlans([]);
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleSort = (field) => {
    setSortBy(field);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleDropdown = (companyId) => {
    setShowDropdown(showDropdown === companyId ? null : companyId);
  };

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type });
  };

  const handleBlockCompany = async (companyId, isBlocked) => {
    setActionLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.post(`/admin/companies/${companyId}/block`, {
        isBlocked: !isBlocked
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      showToast(`Company ${!isBlocked ? 'blocked' : 'unblocked'} successfully.`, 'success');
      setShowDropdown(null);
      fetchCompanies();
    } catch {
      showToast('Failed to update block status.', 'error');
    }
    setActionLoading(false);
  };

  const handleDeleteCompanyClick = (companyId) => {
    setDeleteCompanyId(companyId);
    setShowDeleteModal(true);
    setShowDropdown(null);
  };

  const handleDeleteCompany = async (hardDelete) => {
    setActionLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.delete(`/admin/companies/${deleteCompanyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { hardDelete }
      });
      showToast('Company deleted successfully.', 'success');
      setShowDeleteModal(false);
      setDeleteCompanyId(null);
      fetchCompanies();
    } catch {
      showToast('Failed to delete company.', 'error');
    }
    setActionLoading(false);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteCompanyId(null);
  };

  const handleViewCompany = async (companyId) => {
    setActionLoading(true);
    setShowViewModal(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axiosInstance.get(`/admin/companies/${companyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setViewCompany(res.data.company || res.data);
    } catch {
      setViewCompany(null);
    }
    setActionLoading(false);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewCompany(null);
  };

  const handleEditCompanyClick = (company) => {
    setEditCompanyId(company.id || company._id);
    setEditForm({
      name: company.name || '',
      isBlocked: !!company.isBlocked,
      planId: company.planId || '',
      authorId: company.authorId || ''
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

  const handleEditBlockToggle = async (newBlockedStatus) => {
    setEditLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axiosInstance.post(`/admin/companies/${editCompanyId}/block`, {
        isBlocked: newBlockedStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setEditForm(prev => ({ ...prev, isBlocked: newBlockedStatus }));
      showToast(`Company ${newBlockedStatus ? 'blocked' : 'unblocked'} successfully.`, 'success');
      fetchCompanies();
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
      await axiosInstance.put(`/admin/companies/${editCompanyId}`, {
        name: editForm.name,
        planId: editForm.planId,
        authorId: editForm.authorId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      showToast('Company updated successfully.', 'success');
      setShowEditModal(false);
      setEditCompanyId(null);
      fetchCompanies();
    } catch {
      showToast('Failed to update company.', 'error');
    }
    setEditLoading(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditCompanyId(null);
  };

  const dropdownItems = (company) => [
    {
      key: 'edit',
      label: (
        <span className="flex items-center gap-2 text-grayDash" onClick={() => handleEditCompanyClick(company)}>
          <MdEdit /> Edit
        </span>
      ),
    },
    {
      key: 'delete',
      label: (
        <span className="flex items-center gap-2 text-selectRed1" onClick={() => handleDeleteCompanyClick(company.id || company._id)}>
          <MdDelete /> Delete
        </span>
      ),
    },
    {
      key: 'view',
      label: (
        <span className="flex items-center gap-2 text-grayDash" onClick={() => handleViewCompany(company.id || company._id)}>
          <MdVisibility /> View
        </span>
      ),
    },
  ];

  useEffect(() => {
    const handleClick = (e) => {
      if (showViewModal && e.target.classList.contains('modal-bg')) handleCloseViewModal();
      if (showDeleteModal && e.target.classList.contains('modal-bg')) handleCloseDeleteModal();
      if (showEditModal && e.target.classList.contains('modal-bg')) handleCloseEditModal();
    };

    if (showViewModal || showDeleteModal || showEditModal) {
      window.addEventListener('mousedown', handleClick);
    }
    return () => window.removeEventListener('mousedown', handleClick);
  }, [showViewModal, showDeleteModal, showEditModal]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-radioCanada text-white mb-8">Company Management</h2>
      
      {/* Responsive filter grid */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6 items-center bg-grayDash rounded-xl px-4 py-4">
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
          <option value="">Status</option>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select value={isActive} onChange={e => setIsActive(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          <option value="">Active Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <select value={isBlocked} onChange={e => setIsBlocked(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          <option value="">Blocked Status</option>
          <option value="true">Blocked</option>
          <option value="false">Unblocked</option>
        </select>

        <input type="text" placeholder="Company Name" value={name} onChange={e => setName(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />
        <select value={planId} onChange={e => setPlanId(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          <option value="">All Plans</option>
          {plans.map(p => <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-gray3 text-white2 rounded-lg px-3 py-2" />

        {/* Filter button spans full width on small screens */}
        <div className="col-span-1 sm:col-span-2 md:col-span-1">
          <button type="submit" className="w-full bg-pink2 text-white rounded-lg px-6 py-2 font-radioCanada hover:bg-pink transition-colors">Filter</button>
        </div>
      </form>

      <div className="mb-4">
        <label className="text-white2 mr-2">Items per page:</label>
        <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} 
                className="bg-gray3 text-white2 rounded-lg px-3 py-2">
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {loading && <div className="text-white2">Loading...</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !companies.length && <div className="text-white2">No companies found.</div>}

      {/* Mobile cards: visible on small screens, hidden on md+ */}
      {!loading && companies.length > 0 && (
        <div className="space-y-4 md:hidden">
          {companies.map(c => (
            <div key={c.id || c._id} className="bg-grayDash rounded-xl p-4 flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <MdBusiness className="text-yellow" />
                  <div>
                    <div className="text-white font-semibold">{c.name}</div>
                    <div className="text-white2 text-sm">{c.ownerEmail || c.contactEmail || '—'}</div>
                  </div>
                </div>

                <div className="mt-3 text-white2 text-sm grid grid-cols-2 gap-2">
                  <div>Plan: <span className="font-bold text-white">{c.currentPlan?.name ?? '—'}</span></div>
                  <div className="text-right">Price: <span className="font-bold text-white">{c.currentPlan?.price !== undefined ? `$${c.currentPlan.price}` : '—'}</span></div>
                  <div>Status: <span className="font-bold text-white">{c.status ?? 'N/A'}</span></div>
                  <div className="text-right">Blocked: <span className="font-bold text-white">{c.isBlocked ? 'Yes' : 'No'}</span></div>
                </div>

                <div className="mt-3 flex items-center gap-3 text-white2">
                  <span title="Workspaces" className="flex items-center gap-1"><MdWorkspaces className="text-pink2" /> {c.workspaceCount ?? 0}</span>
                  <span title="Members" className="flex items-center gap-1"><MdGroup className="text-pink2" /> {c.memberCount ?? 0}</span>
                  <span title="Tasks" className="flex items-center gap-1"><MdTask className="text-pink2" /> {c.taskCount ?? 0}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button onClick={() => handleViewCompany(c.id || c._id)} className="bg-gray3 text-white2 rounded-md px-3 py-1 text-sm">View</button>
                <button onClick={() => handleEditCompanyClick(c)} className="bg-gray3 text-white2 rounded-md px-3 py-1 text-sm">Edit</button>
                <button onClick={() => handleDeleteCompanyClick(c.id || c._id)} className="bg-selectRed1 text-white rounded-md px-3 py-1 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table: hidden on small screens, visible md+ */}
      {!loading && !!companies.length && (
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full bg-grayDash rounded-xl">
            <thead>
              <tr className="bg-gray3 text-white2">
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>Company</th>
                <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('status')}>Status</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Metrics</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(company => (
                <Fragment key={company.id || company._id}>
                  <tr className="border-b text-white2 border-gray4 hover:bg-gray3 transition">
                    <td className="py-2 px-4 flex items-center gap-2">
                      <MdBusiness className="text-pink2" />
                      <span>{company.name}</span>
                    </td>
                    <td className="py-2 px-4">{company.status}</td>
                    <td className="py-2 px-4">
                      {company.currentPlan?.name}
                      {company.currentPlan?.price !== undefined && <span className="text-pink2 ml-2">${company.currentPlan.price}</span>}
                    </td>
                    <td className="py-2 px-4">
                      {company.author ? `${company.author.firstName} ${company.author.lastName}` : company.authorId}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-3">
                        <span title="Workspaces" className="flex items-center gap-1">
                          <MdWorkspaces className="text-pink2" /> {company.workspaceCount}
                        </span>
                        <span title="Members" className="flex items-center gap-1">
                          <MdGroup className="text-pink2" /> {company.memberCount}
                        </span>
                        <span title="Tasks" className="flex items-center gap-1">
                          <MdTask className="text-pink2" /> {company.taskCount}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-4 relative">
                      <Dropdown
                        menu={{ items: dropdownItems(company) }}
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

      {/* View Modal */}
      {showViewModal && (
        <div className="modal-bg fixed top-0 left-0 right-0 bottom-0 bg-grayDash bg-opacity-40 flex items-center justify-center z-50 text-white">
          <div className="bg-grayDash rounded-2xl px-8 py-8 min-w-[350px] max-w-[90vw] max-h-[90vh] overflow-y-auto relative">
            <button 
              className="absolute top-4 right-4 text-white hover:text-pink2 transition-colors" 
              onClick={handleCloseViewModal}
            >
              <MdClose size={24} />
            </button>
            {viewCompany ? (
              <div className="text-white2">
                <h3 className="text-xl font-semibold mb-4">{viewCompany.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Status:</strong> {viewCompany.status ?? 'N/A'}
                  </div>
                  <div>
                    <strong>Blocked:</strong> {viewCompany.isBlocked ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Created At:</strong> {viewCompany.createdAt ? new Date(viewCompany.createdAt).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <strong>Updated At:</strong> {viewCompany.updatedAt ? new Date(viewCompany.updatedAt).toLocaleString() : 'N/A'}
                  </div>
                  <div>
                    <strong>Plan:</strong> {viewCompany.plan?.name} 
                    {viewCompany.plan?.price !== undefined && ` ($${viewCompany.plan.price})`}
                  </div>
                  <div>
                    <strong>Author:</strong> {viewCompany.author
                      ? `${viewCompany.author.firstName} ${viewCompany.author.lastName} (${viewCompany.author.email})`
                      : viewCompany.authorId}
                  </div>
                  <div>
                    <strong>Workspaces:</strong> {viewCompany.workspaces.length}
                  </div>
                  <div>
                    <strong>Members:</strong> {viewCompany.members.length}
                  </div>
                  <div>
                    <strong>Transactions:</strong> {viewCompany.transactions.length}
                  </div>
                  <div>
                    <strong>Stripe Customer ID:</strong> {viewCompany.stripeCustomerId ?? 'N/A'}
                  </div>
                  <div>
                    <strong>Subscription Status:</strong> {Array.isArray(viewCompany.subscriptions) && viewCompany.subscriptions.length > 0
                      ? viewCompany.subscriptions[0].status
                      : 'N/A'}
                  </div>
                </div>
                {Array.isArray(viewCompany.subscriptions) && viewCompany.subscriptions.length > 0 && (
                  <div className="mt-4">
                    <strong>Current Subscription:</strong>
                    <ul className="list-disc list-inside">
                      {viewCompany.subscriptions.map(sub => (
                        <li key={sub.id} className="mb-2">
                          <div>Status: {sub.status}</div>
                          <div>Start: {sub.startDate ? new Date(sub.startDate).toLocaleString() : 'N/A'}</div>
                          <div>End: {sub.endDate ? new Date(sub.endDate).toLocaleString() : 'N/A'}</div>
                          <div>Plan: {sub.plan?.name} {sub.plan?.price !== undefined && `($${sub.plan.price})`}</div>
                          <div>Expired: {sub.isExpired ? 'Yes' : 'No'}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-400">Failed to load company details.</div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-bg fixed top-0 left-0 right-0 bottom-0 bg-grayDash bg-opacity-40 flex items-center justify-center z-50 text-white">
          <div className="bg-grayDash rounded-2xl px-8 py-8 min-w-[300px] max-w-[90vw] relative">
            <button 
              className="absolute top-4 right-4 text-white hover:text-pink2 transition-colors" 
              onClick={handleCloseDeleteModal}
            >
              <MdClose size={24} />
            </button>
            <h3 className="text-xl font-semibold mb-4">Delete Company</h3>
            <p className="text-white2 mb-4">Choose delete type for this company:</p>
            <div className="flex gap-4">
              <button
                className="flex-1 bg-gray3 text-white2 rounded-lg px-4 py-2 hover:bg-pink transition-colors"
                onClick={() => handleDeleteCompany(false)}
                disabled={actionLoading}
              >
                Soft Delete
              </button>
              <button
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 hover:bg-red-700 transition-colors"
                onClick={() => handleDeleteCompany(true)}
                disabled={actionLoading}
              >
                Hard Delete
              </button>
            </div>
            <div className="mt-4">
              <button
                className="w-full bg-gray4 text-white2 rounded-lg px-4 py-2 hover:bg-pink transition-colors"
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-bg fixed top-0 left-0 right-0 bottom-0 bg-grayDash bg-opacity-40 flex items-center justify-center z-50 text-white">
          <div className="bg-grayDash rounded-2xl px-8 py-8 min-w-[350px] max-w-[90vw] relative">
            <button 
              className="absolute top-4 right-4 text-white hover:text-pink2 transition-colors" 
              onClick={handleCloseEditModal}
            >
              <MdClose size={24} />
            </button>
            <h3 className="text-xl font-semibold mb-4">Edit Company</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-white2 mb-2">
                  Name:
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditInputChange}
                    required
                    className="mt-1 block w-full bg-gray3 text-white2 rounded-lg px-3 py-2 outline-none"
                  />
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-white2 mb-2">
                  Plan ID:
                  <input
                    type="text"
                    name="planId"
                    value={editForm.planId}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full bg-gray3 text-white2 rounded-lg px-3 py-2 outline-none"
                  />
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-white2 mb-2">
                  Author ID:
                  <input
                    type="text"
                    name="authorId"
                    value={editForm.authorId}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full bg-gray3 text-white2 rounded-lg px-3 py-2 outline-none"
                  />
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-white2 mb-2">
                  Block Status:
                  <select
                    value={editForm.isBlocked ? 'true' : 'false'}
                    onChange={e => handleEditBlockToggle(e.target.value === 'true')}
                    disabled={editLoading}
                    className="mt-1 block w-full bg-gray3 text-white2 rounded-lg px-3 py-2 outline-none"
                  >
                    <option value="false">Unblocked</option>
                    <option value="true">Blocked</option>
                  </select>
                </label>
              </div>
              <button type="submit" disabled={editLoading} className="w-full bg-pink2 text-white rounded-lg px-4 py-2 font-radioCanada hover:bg-pink transition-colors">
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

export default AdminCompanies;
