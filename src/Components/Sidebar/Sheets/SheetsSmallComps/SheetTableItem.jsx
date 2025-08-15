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
    let value = e?.target?.value;

    if (
      ["price", "order", "number1", "number2", "number3", "number4", "number5"].includes(
        taskKey.toLowerCase()
      )
    ) {
      value = parseFloat(value) || 0;
      onChange(task.id, taskKey, value);
      return;
    }

    if (
      ["date1", "date2", "date3", "date4", "date5"].includes(taskKey.toLowerCase())
    ) {
      value = e ? e.toISOString().slice(0, 10) : null;
      onChange(task.id, taskKey, value);
      return;
    }

    onChange(task.id, taskKey, value);
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

  const renderField = (columnKey, columnType, column, colIdx) => {
    const lowerKey = columnKey.toLowerCase();
    const lowerType = columnType?.toLowerCase();

    // Dynamic SELECT dropdown with add option modal
    if (lowerType === "select" && column?.selects?.[0]?.options) {
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

    // Date fields
    if (["date1", "date2", "date3", "date4", "date5"].includes(lowerKey)) {
      const dateValue = task[lowerKey] ? new Date(task[lowerKey]) : null;
      return (
        <DatePicker
          selected={dateValue}
          onChange={(date) => handleInputChange(lowerKey, date)}
          dateFormat="yyyy-MM-dd"
          className="w-[80%] bg-grayDash text-white text-[18px] rounded px-2 py-1"
          placeholderText="Select date"
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

    // Member avatars
    if (lowerKey === "members") {
      const taskMembers = Array.isArray(task.members) ? task.members : [];
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
                    <button
                      className="px-4 py-2 rounded bg-gray3 text-white"
                      onClick={() => setShowMemberModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-pink2 text-white font-semibold disabled:opacity-60"
                      onClick={handleSaveMembers}
                      disabled={isSaving}
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
        </tr>
      )}
    </Draggable>
  );
};



export default SheetTableItem;
