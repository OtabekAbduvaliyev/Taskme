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
  index,
  isSelected,
  onSelect,
  stickyFirstThreeColumns,
  onChatIconClick,
  autoFocus, // <-- new prop
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

    // Single date fields -> send single "YYYY-MM-DD" string
    if (/^date[1-5]$/i.test(key)) {
      const value =
        e && typeof e === "object" && typeof e.format === "function"
          ? e.format("YYYY-MM-DD")
          : "";
      onChange(task.id, taskKey, value);
      return;
    }

    // Duedate fields (single "duedate" or numbered duedate1..5) -> always send array ["YYYY-MM-DD","YYYY-MM-DD"]
    if (/^duedate(?:[1-5])?$/i.test(key)) {
      let value;
      if (Array.isArray(e) && e.length === 2) {
        value = [
          e[0] && typeof e[0].format === "function" ? e[0].format("YYYY-MM-DD") : "",
          e[1] && typeof e[1].format === "function" ? e[1].format("YYYY-MM-DD") : "",
        ];
      } else {
        // cleared or invalid -> keep consistent array shape
        value = ["", ""];
      }
      onChange(task.id, taskKey, value);
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
      // Optionally update UI or refetch tasks here
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
      if (typeof onEdit === "function") onEdit();
    } catch {}
    setSavingOptionId(null);
  };
  console.log(user);
  
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
      if (typeof onEdit === "function") onEdit();
    } catch {}
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
      } catch {}
    };
    fetchUserInfo();
  }, []);

  // Ref for first input
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && firstInputRef.current) {
      firstInputRef.current.focus();
      // Optionally select all text:
      if (typeof firstInputRef.current.select === "function") {
        firstInputRef.current.select();
      }
    }
  }, [autoFocus]);

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
      // notify parent to refresh if onEdit available
      if (typeof onEdit === "function") onEdit();
      // close modal and reset selection
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
      if (typeof onEdit === "function") onEdit();
      // ensure modal selection resets if needed
      setSelectedFileIndex(0);
    } catch (e) {
      console.error("Error deleting file:", e);
    }
  };

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
            defaultValue={task[lowerKey] || "Select value"}
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
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-grayDash rounded-lg shadow-lg p-6 w-full max-w-[400px] relative">
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
                          {editOptions[opt.id] && (
                            <div
                              className="absolute left-0"
                              style={{
                                top: "110%",
                                zIndex: 100,
                                minWidth: 0,
                                minHeight: 0,
                                background: "transparent"
                              }}
                            >
                              {/* Overlay for closing the picker */}
                              <div
                                className="fixed inset-0"
                                style={{ zIndex: 99 }}
                                onClick={() =>
                                  setEditOptions(prev => ({
                                    ...prev,
                                    [opt.id]: false
                                  }))
                                }
                              />
                              <div style={{ position: "relative", zIndex: 100 }}>
                                <SketchPicker
                                  color={opt.editColor}
                                  onChange={color =>
                                    handleEditOptionChange(opt.id, "editColor", color.hex)
                                  }
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
      // const placeholder = isDueDateKey || lowerType === "DUEDATE" ? "Select due date" : "Select date";
      return (
        <AntdDatePicker
          value={dateValue}
          onChange={(date) => handleInputChange(lowerKey, date)}
          format="YYYY-MM-DD"
          className="w-full bg-grayDash text-white text-[18px] rounded px-2 py-1"
          placeholder={'enetr'}
          allowClear
        />
      );
    }

    // Date/duedate range fields (array of [start, end])
    if (["duedate1", "duedate2", "duedate3", "duedate4", "duedate5"].includes(lowerKey)) {
      // Always expect/store as ["YYYY-MM-DD", "YYYY-MM-DD"]
      const rangeValue = Array.isArray(task[lowerKey]) && task[lowerKey].length === 2
        ? [
            task[lowerKey][0] ? dayjs(task[lowerKey][0]) : null,
            task[lowerKey][1] ? dayjs(task[lowerKey][1]) : null,
          ]
        : [null, null];
      const placeholder = ["Start due date", "End due date"];
      return (
        <AntdRangePicker
          value={rangeValue}
          onChange={(dates) => handleInputChange(lowerKey, dates)}
          format="YYYY-MM-DD"
          className="w-full bg-grayDash text-white text-[18px] rounded px-2 py-1"
          placeholder={placeholder}
          allowClear
        />
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
                ${checked ? "bg-pink2 border-pink2" : "bg-[#23272F] border-[#3A3A3A]"}
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
    if (["link", "website"].includes(lowerKey)) {
      const value = task[lowerKey] || "";
      const handleLinkChange = (e) => {
        const val = e.target.value;
        if (/^https?:\/\/\S+\.\S+/.test(val) || val === "") {
          handleInputChange(lowerKey, e);
        }
      };
      const handleDoubleClick = () => {
        if (/^https?:\/\/\S+\.\S+/.test(value)) {
          window.open(value, "_blank", "noopener,noreferrer");
        }
      };
      return (
        <div className="flex items-center w-full">
          <Input
            className="bg-grayDash border-none focus:bg-gray3 hover:bg-grayDash text-white text-[18px] underline placeholder-white"
            value={value}
            onChange={handleLinkChange}
            type="url"
            placeholder="https://example.com"
            required
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={handleDoubleClick}
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
    if (lowerKey === "priority") {
      const priorityOptions = [
        { value: "Low", label: "Low", bg: "#0EC359" },      // selectGreen1
        { value: "Medium", label: "Medium", bg: "#BF7E1C" }, // yellow
        { value: "High", label: "High", bg: "#DC5091" },     // selectRed1
      ];
      return (
        <Select
          suffixIcon={null}
          onChange={(value) =>
            handleInputChange(lowerKey, { target: { value } })
          }
          defaultValue={task[lowerKey] || "Select priority"}
          className="w-full"
          style={{ width: "100%" }}
        >
          {priorityOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontWeight: 500,
                  color: "#fff",
                  background: option.bg,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#111",
                    marginRight: 8,
                  }}
                />
                {option.label}
              </span>
            </Select.Option>
          ))}
        </Select>
      );
    }

    // Generic mapped selects (status, etc.) — render similarly to priority
    if (KEY_SELECT_OPTIONS[lowerKey]) {
      const options = KEY_SELECT_OPTIONS[lowerKey];
      return (
        <Select
          suffixIcon={null}
          onChange={(value) =>
            handleInputChange(lowerKey, { target: { value } })
          }
          defaultValue={task[lowerKey] || `Select ${lowerKey}`}
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
      const taskMembers = Array.isArray(task.members) ? task.members : [];
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
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-grayDash rounded-lg shadow-lg p-4 w-full max-w-[400px] min-h-[220px]">
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
                      className={`px-4 py-2 rounded bg-gray3 text-white transition ${
                        noCompanyMembers ? "opacity-50 cursor-not-allowed" : "hover:bg-gray4"
                      }`}
                      onClick={() => { if (!noCompanyMembers) setShowMemberModal(false); }}
                      disabled={noCompanyMembers}
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-4 py-2 rounded bg-pink2 text-white font-semibold transition ${
                        (isSaving || noCompanyMembers) ? "opacity-50 cursor-not-allowed" : "hover:shadow"
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
    const filesArr = Array.isArray(task.files) ? task.files : [];
    if (!filesArr.length) {
      return (
        <div className="flex items-center gap-2 text-gray4">
          <FaRegFileAlt className="w-4 h-4" />
          <span className="text-xs">No files</span>
        </div>
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

  return (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided) => (
        <tr
          className="task flex text-white border-[black] font-radioCanada"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {/* Sticky checkbox cell */}
          <td className="w-[48px] py-[16px] px-[11px] flex items-center justify-center border-r border-r-[black] sticky left-0 bg-grayDash z-20">
            <label className="relative flex items-center cursor-pointer select-none w-[20px] h-[20px]">
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
                  ${isSelected ? "bg-pink2 border-pink2" : "bg-[#23272F] border-[#3A3A3A]"}
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
          {/* Sticky chat cell */}
          <td className="chat w-[48px] py-[16px] px-[11px] flex items-center justify-center border-r border-r-[black] sticky left-[48px] bg-grayDash z-20">
            <div
              className="cursor-pointer w-[20px] h-[20px] flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                onChatIconClick && onChatIconClick(task);
              }}
            >
              <IoMdChatbubbles className="text-gray4 w-[30px] h-[30px]" />
            </div>
          </td>
          {columns?.map(
            (column, idx) =>
              column.show && (
                <td
                  key={idx}
                  className={`w-[180px] flex items-center justify-between py-[16px] border-r border-r-[black] px-[11px]${
                    stickyFirstThreeColumns && idx === 0
                      ? " sticky left-[96px] z-10 bg-grayDash"
                      : ""
                  }`}
                  onClick={() => onEdit && onEdit()}
                >
                  {renderField(column.key, column.type, column, idx)}
                </td>
              )
          )}

          {/* Files default column (before Last update) */}
          <td className="w-[140px] sm:w-[160px] md:w-[180px] flex items-center py-[16px] border-r border-r-[black] px-[11px] overflow-visible">
            {renderFilesCell()}
          </td>
          
          {/* New default column: Last update (avatar, name/email, timestamp) */}
          <td className="w-[180px] flex items-center gap-3 py-[16px] border-r border-r-[black] px-[11px]">
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
                    <div className="text-gray4 text-xs">{formatted}</div>
                  </div>
                </div>
              );
            })()}
          </td>

          {/* File preview modal (portal) - shows all files, allows select, download, delete */}
          {showFileModal &&
            typeof window !== "undefined" &&
            document.getElementById("root") &&
            ReactDOM.createPortal(
              <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4">
                <div className="bg-grayDash rounded-lg shadow-lg w-full max-w-[900px] overflow-hidden">
                  <div className="flex justify-between items-center p-4 border-b border-[#2A2D36]">
                    <div className="text-white font-semibold">Files</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-gray4 p-2 rounded hover:bg-[#2A2D36]"
                        onClick={() => setShowFileModal(false)}
                      >
                        <IoClose />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 p-4">
                    {/* Preview pane */}
                    <div className="flex-shrink-0 w-full md:w-2/3 flex items-center justify-center bg-[#23272F] border border-[#2A2D36] rounded p-3 overflow-auto">
                      {Array.isArray(task.files) && task.files.length > 0 ? (
                        (() => {
                          const f = task.files[selectedFileIndex] || task.files[0];
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
                              <div className="text-sm">{f.path?.split?.("/").pop?.() || f.id}</div>
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

                    {/* Files list / actions */}
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex-1 overflow-y-auto max-h-[60vh] p-1">
                        <div className="grid grid-cols-3 gap-2">
                          {Array.isArray(task.files) && task.files.length > 0 ? (
                            task.files.map((f, idx) => {
                              const url = getFileUrl(f);
                              const filename = f.path?.split?.("/").pop?.() || f.id;
                              const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(f.path || "");
                              return (
                                // make the thumbnail a group so delete button appears on hover
                                <div key={f.id || idx} className="relative group">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFileIndex(idx);
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

                                  {/* small circular delete X (hidden until hover) */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteFileDirect(f); // direct delete from modal
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
                        {Array.isArray(task.files) && task.files[selectedFileIndex] && (
                          <>
                            <button
                              onClick={() => downloadFile(task.files[selectedFileIndex])}
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
              </div>,
              document.getElementById("root")
            )}

          {/* Delete confirmation modal for file deletion */}
          <DeleteConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => {
              setShowDeleteConfirm(false);
              setFileToDelete(null);
            }}
            onDelete={handleDeleteFile}
            title="Delete file"
            message="Are you sure you want to delete this file? This action cannot be undone."
          />
        </tr>
      )}
    </Draggable>
  );
};



export default SheetTableItem;

