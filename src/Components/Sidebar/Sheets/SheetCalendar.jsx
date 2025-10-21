import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoChevronBack, IoChevronForward, IoAddCircleOutline, IoCalendarOutline } from "react-icons/io5";
import { BiCalendar } from "react-icons/bi";
import { BsCalendar3 } from "react-icons/bs";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import DayTasksModal from "./SheetsSmallComps/DayTasksModal";

dayjs.extend(isBetween);

const SheetCalendar = ({ tasks = [], columns = [], onOpenTask }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isYearMonthPickerOpen, setIsYearMonthPickerOpen] = useState(false);

  // Get priority color from palette
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "#DC5091"; // selectRed1
      case "medium":
        return "#BF7E1C"; // yellow
      case "low":
        return "#0EC359"; // selectGreen1
      default:
        return "#7658B1"; // pink2
    }
  };

  // Get status color from columns configuration
  const getStatusColor = (status) => {
    if (!status || !columns?.length) return "#7658B1"; // default pink2
    
    const statusCol = columns.find(c => 
      c?.key?.toLowerCase() === "status" || c?.name?.toLowerCase() === "status"
    );
    
    if (statusCol?.selects?.[0]?.options) {
      const option = statusCol.selects[0].options.find(
        opt => opt?.name?.toLowerCase() === status?.toLowerCase()
      );
      if (option?.color) return option.color;
    }
    
    return "#7658B1"; // default
  };

  // Parse task dates and organize by day
  const tasksByDate = useMemo(() => {
    const dateMap = {};
    
    if (!tasks || !Array.isArray(tasks)) return dateMap;
    
    tasks.forEach(task => {
      if (!task) return;
      
      // Collect all date fields (date1-date5)
      const dateFields = ['date1', 'date2', 'date3', 'date4', 'date5'];
      const allDates = [];
      
      for (const field of dateFields) {
        if (task[field]) {
          const parsed = dayjs(task[field]);
          if (parsed.isValid()) {
            allDates.push({ date: parsed, field, isDueDate: false });
          }
        }
      }
      
      // Collect all due dates (duedate1-duedate5 are arrays)
      const dueDateFields = ['duedate1', 'duedate2', 'duedate3', 'duedate4', 'duedate5'];
      
      for (const field of dueDateFields) {
        if (Array.isArray(task[field]) && task[field].length > 0) {
          task[field].forEach(dateValue => {
            if (dateValue) {
              const parsed = dayjs(dateValue);
              if (parsed.isValid()) {
                allDates.push({ date: parsed, field, isDueDate: true });
              }
            }
          });
        } else if (task[field] && typeof task[field] === 'string') {
          // Handle case where duedate might be a single string
          const parsed = dayjs(task[field]);
          if (parsed.isValid()) {
            allDates.push({ date: parsed, field, isDueDate: true });
          }
        }
      }
      
      // If no valid dates found, skip this task
      if (allDates.length === 0) return;
      
      // Sort dates chronologically
      allDates.sort((a, b) => a.date.valueOf() - b.date.valueOf());
      
      // Get first and last dates
      const startDate = allDates[0].date;
      const endDate = allDates.length > 1 ? allDates[allDates.length - 1].date : null;
      const isFirstDueDate = allDates[0].isDueDate;
      
      // If task has multiple dates spanning days, show it across all days in range
      if (endDate && endDate.isAfter(startDate, 'day')) {
        let current = startDate.clone();
        let dayCount = 0;
        const maxDays = 365; // Safety limit to prevent infinite loops
        
        while ((current.isBefore(endDate, 'day') || current.isSame(endDate, 'day')) && dayCount < maxDays) {
          const key = current.format("YYYY-MM-DD");
          if (!dateMap[key]) dateMap[key] = [];
          dateMap[key].push({ 
            ...task, 
            __isMultiDay: true,
            __isStart: current.isSame(startDate, 'day'),
            __isEnd: current.isSame(endDate, 'day'),
            __isDueDate: isFirstDueDate,
            __displayDate: startDate.format("YYYY-MM-DD"),
            __allDates: allDates,
          });
          current = current.add(1, 'day');
          dayCount++;
        }
      } else {
        // Single day task
        const key = startDate.format("YYYY-MM-DD");
        if (!dateMap[key]) dateMap[key] = [];
        dateMap[key].push({ 
          ...task, 
          __isMultiDay: false,
          __isDueDate: isFirstDueDate,
          __displayDate: startDate.format("YYYY-MM-DD"),
          __allDates: allDates,
        });
      }
    });
    
    return dateMap;
  }, [tasks]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startDay = startOfMonth.day(); // 0 = Sunday
    const daysInMonth = currentMonth.daysInMonth();
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = 0; i < startDay; i++) {
      const date = startOfMonth.subtract(startDay - i, "day");
      days.push({
        date,
        isCurrentMonth: false,
        key: date.format("YYYY-MM-DD"),
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = startOfMonth.date(i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.isSame(dayjs(), "day"),
        key: date.format("YYYY-MM-DD"),
      });
    }
    
    // Next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = endOfMonth.add(i, "day");
      days.push({
        date,
        isCurrentMonth: false,
        key: date.format("YYYY-MM-DD"),
      });
    }
    
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => prev.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => prev.add(1, "month"));
  };

  const handleToday = () => {
    setCurrentMonth(dayjs());
  };

  const handleDayClick = (day, dayTasks) => {
    if (dayTasks?.length > 0) {
      setSelectedDate(day.key);
      setIsModalOpen(true);
    }
    // TODO: If empty day clicked, trigger create task with that date pre-filled
  };

  const handleTaskClick = (taskId) => {
    console.log('📅 Calendar: Task clicked, ID:', taskId, 'Type:', typeof taskId);
    setIsModalOpen(false);
    if (typeof onOpenTask === "function") {
      console.log('📅 Calendar: Calling onOpenTask with ID:', taskId);
      onOpenTask(taskId);
    } else {
      console.warn('⚠️ Calendar: onOpenTask function not provided!');
    }
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Check if there are any tasks at all
  const hasAnyTasks = tasks && tasks.length > 0;
  
  // Count tasks with valid dates
  const tasksWithDates = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return 0;
    return tasks.filter(task => {
      if (!task) return false;
      
      // Check date1-date5
      const dateFields = ['date1', 'date2', 'date3', 'date4', 'date5'];
      const hasDateField = dateFields.some(field => {
        if (task[field]) {
          const parsed = dayjs(task[field]);
          return parsed.isValid();
        }
        return false;
      });
      
      if (hasDateField) return true;
      
      // Check duedate1-duedate5 (arrays or strings)
      const dueDateFields = ['duedate1', 'duedate2', 'duedate3', 'duedate4', 'duedate5'];
      return dueDateFields.some(field => {
        if (Array.isArray(task[field]) && task[field].length > 0) {
          return task[field].some(dateValue => {
            if (dateValue) {
              const parsed = dayjs(dateValue);
              return parsed.isValid();
            }
            return false;
          });
        } else if (task[field] && typeof task[field] === 'string') {
          const parsed = dayjs(task[field]);
          return parsed.isValid();
        }
        return false;
      });
    }).length;
  }, [tasks]);
  
  // Debug: Uncomment to see task parsing info
  // React.useEffect(() => {
  //   console.log('📅 Calendar Debug:', {
  //     totalTasks: tasks?.length || 0,
  //     tasksWithDates,
  //     daysWithTasks: Object.keys(tasksByDate).length,
  //     tasksByDate: Object.entries(tasksByDate).slice(0, 5), // First 5 days
  //   });
  // }, [tasks, tasksWithDates, tasksByDate]);

  // Generate month/year picker options
  const generateMonthYearOptions = () => {
    const months = [];
    const currentYear = dayjs().year();
    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      for (let month = 0; month < 12; month++) {
        months.push(dayjs().year(year).month(month));
      }
    }
    return months;
  };

  return (
    <div className="w-full h-full flex flex-col bg-grayDash rounded-xl overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-4 sm:px-6 py-4 sm:py-5 bg-gray3 border-b border-gray4/30"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <BiCalendar className="text-pink2 text-2xl sm:text-3xl" />
          <button
            onClick={() => setIsYearMonthPickerOpen(!isYearMonthPickerOpen)}
            className="text-white text-xl sm:text-2xl font-bold hover:text-pink2 transition-colors flex items-center gap-2 group"
          >
            {currentMonth.format("MMMM YYYY")}
            <IoCalendarOutline className="text-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToday}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray4 hover:bg-pink2 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Today
          </motion.button>
          
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePrevMonth}
              className="p-2 rounded-lg bg-gray4 hover:bg-pink2 text-white transition-colors duration-200"
              aria-label="Previous month"
            >
              <IoChevronBack className="text-lg" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-gray4 hover:bg-pink2 text-white transition-colors duration-200"
              aria-label="Next month"
            >
              <IoChevronForward className="text-lg" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Month/Year Picker Dropdown */}
      <AnimatePresence>
        {isYearMonthPickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-gray3 border-b border-gray4/30"
          >
            <div className="px-4 sm:px-6 py-3 max-h-48 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {generateMonthYearOptions().map((monthYear) => (
                  <motion.button
                    key={monthYear.format("YYYY-MM")}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setCurrentMonth(monthYear);
                      setIsYearMonthPickerOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      monthYear.isSame(currentMonth, "month")
                        ? "bg-pink2 text-white"
                        : "bg-gray4 text-white2 hover:bg-gray2"
                    }`}
                  >
                    {monthYear.format("MMM 'YY")}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-gray4/30 border-b border-gray4/30">
        {weekDays.map((day) => (
          <motion.div
            key={day}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray3 py-2 sm:py-3 text-center"
          >
            <span className="text-white2 text-xs sm:text-sm font-semibold uppercase tracking-wide">
              {day}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Empty state when no tasks or no tasks with dates */}
      {!hasAnyTasks && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center p-8"
        >
          <div className="text-center max-w-md">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink2/20 to-selectPurple1/20 flex items-center justify-center"
            >
              <BsCalendar3 className="text-pink2 text-4xl" />
            </motion.div>
            <h3 className="text-white text-xl font-bold mb-2">No Tasks Scheduled</h3>
            <p className="text-white2 text-sm mb-6">
              Start planning your work by creating tasks with start and end dates.
              They'll appear here on the calendar for easy scheduling.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Switch to table view to create tasks
                // This will be handled by parent component
              }}
              className="px-6 py-3 bg-pink2 hover:bg-pink2/80 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <IoAddCircleOutline className="text-xl" />
              Create Your First Task
            </motion.button>
          </div>
        </motion.div>
      )}
      
      {/* Info message when tasks exist but have no dates */}
      {hasAnyTasks && tasksWithDates === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center p-8"
        >
          <div className="text-center max-w-lg">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow/20 to-selectRed1/20 flex items-center justify-center"
            >
              <BsCalendar3 className="text-yellow text-4xl" />
            </motion.div>
            <h3 className="text-white text-xl font-bold mb-2">Add Dates to Your Tasks</h3>
            <p className="text-white2 text-sm mb-4">
              You have {tasks.length} {tasks.length === 1 ? "task" : "tasks"}, but none have start or end dates.
              Add dates to your tasks in the table view to see them on the calendar.
            </p>
            <div className="bg-gray4/30 rounded-lg p-4 mb-6 border border-gray4/50">
              <p className="text-white2 text-xs text-left">
                <span className="font-semibold text-white">💡 Tip:</span> Switch to table view and add dates using the date columns (Date 1-5) or due date columns (Due Date 1-5). 
                Tasks with dates will automatically appear on the calendar.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Calendar grid */}
      {hasAnyTasks && tasksWithDates > 0 && (
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="grid grid-cols-7 gap-px bg-gray4/30 min-h-full">
          {calendarDays.map((day, index) => {
            const dayTasks = tasksByDate[day.key] || [];
            const visibleTaskLimit = 3;
            const visibleTasks = dayTasks.slice(0, visibleTaskLimit);
            const overflowCount = dayTasks.length - visibleTaskLimit;

            return (
              <motion.div
                key={day.key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.005, duration: 0.2 }}
                onClick={() => handleDayClick(day, dayTasks)}
                className={`
                  relative min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] p-2 sm:p-3
                  transition-all duration-200 cursor-pointer group
                  ${day.isCurrentMonth ? "bg-gray3" : "bg-gray3/40"}
                  ${day.isToday ? "ring-2 ring-pink2 ring-inset" : ""}
                  hover:bg-gray2/30
                `}
              >
                {/* Day number */}
                <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                  <span
                    className={`
                      text-sm sm:text-base font-semibold rounded-full w-7 h-7 sm:w-8 sm:h-8 
                      flex items-center justify-center transition-colors
                      ${day.isToday 
                        ? "bg-pink2 text-white" 
                        : day.isCurrentMonth 
                          ? "text-white group-hover:bg-gray4" 
                          : "text-white2"
                      }
                    `}
                  >
                    {day.date.date()}
                  </span>
                  
                  {/* Quick add button (visible on hover) */}
                  {day.isCurrentMonth && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-pink2/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Trigger create task modal with this date pre-filled
                      }}
                      aria-label="Add task"
                    >
                      <IoAddCircleOutline className="text-pink2 text-lg" />
                    </motion.button>
                  )}
                </div>

                {/* Tasks */}
                <div className="space-y-1">
                  {visibleTasks.map((task, idx) => {
                    const bgColor = task.priority 
                      ? getPriorityColor(task.priority)
                      : getStatusColor(task.status);
                    
                    // Build tooltip with date info
                    let tooltip = `${task.name || "Untitled"}`;
                    if (task.priority) tooltip += ` • ${task.priority}`;
                    if (task.status) tooltip += ` • ${task.status}`;
                    if (task.price) tooltip += ` • $${task.price}`;
                    if (task.__isDueDate) tooltip += ` • Due Date`;
                    
                    return (
                      <motion.div
                        key={task.id + "-" + idx}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task.id);
                        }}
                        className={`
                          text-xs px-2 py-1 rounded-md font-medium cursor-pointer
                          hover:shadow-lg hover:shadow-black/20 transform hover:scale-[1.02] 
                          transition-all duration-200 group relative
                          ${task.__isMultiDay && !task.__isStart ? "rounded-l-none" : ""}
                          ${task.__isMultiDay && !task.__isEnd ? "rounded-r-none" : ""}
                          ${task.__isDueDate ? "border-2" : "border"}
                        `}
                        style={{
                          backgroundColor: task.__isDueDate ? bgColor + "CC" : bgColor + "E6", // 80% for due dates, 90% for regular
                          color: "#EFEBF6", // white from palette
                          borderColor: task.__isDueDate ? "#EFEBF6" : bgColor,
                          borderStyle: task.__isDueDate ? "dashed" : "solid",
                        }}
                        title={tooltip}
                      >
                        <div className="flex items-center gap-1 w-full">
                          {/* Due date indicator */}
                          {task.__isDueDate && (
                            <span className="text-[10px] flex-shrink-0 opacity-90" title="Due Date">⏰</span>
                          )}
                          
                          {/* Multi-day start indicator */}
                          {task.__isMultiDay && task.__isStart && !task.__isDueDate && (
                            <span className="text-[10px] flex-shrink-0 opacity-90">▶</span>
                          )}
                          
                          {/* Task name */}
                          <span className="truncate flex-1 text-[11px] sm:text-xs font-medium">
                            {task.name || "Untitled"}
                          </span>
                          
                          {/* Price badge */}
                          {typeof task.price !== "undefined" && task.price !== null && (
                            <span className="ml-auto text-[10px] font-bold flex-shrink-0 bg-white/20 px-1.5 py-0.5 rounded">
                              ${task.price}
                            </span>
                          )}
                        </div>
                        
                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-md transition-colors pointer-events-none" />
                      </motion.div>
                    );
                  })}
                  
                  {/* Overflow indicator */}
                  {overflowCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick(day, dayTasks);
                      }}
                      className="text-xs px-2 py-1 rounded-md font-semibold bg-gray4/80 text-white2 hover:bg-pink2 hover:text-white transition-all duration-200 cursor-pointer border border-gray4 hover:border-pink2 hover:shadow-md"
                    >
                      +{overflowCount} more
                    </motion.div>
                  )}
                </div>

                {/* Task count badge (for mobile) */}
                {dayTasks.length > 0 && (
                  <div className="absolute top-1 right-1 sm:hidden">
                    <div className="w-5 h-5 rounded-full bg-pink2 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">
                        {dayTasks.length}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          </div>
        </div>
      )}

      {/* Legend & Statistics */}
      {hasAnyTasks && tasksWithDates > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 sm:px-6 py-3 bg-gray3 border-t border-gray4/30"
        >
          <div className="flex flex-col gap-3">
            {/* Top row: Priority + Task Type */}
            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
              {/* Priority Legend */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-white2 font-semibold">Priority:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#DC5091" }} />
                  <span className="text-white2">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#BF7E1C" }} />
                  <span className="text-white2">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#0EC359" }} />
                  <span className="text-white2">Low</span>
                </div>
              </div>
              
              {/* Task Type Legend */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-white2 font-semibold">Type:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded border border-gray4 bg-gray4/50" />
                  <span className="text-white2">Date</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-3 rounded border-2 border-dashed border-white2 bg-gray4/30" />
                  <span className="text-white2">⏰ Due Date</span>
                </div>
              </div>
            </div>
            
            {/* Bottom row: Statistics + Hints */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Task Statistics */}
              <div className="flex items-center gap-2">
                <span className="text-white2">
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"} total
                </span>
                <span className="text-gray4">•</span>
                <span className="text-white2">
                  {Object.keys(tasksByDate).length} {Object.keys(tasksByDate).length === 1 ? "day" : "days"} scheduled
                </span>
              </div>
              
              {/* Interaction hint */}
              <div className="text-white2 opacity-75">
                💡 Click task to open • "+X more" for all
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Day Tasks Modal */}
      <DayTasksModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dateStr={selectedDate}
        tasks={tasksByDate[selectedDate] || []}
        onOpenTask={handleTaskClick}
      />
    </div>
  );
};

export default SheetCalendar;
