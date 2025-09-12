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
import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { BsTable, BsThreeDotsVertical } from "react-icons/bs";
import { IoAddCircleOutline, IoFilterCircleOutline, IoSearch } from "react-icons/io5";
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
import SheetList from "./SheetList";
import SheetCalendar from "./SheetCalendar";
import DeleteConfirmationModal from "../../../Components/Modals/DeleteConfirmationModal";
import Selecter from "../../Pagination and selecter/Selecter";
import MoveTaskModal from "../../../Components/Modals/MoveTaskModal";
import Toast from "../../../Components/Modals/Toast";
import UpgradePlanModal from "../../Modals/UpgradePlanModal";
import SortPanel from '../../../Components/SortPanel/SortPanel';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [sortFields, setSortFields] = useState({});
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { createTask, dndOrdersSheets } = useContext(AuthContext);

  // Fetch live user info to determine role and permissions dynamically
  const {
    data: userInfoRes,
  } = useQuery({
    queryKey: ["userinfo"],
    queryFn: async () => await axiosInstance.get("/user/info", { headers: { Authorization: `Bearer ${token}` } }),
    staleTime: 300000,
  });
  const userInfo = userInfoRes?.data || {};
  const selectedRole = Array.isArray(userInfo?.roles)
    ? userInfo.roles.find((r) => r?.id === userInfo?.selectedRole)
    : null;
  const isAuthor = String(selectedRole?.type || '').toUpperCase() === 'AUTHOR';
  // Permissions for non-authors live under role.member.permissions
  const rawPermissions = Array.isArray(selectedRole?.member?.permissions)
    ? selectedRole.member.permissions
    : [];
  const normPermissions = rawPermissions.map((p) => String(p || '').toLowerCase());
  const hasAll = isAuthor || normPermissions.includes('all');
  const canCreate = hasAll || normPermissions.includes('create');
  const canEdit = hasAll || normPermissions.includes('update'); // NEW: allow editing when 'update' permission present
  const canRead = hasAll || normPermissions.includes('read');
  // Read URL search params first so we can initialize state from them
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const initialPage = parseInt(searchParams.get("page")) || 1;
  const initialLimit = parseInt(searchParams.get("limit")) || 10;
  const initialView = searchParams.get("view") || "table";

  const [view, setView] = useState(initialView); // 'table', 'list', 'calendar'
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  //Sort panel state
  const [sortPanel, setSortPanel] = useState(false);
  // Filters panel state (moved to parent so button sits in the actions bar)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const toggleFiltersPanel = () => setFiltersOpen((p) => !p);

  // Add this line to define the ref before using it
  const filtersButtonRef = useRef(null);

  // pagination meta from server
  const [pagination, setPagination] = useState({
    page: initialPage,
    pages: 1,
    limit: initialLimit,
    count: 0,
  });

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
    enabled: !!id && canRead,
  });
  // Local optimistic sheets ordering for smooth DnD UI
  const [localSheets, setLocalSheets] = useState([]);
  // Keep localSheets in sync when server data arrives or changes
  useEffect(() => {
    setLocalSheets(sheets?.sheets ? [...sheets.sheets] : []);
  }, [sheets]);
  useEffect(() => {
    if (sheets?.sheets.length && !sheetId) {
      // Navigate to the newest sheet (assumes backend appends new sheets to the end)
      const qs = searchParams.toString();
      const newestSheet = sheets.sheets[sheets.sheets.length - 1];
      if (newestSheet) {
        navigate(
          `/dashboard/workspace/${id}/${newestSheet.id}${qs ? `?${qs}` : ""}`
        );
      }
    }
  }, [sheets, sheetId, id, navigate, searchParams]);

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
    // Remove deleted sheetId from URL and navigate to newest remaining sheet (if any)
    if (sheets?.sheets) {
      const remainingSheets = sheets.sheets.filter(s => s.id !== sheetIdToDelete);
      if (remainingSheets.length > 0) {
        const qs = searchParams.toString();
        const nextSheet = remainingSheets[remainingSheets.length - 1]; // newest remaining
        navigate(
          `/dashboard/workspace/${id}/${nextSheet.id}${qs ? `?${qs}` : ""}`
        );
      } else {
        const qs = searchParams.toString();
        navigate(`/dashboard/workspace/${id}${qs ? `?${qs}` : ""}`);
      }
    } else {
      const qs = searchParams.toString();
      navigate(`/dashboard/workspace/${id}${qs ? `?${qs}` : ""}`);
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
    data: taskResponse,
    refetch: taskRefetch,
  } = useQuery({
    queryKey: ["tasks", sheetId, searchQuery, currentPage, itemsPerPage, sortFields],
    queryFn: async () => {
      const url = `task/${sheetId}`;
      const params = new URLSearchParams();
      
      // Add all query parameters
      if (searchQuery) params.set('search', searchQuery);
      params.set('page', String(currentPage));
      params.set('limit', String(itemsPerPage));
      if (Object.keys(sortFields).length) {
        params.set('filters', JSON.stringify(sortFields));
      }

      const res = await axiosInstance.get(url, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data; // expected shape: { tasks: [...], pagination: { page, pages, limit, count } }
    },
    enabled: !!sheetId,
  });

  // console.log(taskResponse);

  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const addNewTask = async () => {
    if (!canCreate) return;
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
    await taskRefetch();
    setIsCreatingTask(false);
  };

  const [filteredTasks, setFilteredTasks] = useState([]);

  // use server-side pagination: update filteredTasks + pagination meta when response arrives
  useEffect(() => {
    if (taskResponse?.tasks) {
      // use server ordering; directly set tasks returned by backend
      setFilteredTasks(taskResponse.tasks);
      if (taskResponse.pagination) {
        setPagination({
          page: taskResponse.pagination.page || 1,
          pages: taskResponse.pagination.pages || 1,
          limit: taskResponse.pagination.limit || itemsPerPage,
          count: taskResponse.pagination.count || taskResponse.tasks.length,
        });
        // keep currentPage in sync with server (helps when links share page)
        setCurrentPage(taskResponse.pagination.page || 1);
      } else {
        setPagination((p) => ({ ...p, count: taskResponse.tasks.length }));
      }
    } else {
      // if no tasks returned, clear list
      setFilteredTasks([]);
      setPagination((p) => ({ ...p, count: 0, pages: 1 }));
    }
  }, [taskResponse, itemsPerPage]);

  // Sync state -> URL so page/limit/view/search/sort are shareable
  useEffect(() => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (currentPage && currentPage > 1) params.page = String(currentPage);
    if (itemsPerPage && itemsPerPage !== 10) params.limit = String(itemsPerPage);
    if (view && view !== "table") params.view = view;
    if (Object.keys(sortFields).length) params.sort = JSON.stringify(sortFields);
    // replace to avoid pushing many entries into history during quick interactions
    setSearchParams(params, { replace: true });
  }, [currentPage, itemsPerPage, view, searchQuery, sortFields, setSearchParams]);

  const handleSearch = (e) => {
    const value = e.target.value;
    // Update search param; currentPage reset to 1 (effect will sync URL)
    setSearchParams(value.trim() ? { search: value } : {});
    setCurrentPage(1);
    // No need to filter client-side, just update the search param
  };

  const tasks = filteredTasks;

  const handleSheetCreated = (newSheet) => {
    if (newSheet && newSheet.id) {
      // preserve current query params when navigating to newly created sheet
      const qs = searchParams.toString();
      navigate(
        `/dashboard/workspace/${id}/${newSheet.id}${qs ? `?${qs}` : ""}`
      );
      setToast({
        isOpen: true,
        type: "success",
        message: "Sheet created successfully!",
      });
    }
  };

  // LIFTED STATE


  // Add state for task delete confirmation modal
  const [isDeleteTaskModalOpen, setIsDeleteTaskModalOpen] = useState(false);
  // track deleting tasks for modal loading state
  const [deletingTasks, setDeletingTasks] = useState([]);

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
    if (!selectedTasks.length) return;
    setDeletingTasks([...selectedTasks]); // show loading on modal
    try {
      // Use bulk delete endpoint instead of deleting one-by-one
      await axiosInstance.post(
        "/task/bulk-delete",
        { taskIds: selectedTasks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update UI after successful bulk delete
      setSelectedTasks([]);
      setIsDeleteTaskModalOpen(false);
      setCurrentPage(1);
      try { await taskRefetch(); } catch (_) { }
    } catch (err) {
      // optionally show an error toast or log
      console.error("Bulk delete tasks error:", err);
    } finally {
      setDeletingTasks([]);
    }
  };

  // Add this toast state definition
  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  // Fetch current plan for sheet limit
  const {
    data: currentPlan,
    isLoading: planLoading,
    error: planError,
  } = useQuery({
    queryKey: ["currentPlan"],
    queryFn: async () => {
      const response = await axiosInstance.get("/company/current-plan", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    staleTime: 300000,
  });

  // Determine sheet add eligibility (treat -1 as unlimited)
  const sheetLimitReached =
    currentPlan &&
    typeof currentPlan.maxSheets === "number" &&
    currentPlan.maxSheets !== -1 && // do not enforce limit when -1
    sheets &&
    sheets.sheets &&
    sheets.sheets.length >= currentPlan.maxSheets;

  // human-friendly display for max sheets
  const displayMaxSheets =
    currentPlan && typeof currentPlan.maxSheets === "number"
      ? currentPlan.maxSheets === -1
        ? "Unlimited"
        : currentPlan.maxSheets
      : "";

  // Add this handler so calendar "Open task" can switch to table and focus the task
  const handleOpenTaskFromCalendar = (taskId) => {
    if (!taskId) return;
    // switch to table view
    setView("table");
    // set selected task(s) so table shows it as selected
    setSelectedTasks([taskId]);
    // optionally navigate to page 1 so task is visible (adjust if you have server-side paging logic)
    setCurrentPage(1);
    // dispatch event for any components that need to focus the specific row
    try {
      window.dispatchEvent(new CustomEvent("focusTask", { detail: { taskId } }));
    } catch (e) {
      // ignore; old browsers may not support CustomEvent constructor
    }
  };

  const handleSort = (newSortFields) => {
    setSortFields(newSortFields);
    setSortPanelOpen(false);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // New: compute stable sorted tabs order (server order ascending)
  // Use localSheets (optimistic) if present, otherwise fall back to server sheets.
  const sortedSheetsTabs = (localSheets && localSheets.length)
    ? [...localSheets].sort((a, b) => (a.order || 0) - (b.order || 0))
    : (sheets?.sheets ? [...sheets.sheets].sort((a, b) => (a.order || 0) - (b.order || 0)) : []);

  // Handle DnD end for sheet tabs
  const handleOnDragEnd = React.useCallback(
    async (result) => {
      if (!result.destination || !sheets?.sheets) return;
      try {
        // create local optimistic reorder so UI is instant (works like tasks/columns)
        const current = [...sortedSheetsTabs];
        const reordered = Array.from(current);
        const [moved] = reordered.splice(result.source.index, 1);
        reordered.splice(result.destination.index, 0, moved);

        // Update local UI immediately (also update their order field for consistency)
        const optimistic = reordered.map((s, idx) => ({ ...s, order: idx + 1 }));
        setLocalSheets(optimistic);

        const sheetIds = optimistic.map((s) => s.id);
        const orders = optimistic.map((s) => s.order);
        const payload = { sheetIds, orders };

        // Persist in background. If server fails, revert by refetching.
        try {
          await dndOrdersSheets(payload);
          // optional: re-sync with server to ensure authoritative order
          try { await refetch(); } catch (_) {}
        } catch (persistErr) {
          console.error("Error persisting sheet order, reverting UI:", persistErr);
          // revert to server data
          try { await refetch(); } catch (_) {}
        }
       } catch (err) {
         console.error("Error reordering sheets:", err);
         try { await refetch(); } catch (_) {}
       }
     },
    [sortedSheetsTabs, dndOrdersSheets, sheets, refetch]
  );

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
        onClose={() => { if (deletingTasks.length) return; setIsDeleteTaskModalOpen(false); }}
        onDelete={confirmDeleteTasks}
        title="Delete Task(s)"
        message="Are you sure you want to delete the selected task(s)? This action cannot be undone."
        isLoading={deletingTasks.length > 0}
      />
      <UpgradePlanModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        message="You have reached the sheet limit for your current plan. Please upgrade your plan to add more sheets."
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
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="sheetsTabs" direction="horizontal">
                {(provided) => (
                  <div
                    className="sheets mt-[20px] sm:mt-[24px] md:mt-[27px] text-white gap-[8px] sm:gap-[10px] flex sticky top-0 pb-2 overflow-x-auto custom-scrollbar"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
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

                    {/* Render sheets in server order (ascending) so DnD indices match server payload */}
                    {sortedSheetsTabs.map((sheet, index) => {
                      const qs = searchParams.toString();
                      return (
                        <Draggable key={sheet.id} draggableId={String(sheet.id)} index={index}>
                          {(prov) => (
                            <Link
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              key={sheet.id}
                              to={`/dashboard/workspace/${id}/${sheet.id}${qs ? `?${qs}` : ""}`}
                              className={`sheet flex items-center gap-[6px] hover:bg-gray transition-colors duration-150 ease-in-out bg-grayDash rounded-[9px] pl-[10px] sm:pl-[12px] pr-[6px] py-[6px] inline-flex cursor-pointer text-[13px] sm:text-[14px] ${sheetId == sheet.id ? "bg-pink2 text-white" : "bg-grayDash"}`}
                            >
                              <p>{sheet.name ? sheet.name : "Untitled"}</p>
                              <Dropdown
                                trigger={["click"]}
                                menu={{ items: items(sheet.id, sheet.order, sheet.name) }}
                              >
                                <a onClick={(e) => e.preventDefault()}>
                                  <Space>
                                    <BsThreeDotsVertical
                                      className={`cursor-pointer text-[10px] ${sheetId == sheet.id ? "block" : "hidden"}`}
                                    />
                                  </Space>
                                </a>
                              </Dropdown>
                            </Link>
                          )}
                        </Draggable>
                      );
                    })}

                    {canCreate && (
                      <div
                        className="sheet flex items-center gap-[6px] bg-grayDash rounded-[9px] hover:bg-gray transition-all duration-1000 px-[6px] py-[7px] cursor-pointer"
                        onClick={() => {
                          if (sheetLimitReached) {
                            setUpgradeModalOpen(true);
                          } else {
                            handleToggleModal();
                          }
                        }}
                      >
                        <IoAddCircleOutline className="text-[18px] sm:text-[20px]" />
                      </div>
                    )}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
             {/* Show limit hint when reached */}
             {sheetLimitReached && canCreate && (
               <div className="mt-2">
                 <p className="text-red-400 text-xs">
                   Sheet limit reached for your plan ({displayMaxSheets}). Upgrade to add more.
                 </p>
               </div>
             )}

            {/* 2. Sheet Actions - sticky below tabs */}
            {sheetId && (
              <motion.div
                key="sheet-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="sheetActions flex gap-[12px] sm:gap-[14px] items-center justify-between pb-[10px] sm:pb-[12px] 2xl:pb-[20px] sticky mt-[10px] sm:mt-[12px] 2xl:mt-[20px] top-[70px] flex-wrap"
              // top-[70px] may need adjustment depending on Pabs height
              >
                <div className="flex gap-[12px] sm:gap-[18px] w-full sm:w-auto">
                  {canCreate && (
                    <div className="newProject">
                      <button
                        className="flex bg-white hover:bg-pink2 hover:text-white duration-200 py-[10px] sm:py-[11.5px] px-[10px] sm:px-[12px] items-center rounded-[9px] text-pink2 gap-[8px] sm:gap-[10px]"
                        onClick={addNewTask}
                        disabled={isCreatingTask}
                      >
                        <IoAddCircleOutline className="text-[20px] sm:text-[22px]" />
                        <p className="font-[500] text-[13px] sm:text-[14px]">
                          {isCreatingTask ? "Creating..." : "New Task"}
                        </p>
                      </button>
                    </div>
                  )}
                  <div className="search inputsr">
                    <Input
                      prefix={<IoSearch className="text-[18px] sm:text-[21px]" />}
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={handleSearch}
                      className="bg-grayDash font-radioCanada text-[13px] sm:text-[14px] hover:bg-grayDash outline-none text-white active:bg-grayDash focus:bg-grayDash overflow-hidden border-none w-[180px] sm:w-[210px] h-[42px] sm:h-[46px]"
                    />
                  </div>
                  {/* Filters button moved here next to search input */}
                  <div
                    ref={filtersButtonRef}
                    className="text-white flex items-center gap-[6px] hover:cursor-pointer px-3 py-2 rounded bg-grayDash hover:bg-pink2 duration-200"
                    onClick={toggleFiltersPanel}
                  >
                    <CiFilter className="text-[16px]" />
                    <p className="text-[13px] sm:text-[14px]">Filters</p>
                  </div>
                  <div
                    ref={filtersButtonRef}
                    className="text-white flex items-center gap-[6px] hover:cursor-pointer px-3 py-2 rounded bg-grayDash hover:bg-pink2 duration-200"
                    onClick={() => setSortPanelOpen(true)}
                  >
                    <IoFilterCircleOutline className="text-[16px]" />
                    <p className="text-[13px] sm:text-[14px]">Sort</p>
                  </div>
                </div>
                <div className="items-center flex gap-[12px] sm:gap-[16px] w-full sm:w-auto justify-end">
                  <div
                    className={`text-white flex items-center gap-[6px] hover:cursor-pointer ${view === "table" ? "font-bold underline" : ""
                      }`}
                    onClick={() => setView("table")}
                  >
                    <BsTable />
                    <p className="text-[13px] sm:text-[14px]">Table</p>
                  </div>
                  {/* <div
                    className={`text-white flex items-center gap-[6px] hover:cursor-pointer ${view === "list" ? "font-bold underline" : ""
                      }`}
                    onClick={() => setView("list")}
                  >
                    <FaListUl className="text-[16px] sm:text-[18px]" />
                    <p className="text-[13px] sm:text-[14px]">List</p>
                  </div> */}
                  <div
                    className={`text-white flex items-center gap-[6px] hover:cursor-pointer ${view === "calendar" ? "font-bold underline" : ""
                      }`}
                    onClick={() => setView("calendar")}
                  >
                    <IoMdCalendar className="text-[18px] sm:text-[21px]" />
                    <p className="text-[13px] sm:text-[14px]">Calendar</p>
                  </div>
                </div>
              </motion.div>
            )}
            {/* Sort Panel - can be a modal or a side panel; for simplicity, use a basic implementation */}
            {sortPanel && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              </div>
            )}
            {/* 3. Task View - scrollable middle */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 mt-[10px] mb-[110px] md:mb-[100px]  rounded-[12px]">
              <AnimatePresence mode="wait">
                {isLoading ? (
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
                    <div className="bg-grayDash rounded-[12px] font-radioCanada text-center py-10">
                      <div className="text-gray2 mb-6">
                        No sheets found. Create your first sheet to get started!
                      </div>

                      {/* Add Sheet Button - similar to addWorkspaceButton */}
                      <div className="addSheetButton max-w-md mx-auto">
                        {canCreate ? (
                          <button
                            className="flex items-center gap-3 text-white px-[19px] bg-white w-full justify-between py-[12px] rounded-[9px] transition-all duration-200"
                            onClick={() => {
                              if (sheetLimitReached) {
                                setUpgradeModalOpen(true);
                              } else {
                                handleToggleModal();
                              }
                            }}
                            aria-disabled={sheetLimitReached}
                          >
                            <IoAddCircleOutline className="text-gray4 text-[20px]" />
                            <p className="text-gray4 text-[14px] font-medium">
                              Create first Sheet
                            </p>
                            {currentPlan && (
                              <p className="text-pink2 text-[13px]">
                                {currentPlan.name}
                                {sheetLimitReached ? " (limit reached)" : ""}
                              </p>
                            )}
                          </button>
                        ) : (
                          <button
                            className="flex items-center gap-3 text-white px-[19px] bg-white/10 opacity-50 w-full justify-between py-[12px] rounded-[9px] transition-all duration-200 cursor-not-allowed"
                            disabled
                            title="You don't have permission to create sheets"
                          >
                            <IoAddCircleOutline className="text-gray4 text-[20px]" />
                            <p className="text-gray4 text-[14px] font-medium">
                              Create first Sheet
                            </p>
                            {currentPlan && (
                              <p className="text-pink2 text-[13px]">
                                {currentPlan.name}
                              </p>
                            )}
                          </button>
                        )}

                        {/* explanatory hint when creation is disabled */}
                        {!canCreate && (
                          <p className="text-white text-xs mt-2">
                            You don't have permission to create sheets in this workspace.
                          </p>
                        )}
                        {canCreate && sheetLimitReached && (
                          <p className="text-red-400 text-xs mt-2">
                            Sheet limit reached for your plan ({displayMaxSheets}). <button onClick={() => setUpgradeModalOpen(true)} className="underline">Upgrade</button> to add more.
                          </p>
                        )}
                      </div>
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
                        isCreatingTask={isCreatingTask}
                        taskRefetch={taskRefetch}
                        filtersOpen={filtersOpen}
                        onToggleFilters={toggleFiltersPanel}
                        filtersButtonRef={filtersButtonRef}
                        // NEW props to centralize sheet creation
                        allowCreate={canCreate && !sheetLimitReached}
                        onCreate={() => {
                          if (sheetLimitReached) {
                            setUpgradeModalOpen(true);
                          } else {
                            handleToggleModal();
                          }
                        }}
                        canEdit={canEdit} // NEW: tells table/items whether editing is permitted
                      />
                    )}
                    {view === "list" && (
                      <div className="mt-[26px] flex items-center justify-center">
                        <div className="bg-grayDash rounded-[12px] p-8 flex flex-col items-center gap-3 text-center max-w-md">
                          <FaListUl className="text-pink2 text-[36px]" />
                          <div className="text-white font-bold text-xl">Coming Soon</div>
                          <div className="text-gray4 text-sm">List view is on the way — a compact, fast-scanning layout for tasks.</div>
                          <div className="flex gap-3 mt-3">
                            <button
                              className="bg-white text-pink2 px-4 py-2 rounded"
                              onClick={() => setView("table")}
                            >
                              Open Table
                            </button>
                            <button
                              className="border border-gray-600 text-white px-4 py-2 rounded"
                              onClick={() =>
                                setToast({ isOpen: true, type: "info", message: "We'll notify you when List view is ready." })
                              }
                            >
                              Notify me
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {view === "calendar" && (
                      <div className="">
                        <SheetCalendar tasks={tasks} onOpenTask={handleOpenTaskFromCalendar} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* 4. Selecter - sticky/fixed bottom */}
            {sheetId && (
              <div className="sticky bottom-0 left-0 w-full z-99 pt-2 pb-6">
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
                  pagination={pagination}
                />
              </div>
            )}
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
            <SortPanel
              isOpen={sortPanelOpen}
              onClose={() => setSortPanelOpen(false)}
              onSort={handleSort}
              columns={sheets?.columns || []}
              currentSort={sortFields}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};
export default Sheets;

