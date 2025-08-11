import { Input, Select } from "antd";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { FaUserSlash } from "react-icons/fa";
import Selects from "../Selects";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Draggable } from "react-beautiful-dnd";
import { AuthContext } from "../../../../Auth/AuthContext";
import { useState, useContext } from "react";
import testMemImg from "../../../../assets/default-avatar-icon-of-social-media-user-vector.jpg"
import { IoMdChatbubbles } from "react-icons/io";
import axiosInstance from "../../../../AxiosInctance/AxiosInctance";
import { IoClose } from "react-icons/io5";

const SheetTableItem = ({
  task,
  columns,
  onChange,
  onEdit,
  index,
  isSelected,
  onSelect,
  stickyFirstThreeColumns, // new prop
  onChatIconClick, // new prop
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

  const { members: companyMembers } = useContext(AuthContext);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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

  const renderField = (columnKey, columnType, column) => {
    const lowerKey = columnKey.toLowerCase();
    const lowerType = columnType?.toLowerCase();

    // Dynamic SELECT dropdown
    if (lowerType === "select" && column?.selects?.[0]?.options) {
      return (
        <Select
          suffixIcon={null}
          onChange={(value) =>
            handleInputChange(lowerKey, { target: { value } })
          }
          defaultValue={task[lowerKey] || "Select value"}
        >
          {column.selects[0].options.map((option) => (
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
              <div className="bg-grayDash rounded-lg shadow-lg p-6 w-[340px] max-w-full">
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
                <div className="max-h-[260px] overflow-y-auto mb-4">
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
          )}
        </>
      );
    }

    // Default input
    return (
      <Input
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
                  {renderField(column.key, column.type, column)}
                </td>
              )
          )}
        </tr>
      )}
    </Draggable>
  );
};



export default SheetTableItem;
