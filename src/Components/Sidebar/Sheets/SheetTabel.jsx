import React, { useState, useCallback, useContext, useEffect } from "react";
import axiosInstance from "../../../AxiosInctance/AxiosInctance";
import { AuthContext } from "../../../Auth/AuthContext";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { MdDragIndicator } from "react-icons/md";
import { IoAddCircleOutline } from "react-icons/io5";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import SheetTableItem from "./SheetsSmallComps/SheetTableItem";
import CustomModal from "./SheetsSmallComps/CustomModal";
import { IoIosArrowForward } from "react-icons/io";
import noDataImage from "../../../assets/no-data.svg";
import Selecter from "../../../Components/Pagination and selecter/Selecter";
import { GoFileSymlinkFile } from "react-icons/go";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import AnimatedNoData from "./SheetsSmallComps/AnimatedNoData";
import swal from "sweetalert";
import { AnimatePresence, motion } from "framer-motion";
import DeleteConfirmationModal from "../../Modals/DeleteConfirmationModal";
import { Dropdown, Menu } from "antd";
import { MdEdit, MdDelete } from "react-icons/md";

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
}) => {
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
  const [columnContextMenu, setColumnContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    column: null,
  });
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const token = localStorage.getItem("token");
  const { createColumn, dndOrdersTasks } = useContext(AuthContext);

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

  useEffect(() => {
    if (tasks) {
      const sortedTasks = [...tasks].sort((a, b) => {
        if (typeof a.order === "number" && typeof b.order === "number") {
          return a.order - b.order;
        }
        return 0;
      });
      setTaskList(sortedTasks);
    }
    if (sheets?.columns) {
      setColumnOrder(sheets.columns.map((_, index) => index));
    }
  }, [tasks, sheets]);

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

        setFilteredTasks(reorderedTasks);

        const taskIds = reorderedTasks.map((task) => task.id);
        const orders = reorderedTasks.map((_, index) => index + 1);

        const resultData = { taskId: taskIds, orders };
        dndOrdersTasks(resultData);
      } else if (type === "COLUMN") {
        // Handle column reordering
        const reorderedColumns = Array.from(sheets.columns);
        const [movedColumn] = reorderedColumns.splice(source.index, 1);
        reorderedColumns.splice(destination.index, 0, movedColumn);

        setColumnOrder(reorderedColumns.map((_, idx) => idx)); // Update columnOrder based on the new order
        sheets.columns = reorderedColumns; // Update the columns array locally
      }
    },
    [filteredTasks, sheets, dndOrdersTasks]
  );

  // Handle task changes
  const handleColumnChange = (taskId, taskKey, value) => {
    if (taskId === editingTaskId) {
      setFilteredTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, [taskKey]: value } : task
        )
      );
    }
  };

  useEffect(() => {
    if (!editingTaskId) return;

    const intervalId = setInterval(() => {
      const editedTask = filteredTasks.find(
        (task) => task.id === editingTaskId
      );
      if (editedTask) {
        // Only send if data has changed since last sent
        const memberfixedtask = {
          ...editedTask,
          members: editedTask.members.map((member) => member.id),
        };
        const currentTaskString = JSON.stringify(memberfixedtask);
        if (currentTaskString !== lastSentTask) {
          axiosInstance
            .patch(`/task/${editingTaskId}`, memberfixedtask, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((response) => {
              setLastSentTask(currentTaskString);
              console.log("Task updated successfully:", response.data);
            })
            .catch((error) => {
              console.error("Error updating task:", error);
            });
        }
      }
    }, 300);

    return () => clearInterval(intervalId);
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

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  // Modified function to handle task deletion without page reload
  const handleDeleteSelectedTasks = async () => {
    try {
      // Delete tasks one by one asynchronously
      for (const taskId of selectedTasks) {
        try {
          await axiosInstance.delete(`/task/${taskId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          // Update both selectedTasks and filteredTasks arrays
          setSelectedTasks((prev) => prev.filter((id) => id !== taskId));
          setFilteredTasks((prev) => prev.filter((task) => task.id !== taskId));
          setTaskList((prev) => prev.filter((task) => task.id !== taskId));
        } catch (error) {
          console.error(`Error deleting task ${taskId}:`, error);
        }
      }
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error in deletion process:", error);
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  const handleMoveTaskLocal = () => {
    if (handleMoveTask) {
      handleMoveTask();
    }
  };

  const handleTaskMoved = (taskId) => {
    // Remove the moved task from the list
    setTaskList((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    setFilteredTasks((prevTasks) =>
      prevTasks.filter((task) => task.id !== taskId)
    );
    setSelectedTasks((prevSelected) =>
      prevSelected.filter((id) => id !== taskId)
    );
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
      <CustomModal
        isOpen={isOpen}
        handleToggleModal={handleToggleModal}
        column={column}
        isEditing={!!column.id}
        handleChange={handleChange}
        handleOk={handleOk}
      />

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div>
          <table className="bg-grayDash font-radioCanada w-full min-w-full">
            <thead className="border-1 text-white">
              <tr className="flex border-[black] border-b">
                {/* Sticky checkbox header cell */}
                <td
                  className="w-[48px] py-[16px] px-[11px] flex items-center justify-center border-r border-r-[black] cursor-pointer bg-grayDash sticky left-0 z-20 top-0"
                  onClick={handleSelectAllTasks}
                >
                  <div className="w-[20px] h-[20px] flex items-center justify-center">
                    {selectedTasks.length === filteredTasks.length ? (
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
                        {sheets?.columns.map((column, index) => {
                          const showColumn = column.show;
                          // Make the first column sticky
                          const isFirst = index === 0;
                          return (
                            showColumn && (
                              <Draggable
                                key={column.id}
                                draggableId={`column-${column.id}`}
                                index={index}
                              >
                                {(provided) => (
                                  <Dropdown
                                    overlay={getColumnMenu(column)}
                                    trigger={["contextMenu"]}
                                    placement="bottomLeft"
                                  >
                                    <div
                                      className={`w-[180px] flex items-center justify-between py-[16px] border-r border-[black] px-[11px] hide
                                        ${isFirst ? "sticky left-[48px] bg-grayDash top-0 " : ""}
                                      `}
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
                            )
                          );
                        })}

                        {provided.placeholder}

                        {/* Sticky Add Button */}
                        <div
                          className="w-[50px] flex items-end justify-center py-[16px] border-r border-[black] px-[11px] cursor-pointer bg-grayDash  sticky right-0 top-0"
                          onClick={handleToggleModal}
                        >
                          <IoAddCircleOutline className="text-[20px] text-gray4" />
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
                  {paginatedTasks?.map((task, index) => (
                    <tr key={task.id} className="flex border-b border-black ">
                      {/* Sticky checkbox cell in row */}
                      {/* Task data cells */}
                      {/* Render SheetTableItem, but make the first column sticky */}
                      <SheetTableItem
                        task={task}
                        columns={sheets?.columns.filter((_, idx) =>
                          columnOrder.includes(idx)
                        )}
                        index={index}
                        isSelected={selectedTasks.includes(task.id)}
                        onSelect={handleTaskSelect}
                        onEdit={() => setEditingTaskId(task.id)}
                        onChange={handleColumnChange}
                        stickyFirstColumn // <-- pass a prop to SheetTableItem to handle sticky style
                      />
                    </tr>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </div>
      </DragDropContext>
    </div>
  );
};

export default SheetTabel;
