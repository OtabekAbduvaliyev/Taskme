import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { Select } from 'antd';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../../AxiosInctance/AxiosInctance';
import defImg from "../../assets/default-avatar-icon-of-social-media-user-vector.jpg";

// Add custom styles for modern Select components
const styles = `
  .sort-select-modern .ant-select-selector {
    background-color: #20232A !important;
    border: 1px solid rgba(42, 45, 54, 0.2) !important;
    border-radius: 8px !important;
    padding: 6px 12px !important;
    width:100% !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    position: relative !important;
    min-height: 44px !important;
  }

  /* make sure the selection area has enough right padding so tags don't overlap the arrow */
  .sort-select-modern .ant-select-selection-overflow {
    padding-right: 36px !important;
  }

  /* ensure individual tags look like pills and match background */
  .sort-select-modern .ant-select-selection-item {
    background-color: #2A2D36 !important;
    color: #fff !important;
    border-radius: 6px !important;
    // padding: 4px 8px !important;
    margin-right: 6px !important;
  }

  .sort-select-modern .ant-select-selection-placeholder {
    color: #8b8f95 !important;
  }

  /* position and style the arrow so it sits on the same bg */
  .sort-select-modern .ant-select-arrow {
    position: absolute !important;
    right: 10px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    color: rgba(255,255,255,0.9) !important;
    pointer-events: none !important;
  }

  /* dropdown styling */
  .modern-dropdown .ant-select-item {
    color: #fff !important;
    border-radius: 6px !important;
    padding: 8px 12px !important;
  }

  .modern-dropdown .ant-select-item-option-selected {
    background-color: rgba(220, 80, 145, 0.15) !important;
  }

  .modern-dropdown .ant-select-item-option-active {
    background-color: rgba(42, 45, 54, 0.5) !important;
  }

  .sort-select-modern .ant-select-selection-item-remove {
    color: rgba(255, 255, 255, 0.45) !important;
    margin-left: 6px !important;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #2A2D36;
    border-radius: 4px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #353847;
  }
`;

// Insert styles into document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const SortPanel = ({ isOpen, onClose, onSort, columns = [], currentSort = {} }) => {
  const [sortFields, setSortFields] = useState(currentSort);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectOptions, setSelectOptions] = useState({});

  // Fetch select options when modal opens or when columns change
  useEffect(() => {
    const fetchSelects = async () => {
      if (!isOpen && (!columns || columns.length === 0)) return;

      try {
        const token = localStorage.getItem('token');
        // try plural endpoint
        const response = await axiosInstance.get('/select', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Normalize response: support both /selects -> Array and { data: [...] }
        const apiData = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        // Build map from API selects
        const map = new Map();
        apiData.forEach((sel) => {
          const rawTitle = (sel.title || '').trim();
          const key = rawTitle.replace(/select the /i, '').trim();
          if (!key) return;
          const lower = key.toLowerCase();
          if (!map.has(lower)) map.set(lower, { title: key, options: [] });
          const entry = map.get(lower);
          (sel.options || []).forEach((opt) => {
            const name = String(opt.name || '').trim();
            if (!name) return;
            if (!entry.options.find((o) => o.value === name)) {
              entry.options.push({ value: name, label: name, color: opt.color });
            }
          });
        });

        // Merge selects found in columns prop (if any)
        if (Array.isArray(columns) && columns.length) {
          columns.forEach((col) => {
            // columns may contain selects under col.selects[0].options or col.selects
            const sers = col.selects || [];
            sers.forEach((s) => {
              const rawTitle = (s.title || col.name || col.key || '').trim();
              const key = rawTitle.replace(/select the /i, '').trim();
              if (!key) return;
              const lower = key.toLowerCase();
              if (!map.has(lower)) map.set(lower, { title: key, options: [] });
              const entry = map.get(lower);
              (s.options || []).forEach((opt) => {
                const name = String(opt.name || opt.label || '').trim();
                if (!name) return;
                if (!entry.options.find((o) => o.value === name)) {
                  entry.options.push({ value: name, label: name, color: opt.color });
                }
              });
            });
          });
        }

        // Convert to object keyed by title preserving original casing
        const processedSelects = {};
        for (const [, v] of map) {
          const key = (v.title || '').toString().toLowerCase();
          if (!key) continue;
          // store title lowercased as well so UI shows lowercased labels
          processedSelects[key] = { ...v, title: key };
        }

        // Fetch members and add as a selectable group for sorting
        try {
          const memRes = await axiosInstance.get('/member', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const memPayload = Array.isArray(memRes.data)
            ? memRes.data
            : Array.isArray(memRes.data?.members)
              ? memRes.data.members
              : Array.isArray(memRes.data?.data)
                ? memRes.data.data
                : [];

          if (memPayload && memPayload.length) {
            const membersOptions = memPayload.map((m) => {
              const user = m.user || {};
              const name = `${(user.firstName || '').trim()} ${(user.lastName || '').trim()}`.trim() || user.email || m.id;
              const avatar = user.avatar?.path ? `https://eventify.preview.uz/${user.avatar.path}` : null;
              return { value: m.id, label: name, email: user.email, avatar };
            }).filter(Boolean);

            // only set if there are options
            if (membersOptions.length) {
              // use lowercase key "members" and merge if present
              const membersKey = 'members';
              if (!processedSelects[membersKey]) {
                processedSelects[membersKey] = { title: membersKey, options: membersOptions };
              } else {
                const exist = processedSelects[membersKey];
                membersOptions.forEach((opt) => {
                  if (!exist.options.find((o) => o.value === opt.value)) {
                    exist.options.push(opt);
                  }
                });
              }
            }
          }
        } catch (memErr) {
          // non-fatal: just log and continue
          console.error('Error fetching members for sort panel:', memErr);
        }

        setSelectOptions(processedSelects);
      } catch (error) {
        console.error('Error fetching selects:', error);
      }
    };

    fetchSelects();
  }, [isOpen, columns]);

  // Initialize sort fields from URL on mount and handle params
  useEffect(() => {
    const sortParam = searchParams.get('filters');
    if (sortParam) {
      try {
        const parsedSort = JSON.parse(sortParam);
        // normalize keys to lower case
        const normalized = Object.entries(parsedSort || {}).reduce((acc, [k, v]) => {
          acc[k.toString().toLowerCase()] = v;
          return acc;
        }, {});
        setSortFields(normalized);
        onSort(normalized);
      } catch (e) {
        console.error('Invalid sort parameter:', e);
      }
    }
  }, [searchParams]);

  const handleFieldChange = (field, values) => {
    const newSortFields = {
      ...sortFields,
      [field]: values
    };
    
    if (!values.length) {
      delete newSortFields[field];
    }
    
    setSortFields(newSortFields);
  };

  const handleApply = () => {
    // Format fields while preserving original case
    const formattedSortFields = Object.entries(sortFields).reduce((acc, [key, values]) => {
      if (values && values.length) {
        acc[key.toString().toLowerCase()] = values.map(v => String(v));
      }
      return acc;
    }, {});

    // Create new params object and set the values we want to keep
    const params = {
      page: '1',
      limit: searchParams.get('limit') || '10'
    };
    
    // Add search if it exists
    const searchQuery = searchParams.get('search');
    if (searchQuery) params.search = searchQuery;
    
    // Add filters if we have any
    if (Object.keys(formattedSortFields).length) {
      params.filters = JSON.stringify(formattedSortFields);
    }
    
    setSearchParams(params);
    onSort(formattedSortFields);
    onClose();
  };

  const handleClear = () => {
    const clearedFields = {};
    setSortFields(clearedFields);
    
    // Remove filters from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('filters');
    setSearchParams(newParams);
    
    onSort(clearedFields);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1A1D24] rounded-2xl w-full max-w-md mx-4 overflow-hidden border border-[#2A2D36]/20 shadow-xl">
        <div className="flex items-center justify-between p-5 bg-[#20232A]">
          <h3 className="text-white text-lg font-medium">Sort Tasks</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2A2D36] transition-colors text-gray4 hover:text-white"
          >
            <IoClose size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {Object.entries(selectOptions).map(([field, select]) => (
            <div key={field} className="space-y-3">
              <label className="text-gray4 text-sm font-medium capitalize block">{field}</label>
              {field === 'Members' ? (
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder={`Select ${field}`}
                  value={sortFields[field] || []}
                  onChange={(values) => handleFieldChange(field, values)}
                  optionLabelProp="label"
                  className="sort-select-modern"
                  maxTagCount="responsive"
                  dropdownStyle={{
                    backgroundColor: '#20232A',
                    border: '1px solid rgba(42, 45, 54, 0.2)',
                    borderRadius: '12px',
                    padding: '8px'
                  }}
                  dropdownClassName="modern-dropdown"
                >
                  {select.options.map(opt => (
                    <Select.Option key={opt.value} value={opt.value} label={opt.label}>
                      <div className="flex items-center gap-3">
                        <img
                          src={opt.avatar || defImg}
                          alt={opt.label}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-white text-sm truncate">{opt.label}</div>
                          {opt.email && <div className="text-xs text-gray2 truncate">{opt.email}</div>}
                        </div>
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              ) : (
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  placeholder={`Select ${field}`}
                  value={sortFields[field] || []}
                  onChange={(values) => handleFieldChange(field, values)}
                  options={select.options}
                  className="sort-select-modern"
                  maxTagCount="responsive"
                  dropdownStyle={{
                    backgroundColor: '#20232A',
                    border: '1px solid rgba(42, 45, 54, 0.2)',
                    borderRadius: '12px',
                    padding: '8px'
                  }}
                  dropdownClassName="modern-dropdown"
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-5 bg-[#20232A] flex justify-end gap-3">
          <button
            onClick={handleClear}
            className="px-5 py-2.5 text-gray4 hover:text-white transition-colors rounded-lg hover:bg-[#2A2D36] font-medium"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 bg-pink2 text-white rounded-lg hover:bg-pink2/90 transition-colors font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SortPanel;
