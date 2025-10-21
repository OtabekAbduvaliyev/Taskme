import React, { useState, useCallback, useContext, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axiosInstance from "../../../AxiosInctance/AxiosInctance";
import { AuthContext } from "../../../Auth/AuthContext";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { MdDragIndicator } from "react-icons/md";
import { IoAddCircleOutline } from "react-icons/io5";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import SheetTableItem from "./SheetsSmallComps/SheetTableItem";
import CustomModal from "./SheetsSmallComps/CustomModal";
import { IoMdChatbubbles } from "react-icons/io";
import AnimatedNoData from "./SheetsSmallComps/AnimatedNoData";
import swal from "sweetalert";
import { AnimatePresence, motion } from "framer-motion";
import DeleteConfirmationModal from "../../Modals/DeleteConfirmationModal";
import { Dropdown, Menu, Select, Switch } from "antd";
import { MdEdit, MdDelete } from "react-icons/md";
import TaskChatSidebar from "./SheetsSmallComps/TaskChatSidebar";
import dayjs from "dayjs";

const SheetTabel = ({
  tasks = [],
  isEditing,
  selectedTasks,
  setSelectedTasks,
  itemsPerPage,
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  deleteModalOpen,
  setDeleteModalOpen,
  handleMoveTask,
  filteredTasks,
  setFilteredTasks,
  isCreatingTask,
  taskRefetch, // <- new prop (optional) to call parent's refetch
  filtersOpen = false, // controlled by parent; parent renders the Filters button
  onToggleFilters, // optional toggle handler from parent
  filtersButtonRef = null, // ref to anchor portal to the parent Filters button (default null)
  allowCreate = true, // new: control whether the table renders its own create button
  onCreate = () => {}, // new: handler to open centralized create modal
  canEdit = true, // NEW: whether task columns are editable
}) => {
  // track which task ids are currently being deleted (shows UI & disables interactions)
  const [deletingTaskIds, setDeletingTaskIds] = useState([]);
  const { sheetId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [column, setColumn] = useState({
    key: "",
    type: "TEXT",
    sheetId,
    show: true,
  });
  const [taskList, setTaskList] = useState(tasks);
  const [columnOrder, setColumnOrder] = useState([]);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [lastSentTask, setLastSentTask] = useState(null);
  // track retries per task to avoid infinite retry loops on server errors
  const retryCountsRef = useRef({});
  const [columnContextMenu, setColumnContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    column: null,
  });
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [tasksToDelete, setTasksToDelete] = useState([]);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [chatTask, setChatTask] = useState(null);
  const token = localStorage.getItem("token");
  const { createColumn, dndOrdersTasks, dndOrdersColumns } = useContext(AuthContext);

  // localStorage key for Last Update column visibility
  const LAST_UPDATE_VISIBILITY_KEY = `lastUpdateColumn_${sheetId}_visible`;
  
  // State for Last Update column visibility (default: true)
  const [showLastUpdateColumn, setShowLastUpdateColumn] = useState(() => {
    const saved = localStorage.getItem(LAST_UPDATE_VISIBILITY_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Function to toggle Last Update column visibility
  const toggleLastUpdateColumn = useCallback(() => {
    setShowLastUpdateColumn(prev => {
      const newValue = !prev;
      localStorage.setItem(LAST_UPDATE_VISIBILITY_KEY, JSON.stringify(newValue));
      return newValue;
    });
  }, [LAST_UPDATE_VISIBILITY_KEY]);

  // New: queryClient to invalidate other sheet queries after updates
  const queryClient = useQueryClient();

  // Helper: derive select options from sheets.columns (same source as desktop table)
  const getColumnOptions = (key) => {
    if (!sheets?.columns || !key) return [];
    const lower = key.toLowerCase();
    const col = sheets.columns.find((c) => {
      if (!c) return false;
      const cKey = (c.key || "").toString().toLowerCase();
      const cName = (c.name || "").toString().toLowerCase();
      return cKey === lower || cName === lower;
    });
    const opts = col?.selects?.[0]?.options || [];
    return opts.map((o) => ({ value: o.name, label: o.name, bg: o.color || "#6B7280" }));
  };

  const builtinPriorityOptions = [
    { value: "Low", label: "Low", bg: "#0EC359" },
    { value: "Medium", label: "Medium", bg: "#BF7E1C" },
    { value: "High", label: "High", bg: "#DC5091" },
  ];

  // Mobile edit modal state (to behave like desktop inline edit)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTaskForModal, setEditingTaskForModal] = useState(null);
  const [isSavingModalTask, setIsSavingModalTask] = useState(false);

  // --- Mobile edit helpers (open/close/update/save) ---
  const openEditModal = (task) => {
    // derive available options (use same source as desktop)
    const statusOptions = getColumnOptions("status");
    const priorityOptions = getColumnOptions("priority").length
      ? getColumnOptions("priority")
      : builtinPriorityOptions;

    const defaultStatus = task?.status || statusOptions[0]?.value || "";
    const defaultPriority = task?.priority || priorityOptions[0]?.value || "";

    setEditingTaskForModal({
      ...task,
      status: defaultStatus,
      priority: defaultPriority,
    });
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTaskForModal(null);
  };
  const handleModalFieldChange = (field, value) => {
    setEditingTaskForModal((prev) => ({ ...prev, [field]: value }));
  };
  const saveModalTask = async () => {
    if (!editingTaskForModal) return;
    setIsSavingModalTask(true);
    try {
      const payload = { ...editingTaskForModal };
      // normalize members to ids if necessary
      if (Array.isArray(payload.members) && payload.members.length && payload.members[0]?.id) {
        payload.members = payload.members.map((m) => m.id);
      }
      await axiosInstance.patch(`/task/${payload.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // update local list like desktop inline save
      setFilteredTasks((prev) => prev.map((t) => (t.id === payload.id ? { ...t, ...editingTaskForModal } : t)));
      closeEditModal();
    } catch (e) {
      console.error("Error saving task (mobile modal):", e);
    }
    setIsSavingModalTask(false);
  };
  // --- end mobile edit helpers ---

  // Mobile detection to switch to a compact card/list layout
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const {
    isLoading,
    error,
    data: sheets,
    refetch,
  } = useQuery({
    queryKey: ["sheets", sheetId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/sheet/${sheetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 300000,
  });

  // derive visible columns (preserve server order, only include those with show===true)
  const visibleColumns = Array.isArray(sheets?.columns)
    ? sheets.columns.filter((c) => c && c.show)
    : [];

  useEffect(() => {
    if (tasks) {
      // Keep the original order as received from the server (do not sort by `order`)
      setTaskList(Array.isArray(tasks) ? [...tasks] : []);
    }
    if (sheets?.columns) {
      setColumnOrder(sheets.columns.map((_, index) => index));
    }
  }, [tasks, sheets]);
  // Refresh helper: invalidate sheet/columns and refetch sheet details
  const refreshSheetColumns = React.useCallback(async () => {
    try {
      // prefer invalidation so all components using ["sheets", sheetId] re-query
      await queryClient.invalidateQueries(["sheets", sheetId]);
      // also call local refetch to update this component immediately
      try { await refetch(); } catch (_) {}
    } catch (e) {
      // ignore
    }
  }, [queryClient, sheetId, refetch]);

  // New: track column ids currently updating to disable their switches
  const [updatingColumnIds, setUpdatingColumnIds] = useState([]);

  // New: dropdown positioning for the filters portal (was missing)
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 8, width: 300 });
  // portal ref (optional) - used for outside click detection already handled by parent
  const filtersPortalRef = useRef(null);

  // Toggle a column's `show` boolean and update server, with optimistic UI loading per-column
  const toggleColumnShow = useCallback(
    async (column) => {
      if (!column || !column.id) return;
      const cid = column.id;
      setUpdatingColumnIds((prev) => [...new Set([...prev, cid])]);
      try {
        const putData = {
          name: column.name || column.key || "",
          show: !column.show,
          type: column.type || "TEXT",
          selectedId: cid,
        };
        await axiosInstance.put(`/column/${cid}`, putData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Invalidate queries so the latest sheet/columns are fetched.
        // Use queryClient.invalidateQueries instead of calling refetch here
        // to avoid referencing refetch before it's initialized.
        await queryClient.invalidateQueries(["sheets", sheetId]);
        await queryClient.invalidateQueries(["sheets"]);
      } catch (err) {
        console.error("Error updating column show:", err);
      } finally {
        setUpdatingColumnIds((prev) => prev.filter((id) => id !== cid));
      }
    },
    [queryClient, token, sheetId]
  );

  // compute portal position when filtersOpen opens; anchor to filtersButtonRef
  useEffect(() => {
    if (!filtersOpen || !(filtersButtonRef && filtersButtonRef.current)) return;
    const computePos = () => {
      const rect = filtersButtonRef.current.getBoundingClientRect();
      const top = rect.bottom + 8 + window.scrollY;
      const width = Math.min(420, Math.max(260, window.innerWidth < 768 ? window.innerWidth * 0.9 : 300));
      // anchor left to rect.left on narrow, align right edge with button on large
      let left;
      if (window.innerWidth < 1024) {
        left = rect.left;
      } else {
        left = rect.right - width;
      }
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setDropdownStyle({ top, left, width });
    };
    computePos();
    window.addEventListener("resize", computePos);
    window.addEventListener("scroll", computePos, true);
    return () => {
      window.removeEventListener("resize", computePos);
      window.removeEventListener("scroll", computePos, true);
    };
  }, [filtersOpen, filtersButtonRef]);

  // Define filtersPanel so return can reference it safely
  const filtersPanel = filtersOpen ? (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        ref={filtersPortalRef}
        style={{
          position: "fixed",
          top: dropdownStyle.top,
          left: dropdownStyle.left,
          width: dropdownStyle.width,
          zIndex: 80, // Lower than modals (which are usually 1100+)
        }}
      >
        <div className="bg-black rounded-xl shadow-lg border border-[#2A2A2A] overflow-hidden" style={{ width: "100%" }}>
          <div className="p-3">
            <div className="text-white font-semibold mb-2">Columns</div>
            <div className="max-h-64 overflow-auto custom-scrollbar">
              {/* Dynamic columns from database */}
              {!sheets?.columns?.length ? (
                <div className="text-gray4 text-sm">No columns</div>
              ) : (
                sheets.columns.map((col) => (
                  <div key={col.id} className="flex items-center justify-between py-2">
                    <div className="text-sm text-white truncate mr-2">{col.name || col.key}</div>
                    <div>
                      <Switch
                        className="custom-pink-switch"
                        checked={!!col.show}
                        loading={updatingColumnIds.includes(col.id)}
                        onChange={() => toggleColumnShow(col)}
                        size="small"
                      />
                    </div>
                  </div>
                ))
              )}
              
              {/* Separator for default columns */}
              {sheets?.columns?.length > 0 && (
                <div className="border-t border-[#2A2A2A] my-2"></div>
              )}
              
              {/* Default columns section */}
              <div className="text-gray4 text-xs mb-2 uppercase tracking-wide">Default Columns</div>
              
              {/* Files column (always visible) */}
              <div className="flex items-center justify-between py-2">
                <div className="text-sm text-white truncate mr-2">Files</div>
                <div title="Files column is always visible">
                  <Switch
                    className="custom-pink-switch"
                    checked={true}
                    disabled={true}
                    size="small"
                  />
                </div>
              </div>
              
              {/* Last Update column (controllable via localStorage) */}
              <div className="flex items-center justify-between py-2">
                <div className="text-sm text-white truncate mr-2">Last Update</div>
                <div title="Toggle Last Update column visibility (saved locally)">
                  <Switch
                    className="custom-pink-switch"
                    checked={showLastUpdateColumn}
                    onChange={toggleLastUpdateColumn}
                    size="small"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  ) : null;
  // Handle task reordering (drag and drop)
  const handleOnDragEnd = useCallback(
    (result) => {
      const { source, destination, type } = result;

      if (!destination) return; // No destination means no movement

      if (type === "TASK") {
        // Handle task reordering
        const reorderedTasks = Array.from(filteredTasks);
        const [movedTask] = reorderedTasks.splice(source.index, 1);
        reorderedTasks.splice(destination.index, 0, movedTask);

        // Update order property locally
        const reorderedWithOrder = reorderedTasks.map((task, idx) => ({
          ...task,
          order: idx + 1,
        }));

        setFilteredTasks(reorderedWithOrder);

        const taskIds = reorderedWithOrder.map((task) => task.id);
        const orders = reorderedWithOrder.map((task) => task.order);

        const resultData = { taskId: taskIds, orders };
        dndOrdersTasks(resultData);
      } else if (type === "COLUMN") {
        // Handle column reordering:
        // - source.index/destination.index are indices among visibleColumns,
        // - compute moved column from visibleColumns, then reorder full sheets.columns array accordingly.
        try {
          const visible = visibleColumns;
          const movedColumn = visible?.[source.index];
          if (!movedColumn) return;

          // start from the full columns list and remove the moved column
          let newColumns = (Array.isArray(sheets?.columns) ? sheets.columns.slice() : []).filter(
            (c) => c && c.id !== movedColumn.id
          );

          // Determine insertion point by the destination visible column
          const destinationVisible = visible?.[destination.index];
          if (destinationVisible) {
            const destIndexAll = newColumns.findIndex((c) => c.id === destinationVisible.id);
            if (destIndexAll === -1) {
              newColumns.push(movedColumn);
            } else {
              newColumns.splice(destIndexAll, 0, movedColumn);
            }
          } else {
            // fallback: append at end
            newColumns.push(movedColumn);
          }

          // optimistic local update
          setColumnOrder(newColumns.map((_, idx) => idx));
          // update local sheets.columns for immediate UI
          if (sheets) sheets.columns = newColumns;

          // prepare payload and call API to persist new order
          const columnIds = newColumns.map((c) => c.id);
          const orders = newColumns.map((_, idx) => idx + 1);
          const payload = { columnIds, orders };
          // call context API and invalidate queries afterwards
          (async () => {
            try {
              await dndOrdersColumns(payload);
              await queryClient.invalidateQueries(["sheets", sheetId]);
              await queryClient.invalidateQueries(["sheets"]);
            } catch (err) {
              // on error, refetch to restore server state
              await queryClient.invalidateQueries(["sheets", sheetId]);
            }
          })();
        } catch (e) {
          console.error("Error handling column reorder:", e);
        }
       }
    },
    [filteredTasks, sheets, dndOrdersTasks, dndOrdersColumns, visibleColumns, queryClient, sheetId]
  );

  // Handle task changes
  const handleColumnChange = (taskId, taskKey, value) => {
    // Always update local UI immediately so typing/partial values are preserved.
    setFilteredTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, [taskKey]: value } : task
      )
    );
    // Ensure autosave effect targets this task
    setEditingTaskId(taskId);
  };

  // Debounced autosave with retry limit to avoid infinite retry loop on errors
  useEffect(() => {
    if (!editingTaskId) return;

    // debounce delay (ms)
    const DELAY = 800;
    // max attempts before giving up (treat as attempted to avoid infinite loop)
    const MAX_RETRIES = 5;

    let mounted = true;
    const handler = setTimeout(async () => {
      if (!mounted) return;
      const editedTask = filteredTasks.find((task) => task.id === editingTaskId);
      if (!editedTask) return;

      const memberfixedtask = {
        ...editedTask,
        members: Array.isArray(editedTask.members)
          ? editedTask.members.map((member) => member.id)
          : [],
      };
      const currentTaskString = JSON.stringify(memberfixedtask);
      if (currentTaskString === lastSentTask) return; // nothing new to send

      try {
        await axiosInstance.patch(`/task/${editingTaskId}`, memberfixedtask, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // success -> mark as sent and reset retry count
        setLastSentTask(currentTaskString);
        retryCountsRef.current[editingTaskId] = 0;
      } catch (err) {
        console.error("Error updating task:", err);
        // increment retry count
        const prev = retryCountsRef.current[editingTaskId] || 0;
        retryCountsRef.current[editingTaskId] = prev + 1;
        // if reached max retries, mark as "attempted" to avoid continuous loop
        if (retryCountsRef.current[editingTaskId] >= MAX_RETRIES) {
          // avoid infinite retries: treat as last-sent to stop further attempts
          setLastSentTask(currentTaskString);
          // optionally: notify user or set an error flag here
        }
      }
    }, DELAY);

    return () => {
      mounted = false;
      clearTimeout(handler);
    };
  }, [editingTaskId, filteredTasks, token, lastSentTask]);

  // Modal logic for adding a new column
  const handleToggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [isOpen]);

  const handleOk = async () => {
    if (!column.type || !column.name) {
      swal({
        title: "Error !",
        text: `Please fill all required fields (name, type)`,
        icon: "error",
        button: "close",
      });
      return;
    }
    if (column.id) {
      // Edit column
      const putData = {
        name: column.name,
        show: column.show ?? true,
        type: column.type,
        selectedId: column.id,
      };
      await axiosInstance.put(`/column/${column.id}`, putData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      // Create column
      await createColumn({ ...column, sheetId });
    }
    refetch();
    handleToggleModal();
    setColumn({ key: "", type: "TEXT", sheetId, show: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setColumn((prevColumn) => ({
      ...prevColumn,
      [name]: value,
    }));
  };

  // Handle task selection
  const handleTaskSelect = (taskId) => {
    setSelectedTasks((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      }
      return [...prev, taskId];
    });
  };

  // Handle select all tasks
  const handleSelectAllTasks = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map((task) => task.id));
    }
  };

  // Server-side pagination: the parent provides filteredTasks already paginated.
  // Use tasksToRender directly (no client-side slicing).
  const tasksToRender = filteredTasks || [];

  // Do not sort tasks here — render in the order provided by the server/parent
  const sortedTasksToRender = Array.isArray(tasksToRender) ? [...tasksToRender] : [];

  // Modified function to handle task deletion without page reload

  // Task delete handler
  const handleDeleteTasks = () => {
    setTasksToDelete(selectedTasks);
    setIsDeleteTaskModalOpen(true);
  };

  const confirmDeleteTasks = async () => {
    if (!tasksToDelete.length) return;
    try {
      // mark as deleting immediately for UI feedback
      setDeletingTaskIds(prev => [...new Set([...prev, ...tasksToDelete])]);

      // Use bulk delete endpoint
      await axiosInstance.post(
        "/task/bulk-delete",
        { taskIds: tasksToDelete },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove deleted tasks from filteredTasks
      setFilteredTasks((prev) =>
        prev.filter((task) => !tasksToDelete.includes(task.id))
      );
      setSelectedTasks([]);
      // attempt to refresh server-side pagination / data in parent if provided
      try { if (typeof taskRefetch === "function") await taskRefetch(); } catch (_) { }
    } catch (err) {
      console.error("Bulk delete tasks error:", err);
    }
    // clean up deleting state
    setDeletingTaskIds(prev => prev.filter(id => !tasksToDelete.includes(id)));
    setIsDeleteTaskModalOpen(false);
    setTasksToDelete([]);
  };

  // Column edit/delete handlers
  const handleEditColumn = (column) => {
    setIsOpen(true);
    setColumn({ ...column });
  };

  const handleDeleteColumn = (column) => {
    setColumnToDelete(column);
    setIsDeleteColumnModalOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (!columnToDelete) return;
    await axiosInstance.delete(`/column/${columnToDelete.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setIsDeleteColumnModalOpen(false);
    setColumnToDelete(null);
    refetch();
  };

  // Dropdown menu for columns
  const getColumnMenu = (column) => (
    <Menu>
      <Menu.Item
        key="edit"
        icon={<MdEdit />}
        onClick={() => handleEditColumn(column)}
      >
        Edit
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<MdDelete />}
        onClick={() => handleDeleteColumn(column)}
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  // Handler to open chat sidebar
  const handleOpenChatSidebar = (task) => {
    setChatTask(task);
    setChatSidebarOpen(true);
  };

  // Handler to close chat sidebar
  const handleCloseChatSidebar = () => {
    setChatSidebarOpen(false);
    setChatTask(null);
  };

  // Track the last created task id to autofocus
  const lastCreatedTaskIdRef = useRef(null);
  // Ensure we only auto-focus once (cleared after consumed) to avoid stealing focus during searches
  const autoFocusConsumedRef = useRef(false);

  useEffect(() => {
    if (isCreatingTask === false && filteredTasks.length > 0) {
      // Find the newest task (assuming sorted newest first)
      lastCreatedTaskIdRef.current = filteredTasks[0]?.id;
      autoFocusConsumedRef.current = false; // mark available for consumption
    }
  }, [isCreatingTask, filteredTasks]);

  // When the first task equals the last-created id, mark autofocus consumed shortly after rendering.
  // This prevents autofocus from retriggering on unrelated re-renders (search, filters).
  useEffect(() => {
    const firstId = filteredTasks?.[0]?.id;
    if (!firstId || !lastCreatedTaskIdRef.current) return;
    if (firstId === lastCreatedTaskIdRef.current && !autoFocusConsumedRef.current) {
      // give child a small window to focus, then mark consumed
      const t = setTimeout(() => {
        autoFocusConsumedRef.current = true;
        lastCreatedTaskIdRef.current = null;
      }, 350);
      return () => clearTimeout(t);
    }
  }, [filteredTasks]);

  // Add this effect to close the filters dropdown when clicking outside
  useEffect(() => {
    if (!filtersOpen) return;
    function handleClickOutside(event) {
      // If the dropdown or the button is not mounted, do nothing
      if (!filtersPortalRef.current || !filtersButtonRef?.current) return;
      // If click is inside the dropdown or the button, do nothing
      if (
        filtersPortalRef.current.contains(event.target) ||
        filtersButtonRef.current.contains(event.target)
      ) {
        return;
      }
      // Otherwise, close the dropdown
      if (typeof onToggleFilters === "function") onToggleFilters(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filtersOpen, filtersButtonRef, onToggleFilters]);

  if (isLoading) {
    return (
      <div className="mt-[26px]">
        <div className="animate-pulse bg-grayDash rounded-[12px] h-[400px] flex items-center justify-center">
          <div className="text-gray4 text-[20px] font-radioCanada">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-[26px] custom-scrollbar">
        <div className="bg-grayDash rounded-[12px] font-radioCanada">
          <AnimatedNoData message="No Data" />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* inject tiny css override so antd Switch uses main pink color when checked */}
      <style>{`
       .custom-pink-switch .ant-switch-checked {
         background-color: #DC5091 !important;
         border-color: #DC5091 !important;
       }
       .custom-pink-switch .ant-switch-checked:focus {
         box-shadow: 0 0 0 4px rgba(220,80,145,0.12) !important;
       }
     `}</style>
      {/* render portal into root so layout isn't affected */}
      {filtersPanel && ReactDOM.createPortal(filtersPanel, (typeof document !== "undefined" && document.getElementById("root")) || document.body)}
      {/* Delete Confirmation Modal for columns */}
      <DeleteConfirmationModal
        isOpen={isDeleteColumnModalOpen}
        onClose={() => {
          setIsDeleteColumnModalOpen(false);
          setColumnToDelete(null);
        }}
        onDelete={confirmDeleteColumn}
        title="Delete Column"
        message="Are you sure you want to delete this column? This action cannot be undone."
      />
      {/* Delete Confirmation Modal for tasks */}
      {isDeleteTaskModalOpen && (
        (() => {
          const modalIsDeleting = tasksToDelete.some(id => deletingTaskIds.includes(id));
          return (
            <DeleteConfirmationModal
              isOpen={isDeleteTaskModalOpen}
              onClose={() => {
                if (modalIsDeleting) return; // prevent closing while deleting
                setIsDeleteTaskModalOpen(false);
                setTasksToDelete([]);
              }}
              onDelete={confirmDeleteTasks}
              title="Delete Task(s)"
              message="Are you sure you want to delete the selected task(s)? This action cannot be undone."
              isLoading={modalIsDeleting}
            />
          );
        })()
      )}
      <CustomModal
        isOpen={isOpen}
        handleToggleModal={handleToggleModal}
        column={column}
        isEditing={!!column.id}
        handleChange={handleChange}
        handleOk={handleOk}
      />

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="w-full">
          {isMobile ? (
            // Mobile: chat-like dark card/F (single-line title+badges, actions on right)
            <div className="space-y-3 p-2">
              {sortedTasksToRender.map((task) => (
                <div
                  key={task.id}
                  data-task-id={task.id}
                  // restore original base + hover pair: base=#23272F, hover=#2A2D36
                  className="bg-[#23272F] border border-[#2A2D36] rounded-lg p-3 flex items-start justify-between gap-3 hover:bg-[#2A2D36] transition-colors"
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Order badge */}
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-[#1F1F1F] text-sm font-semibold text-gray4 shrink-0">
                      {typeof task.order !== "undefined" ? task.order : "-"}
                    </div>

                    {/* checkbox styled like desktop for consistency */}
                    <label className="relative flex items-center cursor-pointer select-none shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleTaskSelect(task.id);
                        }}
                        className="peer appearance-none w-5 h-5 m-0 p-0 absolute opacity-0 cursor-pointer"
                        style={{ zIndex: 2 }}
                      />
                      <span
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-150 ${selectedTasks.includes(task.id) ? "bg-pink2 border-pink2" : "bg-[#353847] border-[#3A3A3A]"} peer-focus:ring-2 peer-focus:ring-pink2`}
                        style={{ zIndex: 1 }}
                      >
                        {selectedTasks.includes(task.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </label>

                    {/* Content: single-line header with title + badges, then status row */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Title (truncates) */}
                          <div className="text-white font-medium text-sm truncate">
                            {task.name || "Untitled"}
                          </div>

                          {/* Inline badges (priority + price) — will move to next line if space is tight */}
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {task.priority && (
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-semibold text-white flex items-center"
                                style={{
                                  background:
                                    task.priority === "High"
                                      ? "#DC5091"
                                      : task.priority === "Medium"
                                        ? "#BF7E1C"
                                        : "#0EC359",
                                }}
                              >
                                {task.priority}
                              </span>
                            )}
                            {typeof task.price !== "undefined" && (
                              <span className="text-pink2 font-bold text-sm whitespace-nowrap">
                                ${task.price}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions (chat/edit/delete) — pinned to right */}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChatSidebar(task);
                            }}
                            className="text-gray4 p-1 rounded hover:text-white"
                            aria-label="Chat"
                          >
                            <IoMdChatbubbles size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(task);
                            }}
                            className="text-gray4 p-1 rounded hover:text-white"
                            title="Edit"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTasksToDelete([task.id]);
                              setIsDeleteTaskModalOpen(true);
                            }}
                            className="text-red-500 p-1 rounded hover:text-red-400"
                            title="Delete"
                            disabled={deletingTaskIds.includes(task.id)}
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Status / subtitle row (muted) */}
                      {task.status && (
                        <div className="text-xs text-gray4 mt-2 truncate">
                          {task.status}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Mobile Edit Task Modal (dark background like chat) */}
              {isEditModalOpen && editingTaskForModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/40" onClick={closeEditModal} />
                  <div className="relative w-full max-w-md bg-[#23272F] rounded-lg shadow-lg p-5 z-10 border border-[#2A2D36]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white">Edit Task</h3>
                      <button onClick={closeEditModal} className="text-gray4">✕</button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray4">Name</label>
                        <input
                          value={editingTaskForModal.name || ""}
                          onChange={(e) => handleModalFieldChange("name", e.target.value)}
                          className="mt-1 w-full bg-[#2A2D36] border border-[#353847] rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray4">Status</label>
                        <Select
                          value={editingTaskForModal.status}
                          onChange={(value) => handleModalFieldChange("status", value)}
                          className="mt-1 w-full h-[38px] rounded-md bg-[#2A2D36] text-white border border-[#353847] px-2"
                          dropdownMatchSelectWidth={false}
                          dropdownClassName="custom-select-dropdown bg-[#23272F] rounded-md"
                          getPopupContainer={(trigger) => trigger.parentElement}
                        >
                          {getColumnOptions("status").map((opt) => (
                            <Select.Option key={opt.value} value={opt.value}>
                              <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
                                <span style={{ width: 10, height: 10, borderRadius: 4, background: opt.bg }} />
                                <span>{opt.label}</span>
                              </span>
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray4">Priority</label>
                        <Select
                          value={editingTaskForModal.priority}
                          onChange={(value) => handleModalFieldChange("priority", value)}
                          className="mt-1 w-full h-[38px] rounded-md bg-[#2A2D36] text-white border border-[#353847] px-2"
                          dropdownMatchSelectWidth={false}
                          dropdownClassName="custom-select-dropdown bg-[#23272F] rounded-md"
                          getPopupContainer={(trigger) => trigger.parentElement}
                        >
                          {(getColumnOptions("priority").length ? getColumnOptions("priority") : builtinPriorityOptions).map(opt => (
                            <Select.Option key={opt.value} value={opt.value}>
                              <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
                                <span style={{ width: 10, height: 10, borderRadius: 4, background: opt.bg }} />
                                <span>{opt.label}</span>
                              </span>
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-gray4">Price</label>
                        <input
                          type="number"
                          value={editingTaskForModal.price || 0}
                          onChange={(e) => handleModalFieldChange("price", Number(e.target.value))}
                          className="mt-1 w-full bg-[#2A2D36] border border-[#353847] rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray4">Link</label>
                        <input
                          value={editingTaskForModal.link || ""}
                          onChange={(e) => handleModalFieldChange("link", e.target.value)}
                          className="mt-1 w-full bg-[#2A2D36] border border-[#353847] rounded px-3 py-2 text-white"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button className="px-4 py-2 rounded bg-[#2A2D36] text-gray4" onClick={closeEditModal}>Cancel</button>
                        <button className={`px-4 py-2 rounded bg-pink2 text-white ${isSavingModalTask ? "opacity-50 cursor-not-allowed" : "hover:shadow"}`} onClick={saveModalTask} disabled={isSavingModalTask}>
                          {isSavingModalTask ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Desktop/tablet: original table (unchanged)
            <div className="w-full overflow-x-auto sm:overflow-x-visible">
              <table className="bg-grayDash font-radioCanada w-full min-w-max">
                <thead className="border-1 text-white">
                  <tr className="flex border-[black] border-b">
                    {/* Sticky checkbox header cell */}
                    <td
                      className="w-[44px] sm:w-[48px] py-[12px] sm:py-[16px] px-[8px] sm:px-[11px] flex items-center justify-center border-r border-r-[black] cursor-pointer bg-grayDash sticky left-0 z-30 top-0"
                      onClick={handleSelectAllTasks}
                    >
                      <label className="relative flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={
                            selectedTasks.length === filteredTasks.length
                          }
                          readOnly
                          className="peer appearance-none w-5 h-5 m-0 p-0 absolute opacity-0 cursor-pointer"
                          style={{ zIndex: 2 }}
                        />
                        <span
                          className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        transition-colors duration-150
                        ${selectedTasks.length === filteredTasks.length
                              ? "bg-pink2 border-pink2"
                              : "bg-[#23272F] border-gray4"
                            } peer-focus:ring-2 peer-focus:ring-pink2
                      `}
                          style={{ zIndex: 1 }}
                        >
                          {selectedTasks.length === filteredTasks.length && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                      </label>
                    </td>
                    {/* Draggable Columns + Sticky Add Button */}
                    <td className="flex-grow">
                      <Droppable
                        droppableId="droppableColumns"
                        direction="horizontal"
                        type="COLUMN"
                      >
                        {(provided) => (
                          <div
                            className="flex relative"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {visibleColumns.map((column, vIndex) => {
                              // vIndex is the index among visible columns (0..n-1)
                              const isFirstVisible = vIndex === 0;
                              return (
                                <Draggable
                                  key={column.id}
                                  draggableId={`column-${column.id}`}
                                  index={vIndex}
                                >
                                  {(provided) => (
                                    <Dropdown
                                      overlay={getColumnMenu(column)}
                                      trigger={["contextMenu"]}
                                      placement="bottomLeft"
                                    >
                                      <div
                                        className={`w-[140px] sm:w-[160px] md:w-[180px] flex items-center justify-between py-[12px] sm:py-[16px] border-r border-[black] px-[8px] sm:px-[11px] hide
                                        ${isFirstVisible ? "sticky left-[44px] sm:left-[48px] bg-grayDash top-0 z-20" : ""}`}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        {column.name}
                                        <MdDragIndicator className="text-gray4 cursor-grab" />
                                      </div>
                                    </Dropdown>
                                  )}
                                </Draggable>
                              );
                            })}

                            {provided.placeholder}

                            {/* Files header (new default column before Last update) */}
                            <div className="w-[140px] sm:w-[160px] md:w-[180px] flex items-center justify-between py-[12px] sm:py-[16px] border-r border-[black] px-[8px] sm:px-[11px] bg-grayDash">
                              <span className="text-white font-semibold">Files</span>
                            </div>

                            {/* Last update header (conditional based on localStorage) */}
                            {showLastUpdateColumn && (
                              <div className="w-[180px] sm:w-[180px] flex items-center justify-between py-[12px] sm:py-[16px] border-r border-[black] px-[8px] sm:px-[11px] bg-grayDash">
                                <span className="text-white font-semibold">Last update</span>
                              </div>
                            )}

                            {/* Sticky Add Button */}
                            <div
                              className="w-[44px] sm:w-[50px] flex items-end justify-center py-[12px] sm:py-[16px] border-r border-[black] px-[8px] sm:px-[11px] cursor-pointer bg-grayDash sticky right-0 top-0"
                              onClick={handleToggleModal}
                              role="button"
                              aria-disabled={!allowCreate}
                            >
                              <IoAddCircleOutline className={`text-[18px] sm:text-[20px] ${allowCreate ? 'text-gray4' : 'text-gray4/60 pointer-events-none'}`} />
                            </div>
                          </div>
                        )}
                      </Droppable>
                    </td>
                  </tr>
                </thead>

                <Droppable droppableId="droppable" direction="vertical" type="TASK">
                  {(provided) => (
                    <tbody ref={provided.innerRef} {...provided.droppableProps}>
                      {sortedTasksToRender?.map((task, index) => (
                        <tr 
                          key={task.id} 
                          data-task-id={task.id}
                          className="flex border-b border-black"
                        >
                          <SheetTableItem
                            task={task}
                            columns={visibleColumns}
                            index={index}
                            isSelected={selectedTasks.includes(task.id)}
                            onSelect={handleTaskSelect}
                            onEdit={() => setEditingTaskId(task.id)}
                            onChange={handleColumnChange}
                            onOptionsChange={refreshSheetColumns} // <-- new prop
                            stickyFirstThreeColumns
                            onOpenChat={() => handleOpenChatSidebar(task)}
                            autoFocus={
                              task.id === lastCreatedTaskIdRef.current &&
                              index === 0 &&
                              !autoFocusConsumedRef.current
                            }
                            isDeleting={deletingTaskIds.includes(task.id)}
                            showLastUpdateColumn={showLastUpdateColumn}
                            canEdit={canEdit} // NEW: pass down edit permission
                          />
                        </tr>
                      ))} 
                      {provided.placeholder}
                    </tbody>
                  )}
                </Droppable>
              </table>
            </div>
          )}
        </div>
      </DragDropContext>
      {/* Chat Sidebar */}
      <TaskChatSidebar
        isOpen={chatSidebarOpen}
        onClose={handleCloseChatSidebar}
        task={chatTask}
        initialMembers={chatTask?.members || []}
      />
    </div>
  );
};

export default SheetTabel;