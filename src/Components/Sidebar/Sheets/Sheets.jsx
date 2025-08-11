import {
  Dropdown,
  Input,
  Modal,
  Space,
  Tooltip,
  Avatar,
  Badge,
  Popover,
} from "antd";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { BsTable, BsThreeDotsVertical } from "react-icons/bs";
import { IoAddCircleOutline, IoSearch } from "react-icons/io5";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../../Auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../../AxiosInctance/AxiosInctance";
import { MdDelete, MdEdit } from "react-icons/md";
import { IoMdCalendar } from "react-icons/io";
import { CiFilter } from "react-icons/ci";
import { FaListUl } from "react-icons/fa";
import SheetTabel from "./SheetTabel";
import CreateSheetFormModal from "./CreateEditSheetFormModal";
import { AnimatePresence, motion } from "framer-motion";
import Calendar from "react-calendar"; // You may need to install this or use a placeholder
import "react-calendar/dist/Calendar.css";
import SheetList from "./SheetList";
import SheetCalendar from "./SheetCalendar";
import DeleteConfirmationModal from "../../../Components/Modals/DeleteConfirmationModal";
import Selecter from "../../Pagination and selecter/Selecter";
import MoveTaskModal from "../../../Components/Modals/MoveTaskModal";
import Toast from "../../../Components/Modals/Toast";

const Sheets = () => {
  const { id } = useParams(); // workspace ID
  const { sheetId } = useParams(); // sheet ID
  const [editingSheetId, setEditingSheetId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSheetName, setEditingSheetName] = useState("");
  const [editingSheetOrder, setEditingSheetOrder] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { createTask } = useContext(AuthContext);
  const [view, setView] = useState("table"); // 'table', 'list', 'calendar'

  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const {
    isLoading,
    error,
    data: sheets,
    refetch,
  } = useQuery({
    queryKey: ["sheets", id],
    queryFn: async () => {
      const response = await axiosInstance.get(`/workspace/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 300000,
    enabled: !!id,
  });

  useEffect(() => {
    if (sheets?.sheets.length && !sheetId) {
      // Navigate to the first sheet if sheetId is not provided
      navigate(`/dashboard/workspace/${id}/${sheets.sheets[0].id}`);
    }
  }, [sheets, sheetId, id, navigate]);

  const handleToggleModal = useCallback(async () => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setIsEditing(false);
      // setSheet({ name: "", workspaceId: id });
      setEditingSheetId(null);
    }
  }, [isOpen, id]);

  const handleEdit = (workspace) => {
    setIsEditing(true);
    setEditingSheetId(workspace.id);
    setEditingSheetOrder(workspace.order);
    setEditingSheetName(workspace.name);
    setIsOpen(true);
  };

  const handleDelete = async (sheetIdToDelete) => {
    await axiosInstance.delete(`/sheet/${sheetIdToDelete}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setDeleteModalOpen(false);
    setSheetToDelete(null);
    await refetch();
    // Remove deleted sheetId from URL
    if (sheets?.sheets) {
      const remainingSheets = sheets.sheets.filter(s => s.id !== sheetIdToDelete);
      if (remainingSheets.length > 0) {
        navigate(`/dashboard/workspace/${id}/${remainingSheets[0].id}`);
      } else {
        navigate(`/dashboard/workspace/${id}`);
      }
    } else {
      navigate(`/dashboard/workspace/${id}`);
    }
  };

  const items = (sheetId, sheetOrder, sheetName) => [
    {
      key: "1",
      label: (
        <Link
          className="flex items-center gap-[20px]"
          onClick={() =>
            handleEdit({ id: sheetId, order: sheetOrder, name: sheetName })
          }
        >
          <p className="text-[14px] font-radioCanada">Edit</p>
          <MdEdit />
        </Link>
      ),
    },
    {
      key: "2",
      label: (
        <div
          className="flex items-center gap-[10px] text-red-500"
          onClick={() => {
            setSheetToDelete(sheetId);
            setDeleteModalOpen(true);
          }}
        >
          <p className="text-[14px] font-radioCanada">Delete</p>
          <MdDelete />
        </div>
      ),
      disabled: false,
    },
  ];
const credentails = {
  key: "name",
  value: searchQuery
};

const {
  isLoading: taskLoading,
  error: errorTask,
  data,
  refetch: taskRefetch,
} = useQuery({
  queryKey: ["tasks", sheetId, searchQuery],
  queryFn: async () => {
    const url = `task/${sheetId}`;
    return await axiosInstance.get(url, {
      // params: {
      //   search: "key"
      // },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
  // ✅ will only call if sheetId exists AND searchQuery is not empty
  enabled: !!sheetId 
});

console.log(data);


  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const addNewTask = async () => {
    setIsCreatingTask(true);
    const newTask = {
      sheetId: sheetId, // unique ID for each task
      name: "",
      status: "",
      // members: [
      //   members[0]?.id // default member ID
      // ],
      priority: "",
      link: "",
      price: 100,
      paid: true,
      // startDate: "Jan 19,2034",
      // endDate: "Jan 19,2034",
    };
    await createTask(newTask);
    taskRefetch();
    setIsCreatingTask(false);
  };

  const [filteredTasks, setFilteredTasks] = useState([]);

  useEffect(() => {
    if (data?.data?.tasks) {
      setFilteredTasks(data.data.tasks);
    }
  }, [data?.data?.tasks]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchParams(value.trim() ? { search: value } : {});
    // No need to filter client-side, just update the search param
  };

  const tasks = filteredTasks;

  const handleSheetCreated = (newSheet) => {
    if (newSheet && newSheet.id) {
      navigate(`/dashboard/workspace/${id}/${newSheet.id}`);
      setToast({
        isOpen: true,
        type: "success",
        message: "Sheet created successfully!",
      });
    }
  };

  // LIFTED STATE
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Add state for task delete confirmation modal
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);

  // LIFTED: handleMoveTask
  const handleMoveTask = () => {
    if (selectedTasks.length === 1) {
      setIsMoveModalOpen(true);
    }
  };

  // Change handleDeleteTasks to open modal
  const handleDeleteTasks = () => {
    setIsDeleteTaskModalOpen(true);
  };

  // Confirm delete handler
  const confirmDeleteTasks = async () => {
    for (const taskId of selectedTasks) {
      await axiosInstance.delete(`/task/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    setSelectedTasks([]);
    setIsDeleteTaskModalOpen(false);
    setCurrentPage(1);
    refetch();
  };

  // Add this toast state definition
  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  return (
    <>
      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />
      {/* Delete Confirmation Modal for sheets */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSheetToDelete(null);
        }}
        onDelete={() => sheetToDelete && handleDelete(sheetToDelete)}
        title="Delete Sheet"
        message="Are you sure you want to delete this sheet? This action cannot be undone."
      />
      {/* Delete Confirmation Modal for tasks */}
      <DeleteConfirmationModal
        isOpen={isDeleteTaskModalOpen}
        onClose={() => setIsDeleteTaskModalOpen(false)}
        onDelete={confirmDeleteTasks}
        title="Delete Task(s)"
        message="Are you sure you want to delete the selected task(s)? This action cannot be undone."
      />
      <div className=" h-[calc(100vh-40px)] flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={sheetId || "sheet-list"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex flex-col h-full"
          >
            {/* 1. Sheet Tabs - sticky top */}
            <div className="sheets mt-[27px] text-white gap-[10px] flex sticky top-0  pb-2">
              <CreateSheetFormModal
                handleToggleModal={handleToggleModal}
                isOpen={isOpen}
                refetch={refetch}
                isEditing={isEditing}
                editingSheetId={editingSheetId}
                editingSheetOrder={editingSheetOrder}
                editingSheetName={editingSheetName}
                onSheetCreated={handleSheetCreated}
              />
              {sheets?.sheets.map((sheet) => (
                <Link
                  key={sheet.id}
                  to={`/dashboard/workspace/${id}/${sheet.id}`}
                  className="sheet flex items-center gap-[6px] hover:bg-gray transition-all duration-1000 bg-grayDash rounded-[9px] pl-[12px] pr-[6px] py-[6px] inline-flex cursor-pointer"
                >
                  <p>{!sheet.name == "" ? sheet.name : "Untitled"}</p>
                  <Dropdown
                    trigger={["click"]}
                    menu={{ items: items(sheet.id, sheet.order, sheet.name) }}
                  >
                    <a onClick={(e) => e.preventDefault()}>
                      <Space>
                        <BsThreeDotsVertical
                          className={`cursor-pointer text-[10px] ${sheetId == sheet.id ? "block" : "hidden"
                            }`}
                        />
                      </Space>
                    </a>
                  </Dropdown>
                </Link>
              ))}

              <div
                className="sheet flex items-center gap-[6px] bg-grayDash rounded-[9px] hover:bg-gray transition-all duration-1000 px-[6px] py-[7px] cursor-pointer"
                onClick={handleToggleModal}
              >
                <IoAddCircleOutline className="text-[20px]" />
              </div>
            </div>
            {/* 2. Sheet Actions - sticky below tabs */}
            {sheetId && (
              <motion.div
                key="sheet-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="sheetActions flex gap-[14px] items-center justify-between pb-[12px] 2xl:pb-[20px]  sticky mt-[12px] 2xl:mt-[20px] top-[70px] "
              // top-[70px] may need adjustment depending on tabs height
              >
                <div className="flex gap-[18px]">
                  <div className="newProject">
                    <button
                      className="flex bg-white py-[11.5px] px-[12px] items-center rounded-[9px] text-pink2 gap-[10px]"
                      onClick={addNewTask}
                    >
                      <IoAddCircleOutline className="text-[22px]" />
                      <p className="font-[500] text-[14px]">New project</p>
                    </button>
                  </div>
                  <div className="search inputsr">
                    <Input
                      prefix={<IoSearch className="text-[21px]" />}
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="bg-grayDash font-radioCanada text-[14px] hover:bg-grayDash outline-none text-white active:bg-grayDash focus:bg-grayDash overflow-hidden border-none w-[210px] h-[46px]"
                    />
                  </div>
                </div>
                <div className="items-center flex gap-[16px] ">
                  <div
                    className={`text-white flex items-center gap-[6px] hover:cursor-pointer ${view === "table" ? "font-bold underline" : ""
                      }`}
                    onClick={() => setView("table")}
                  >
                    <BsTable />
                    <p>Table</p>
                  </div>
                  <div
                    className={`text-white flex items-center gap-[6px] hover:cursor-pointer ${view === "list" ? "font-bold underline" : ""
                      }`}
                    onClick={() => setView("list")}
                  >
                    <FaListUl className="text-[18px]" />
                    <p>List</p>
                  </div>
                  <div
                    className={`text-white flex items-center gap-[6px] hover:cursor-pointer ${view === "calendar" ? "font-bold underline" : ""
                      }`}
                    onClick={() => setView("calendar")}
                  >
                    <IoMdCalendar className="text-[21px]" />
                    <p>Calendar</p>
                  </div>
                </div>
              </motion.div>
            )}
            {/* 3. Task View - scrollable middle */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 mt-[10px] mb-[20px] rounded-[12px]">
              <AnimatePresence mode="wait">
                {isCreatingTask ? (
                  <motion.div
                    key="creating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-[26px]"
                  >
                    <div className="animate-pulse bg-grayDash rounded-[12px] h-[100px] flex items-center justify-center">
                      <div className="text-gray4 text-[20px] font-radioCanada">
                        Creating...
                      </div>
                    </div>
                  </motion.div>
                ) : isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-[26px]"
                  >
                    <div className="animate-pulse bg-grayDash rounded-[12px] h-[400px] flex items-center justify-center">
                      <div className="text-gray4 text-[20px] font-radioCanada">
                        Loading...
                      </div>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-[26px]"
                  >
                    <div className="bg-grayDash rounded-[12px] font-radioCanada text-center text-red-400 py-10">
                      Error loading sheets.
                    </div>
                  </motion.div>
                ) : !sheets?.sheets?.length ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-[26px]"
                  >
                    <div className="bg-grayDash rounded-[12px] font-radioCanada text-center text-gray2 py-10">
                      No sheets found. Create a new sheet to get started!
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  >
                    {view === "table" && (
                      <SheetTabel
                        tasks={tasks}
                        isEditing={isEditing}
                        selectedTasks={selectedTasks}
                        setSelectedTasks={setSelectedTasks}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={setItemsPerPage}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        deleteModalOpen={deleteModalOpen}
                        setDeleteModalOpen={setDeleteModalOpen}
                        handleMoveTask={handleMoveTask}
                        filteredTasks={filteredTasks}
                        setFilteredTasks={setFilteredTasks}
                        isMoveModalOpen={isMoveModalOpen}
                        setIsMoveModalOpen={setIsMoveModalOpen}
                        handleDeleteTasks={handleDeleteTasks}
                      />
                    )}
                    {view === "list" && <SheetList tasks={tasks} />}
                    {view === "calendar" && <SheetCalendar tasks={tasks} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* 4. Selecter - sticky/fixed bottom */}
            {sheetId && (<div className="sticky bottom-0 left-0 w-full z-99 pt-2 pb-6">
              <Selecter
                selectedTasks={selectedTasks}
                setItemsPerPage={setItemsPerPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                filteredTasks={filteredTasks}
                setSelectedTasks={setSelectedTasks}
                handleMoveTask={handleMoveTask}
                setDeleteModalOpen={setDeleteModalOpen}
                isHidden={false}
                handleDeleteTasks={handleDeleteTasks}
              />
            </div>)}
            {/* MoveTaskModal rendered at parent level */}
            {isMoveModalOpen && selectedTasks.length === 1 && (
              <MoveTaskModal
                isOpen={isMoveModalOpen}
                onClose={() => {
                  setIsMoveModalOpen(false);
                  setSelectedTasks([]);
                }}
                taskId={selectedTasks[0]}
                onTaskMoved={(taskId) => {
                  // Remove the moved task from the list
                  setFilteredTasks((prevTasks) =>
                    prevTasks.filter((task) => task.id !== taskId)
                  );
                  setSelectedTasks((prevSelected) =>
                    prevSelected.filter((id) => id !== taskId)
                  );
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};



export default Sheets;
