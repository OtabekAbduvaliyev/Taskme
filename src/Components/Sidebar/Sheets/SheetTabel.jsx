import React, { useState, useCallback, useContext, useEffect, useRef } from "react";
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
import { IoMdChatbubbles } from "react-icons/io";
import AnimatedNoData from "./SheetsSmallComps/AnimatedNoData";
import swal from "sweetalert";
import { AnimatePresence, motion } from "framer-motion";
import DeleteConfirmationModal from "../../Modals/DeleteConfirmationModal";
import { Dropdown, Menu } from "antd";
import { MdEdit, MdDelete } from "react-icons/md";
import TaskChatSidebar from "./SheetsSmallComps/TaskChatSidebar";

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
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  const [tasksToDelete, setTasksToDelete] = useState([]);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [chatTask, setChatTask] = useState(null);
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

  // Use filteredTasks as-is for pagination (do not sort here)
  const paginatedTasks = filteredTasks.slice(indexOfFirstItem, indexOfLastItem);

  // Modified function to handle task deletion without page reload

  // Task delete handler
  const handleDeleteTasks = () => {
    setTasksToDelete(selectedTasks);
    setIsDeleteTaskModalOpen(true);
  };

  const confirmDeleteTasks = async () => {
    if (!tasksToDelete.length) return;
    try {
      // Delete each task by ID
      await Promise.all(
        tasksToDelete.map((taskId) =>
          axiosInstance.delete(`/task/${taskId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );
      // Remove deleted tasks from filteredTasks
      setFilteredTasks((prev) =>
        prev.filter((task) => !tasksToDelete.includes(task.id))
      );
      setSelectedTasks([]);
    } catch (err) {
      // Optionally handle error
    }
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

  useEffect(() => {
    if (isCreatingTask === false && filteredTasks.length > 0) {
      // Find the newest task (assuming sorted newest first)
      lastCreatedTaskIdRef.current = filteredTasks[0]?.id;
    }
  }, [isCreatingTask, filteredTasks]);

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
      {/* Delete Confirmation Modal for tasks */}
      <DeleteConfirmationModal
        isOpen={isDeleteTaskModalOpen}
        onClose={() => {
          setIsDeleteTaskModalOpen(false);
          setTasksToDelete([]);
        }}
        onDelete={confirmDeleteTasks}
        title="Delete Task(s)"
        message="Are you sure you want to delete the selected task(s)? This action cannot be undone."
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
                      checked={selectedTasks.length === filteredTasks.length}
                      readOnly
                      className="peer appearance-none w-5 h-5 m-0 p-0 absolute opacity-0 cursor-pointer"
                      style={{ zIndex: 2 }}
                    />
                    <span
                      className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        transition-colors duration-150
                        ${selectedTasks.length === filteredTasks.length ? "bg-pink2 border-pink2" : "bg-[#23272F] border-[#3A3A3A]"} peer-focus:ring-2 peer-focus:ring-pink2
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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </label>
                </td>
                <td
                  className="w-[44px] sm:w-[48px] py-[12px] sm:py-[16px] px-[8px] sm:px-[11px] flex items-center justify-center border-r border-r-[black] cursor-pointer bg-grayDash sticky left-[44px] sm:left-[48px] z-30 top-0"
                >
                  <div className="chat w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] flex items-center justify-center">
                    <IoMdChatbubbles className="text-gray4 w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" />
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
                          // Make the first data column sticky (third column overall)
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
                                      className={`w-[140px] sm:w-[160px] md:w-[180px] flex items-center justify-between py-[12px] sm:py-[16px] border-r border-[black] px-[8px] sm:px-[11px] hide
                                        ${isFirst ? "sticky left-[88px] sm:left-[96px] bg-grayDash top-0 z-20" : ""}
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
                          className="w-[44px] sm:w-[50px] flex items-end justify-center py-[12px] sm:py-[16px] border-r border-[black] px-[8px] sm:px-[11px] cursor-pointer bg-grayDash sticky right-0 top-0"
                          onClick={handleToggleModal}
                        >
                          <IoAddCircleOutline className="text-[18px] sm:text-[20px] text-gray4" />
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
                        stickyFirstThreeColumns
                        onChatIconClick={() => handleOpenChatSidebar(task)}
                        autoFocus={task.id === lastCreatedTaskIdRef.current && index === 0}
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
