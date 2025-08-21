import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../AxiosInctance/AxiosInctance';
import Toast from '../../../Components/Modals/Toast';
import DeleteConfirmationModal from '../../../Components/Modals/DeleteConfirmationModal';

const initialForm = {
  name: '',
  description: '',
  price: 0,
  maxWorkspaces: 0,
  maxSheets: 0,
  maxMembers: 0,
  maxViewers: 0,
  maxTasks: 0,
  isCustomized: false,
  customizedPlanFor: [],
  tags: '', // changed to string
};

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, planId: null });

  // new states for searching/selecting users for customized plans
  const [searchEmail, setSearchEmail] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]); // array of user objects
  const [selectedUsers, setSelectedUsers] = useState([]); // array of user objects (selected)
  const [searchNoResults, setSearchNoResults] = useState(false);

  // Fetch all plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosInstance.get('/plan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure each plan has an id property for consistency and normalize tags (support plan.tags or backend's tags)
      const plansWithId = (res.data || []).map(plan => {
        const rawTags = Array.isArray(plan.tags) ? plan.tags
          : (typeof plan.tags === 'string' ? plan.tags : '');
        const tagsArray = typeof rawTags === 'string'
          ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
          : (Array.isArray(rawTags) ? rawTags : []);
        return {
          ...plan,
          id: plan._id || plan.id,
          tags: tagsArray,
        };
      });
      setPlans(plansWithId);
    } catch {
      setToast({ isOpen: true, type: 'error', message: 'Failed to load plans.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle form input change
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => {
      if (name === "isCustomized") {
        return { ...f, isCustomized: checked };
      }
      if (name === "customizedPlanFor") {
        // Split by comma and trim
        return { ...f, customizedPlanFor: value.split(",").map(v => v.trim()).filter(Boolean) };
      }
      if (name === "tags") {
        // keep tags as string for the form input
        return { ...f, tags: value };
      }
      return {
        ...f,
        [name]: name === 'price' || name.startsWith('max')
          ? Number(value)
          : value
      };
    });
  };

  // Handle form submit (create or update)
  const handleSubmit = async e => {
    e.preventDefault();
    setFormLoading(true);
    const token = localStorage.getItem('token');
    const payload = {
      ...form,
      customizedPlanFor: Array.isArray(form.customizedPlanFor)
        ? form.customizedPlanFor
        : [],
      isCustomized: !!form.isCustomized,
      // send tags as single string field named "tags"
      tags: typeof form.tags === 'string' ? form.tags : Array.isArray(form.tags) ? form.tags.join(', ') : '',
    };
    try {
      if (editId) {
        await axiosInstance.put(`/plan/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ isOpen: true, type: 'success', message: 'Plan updated successfully.' });
      } else {
        await axiosInstance.post('/plan', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setToast({ isOpen: true, type: 'success', message: 'Plan created successfully.' });
      }
      setForm(initialForm);
      setEditId(null);
      await fetchPlans();
    } catch {
      setToast({ isOpen: true, type: 'error', message: editId ? 'Failed to update plan.' : 'Failed to create plan.' });
    }
    setFormLoading(false);
  };

  // Handle edit button
  const handleEdit = plan => {
    setEditId(plan.id); // always use normalized id
    // determine tags from plan.tags (array/string)
    const rawTags = Array.isArray(plan.tags) ? plan.tags
      : (typeof plan.tags === 'string' ? plan.tags : '');
    const tagsArray = typeof rawTags === 'string'
      ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
      : (Array.isArray(rawTags) ? rawTags : []);
    setForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      maxWorkspaces: plan.maxWorkspaces,
      maxSheets: plan.maxSheets,
      maxMembers: plan.maxMembers,
      maxViewers: plan.maxViewers,
      maxTasks: plan.maxTasks,
      isCustomized: !!plan.isCustomized,
      customizedPlanFor: Array.isArray(plan.customizedPlanFor) ? plan.customizedPlanFor : [],
      tags: tagsArray.join(', '), // populate as string
    });
    // clear previous selectedUsers; admin may search to find the users and re-add for display
    setSelectedUsers([]);
  };

  // Handle delete button (open modal)
  const handleDelete = id => {
    // normalize id (support _id or id)
    const normalizedId = id || null;
    console.debug('Open delete modal for plan id:', normalizedId);
    setDeleteModal({ isOpen: true, planId: normalizedId });
  };

  // Confirm delete
  const confirmDelete = async () => {
    const id = deleteModal.planId;
    console.debug('Attempting to delete plan id:', id);
    if (!id) {
      console.warn('No plan id available to delete');
      setDeleteModal({ isOpen: false, planId: null });
      return;
    }

    setFormLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await axiosInstance.delete(`/plan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.debug('Delete response:', res?.data || res);
      setToast({ isOpen: true, type: 'success', message: 'Plan deleted successfully.' });
      // Reset editing form if deleted plan was being edited
      if (editId === id) {
        setEditId(null);
        setForm(initialForm);
      }
      await fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete plan.';
      setToast({ isOpen: true, type: 'error', message: msg });
    } finally {
      setFormLoading(false);
      setDeleteModal({ isOpen: false, planId: null });
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditId(null);
    setForm(initialForm);
  };

  // new: search user by email
  const searchUserByEmail = async (email) => {
    if (!email) return;
    setSearchLoading(true);
    setSearchResults([]);
    setSearchNoResults(false);
    try {
      const token = localStorage.getItem('token');
      // use endpoint: /user/{email}
      const res = await axiosInstance.get(`/user/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Expect res.data to be array or single user
      const results = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchNoResults(true);
      } else {
        setSearchNoResults(false);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to search user.';
      setToast({ isOpen: true, type: 'error', message: msg });
    } finally {
      setSearchLoading(false);
    }
  };

  // new: add user to customizedPlanFor (store id in form and user object in selectedUsers)
  const addCustomizedUser = (user) => {
    if (!user || !user._id && !user.id) return;
    const userId = user._id || user.id;
    setForm(f => {
      const existing = Array.isArray(f.customizedPlanFor) ? f.customizedPlanFor : [];
      if (existing.includes(userId)) return f;
      return { ...f, customizedPlanFor: [...existing, userId] };
    });
    setSelectedUsers(prev => {
      if (prev.some(u => (u._id || u.id) === userId)) return prev;
      return [...prev, user];
    });
    // optionally clear search results / input
    setSearchResults([]);
    setSearchEmail('');
    setSearchNoResults(false);
  };

  // new: remove user from customizedPlanFor and selectedUsers
  const removeCustomizedUser = (userId) => {
    setForm(f => ({
      ...f,
      customizedPlanFor: (Array.isArray(f.customizedPlanFor) ? f.customizedPlanFor : []).filter(id => id !== userId)
    }));
    setSelectedUsers(prev => prev.filter(u => (u._id || u.id) !== userId));
  };

  return (
    <div>
      <h2 className="text-2xl font-radioCanada text-white mb-8">Plans Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Plans List - scrollable vertically, responsive padding */}
        <div className="bg-grayDash rounded-2xl px-6 md:px-8 py-6 md:py-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <h3 className="text-lg text-white mb-4 font-radioCanada">All Plans</h3>
          {loading && <div className="text-white2">Loading...</div>}
          <div className="w-full">
            <ul className="space-y-4">
              {plans.length === 0 && !loading && <li className="text-white2">No plans found.</li>}
              {plans.map(plan => (
                <li key={plan.id || plan.name} className="bg-gray3 rounded-lg p-4 text-white2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="font-bold text-white flex items-center gap-3">
                      <span>{plan.name}</span>
                      {/* tags badges */}
                      <div className="flex flex-wrap gap-2">
                        {(plan.tags || []).map((tag, idx) => (
                          <span key={idx} className="text-xs bg-pink2 text-white px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs mb-2">{plan.description}</div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span>Price: <span className="text-pink2">${plan.price}</span></span>
                      <span>Workspaces: {plan.maxWorkspaces}</span>
                      <span>Sheets: {plan.maxSheets}</span>
                      <span>Members: {plan.maxMembers}</span>
                      <span>Viewers: {plan.maxViewers}</span>
                      <span>Tasks: {plan.maxTasks}</span>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2">
                    <button
                      className="w-full sm:w-auto px-3 py-1 rounded bg-yellow text-black text-xs font-bold hover:bg-yellow-400 transition-colors"
                      onClick={() => handleEdit(plan)}
                      disabled={formLoading}
                    >
                      Edit
                    </button>
                    <button
                      className="w-full sm:w-auto px-3 py-1 rounded bg-selectRed1 text-white text-xs font-bold hover:bg-selectRed2 transition-colors"
                      onClick={() => handleDelete(plan.id || plan._id)}
                      disabled={formLoading}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Create/Update Plan Form (responsive padding) */}
        <div className="bg-grayDash rounded-2xl px-6 md:px-8 py-6 md:py-8">
          <h3 className="text-lg text-white mb-4 font-radioCanada">
            {editId ? 'Update Plan' : 'Create New Plan'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name and Tags side-by-side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white2 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded px-3 py-2 bg-gray3 text-white"
                  disabled={formLoading}
                />
              </div>
              <div>
                <label className="block text-white2 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags || ''}
                  onChange={handleChange}
                  className="w-full rounded px-3 py-2 bg-gray3 text-white"
                  disabled={formLoading}
                  placeholder="most popular, premium"
                />
              </div>
            </div>

            {/* new: Is Customized checkbox */}
            <div className="flex items-center gap-3">
              <input
                id="isCustomized"
                type="checkbox"
                name="isCustomized"
                checked={!!form.isCustomized}
                onChange={handleChange}
                disabled={formLoading}
                className="h-4 w-4"
              />
              <label htmlFor="isCustomized" className="text-white2">Is Customized</label>
            </div>

            {/* show search input when customized selected */}
            {form.isCustomized && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Search user by email"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    className="w-full rounded px-3 py-2 bg-gray3 text-white"
                    disabled={searchLoading || formLoading}
                  />
                  <button
                    type="button"
                    onClick={() => searchUserByEmail(searchEmail)}
                    disabled={searchLoading || formLoading || !searchEmail}
                    className="px-4 py-2 rounded bg-pink2 text-white"
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {/* search results */}
                {searchLoading ? (
                  <div className="text-white2 text-sm">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="bg-gray3 rounded p-3">
                    <div className="text-white2 text-sm mb-2">Search Results</div>
                    <ul className="space-y-2">
                      {searchResults.map(u => {
                        const uid = u._id || u.id;
                        const displayName = (u.firstName || u.first_name || u.lastName || u.last_name)
                          ? `${u.firstName || u.first_name || ''}${u.lastName || u.last_name ? ' ' + (u.lastName || u.last_name) : ''}`.trim()
                          : (u.name || u.email);
                        return (
                          <li key={uid} className="flex items-center justify-between">
                            <div className="text-white2 text-sm">{displayName} — {u.email}</div>
                            <button
                              type="button"
                              onClick={() => addCustomizedUser(u)}
                              disabled={formLoading || (Array.isArray(form.customizedPlanFor) && form.customizedPlanFor.includes(uid))}
                              className="px-3 py-1 rounded bg-yellow text-black text-xs font-bold"
                            >
                              {Array.isArray(form.customizedPlanFor) && form.customizedPlanFor.includes(uid) ? 'Added' : 'Add'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : searchNoResults ? (
                  <div className="bg-gray3 rounded p-3 text-white2 text-sm">No user found with that email.</div>
                ) : null}

                {/* selected users badges */}
                {(selectedUsers.length > 0 || (Array.isArray(form.customizedPlanFor) && form.customizedPlanFor.length > 0)) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* prefer selectedUsers for display; fall back to ids if no user info */}
                    {selectedUsers.map(u => {
                      const uid = u._id || u.id;
                      return (
                        <span key={uid} className="flex items-center gap-2 bg-pink2 text-white px-2 py-0.5 rounded-full text-xs">
                          <span>{u.email || uid}</span>
                          <button type="button" onClick={() => removeCustomizedUser(uid)} className="text-white text-xs">×</button>
                        </span>
                      );
                    })}
                    {/* display remaining ids if any (when editing and not yet resolved into user objects) */}
                    {(!selectedUsers.length && Array.isArray(form.customizedPlanFor)) && form.customizedPlanFor.map(id => (
                      <span key={id} className="flex items-center gap-2 bg-pink2 text-white px-2 py-0.5 rounded-full text-xs">
                        <span>{id}</span>
                        <button type="button" onClick={() => removeCustomizedUser(id)} className="text-white text-xs">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-white2 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                className="w-full rounded px-3 py-2 bg-gray3 text-white"
                disabled={formLoading}
              />
            </div>
            <div>
              <label className="block text-white2 mb-1">Price</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                min={0}
                required
                className="w-full rounded px-3 py-2 bg-gray3 text-white"
                disabled={formLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white2 mb-1">Max Workspaces</label>
                <input
                  type="number"
                  name="maxWorkspaces"
                  value={form.maxWorkspaces}
                  onChange={handleChange}
                  min={0}
                  required
                  className="w-full rounded px-3 py-2 bg-gray3 text-white"
                  disabled={formLoading}
                />
              </div>
              <div>
                <label className="block text-white2 mb-1">Max Sheets</label>
                <input
                  type="number"
                  name="maxSheets"
                  value={form.maxSheets}
                  onChange={handleChange}
                  min={0}
                  required
                  className="w-full rounded px-3 py-2 bg-gray3 text-white"
                  disabled={formLoading}
                />
              </div>
              <div>
                <label className="block text-white2 mb-1">Max Members</label>
                <input
                  type="number"
                  name="maxMembers"
                  value={form.maxMembers}
                  onChange={handleChange}
                  min={0}
                  required
                  className="w-full rounded px-3 py-2 bg-gray3 text-white"
                  disabled={formLoading}
                />
              </div>
              <div>
                <label className="block text-white2 mb-1">Max Viewers</label>
                <input
                  type="number"
                  name="maxViewers"
                  value={form.maxViewers}
                  onChange={handleChange}
                  min={0}
                  required
                  className="w-full rounded px-3 py-2 bg-gray3 text-white"
                  disabled={formLoading}
                />
              </div>
              <div>
                <label className="block text-white2 mb-1">Max Tasks</label>
                <input
                  type="number"
                  name="maxTasks"
                  value={form.maxTasks}
                  onChange={handleChange}
                  min={0}
                  required
                  className="w-full rounded px-3 py-2 bg-gray3 text-white"
                  disabled={formLoading}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={formLoading}
                className={`px-6 py-2 rounded-lg font-radioCanada transition-colors
                  ${editId
                    ? 'bg-yellow text-black hover:bg-yellow-400'
                    : 'bg-pink2 text-white hover:bg-pink'
                  }`}
              >
                {formLoading ? (editId ? 'Updating...' : 'Creating...') : (editId ? 'Update Plan' : 'Create Plan')}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={formLoading}
                  className="px-6 py-2 rounded-lg font-radioCanada bg-gray3 text-white2 hover:bg-gray4 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {/* Delete Confirmation Modal (was missing) */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, planId: null })}
        onDelete={confirmDelete}
        title="Delete Plan"
        message="Are you sure you want to delete this plan? This action cannot be undone."
        isLoading={formLoading}
      />
      {/* Toast */}
      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(t => ({ ...t, isOpen: false }))}
      />

    </div>
  );
};

export default AdminPlans;
