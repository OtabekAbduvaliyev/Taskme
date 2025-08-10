import { Input, Select } from "antd";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { FaUserSlash } from "react-icons/fa";
import Selects from "../Selects";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Draggable } from "react-beautiful-dnd";
import { AuthContext } from "../../../../Auth/AuthContext";
import { useContext } from "react";
import testMemImg from "../../../../assets/5d3c4f61d58fc049b8def14e6d66662b.png"; // Add this import if not present

const SheetTableItem = ({
  task,
  columns,
  onChange,
  onEdit,
  index,
  isSelected,
  onSelect,
}) => {
  const { members } = useContext(AuthContext);

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
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) =>
              handleInputChange(lowerKey, { target: { value: e.target.checked } })
            }
            className="w-5 h-5 accent-pink2 bg-[#23272F] border-[#3A3A3A] rounded focus:ring-pink2"
          />
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
    if (lowerKey === "member") {
      if (!members || members.length === 0) {
        return (
          <div className="flex items-center justify-center w-full h-full">
            <FaUserSlash className="text-gray4 w-[22px] h-[22px]" title="No members exist" />
          </div>
        );
      }
      return (
        <div className="flex items-center -space-x-4">
          {members.map((member, index) => (
            <img
              key={member.id}
              src={
                member.user.avatar?.path
                  ? `https://eventify.preview.uz/${member.user.avatar?.path}`
                  : testMemImg
              }
              alt={member.user.firstName || "Member Image"}
              className="w-[30px] h-[30px] 2xl:w-[35px] 2xl:h-[35px] rounded-full object-cover border-2 border-[#1a1a2e]"
              style={{ zIndex: members.length - index }}
            />
          ))}
        </div>
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
          <td className="w-[48px] py-[16px] px-[11px] flex items-center justify-center border-r border-r-[black] sticky left-0 bg-grayDash z-10">
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(task.id);
              }}
              className="cursor-pointer w-[20px] h-[20px] flex items-center justify-center"
            >
              {isSelected ? (
                <RiCheckboxLine
                  className="text-pink2 w-[20px] h-[20px]"
                  style={{ strokeWidth: "0.5" }}
                />
              ) : (
                <RiCheckboxBlankLine
                  className="text-gray4 w-[20px] h-[20px]"
                  style={{ strokeWidth: "0.5" }}
                />
              )}
            </div>
          </td>

          {columns?.map(
            (column, idx) =>
              column.show && (
                <td
                  key={idx}
                  className={`w-[180px] flex items-center justify-between py-[16px] border-r border-r-[black] px-[11px]${
                    columns.filter(c => c.show).findIndex((c, i) => i === idx) === 0
                      ? " sticky left-[48px] z-10 bg-grayDash"
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
