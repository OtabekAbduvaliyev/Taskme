import React from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import useEscapeKey from "./hooks/useEscapeKey";

const UpgradePlanModal = ({ isOpen, onClose, message }) => {
  // Handle ESC key press
  useEscapeKey(isOpen, onClose);

  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#23272F] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-2 relative">
        <button
          className="absolute top-3 right-3 text-gray4 hover:text-white2 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Upgrade Required</h2>
          <p className="text-white2 mb-6">{message || "You have reached the limit for your current plan. Please upgrade to continue."}</p>
          <Link
            to="/subscriptions"
            className="inline-block px-6 py-3 bg-pink2 text-white rounded-xl font-semibold hover:bg-pink transition"
            onClick={onClose}
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default UpgradePlanModal;
