import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { BsArrowUpRight } from "react-icons/bs";
import dayjs from "dayjs";

const DayTasksModal = ({ isOpen, onClose, dateStr, tasks = [], onOpenTask }) => {
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#DC5091";
      case "medium":
        return "#BF7E1C";
      case "low":
        return "#0EC359";
      default:
        return "#7658B1";
    }
  };

  // Get priority text color (lighter shade for better visibility)
  const getPriorityTextColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#FF6B9D";
      case "medium":
        return "#FFA94D";
      case "low":
        return "#51CF66";
      default:
        return "#B296F5";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="absolute inset-0 bg-[#171922]/80 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative bg-gray3 rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] shadow-2xl border border-gray4/50"
          >
            {/* Gradient overlay */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-pink2/10 to-transparent pointer-events-none" />
            
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-gray4/30">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-5 right-5 text-white2 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray4"
              >
                <FiX size={24} />
              </motion.button>
              <div>
                <h2 className="text-white font-bold text-2xl">
                  {dateStr ? dayjs(dateStr).format("dddd, MMMM D, YYYY") : "Tasks"}
                </h2>
                <p className="text-white2 text-sm mt-1.5">
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"} scheduled
                </p>
              </div>
            </div>

            {/* Tasks list */}
            <div className="relative px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
              {tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-gray4/50 flex items-center justify-center mb-4">
                    <BsArrowUpRight className="text-white2 text-2xl" />
                  </div>
                  <p className="text-white2 text-base">No tasks scheduled for this date</p>
                  <p className="text-gray4 text-sm mt-1">Click outside to close</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, index) => {
                    const title = task?.name || "Untitled Task";
                    const priority = task?.priority;
                    const status = task?.status;
                    const price = task?.price;
                    const isDueDate = task?.__isDueDate;
                    const priorityColor = getPriorityColor(priority);
                    const priorityTextColor = getPriorityTextColor(priority);

                    return (
                      <motion.div
                        key={task?.id || task?._id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (typeof onOpenTask === "function") {
                            onOpenTask(task.id ?? task._id);
                          }
                        }}
                        className={`group relative bg-grayDash rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ${
                          isDueDate 
                            ? "border-2 border-white2 border-dashed" 
                            : "border border-gray4/50 hover:border-pink2/50"
                        }`}
                      >
                        {/* Priority indicator bar */}
                        {priority && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                            style={{ backgroundColor: priorityColor }}
                          />
                        )}

                        <div className="flex items-start justify-between gap-3 pl-2">
                          <div className="flex-1 min-w-0">
                            {/* Task name with due date indicator */}
                            <div className="flex items-center gap-2 mb-2">
                              {isDueDate && (
                                <span className="text-base" title="Due Date">⏰</span>
                              )}
                              <h3 className="text-white font-semibold text-base group-hover:text-pink2 transition-colors">
                                {title}
                              </h3>
                            </div>

                            {/* Metadata row */}
                            <div className="flex flex-wrap items-center gap-2">
                              {priority && (
                                <span
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                                  style={{
                                    backgroundColor: priorityColor + "20",
                                    color: priorityTextColor,
                                  }}
                                >
                                  {priority}
                                </span>
                              )}

                              {status && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray4/50 text-white2">
                                  {status}
                                </span>
                              )}

                              {typeof price !== "undefined" && price !== null && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-pink2/20 text-pink2">
                                  ${price}
                                </span>
                              )}

                              {/* Due date badge */}
                              {isDueDate && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-yellow/20 text-yellow border border-yellow/50">
                                  Due Date
                                </span>
                              )}

                              {/* Multi-day indicator */}
                              {task.__isMultiDay && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-selectPurple1/20 text-selectPurple1">
                                  Multi-day
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Arrow icon */}
                          <motion.div
                            className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray4/50 flex items-center justify-center group-hover:bg-pink2 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <BsArrowUpRight className="text-white2 group-hover:text-white text-sm" />
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {tasks.length > 0 && (
              <div className="relative px-6 py-4 border-t border-gray4/30 bg-gray3">
                <p className="text-white2 text-xs text-center">
                  Click any task to view details in table view
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DayTasksModal;




