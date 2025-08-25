import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import { HiOutlineFolder } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import useEscapeKey from './hooks/useEscapeKey';

const WorkspaceFormModal = ({ isOpen, onClose, isEditing, workspaceName, onWorkspaceNameChange, onSubmit }) => {
  const inputRef = useRef(null);

  // Handle ESC key press
  useEscapeKey(isOpen, onClose);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only submit if there's a non-empty, trimmed name
    if (!workspaceName || !workspaceName.name || !workspaceName.name.trim()) return;
    onSubmit();
  };

  const currentLength = workspaceName?.name?.length || 0;
  const maxLength = 20;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-[#1E1E1E] rounded-2xl w-full max-w-md overflow-hidden"
          >
            {/* Glass effect top banner */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />
            
            <div className="relative p-6">
              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 text-gray2 hover:text-white transition-colors"
              >
                <FiX size={24} />
              </motion.button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink2/20 to-pink2/10 flex items-center justify-center"
                >
                  <HiOutlineFolder className="text-pink2 text-2xl" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    {isEditing ? "Edit Workspace" : "New Workspace"}
                  </h2>
                  <p className="text-[#777C9D] text-sm">
                    {isEditing ? "Update your workspace details" : "Create a new workspace to organize your work"}
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#777C9D]">
                    Workspace Name
                  </label>
                  <motion.div 
                    whileFocus={{ scale: 1.02 }}
                    className="relative group"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      name="name"
                      value={workspaceName.name}
                      onChange={onWorkspaceNameChange}
                      maxLength={maxLength}
                      className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
                      placeholder="Enter workspace name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.div>
                  {/* character count */}
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs ${currentLength === maxLength ? 'text-red-400' : 'text-[#777C9D]'}`}>
                      {currentLength}/{maxLength}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 bg-[#2A2A2A] text-[#777C9D] rounded-xl py-3.5 font-medium transition-all duration-300 hover:bg-[#3A3A3A] hover:text-white"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!workspaceName.name || !workspaceName.name.trim()}
                    className={`flex-1 bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl py-3.5 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink2/20 relative overflow-hidden group ${
                      !workspaceName.name || !workspaceName.name.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="relative z-10">{isEditing ? "Save Changes" : "Create Workspace"}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink2/0 via-white/20 to-pink2/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WorkspaceFormModal;
