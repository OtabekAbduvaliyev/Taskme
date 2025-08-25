import { Input, Select } from "antd";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { FaUserSlash } from "react-icons/fa";
import Selects from "../Selects";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Draggable } from "react-beautiful-dnd";
import { AuthContext } from "../../../../Auth/AuthContext";
import { useRef, useEffect, useState, useContext } from "react";
import testMemImg from "../../../../assets/default-avatar-icon-of-social-media-user-vector.jpg"
import { IoMdChatbubbles } from "react-icons/io";
import axiosInstance from "../../../../AxiosInctance/AxiosInctance";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import InviteMemberModal from "../../../Modals/InviteMemberModal";
import { SketchPicker } from "react-color";
import ReactDOM from "react-dom";
import { FaRegFileAlt } from "react-icons/fa";
import DeleteConfirmationModal from "../../../Modals/DeleteConfirmationModal";
import dayjs from "dayjs";
import { DatePicker as AntdDatePicker } from "antd";
const { RangePicker: AntdRangePicker } = AntdDatePicker;

const SheetTableItem = ({
  task,
  columns,
  onChange,
  onEdit,
  onOptionsChange, // <-- new prop
  index,
  isSelected,
  onSelect,
  onOpenChat, // <-- new prop to open chat sidebar for this task
  stickyFirstThreeColumns,
  autoFocus, // <-- new prop
  isDeleting = false, // new prop to indicate deletion in progress
  showLastUpdateColumn = true, // new prop: whether to show last update column
}) => {
  const handleInputChange = (taskKey, e) => {
    const key = String(taskKey).toLowerCase();

    // Numeric-ish fields
    if (
      ["price", "order", "number1", "number2", "number3", "number4", "number5"].includes(
        key
      )
    ) {
      const raw = e?.target?.value;
      const num = parseFloat(raw);
      onChange(task.id, taskKey, isNaN(num) ? 0 : num);
      return;
    }

    // Single date fields -> send ISO datetime string (e.g. 2025-08-23T14:30:00.000Z)
    if (/^date[1-5]$/i.test(key)) {
      const toIso = (val) => {
        if (!val) return "";
        try {
          if (typeof val.toISOString === "function") return val.toISOString();
          return dayjs(val).toISOString();
        } catch {
          try { return new Date(val).toISOString(); } catch { return ""; }
        }
      };
      const value = e && typeof e === "object" ? toIso(e) : "";
      onChange(task.id, taskKey, value);
      return;
    }

    // Duedate fields (single "duedate" or numbered duedate1..5) -> always send array ["isoStart","isoEnd"]
    if (/^duedate(?:[1-5])?$/i.test(key)) {
      let value;
      if (Array.isArray(e) && e.length === 2) {
        const toIso = (val) => {
          if (!val) return "";
          try {
            // prefer direct toISOString if available (Date/moment/dayjs)
            if (typeof val.toISOString === "function") return val.toISOString();
            // fallback to dayjs to produce ISO (handles moment/dayjs/string)
            return dayjs(val).toISOString();
          } catch {
            try { return new Date(val).toISOString(); } catch { return ""; }
          }
        };
        value = [toIso(e[0]), toIso(e[1])];
      } else {
        // cleared or invalid -> keep consistent array shape
        value = ["", ""];
      }
      onChange(task.id, taskKey, value);
      return;
    }

    // Link/website fields -> always send as array (single value array or empty array)
    if (["links", "website"].includes(key)) {
      // accept either event-like object or raw string
      const rawVal = e?.target?.value ?? (typeof e === "string" ? e : "");
      const arr = rawVal ? [rawVal] : [];
      onChange(task.id, taskKey, arr);
      return;
    }

    // Default: pass through value from input event (if any)
    const fallback = e?.target?.value ?? "";
    onChange(task.id, taskKey, fallback);
  };

  const { members: companyMembers, user } = useContext(AuthContext);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // State for add option modal
  const [addOptionModal, setAddOptionModal] = useState({
    open: false,
    columnKey: null,
    selectId: null,
  });
  const [addOptionName, setAddOptionName] = useState("");
  const [addOptionColor, setAddOptionColor] = useState("#801949");
  const [addingOption, setAddingOption] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);

  // State for manage options modal
  const [manageOptionsModal, setManageOptionsModal] = useState({
    open: false,
    columnKey: null,
    selectId: null,
    options: [],
  });
  const [editOptions, setEditOptions] = useState({});
  const [savingOptionId, setSavingOptionId] = useState(null);
  const [deletingOptionId, setDeletingOptionId] = useState(null);

  // State for file preview modal
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- NEW: local mirror of task.files so UI updates immediately ---
  const [localFiles, setLocalFiles] = useState(Array.isArray(task?.files) ? [...task.files] : []);

  useEffect(() => {
    setLocalFiles(Array.isArray(task?.files) ? [...task.files] : []);
  }, [task?.files]);

  // --- NEW: local mirror of task.members so UI updates immediately ---
  const [localMembers, setLocalMembers] = useState(Array.isArray(task?.members) ? [...task.members] : []);

  useEffect(() => {
    setLocalMembers(Array.isArray(task?.members) ? [...task.members] : []);
  }, [task?.members]);

  // Listen for member updates dispatched by other components
  useEffect(() => {
    const handler = (e) => {
      if (!e?.detail) return;
      const { taskId, members } = e.detail || {};
      if (!taskId || taskId !== task?.id) return;
      if (!Array.isArray(members)) return;
      setLocalMembers(members);
    };
    window.addEventListener("taskMembersUpdated", handler);
    return () => window.removeEventListener("taskMembersUpdated", handler);
  }, [task?.id]);

  // Ensure selectedFileIndex stays valid when localFiles changes
  useEffect(() => {
    if (selectedFileIndex >= (localFiles.length || 0)) {
      setSelectedFileIndex(Math.max(0, (localFiles.length || 1) - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFiles]);

  // Upload helpers (use same upload API as TaskChatSidebar)
  const UPLOAD_ENDPOINT = "task/upload";
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
  const formatMaxSize = () => "100 MB";

  // utility: format bytes (used in upload UI)
  const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i] || "B"}`;
  };

  // Upload queue: {id, file, preview, size, progress, status, error}
  const [uploadQueue, setUploadQueue] = useState([]);
  const [modalTab, setModalTab] = useState("preview"); // "preview" | "upload"

  // Cancel single upload (remove from queue and cancel request if running)
  const cancelUpload = (id) => {
    setUploadQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (!item) return prev;
      // cancel in-progress request
      if (item.cancelSource && typeof item.cancelSource.cancel === "function") {
        try { item.cancelSource.cancel("Upload cancelled by user"); } catch (_) { }
      }
      // revoke preview if present
      if (item.preview) {
        try { URL.revokeObjectURL(item.preview); } catch (_) { }
      }
      return prev.filter((q) => q.id !== id);
    });
  };

  const uploadSingle = async (item) => {
    // skip if already error/invalid or task missing
    if (!task?.id || item.status === "error") return;
    // create cancel token for this request
    const source = axios.CancelToken ? axios.CancelToken.source() : null;
    setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading", progress: 0, cancelSource: source } : q)));
    const form = new FormData();
    form.append("files", item.file);
    form.append("taskId", task.id);

    try {
      const token = localStorage.getItem("token");
      const res = await axiosInstance.post(UPLOAD_ENDPOINT, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        cancelToken: source?.token,
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q)));
        },
      });

      // get server-returned files (if API returns them) and notify parent/sidebar via event
      const returned = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.files)
          ? res.data.files
          : Array.isArray(res?.data)
            ? res.data
            : [];

      if (typeof window !== "undefined" && Array.isArray(returned) && returned.length > 0) {
        try {
          window.dispatchEvent(
            new CustomEvent("taskFilesUpdated", {
              detail: {
                taskId: task?.id || null,
                files: returned
              }
            })
          );
        } catch (e) {
          // ignore if CustomEvent not supported
        }
      }

      // --- NEW: merge returned files into localFiles for immediate UI update ---
      if (Array.isArray(returned) && returned.length) {
        setLocalFiles(prev => {
          const existingIds = new Set(prev.map(f => f.id));
          const newFiles = returned.filter(f => f && f.id && !existingIds.has(f.id));
          return newFiles.length ? [...newFiles, ...prev] : prev;
        });
      }

      // mark done and notify parent to refresh files
      setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done", progress: 100, cancelSource: undefined } : q)));
      if (typeof onEdit === "function") onEdit();
    } catch (err) {
      // If cancelled, we already handled removal in cancelUpload; otherwise mark as error
      if (axios.isCancel && axios.isCancel(err)) {
        // do nothing (cancelUpload already removed it)
      } else {
        setUploadQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: err?.message || "Upload failed", cancelSource: undefined } : q)));
      }
    } finally {
      setTimeout(() => {
        setUploadQueue((prev) => prev.filter((q) => q.id !== item.id || q.status !== "done"));
      }, 1200);
    }
  };

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length || !task?.id) return;
    const items = selected.map((file, idx) => {
      const id = `${Date.now()}_${idx}`;
      const isTooLarge = file.size > MAX_FILE_SIZE;
      return {
        id,
        file,
        preview: /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name) ? null : URL.createObjectURL(file),
        size: file.size,
        progress: 0,
        status: isTooLarge ? "error" : "queued",
        error: isTooLarge ? `File exceeds ${formatMaxSize()}` : undefined,
      };
    });
    setUploadQueue((prev) => [...items, ...prev]);
    e.target.value = "";
    for (const it of items) {
      if (it.status === "error") continue;
      if (!task?.id) break;
      /* eslint-disable no-await-in-loop */
      await uploadSingle(it);
      /* eslint-enable no-await-in-loop */
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const files = Array.from(e.dataTransfer.files || []);
    const fakeEvent = { target: { files } };
    handleFileChange(fakeEvent);
  };
  const handleDragOver = (e) => e.preventDefault();

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      uploadQueue.forEach((q) => {
        if (q.preview) URL.revokeObjectURL(q.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open modal and set selected members to current task members
  const handleOpenMemberModal = () => {
    setSelectedMemberIds((task?.members || []).map((m) => m.id));
    setShowMemberModal(true);
  };

  // Toggle member selection
  const handleToggleMember = (memberId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Save selected members to task
  const handleSaveMembers = async () => {
    if (!task?.id) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.patch(
        `/task/${task.id}`,
        { members: selectedMemberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // --- NEW: update localMembers immediately and notify other components ---
      const updatedMembers = (companyMembers || []).filter(m => selectedMemberIds.includes(m.id));
      setLocalMembers(updatedMembers);
      try {
        window.dispatchEvent(new CustomEvent("taskMembersUpdated", {
          detail: { taskId: task.id, members: updatedMembers }
        }));
      } catch (e) { /* ignore */ }

      setShowMemberModal(false);
    } catch {
      // Optionally show error
    }
    setIsSaving(false);
  };

  // Add option handler (modal)
  const handleAddOption = async () => {
    const { columnKey, selectId } = addOptionModal;
    if (!addOptionName.trim() || !selectId) return;
    setAddingOption((prev) => ({ ...prev, [columnKey]: true }));
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.post(
        "/option",
        { name: addOptionName, color: addOptionColor, selectId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      closeAddOptionModal();
      // refresh parent sheet/columns so select options reflect the new entry
      try { if (typeof onOptionsChange === "function") await onOptionsChange(); } catch (_) {}
      if (typeof onEdit === "function") onEdit();
    } catch (e) {
      // Optionally show error
    }
    setAddingOption((prev) => ({ ...prev, [columnKey]: false }));
  };

  const openAddOptionModal = (columnKey, selectId) => {
    setAddOptionModal({ open: true, columnKey, selectId });
    setAddOptionName("");
    setAddOptionColor("#801949");
    setShowColorPicker(false);
  };

  const closeAddOptionModal = () => {
    setAddOptionModal({ open: false, columnKey: null, selectId: null });
    setAddOptionName("");
    setAddOptionColor("#801949");
    setShowColorPicker(false);
  };

  // Open manage options modal
  const openManageOptionsModal = (columnKey, selectId, options) => {
    setManageOptionsModal({
      open: true,
      columnKey,
      selectId,
      options: options.map(opt => ({
        ...opt,
        editName: opt.name,
        editColor: opt.color || "#801949",
      })),
    });
    setEditOptions({});
    setSavingOptionId(null);
    setDeletingOptionId(null);
  };

  // Close manage options modal
  const closeManageOptionsModal = () => {
    setManageOptionsModal({
      open: false,
      columnKey: null,
      selectId: null,
      options: [],
    });
    setEditOptions({});
    setSavingOptionId(null);
    setDeletingOptionId(null);
  };

  // Handle edit in manage modal
  const handleEditOptionChange = (id, field, value) => {
    setManageOptionsModal(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.id === id ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  // Save option update
  const handleSaveOption = async (id, name, color) => {
    setSavingOptionId(id);
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.put(
        `/option/${id}`,
        { name, color },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      try { if (typeof onOptionsChange === "function") await onOptionsChange(); } catch (_) {}
      if (typeof onEdit === "function") onEdit();
    } catch { }
    setSavingOptionId(null);
  };

  // Delete option
  const handleDeleteOption = async (id) => {
    setDeletingOptionId(id);
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(
        `/option/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setManageOptionsModal(prev => ({
        ...prev,
        options: prev.options.filter(opt => opt.id !== id),
      }));
      try { if (typeof onOptionsChange === "function") await onOptionsChange(); } catch (_) {}
      if (typeof onEdit === "function") onEdit();
    } catch { }
    setDeletingOptionId(null);
  };

  // User info state
  const [userInfo, setUserInfo] = useState(null);

  // Map specific keys (status, etc.) to select options so they behave like priority
  const KEY_SELECT_OPTIONS = {
    status: [
      { value: "To Do", label: "To Do", bg: "#6B7280" },
      { value: "In Progress", label: "In Progress", bg: "#BF7E1C" },
      { value: "Done", label: "Done", bg: "#0EC359" },
    ],
    priority: [

    ]
    // add other keys here if you want mapped selects, e.g. stage, progress...
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axiosInstance.get("/user/info", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserInfo(res.data);
      } catch { }
    };
    fetchUserInfo();
  }, []);

  // --- NEW: ensure SELECT / priority fields get the first option when empty (run once per task) ---
  const initializedDefaultsRef = useRef(new Set());
  useEffect(() => {
    if (!task?.id || typeof onChange !== "function" || initializedDefaultsRef.current.has(task.id)) return;

    const updates = [];
    (columns || []).forEach((column) => {
      const colKey = String(column.key || "").toLowerCase();
      const colType = String(column.type || "").toUpperCase();

      // SELECT columns -> use first option.name if present
      if (colType === "SELECT") {
        const opts = column?.selects?.[0]?.options;
        if (Array.isArray(opts) && opts.length > 0) {
          const firstVal = opts[0].name ?? opts[0].value ?? "";
          if (firstVal && !task[colKey]) updates.push({ key: colKey, value: firstVal });
        }
      }


    });

    if (updates.length) {
      updates.forEach(u => onChange(task.id, u.key, u.value));
    }
    initializedDefaultsRef.current.add(task.id);
    // intentionally run when task id or columns change
  }, [task?.id, columns, onChange]);

  // Ref for first input
  const firstInputRef = useRef(null);

  // Run auto-focus/select only once per mounted item to avoid re-selecting on unrelated re-renders
  const hasAutoFocusedRef = useRef(false);
  useEffect(() => {
    if (!autoFocus || hasAutoFocusedRef.current || !firstInputRef.current) return;

    // Don't steal focus if the user is actively typing into another input/textarea/contentEditable
    try {
      const active = typeof document !== "undefined" ? document.activeElement : null;
      if (active) {
        const isTextEntry =
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable;
        // allow autofocus only if the active element is inside this row (so the user is already interacting here)
        if (isTextEntry) {
          const insideThisRow =
            typeof active.closest === "function" &&
            active.closest(`[data-task-id="${task?.id}"]`);
          if (!insideThisRow) {
            return; // skip autofocus to avoid interrupting the user's typing (e.g. search)
          }
        }
      }
    } catch (e) {
      // ignore DOM access errors and proceed
    }

    hasAutoFocusedRef.current = true;
    try {
      const el = firstInputRef.current;
      el.focus();
      // select briefly so user sees focus, then reliably move caret to end
      if (typeof el.select === "function") el.select();
      // slightly longer delay to improve reliability across environments
      setTimeout(() => {
        try {
          if (el && typeof el.setSelectionRange === "function") {
            const len = (el.value || "").length;
            // use requestAnimationFrame for best timing
            requestAnimationFrame(() => {
              try {
                el.setSelectionRange(len, len);
              } catch (_) {}
            });
          }
        } catch (_) {
          // ignore environment-specific issues
        }
      }, 200);
    } catch (_) {
      // ignore focus errors
    }
  }, [autoFocus, task?.id]);

  // Use same host pattern as other places: https://eventify.preview.uz/<path>
  const getFileUrl = (file) => {
    const rawPath = file?.path || "";
    const cleaned = rawPath.replace(/^\/+/, ""); // remove leading slashes
    return `https://eventify.preview.uz/${cleaned}`;
  };

  // download via fetch to ensure proper download behavior (works across hosts)
  const downloadFile = async (file) => {
    try {
      const url = getFileUrl(file);
      const filename = (file.path || "").split("/").pop() || file.id || "file";
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const confirmDeleteFile = (file) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeletingFile(true);
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/task/${task.id}/files`, {
        data: { fileIds: [fileToDelete.id] },
        headers: { Authorization: `Bearer ${token}` },
      });
      // --- NEW: remove deleted file from localFiles immediately ---
      setLocalFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      if (typeof onEdit === "function") onEdit();
      setShowDeleteConfirm(false);
      setFileToDelete(null);
      setShowFileModal(false);
    } catch (e) {
      console.error("Error deleting file:", e);
      setShowDeleteConfirm(false);
    }
    setIsDeletingFile(false);
  };

  // Direct delete used from modal (no confirmation)
  const deleteFileDirect = async (file) => {
    if (!file) return;
    try {
      const token = localStorage.getItem("token");
      await axiosInstance.delete(`/task/${task.id}/files`, {
        data: { fileIds: [file.id] },
        headers: { Authorization: `Bearer ${token}` },
      });
      // --- NEW: update localFiles immediately ---
      setLocalFiles(prev => prev.filter(f => f.id !== file.id));
      if (typeof onEdit === "function") onEdit();
      setSelectedFileIndex(0);
    } catch (e) {
      console.error("Error deleting file:", e);
    }
  };

  // Confirm-clear state for dates (columnKey e.g. "duedate1" / "date1", isRange true for range pickers)
  const [clearConfirm, setClearConfirm] = useState({
    open: false,
    columnKey: null,
    isRange: false,
  });

  const requestClear = (columnKey, isRange = false) => {
    setClearConfirm({ open: true, columnKey, isRange });
  };
  const closeClearConfirm = () => {
    setClearConfirm({ open: false, columnKey: null, isRange: false });
  };
  const confirmClear = () => {
    if (!clearConfirm.columnKey) return closeClearConfirm();
    if (clearConfirm.isRange) {
      handleInputChange(clearConfirm.columnKey, ["", ""]);
    } else {
      handleInputChange(clearConfirm.columnKey, "");
    }
    closeClearConfirm();
  };

  // close modal on ESC
  useEffect(() => {
    if (!clearConfirm.open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeClearConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [clearConfirm.open]);

  const renderField = (columnKey, columnType, column, colIdx) => {
    const lowerKey = columnKey.toLowerCase();
    const lowerType = columnType?.toUpperCase();

    // Dynamic SELECT dropdown with add option modal
    if (lowerType === "SELECT" && column?.selects?.[0]?.options) {
      const selectId = column.selects[0]?.id;
      const options = column.selects[0].options;
      return (
        <div className="w-full">
          <Select
            suffixIcon={null}
            onChange={(value) =>
              handleInputChange(lowerKey, { target: { value } })
            }
            /* show first option when task has no value */
            defaultValue={task[lowerKey] || (options[0]?.name || "Select value")}
            className="w-full"
            style={{ width: "100%" }}
            dropdownRender={menu => (
              <>
                {menu}
                {/* Only show add/manage buttons if user is AUTHOR */}
                {userInfo?.roles?.some(r => r.type === "AUTHOR") && (
                  <div className="flex flex-col gap-1 px-2 py-1 border-t border-gray-700 bg-grayDash">
                    <button
                      className="w-full py-1 text-pink2 hover:text-white hover:bg-pink2 rounded transition"
                      onClick={e => {
                        e.stopPropagation();
                        openAddOptionModal(lowerKey, selectId);
                      }}
                    >
                      + Add option
                    </button>
                    <button
                      className="w-full py-1 text-white2 hover:text-white hover:bg-gray3 rounded transition border border-gray4"
                      onClick={e => {
                        e.stopPropagation();
                        openManageOptionsModal(lowerKey, selectId, options);
                      }}
                    >
                      Manage options
                    </button>
                  </div>
                )}
              </>
            )}
          >
            {options.map((option) => (
              <Select.Option key={option.id} value={option.name}>
                <Selects
                  bgSelect={option.color || "#FFFFFF"}
                  value={option.name}
                  textColor={"#000000"}
                >
                  {option.name}
                </Selects>
              </Select.Option>
            ))}
          </Select>
          {/* Add Option Modal */}
          {addOptionModal.open && addOptionModal.columnKey === lowerKey &&
            typeof window !== "undefined" &&
            document.getElementById("root") &&
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-grayDash rounded-lg shadow-lg p-6 w-full max-w-[350px] relative">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-lg text-white">Add Option</div>
                    <button
                      className="text-gray4 hover:text-pink2 text-xl"
                      onClick={closeAddOptionModal}
                    >
                      <IoClose />
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-white mb-1">Name</label>
                    <Input
                      value={addOptionName}
                      onChange={e => setAddOptionName(e.target.value)}
                      placeholder="Option name"
                      className="mb-2"
                    />
                    <label className="block text-white mb-1">Color</label>
                    <div className="relative">
                      <div
                        className="w-full h-6 rounded cursor-pointer border-2 border-gray3 mb-2"
                        style={{ background: addOptionColor }}
                        title={addOptionColor}
                        onClick={() => setShowColorPicker(v => !v)}
                      />
                      {showColorPicker && (
                        <div className="absolute z-50" style={{ top: 32, left: 0 }}>
                          {/* Overlay for closing the picker */}
                          <div
                            className="fixed inset-0"
                            style={{ zIndex: 49 }}
                            onClick={() => setShowColorPicker(false)}
                          />
                          {/* Picker must be above the overlay */}
                          <div style={{ position: "relative", zIndex: 50 }}>
                            <SketchPicker
                              color={addOptionColor}
                              onChange={color => setAddOptionColor(color.hex)}
                              onChangeComplete={color => {
                                setAddOptionColor(color.hex);
                                setShowColorPicker(false); // close after selection
                              }}
                              presetColors={[
                                "#801949", "#0EC359", "#BF7E1C", "#DC5091", "#FFFFFF", "#23272F"
                              ]}
                              disableAlpha
                              width={180}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      className="px-4 py-2 rounded bg-gray3 text-white"
                      onClick={closeAddOptionModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-pink2 text-white font-semibold disabled:opacity-60"
                      onClick={handleAddOption}
                      disabled={addingOption[lowerKey] || !addOptionName.trim()}
                    >
                      {addingOption[lowerKey] ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              </div>,
              document.getElementById("root")
            )
          }
          {/* Manage Options Modal */}
          {manageOptionsModal.open && manageOptionsModal.columnKey === lowerKey &&
            typeof window !== "undefined" &&
            document.getElementById("root") &&
            ReactDOM.createPortal(
              <div
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40"
                onClick={closeManageOptionsModal} // close when clicking outside modal
              >
                {/* stop propagation so clicks inside dialog don't close it */}
                <div
                  className="bg-grayDash rounded-lg shadow-lg p-6 w-full max-w-[400px] relative"
                  onClick={(e) => e.stopPropagation()} // prevent overlay click handler
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-lg text-white">Manage Options</div>
                    <button
                      className="text-gray4 hover:text-pink2 text-xl"
                      onClick={closeManageOptionsModal}
                    >
                      <IoClose />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto">
                    {manageOptionsModal.options.length === 0 && (
                      <div className="text-gray4 text-center py-6">No options found.</div>
                    )}
                    {manageOptionsModal.options.map(opt => (
                      <div
                        key={opt.id}
                        className="flex items-center gap-2 bg-gray3 rounded px-2 py-2 relative"
                        style={{ alignItems: "flex-start" }}
                      >
                        <Input
                          value={opt.editName}
                          onChange={e => handleEditOptionChange(opt.id, "editName", e.target.value)}
                          className="flex-1"
                          size="small"
                        />
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-8 h-6 rounded cursor-pointer border-2 border-gray4"
                            style={{ background: opt.editColor }}
                            title={opt.editColor}
                            onClick={e => {
                              e.stopPropagation();
                              setEditOptions(prev => ({
                                ...prev,
                                [opt.id]: !prev[opt.id]
                              }));
                            }}
                          />
                          {/* Replace inline picker (which could be clipped) with a portal-mounted fixed overlay + centered picker */}
                          {editOptions[opt.id] && typeof window !== "undefined" && document.getElementById("root") && ReactDOM.createPortal(
                            <div>
                              {/* overlay to catch outside clicks and prevent background scrolling interactions */}
                              <div
                                className="fixed inset-0"
                                style={{ zIndex: 10001 }} // <- raised above modal z-[10000]
                                onClick={() => setEditOptions(prev => ({ ...prev, [opt.id]: false }))}
                              />
                              {/* fixed picker container placed above the modal */}
                              <div
                                className="fixed"
                                style={{
                                  zIndex: 10002, // <- raised above modal z-[10000]
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%,-50%)"
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <SketchPicker
                                  color={opt.editColor}
                                  onChange={color =>
                                    handleEditOptionChange(opt.id, "editColor", color.hex)
                                  }
                                  onChangeComplete={color => {
                                    // apply final color and close the picker
                                    handleEditOptionChange(opt.id, "editColor", color.hex);
                                    setEditOptions(prev => ({ ...prev, [opt.id]: false }));
                                  }}
                                  presetColors={[
                                    "#801949", "#0EC359", "#BF7E1C", "#DC5091", "#FFFFFF", "#23272F"
                                  ]}
                                  disableAlpha
                                  width={220}
                                />
                              </div>
                            </div>,
                            document.getElementById("root")
                          )}
                        </div>
                        <button
                          className="px-2 py-1 rounded bg-pink2 text-white text-xs font-semibold disabled:opacity-60"
                          onClick={() => handleSaveOption(opt.id, opt.editName, opt.editColor)}
                          disabled={savingOptionId === opt.id || !opt.editName.trim()}
                        >
                          {savingOptionId === opt.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold disabled:opacity-60"
                          onClick={() => handleDeleteOption(opt.id)}
                          disabled={deletingOptionId === opt.id}
                        >
                          {deletingOptionId === opt.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>,
              document.getElementById("root")
            )
          }
        </div>
      );
    }

    // Date fields (including due date and duedate1-5)
    if (
      ["date1", "date2", "date3", "date4", "date5"].includes(lowerKey)
    ) {
      const dateValue = task[lowerKey] ? dayjs(task[lowerKey]) : null;
      return (
        <div className="w-full">
          <AntdDatePicker
            showTime
            value={dateValue}
            onChange={(date) => {
              // when user clicks the clear (x) Antd passes null -> ask for confirmation
              if (date === null) {
                requestClear(lowerKey, false);
                return;
              }
              handleInputChange(lowerKey, date);
            }}
            format="YYYY-MM-DD HH:mm"
            className="w-full bg-grayDash text-white text-[18px] rounded px-2 py-1"
            placeholder={'Select date & time'}
            allowClear
          />
          {clearConfirm.open && clearConfirm.columnKey === lowerKey && (
            typeof window !== "undefined" && document.getElementById("root") &&
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={closeClearConfirm} />
                <div className="relative bg-grayDash rounded-lg shadow-lg w-full max-w-[360px] p-4 z-10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-lg font-semibold text-white">Confirm</div>
                    <button className="text-gray4" onClick={closeClearConfirm}>✕</button>
                  </div>
                  <div className="text-sm text-gray4 mb-4">Are you sure you want to clear this date?</div>
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-2 rounded bg-gray3 text-white" onClick={closeClearConfirm}>Cancel</button>
                    <button className="px-3 py-2 rounded bg-pink2 text-white" onClick={confirmClear}>Clear</button>
                  </div>
                </div>
              </div>,
              document.getElementById("root")
            )
          )}
        </div>
      );
    }

    // Date/duedate range fields (array of [start, end])
    if (["duedate1", "duedate2", "duedate3", "duedate4", "duedate5"].includes(lowerKey)) {
      // Always expect/store as ISO datetime strings: ["isoStart","isoEnd"]
      const rangeValue = Array.isArray(task[lowerKey]) && task[lowerKey].length === 2
        ? [
          task[lowerKey][0] ? dayjs(task[lowerKey][0]) : null,
          task[lowerKey][1] ? dayjs(task[lowerKey][1]) : null,
        ]
        : [null, null];
      const placeholder = ["Start due date & time", "End due date & time"];
      return (
        <div className="w-full">
          <AntdRangePicker
            value={rangeValue}
            onChange={(dates) => {
              // dates === null or [null,null] on clear -> confirm
              if (!dates || (Array.isArray(dates) && dates.every(d => !d))) {
                requestClear(lowerKey, true);
                return;
              }
              handleInputChange(lowerKey, dates);
            }}
             showTime={{ format: 'HH:mm' }}
             format="YYYY-MM-DD HH:mm"
             className="w-full bg-grayDash !text-white text-[18px] rounded px-2 py-1 "
             placeholder={placeholder}
             allowClear
           />
          {clearConfirm.open && clearConfirm.columnKey === lowerKey && (
            typeof window !== "undefined" && document.getElementById("root") &&
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={closeClearConfirm} />
                <div className="relative bg-grayDash rounded-lg shadow-lg w-full max-w-[420px] p-4 z-10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-lg font-semibold text-white">Confirm</div>
                    <button className="text-gray4" onClick={closeClearConfirm}>✕</button>
                  </div>
                  <div className="text-sm text-gray font-[500] mb-4">Are you sure you want to clear this date range?</div>
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-2 rounded bg-gray3 text-white" onClick={closeClearConfirm}>Cancel</button>
                    <button className="px-3 py-2 rounded bg-pink2 text-white" onClick={confirmClear}>Clear</button>
                  </div>
                </div>
              </div>,
              document.getElementById("root")
            )
          )}
        </div>
      );
    }

    // Checkbox
    if (
      ["checkbox", "checkbox1", "checkbox2", "checkbox3", "checkbox4", "checkbox5"].includes(
        lowerKey
      )
    ) {
      const checked = !!task[lowerKey];
      return (
        <div className="flex items-center justify-center w-full">
          <label className="relative flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) =>
                handleInputChange(lowerKey, { target: { value: e.target.checked } })
              }
              className="peer appearance-none w-5 h-5 m-0 p-0 absolute opacity-0 cursor-pointer"
              style={{ zIndex: 2 }}
            />
            <span
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center
                transition-colors duration-150
                ${checked ? "bg-pink2 border-pink2" : "bg-[#23272F] border-gray4"}
                peer-focus:ring-2 peer-focus:ring-pink2
              `}
              style={{ zIndex: 1 }}
            >
              {checked && (
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
          </label>
        </div>
      );
    }
    // Link input
    if (["links"].includes(lowerKey)) {
      // task value may be stored as array; show first element or empty string
      const raw = task[lowerKey];
      const value = Array.isArray(raw) ? raw[0] || "" : raw || "";
      const handleLinkChange = (e) => {
        // Accept any intermediate text while typing (validation/opening handled elsewhere)
        handleInputChange(lowerKey, e); // handleInputChange will wrap into array
      };
      const handleDoubleClick = () => {
        if (/^https?:\/\/\S+\.\S+/.test(value)) {
          window.open(value, "_blank", "noopener,noreferrer");
        }
      };
      return (
        <div className="flex items-center w-full">
          <Input
            className="bg-grayDash border-none focus:bg-gray3 hover:bg-grayDash text-white text-[18px]  placeholder-gray"
            value={value}
            onChange={handleLinkChange}
            type="text"
            placeholder="https://example.com"
          />
        </div>
      );
    }

    // Price input
    if (lowerKey === "price") {
      return (
        <div className="flex items-center w-full">
          <span className="text-pink2 font-bold mr-1">$</span>
          <Input
            className="bg-grayDash border-none focus:bg-gray3 hover:bg-grayDash text-white text-[18px] placeholder-white"
            value={task[lowerKey] || ""}
            onChange={(e) => handleInputChange(lowerKey, e)}
            type="number"
            placeholder="0.00"
          />
        </div>
      );
    }

    // Priority select


    // Generic mapped selects (status, etc.) — render similarly to priority
    if (KEY_SELECT_OPTIONS[lowerKey] || lowerKey === "priority") {
      const options = KEY_SELECT_OPTIONS[lowerKey];
      return (
        <Select
          suffixIcon={null}
          onChange={(value) =>
            handleInputChange(lowerKey, { target: { value } })
          }
          defaultValue={task[lowerKey] || (options[0]?.value || `Select ${lowerKey}`)}
          className="w-full"
          style={{ width: "100%" }}
        >
          {options.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontWeight: 500,
                  color: "#fff",
                  background: opt.bg || "#6B7280",
                }}
              >
                {opt.label}
              </span>
            </Select.Option>
          ))}
        </Select>
      );
    }

    // Member avatars
    if (lowerKey === "members") {
      const taskMembers = Array.isArray(localMembers) ? localMembers : [];
      const noCompanyMembers = !companyMembers || companyMembers.length === 0;
      return (
        <>
          <div
            className="flex items-center -space-x-4 cursor-pointer"
            onClick={handleOpenMemberModal}
            title="Edit members"
          >
            {taskMembers.length === 0 ? (
              <FaUserSlash className="text-gray4 w-[22px] h-[22px]" title="No members exist" />
            ) : (
              taskMembers.map((member, index) => (
                <img
                  key={member.id}
                  src={
                    member.user?.avatar?.path
                      ? `https://eventify.preview.uz/${member.user.avatar.path}`
                      : testMemImg
                  }
                  alt={member.user?.firstName || "Member Image"}
                  className="w-[30px] h-[30px] 2xl:w-[35px] 2xl:h-[35px] rounded-full object-cover border-2 border-[#1a1a2e]"
                  style={{ zIndex: taskMembers.length - index }}
                  title={member.user?.firstName || ""}
                />
              ))
            )}
          </div>
          {showMemberModal && (
            // overlay closes modal on outside click
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40"
              onClick={() => setShowMemberModal(false)}
            >
              {/* stop propagation so clicks inside dialog don't close it */}
              <div
                className="bg-grayDash rounded-lg shadow-lg p-4 w-full max-w-[400px] min-h-[220px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="font-bold text-lg text-white">
                    Select Members
                  </div>
                  <button
                    className="text-gray4 hover:text-pink2 text-xl"
                    onClick={() => setShowMemberModal(false)}
                  >
                    <IoClose />
                  </button>
                </div>
                <div className="max-h-[160px] overflow-y-auto mb-4">
                  {!companyMembers || companyMembers.length === 0 ? (
                    <div className="text-gray4 text-center py-6">
                      No company members found.
                    </div>
                  ) : (
                    companyMembers.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 py-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(member.id)}
                          onChange={() => handleToggleMember(member.id)}
                          className="accent-pink2 w-5 h-5"
                        />
                        <img
                          src={
                            member.user?.avatar?.path
                              ? `https://eventify.preview.uz/${member.user.avatar.path}`
                              : testMemImg
                          }
                          alt={member.user?.firstName || "Member"}
                          className="w-7 h-7 rounded-full object-cover border-2 border-[#23272F]"
                        />
                        <span className="text-white">
                          {member.user?.firstName || "NoName"}{" "}
                          {member.user?.lastName || ""}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="w-full h-9 rounded bg-pink2 text-white font-semibold hover:bg-pink transition mb-2"
                    onClick={() => {
                      setShowMemberModal(false);
                      setShowInviteModal(true);
                    }}
                  >
                    Invite
                  </button>
                  <div className="flex justify-end gap-2">
                    {/* Disable Cancel and Save when no company members exist */}
                    <button
                      className={`px-4 py-2 rounded bg-gray3 text-white transition ${noCompanyMembers ? "opacity-50 cursor-not-allowed" : "hover:bg-gray4"
                        }`}
                      onClick={() => { if (!noCompanyMembers) setShowMemberModal(false); }}
                      disabled={noCompanyMembers}
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-4 py-2 rounded bg-pink2 text-white font-semibold transition ${(isSaving || noCompanyMembers) ? "opacity-50 cursor-not-allowed" : "hover:shadow"
                        }`}
                      onClick={handleSaveMembers}
                      disabled={isSaving || noCompanyMembers}
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <InviteMemberModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
          />
        </>
      );
    }

    // Default input
    return (
      <Input
        ref={autoFocus && colIdx === 0 ? firstInputRef : undefined}
        className="bg-grayDash border-none focus:bg-gray3 hover:bg-grayDash text-white text-[18px]"
        value={task[lowerKey] || ""}
        onChange={(e) => handleInputChange(lowerKey, e)}
        type="text"
      />
    );
  };

  // Helper to render small file preview/icon
  const renderFilesCell = () => {
    // use localFiles (immediate UI) instead of task.files
    const filesArr = Array.isArray(localFiles) ? localFiles : [];
    if (!filesArr.length) {
      // make the empty cell clickable to open the modal (upload tab)
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setModalTab("upload");
            setShowFileModal(true);
          }}
          className="flex items-center gap-2 text-gray4 px-2 py-1 rounded hover:bg-grayDash"
          title="No files — upload"
        >
          <FaRegFileAlt className="w-4 h-4" />
          <span className="text-xs">No files — upload</span>
        </button>
      );
    }

    const isImageByPath = (p = "") => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(p);

    return (
      <div className="flex items-center gap-2">
        {filesArr.slice(0, 3).map((f, i) => {
          const url = getFileUrl(f);
          const filename = (f.path || "").split("/").pop() || f.id || "file";
          const isImage = isImageByPath(f.path);
          return (
            // wrapper must allow overflow so the delete button can sit above the corner;
            // add "group" so we can show X only on hover
            <div key={f.id || i} className="relative rounded group" style={{ width: 36, height: 36, overflow: "visible" }}>
              {/* thumbnail / click to open preview */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFileIndex(i);
                  setShowFileModal(true);
                }}
                title={filename}
                className="w-full h-full p-0 block"
                style={{ borderRadius: 6, overflow: "hidden", border: "1px solid #2A2D36", background: "#23272F" }}
              >
                {isImage ? (
                  <img src={url} alt={filename} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#2A2D36] text-gray4">
                    <FaRegFileAlt className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* small delete X on thumbnail (in-column) - shown only on hover (group-hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDeleteFile(f); // preserve confirmation for column hover delete
                }}
                title="Delete file"
                aria-label={`Delete ${filename}`}
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  zIndex: 80,
                  top: -6,
                  right: -6,
                  width: 14,
                  height: 14,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 9999,
                  background: "#ffffff",
                  color: "#000000",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
                  cursor: "pointer",
                }}
              >
                <span style={{ lineHeight: "12px" }}>✕</span>
              </button>
            </div>
          );
        })}
        {filesArr.length > 3 && <div className="text-gray4 text-xs">+{filesArr.length - 3}</div>}
      </div>
    );
  };

  // determine first visible column key (we'll show chat button inside that column)
  const firstVisibleColumnKeyLower = Array.isArray(columns)
    ? (columns.find((c) => c && c.show)?.key || "").toString().toLowerCase()
    : "";

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <tr
          data-task-id={task.id}
           // row controls hover color; cells use group-hover to respond
           className={`task flex text-white border-[black] font-radioCanada group hover:bg-[#2A2D36] transition-colors ${isDeleting ? "opacity-60 pointer-events-none" : ""}`}
           ref={provided.innerRef}
           {...provided.draggableProps}
           {...provided.dragHandleProps}
         >
          {/* Sticky checkbox cell */}
          <td className="w-[48px] py-[16px] px-[11px] flex items-center justify-center border-r border-r-[black] sticky left-0 bg-grayDash group-hover:bg-[#2A2D36] z-20">
            <label className="relative flex items-center cursor-pointer select-none w-[20px] h-[20px] text-gray4">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect && onSelect(task.id);
                }}
                className="peer appearance-none w-5 h-5 m-0 p-0 absolute opacity-0 cursor-pointer"
                style={{ zIndex: 2 }}
              />
              <span
                className={`
                  w-5 h-5 rounded border-2 flex items-center justify-center
                  transition-colors duration-150
                  ${isSelected ? "bg-pink2 border-pink2" : "bg-[#23272F] border-gray4"}
                  peer-focus:ring-2 peer-focus:ring-pink2
                `}
                style={{ zIndex: 1 }}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            </label>
          </td>

          {/* Order cell - shows numeric order for the task */}
          {columns?.map(
            (column, idx) =>
              column.show && (() => {
                // decide if this cell should host the chat overlay:
                const isChatColumn = firstVisibleColumnKeyLower
                  ? String(column.key || "").toLowerCase() === firstVisibleColumnKeyLower
                  : false;

                // base classes (sticky left for the first visible column if requested)
                const baseSticky = stickyFirstThreeColumns && idx === 0 ? " sticky left-[48px] z-10 bg-grayDash" : "";
                // For chat column: place chat button as inline sibling next to the input
                if (isChatColumn) {
                  return (
                    <td
                      key={idx}
                      className={`w-[180px] py-[16px] border-r border-r-[black] px-[11px]${baseSticky} group-hover:bg-[#2A2D36]`}
                      onClick={() => onEdit && onEdit()}
                    >
                      <div className="flex items-center gap-2">
                        {/* field takes remaining space */}
                        <div className="flex-1 min-w-0">
                          {renderField(column.key, column.type, column, idx)}
                        </div>

                        {/* chat button sits next to input; revealed on row hover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat && onOpenChat(task);
                          }}
                          title="Open chat"
                          aria-label="Open chat"
                          // default icon color pink, still white on hover; revealed on row hover
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-pink2 bg-transparent p-1 rounded flex-shrink-0"
                        >
                          <IoMdChatbubbles className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </td>
                  );
                }

                // non-chat columns: render as before
                return (
                  <td
                    key={idx}
                    className={`w-[180px] flex items-center justify-between py-[16px] border-r border-r-[black] px-[11px]${baseSticky} group-hover:bg-[#2A2D36]`}
                    onClick={() => onEdit && onEdit()}
                  >
                    <div className="w-full">
                      {renderField(column.key, column.type, column, idx)}
                    </div>
                  </td>
                );
              })()
          )}
 
          {/* Files default column (before Last update) */}
          <td className="w-[140px] sm:w-[160px] md:w-[180px] flex items-center py-[16px] border-r border-r-[black] px-[11px] overflow-visible group-hover:bg-[#2A2D36]">
             {renderFilesCell()}
           </td>
 
          {/* New default column: Last update (avatar, name/email, timestamp) - conditional rendering */}
          {showLastUpdateColumn && (
            <td className="w-[180px] flex items-center gap-3 py-[16px] border-r border-r-[black] px-[11px] group-hover:bg-[#2A2D36]">
               {(() => {
                 const lastUser = task?.lastUpdatedByUser || null;
                 const avatarPath = lastUser?.avatar?.path
                   ? getFileUrl({ path: lastUser.avatar.path })
                   : testMemImg;
                 const displayName = lastUser
                   ? `${lastUser.firstName || ""} ${lastUser.lastName || ""}`.trim() || lastUser.email || "User"
                   : "—";
                 const time = task?.updatedAt || task?.updatedAt || task?.updatedAt;
                 const formatted = time ? dayjs(time).format("MMM D, HH:mm") : "";
                 return (
                   <div className="flex items-center w-full">
                     <img
                       src={avatarPath}
                       alt={lastUser?.firstName || "User"}
                       className="w-8 h-8 rounded-full object-cover border-2 border-[#23272F] flex-shrink-0"
                     />
                     <div className="flex-1 ml-3 min-w-0">
                       <div className="text-white text-sm truncate">{displayName}</div>
                       {/* show deleting marker when applicable */}
                       {isDeleting ? (
                         <div className="text-yellow-300 text-xs">Deleting...</div>
                       ) : (
                         <div className="text-gray4 text-xs">{formatted}</div>
                       )}
                     </div>
                   </div>
                 );
               })()}
             </td>
          )}

           {/* File preview modal (portal) - shows all files, allows select, download, delete */}
           {showFileModal &&
             typeof window !== "undefined" &&
             document.getElementById("root") &&
             ReactDOM.createPortal(
               <div>
                 <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4">
                   <div className="bg-grayDash rounded-lg shadow-lg w-full max-w-[900px] overflow-hidden">
                     <div className="flex justify-between items-center p-4 border-b border-[#2A2D36]">
                       <div className="flex items-center gap-3">
                         <div className="text-white font-semibold">Files</div>
                         <div className="flex items-center bg-[#1f1ff]">
                           <button
                             className={`px-3 py-1 ${modalTab === "upload" ? "bg-pink2 text-white" : "text-gray4"}`}
                             onClick={() => setModalTab("upload")}
                           >
                             Upload
                           </button>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <button
                           className="text-gray4 p-2 rounded group-hover:bg-[#2A2D36]"
                           onClick={() => setShowFileModal(false)}
                         >
                           <IoClose />
                         </button>
                       </div>
                     </div>

                     <div className="flex flex-col md:flex-row gap-4 p-4">
                       {/* Left pane: preview OR upload UI based on tab */}
                       {modalTab === "preview" ? (
                         <div className="flex-shrink-0 w-full md:w-2/3 flex items-center justify-center bg-[#23272F] border border-[#2A2D36] rounded p-3 overflow-auto">
                           {Array.isArray(localFiles) && localFiles.length > 0 ? (
                             (() => {
                               const f = localFiles[selectedFileIndex] || localFiles[0];
                               const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(f.path || "");
                               return isImage ? (
                                 <img
                                   src={getFileUrl(f)}
                                   alt={f.path?.split?.("/").pop?.() || "preview"}
                                   className="max-h-[70vh] max-w-full object-contain"
                                 />
                               ) : (
                                 <div className="flex flex-col items-center text-gray4">
                                   <FaRegFileAlt className="w-20 h-20 mb-2" />
                                   <div className="text-sm">{f.path?.split?.("/").pop() || f.id}</div>
                                 </div>
                               );
                             })()
                           ) : (
                             <div className="flex flex-col items-center text-gray4">
                               <FaRegFileAlt className="w-12 h-12 mb-2" />
                               <div className="text-sm">No files</div>
                             </div>
                           )}
                         </div>
                       ) : (
                         <div
                           className="flex-shrink-0 w-full md:w-2/3 bg-[#23272F] border border-[#2A2D36] rounded p-3"
                           onDrop={handleDrop}
                           onDragOver={handleDragOver}
                         >
                           <div className="border-2 border-dashed border-[#2A2D36] rounded-lg p-4 mb-4 flex flex-col items-center gap-3">
                             <div className="text-white font-semibold mb-2">Drag & drop files here</div>
                             <div className="text-gray4 text-sm">or click to select files. Max: <span className="text-white">{formatMaxSize()}</span></div>
                             <label className="inline-flex items-center gap-2 cursor-pointer mt-2">
                               <div className="px-3 py-2 bg-pink2 text-white rounded-md font-medium">Select files</div>
                               <input type="file" multiple onChange={handleFileChange} className="hidden" />
                             </label>
                           </div>

                           {/* Upload queue */}
                           {uploadQueue.length > 0 && (
                             <div className="mb-2">
                               <div className="text-white font-semibold mb-2">Upload queue</div>
                               <div className="flex flex-col gap-2">
                                 {uploadQueue.map((q) => (
                                   <div key={q.id} className="flex items-center gap-3 bg-[#1F1F1F] rounded-lg px-3 py-2">
                                     <div className="w-12 h-12 rounded overflow-hidden bg-[#111] flex items-center justify-center border border-[#2A2D36]">
                                       {q.preview ? <img src={q.preview} alt={q.file.name} className="w-full h-full object-cover" /> : <FaRegFileAlt className="text-pink2 w-6 h-6" />}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                       <div className="text-white truncate">{q.file.name}</div>
                                       <div className="flex items-center gap-3 mt-1">
                                         <div className="h-2 bg-[#2A2D36] rounded-md flex-1 overflow-hidden">
                                           <div style={{ width: `${q.progress}%` }} className={`h-2 bg-pink2 rounded-md transition-all`} />
                                         </div>
                                         <div className="text-xs text-gray4 whitespace-nowrap">{q.progress}%</div>
                                         <div className="text-xs text-gray4">· {formatBytes(q.size)}</div>
                                       </div>
                                       {q.status === "error" && (
                                         <div className="text-xs text-red-500 mt-1">
                                           {q.error || "Upload failed"}
                                         </div>
                                       )}
                                     </div>
                                     <div className="flex items-center gap-2 ml-2">
                                       {q.status === "uploading" ? (
                                         <>
                                           <button className="text-gray4 px-2 py-1 rounded" title="Uploading" disabled>…</button>
                                           <button onClick={() => cancelUpload(q.id)} className="text-red-500 px-2 py-1 rounded" title="Cancel">Cancel</button>
                                         </>
                                       ) : q.status === "queued" ? (
                                         <button onClick={() => cancelUpload(q.id)} className="text-red-500 px-2 py-1 rounded" title="Cancel">Cancel</button>
                                       ) : q.status === "error" ? (
                                         <>
                                           <button onClick={() => uploadSingle(q)} className="text-yellow-400 px-2 py-1 rounded" title="Retry">Retry</button>
                                           <button onClick={() => cancelUpload(q.id)} className="text-red-500 px-2 py-1 rounded" title="Remove">Remove</button>
                                         </>
                                       ) : null}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                        </div>
                      )}

                      {/* Right pane: files list / actions (use localFiles) */}
                      <div className="flex-1 flex flex-col gap-3">
                        <div className="flex-1 overflow-y-auto max-h-[60vh] p-1">
                          <div className="grid grid-cols-3 gap-2">
                            {Array.isArray(localFiles) && localFiles.length > 0 ? (
                              localFiles.map((f, idx) => {
                                const url = getFileUrl(f);
                                const filename = f.path?.split?.("/").pop() || f.id;
                                const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(f.path || "");
                                return (
                                  // make the thumbnail a group so delete button appears on hover
                                  <div key={f.id || idx} className="relative group">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFileIndex(idx);
                                        setModalTab("preview");
                                      }}
                                      className={`w-full h-24 rounded border overflow-hidden bg-[#23272F] flex items-center justify-center transition ${selectedFileIndex === idx ? "border-pink2 ring-2 ring-pink2" : "border-[#2A2D36]"}`}
                                    >
                                      {isImage ? (
                                        <img src={url} alt={filename} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="flex flex-col items-center text-gray4">
                                          <FaRegFileAlt className="w-6 h-6" />
                                          <div className="text-xs mt-1 truncate">{filename}</div>
                                        </div>
                                      )}
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteFileDirect(f);
                                      }}
                                      title="Delete file"
                                      aria-label={`Delete ${filename}`}
                                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow"
                                      style={{ zIndex: 60 }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-3 text-gray4 text-sm">No files</div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {Array.isArray(localFiles) && localFiles[selectedFileIndex] && (
                            <>
                              <button
                                onClick={() => downloadFile(localFiles[selectedFileIndex])}
                                className="px-4 py-2 rounded bg-pink2 text-white font-semibold"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => setShowFileModal(false)}
                                className="px-4 py-2 rounded bg-gray3 text-white"
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                 </div>,
                 document.getElementById("root")
             )}

                {/* Delete confirmation modal for file deletion */}
                <DeleteConfirmationModal
                  isOpen={showDeleteConfirm}
                  onClose={() => {
                    if (isDeletingFile) return; // prevent closing while deleting
                    setShowDeleteConfirm(false);
                    setFileToDelete(null);
                  }}
                  onDelete={handleDeleteFile}
                  title="Delete file"
                  message="Are you sure you want to delete this file? This action cannot be undone."
                  isLoading={isDeletingFile}
                />
              </tr>
            )}
        </Draggable>
      );
        }



      export default SheetTableItem;