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

  // Fetch all plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosInstance.get('/plan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure each plan has an id property for consistency
      const plansWithId = (res.data || []).map(plan => ({
        ...plan,
        id: plan._id || plan.id // normalize id field
      }));
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
    });
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
                    <div className="font-bold text-white">{plan.name}</div>
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
            {/* <div>
              <label className="block text-white2 mb-1">Is Customized</label>
              <input
                type="checkbox"
                name="isCustomized"
                checked={form.isCustomized}
                onChange={handleChange}
                className="mr-2"
                disabled={formLoading}
              />
              <span className="text-white2">Check if this is a customized plan</span>
            </div> */}
            {/* <div>
              <label className="block text-white2 mb-1">Customized Plan For (comma separated)</label>
              <input
                type="text"
                name="customizedPlanFor"
                value={form.customizedPlanFor.join(", ")}
                onChange={handleChange}
                className="w-full rounded px-3 py-2 bg-gray3 text-white"
                disabled={formLoading}
                placeholder="companyId1, companyId2, ..."
              />
            </div> */}
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
