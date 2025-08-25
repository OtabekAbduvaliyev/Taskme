import { useEffect } from 'react';

/**
 * Custom hook to handle ESC key press events for modals
 * @param {boolean} isOpen - Whether the modal is currently open
 * @param {function} onClose - Function to call when ESC is pressed
 * @param {boolean} disabled - Whether to disable ESC handling (e.g., during loading states)
 */
const useEscapeKey = (isOpen, onClose, disabled = false) => {
  useEffect(() => {
    // Only attach listener if modal is open and not disabled
    if (!isOpen || disabled || typeof onClose !== 'function') return;

    const handleEscapeKey = (event) => {
      // Check if ESC key was pressed
      if (event.key === 'Escape' || event.keyCode === 27) {
        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Only close if no other modal or overlay is on top
        // Check if the event target is within the modal or its backdrop
        const modalElements = document.querySelectorAll('[data-modal="true"]');
        if (modalElements.length > 0) {
          // Find the topmost modal (highest z-index)
          let topmostModal = null;
          let highestZIndex = -1;
          
          modalElements.forEach(modal => {
            const zIndex = parseInt(window.getComputedStyle(modal).zIndex, 10);
            if (zIndex > highestZIndex) {
              highestZIndex = zIndex;
              topmostModal = modal;
            }
          });
          
          // Only close if this is the topmost modal
          if (topmostModal && topmostModal.getAttribute('data-modal-id') === 'current') {
            onClose();
          }
        } else {
          // No modal hierarchy tracking, just close
          onClose();
        }
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleEscapeKey, true);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleEscapeKey, true);
    };
  }, [isOpen, onClose, disabled]);
};

export default useEscapeKey;
