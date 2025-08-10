import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { MdOutlineCheckCircle, MdOutlineError } from "react-icons/md";

const Toast = ({ isOpen, type = "success", message, onClose }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="fixed bottom-8 right-8 z-[9999] flex items-center"
        >
          <div
            className={`relative bg-[#1E1E1E] rounded-2xl shadow-lg px-6 py-4 flex items-center gap-4 min-w-[280px] border-2 ${
              type === "success"
                ? "border-green-500"
                : "border-red-500"
            }`}
          >
            <div>
              {type === "success" ? (
                <MdOutlineCheckCircle className="text-green-500 text-2xl" />
              ) : (
                <MdOutlineError className="text-red-500 text-2xl" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-white font-medium">{message}</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray2 hover:text-white transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Toast;
