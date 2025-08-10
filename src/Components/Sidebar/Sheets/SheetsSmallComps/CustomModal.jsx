import React, { useState } from 'react';
import ColumnSelect from './ColumnSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { BsColumns } from 'react-icons/bs';

const ColumnType = {
  SELECT: "SELECT",
  TEXT: "TEXT",
  NUMBER: "NUMBER",
  DATE: "DATE",
  CHECK: "CHECK",
  MEMBER: "MEMBER",
};

const CustomModal = ({ isOpen, handleToggleModal, handleOk, column, handleChange, isEditing }) => {
  // Local state for select options if column.type === SELECT
  const [selects, setSelects] = useState(
    column.selects ? [...column.selects] : [{
      title: column.name || "Select",
      color: "#000000",
      options: [],
    }]
  );

  // Sync selects with column prop changes
  React.useEffect(() => {
    if (column.type === ColumnType.SELECT) {
      setSelects(column.selects ? [...column.selects] : [{
        title: column.name || "Select",
        color: "#000000",
        options: [],
      }]);
    }
  }, [column.type, column.selects, column.name]);

  // Handlers for select editing
  const handleSelectTitleChange = (value) => {
    const updated = [...selects];
    updated[0].title = value;
    setSelects(updated);
    handleChange({ target: { name: "selects", value: updated } });
  };

  const handleSelectColorChange = (value) => {
    const updated = [...selects];
    updated[0].color = value;
    setSelects(updated);
    handleChange({ target: { name: "selects", value: updated } });
  };

  const handleSelectOptionChange = (optIndex, key, value) => {
    const updated = [...selects];
    if (!updated[0].options) updated[0].options = [];
    updated[0].options[optIndex][key] = value;
    setSelects(updated);
    handleChange({ target: { name: "selects", value: updated } });
  };

  const handleAddSelectOption = () => {
    const updated = [...selects];
    if (!updated[0].options) updated[0].options = [];
    updated[0].options = [
      ...updated[0].options,
      { name: "", color: "#ffffff" }
    ];
    setSelects(updated);
    handleChange({ target: { name: "selects", value: updated } });
  };

  const handleDeleteSelectOption = (optIndex) => {
    const updated = [...selects];
    if (!updated[0].options) updated[0].options = [];
    updated[0].options = updated[0].options.filter((_, i) => i !== optIndex);
    setSelects(updated);
    handleChange({ target: { name: "selects", value: updated } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleToggleModal}
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
                onClick={handleToggleModal}
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
                  <BsColumns className="text-pink2 text-2xl" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-1">
                    {isEditing ? "Edit Column" : "Create Column"}
                  </h2>
                  <p className="text-[#777C9D] text-sm">
                    {isEditing ? "Edit this column's details" : "Add a new column to your sheet"}
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="columnName" className="block text-sm font-medium text-[#777C9D]">
                    Column Name
                  </label>
                  <motion.div 
                    whileFocus={{ scale: 1.02 }}
                    className="relative group"
                  >
                    <input
                      type="text"
                      id="columnName"
                      name="name"
                      value={column.name}
                      onChange={handleChange}
                      placeholder="Enter column name"
                      className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#777C9D]">
                    Column Type
                  </label>
                  <ColumnSelect column={column} handleChange={handleChange} />
                </div>

                {/* Add select option editor if type is SELECT */}
                {column.type === ColumnType.SELECT && (
                  <div className="mt-3 p-3 rounded-lg bg-[#23232a] border border-[#333]">
                    <div className="mb-2 flex gap-2 items-center">
                      <input
                        type="text"
                        value={selects[0]?.title || ""}
                        onChange={e => handleSelectTitleChange(e.target.value)}
                        placeholder="Select title"
                        className="bg-[#18181c] text-white px-2 py-1 rounded mr-2 text-sm"
                      />
                      <input
                        type="color"
                        value={selects[0]?.color || "#000000"}
                        onChange={e => handleSelectColorChange(e.target.value)}
                        className="w-6 h-6 border-none"
                        title="Select color"
                      />
                    </div>
                    <div className="space-y-2">
                      {(selects[0]?.options || []).map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={e => handleSelectOptionChange(optIndex, "name", e.target.value)}
                            placeholder="Option name"
                            className="bg-[#18181c] text-white px-2 py-1 rounded text-sm flex-1"
                          />
                          <input
                            type="color"
                            value={opt.color || "#ffffff"}
                            onChange={e => handleSelectOptionChange(optIndex, "color", e.target.value)}
                            className="w-6 h-6 border-none"
                            title="Option color"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteSelectOption(optIndex)}
                            className="text-red-400 hover:text-red-300"
                            title="Delete option"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSelectOption}
                      className="mt-2 text-pink2 text-xs hover:underline"
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleToggleModal}
                    className="flex-1 bg-[#2A2A2A] text-[#777C9D] rounded-xl py-3.5 font-medium transition-all duration-300 hover:bg-[#3A3A3A] hover:text-white"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOk}
                    className="flex-1 bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl py-3.5 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink2/20 relative overflow-hidden group"
                  >
                    <span className="relative z-10">{isEditing ? "Save" : "Create"}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink2/0 via-white/20 to-pink2/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomModal;
