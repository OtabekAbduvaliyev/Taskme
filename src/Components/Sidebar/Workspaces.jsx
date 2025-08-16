import { Dropdown, Space } from "antd";
import React, { useContext, useState, useCallback, useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoAddCircleOutline } from "react-icons/io5";
import { AuthContext } from "../../Auth/AuthContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useQuery, useQuery as useRQ } from "@tanstack/react-query";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { MdDelete, MdEdit } from "react-icons/md";
import { Link, useNavigate, useParams } from "react-router-dom";
import WorkspaceFormModal from "../Modals/WorkspaceFormModal";
import DeleteConfirmationModal from "../Modals/DeleteConfirmationModal";
import Toast from "../Modals/Toast";
import UpgradePlanModal from "../Modals/UpgradePlanModal";

const Workspaces = ({user}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track whether creating or editing
  const [showAll, setShowAll] = useState(false);
  const { createWorkspace, dndOrders } = useContext(AuthContext);
  const [workspaceName, setWorkspaceName] = useState({ name: "" });
  const [editingWorkspaceOrder, setEditingWorkspaceOrder] = useState(null); // Store the id of workspace being edited
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null); // Store the id of workspace being edited
  const token = localStorage.getItem("token");
  const { id: activeWorkspaceId } = useParams();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState(null);
  const [toast, setToast] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Fetch current plan
  const {
    data: currentPlan,
    isLoading: planLoading,
    error: planError,
  } = useRQ({
    queryKey: ["currentPlan"],
    queryFn: async () => {
      const response = await axiosInstance.get("/company/current-plan", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    staleTime: 300000,
  });
console.log(currentPlan);

  const {
    isLoading,
    error,
    data: workspacesData,
    refetch,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await axiosInstance.get("/workspace", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 300000, // Cache for 5 minutes
  });

  // 1. Keep user on dashboard unless they explicitly navigate or create a new workspace
  useEffect(() => {
    if (!workspacesData) return;
    // If no workspaces and a workspace id is present, redirect back to dashboard
    if (workspacesData.length === 0) {
      if (activeWorkspaceId) navigate("/dashboard", { replace: true });
      return;
    }
    // Do not auto-navigate to any workspace when workspaces exist
  }, [workspacesData, activeWorkspaceId, navigate]);

  const handleChange = (e) => {
    setWorkspaceName({ ...workspaceName, [e.target.name]: e.target.value });
  };

  const handleToggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (isOpen) {
      setIsEditing(false); // Reset state when modal closes
      setWorkspaceName({ name: "" });
      setEditingWorkspaceId(null);
    }
  }, [isOpen]);

  // 2. Workspace creation: after creating, navigate to new workspace
  const handleOk = useCallback(async () => {
    try {
      if (isEditing) {
        await axiosInstance.put(
          `/workspace/${editingWorkspaceId}`,
          { name: workspaceName.name, order: editingWorkspaceOrder },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setToast({
          isOpen: true,
          type: "success",
          message: "Workspace updated successfully!",
        });
      } else {
        // Create new workspace
        const newWorkspace = await createWorkspace(workspaceName);
        if (newWorkspace && newWorkspace.id) {
          setToast({
            isOpen: true,
            type: "success",
            message: "Workspace created successfully!",
          });

          // Place new workspace at the top (order 1), increment others
          if (workspacesData && workspacesData.length > 0) {
            const updatedWorkspaces = [
              { ...newWorkspace, order: 1 },
              ...workspacesData.map(w => ({ ...w, order: (w.order || 0) + 1 }))
            ];
            // Sort by order ascending for DND compatibility
            updatedWorkspaces.sort((a, b) => (a.order || 0) - (b.order || 0));
            const workspaceIds = updatedWorkspaces.map(w => w.id);
            const orders = updatedWorkspaces.map(w => w.order);
            await axiosInstance.put("/workspace", { workspaceIds, orders }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          // Always activate the newly created workspace
          navigate(`/dashboard/workspace/${newWorkspace.id}`, { replace: true });
        }
      }
      setWorkspaceName({ name: "" });
      handleToggleModal();
      refetch();
    } catch (error) {
      setToast({
        isOpen: true,
        type: "error",
        message: "Error creating/updating workspace.",
      });
      console.error("Error creating/updating workspace:", error);
    }
  }, [
    createWorkspace,
    workspaceName,
    isEditing,
    editingWorkspaceId,
    handleToggleModal,
    refetch,
    navigate,
    token,
    editingWorkspaceOrder,
    workspacesData,
  ]);

  // 3. Workspace deletion: after deleting, refetch and redirect if needed
  const handleDelete = async (workspaceId) => {
    try {
      await axiosInstance.delete(`/workspace/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await refetch();
      setDeleteModalOpen(false);
      setWorkspaceToDelete(null);
      setToast({
        isOpen: true,
        type: "success",
        message: "Workspace deleted successfully!",
      });

      // After deletion, activate the first workspace if any remain
      if (workspacesData && workspacesData.length > 1) {
        // Filter out the deleted workspace and sort by order descending
        const remaining = [...workspacesData]
          .filter(w => w.id !== workspaceId)
          .sort((a, b) => (b.order || 0) - (a.order || 0));
        if (remaining.length > 0) {
          navigate(`/dashboard/workspace/${remaining[0].id}`, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setToast({
        isOpen: true,
        type: "error",
        message: "Error deleting workspace.",
      });
      console.error("Error deleting workspace:", error);
    }
  };

  // Drag and drop logic (unchanged, but use workspacesData as source)
  const handleOnDragEnd = useCallback(
    (result) => {
      if (!result.destination || !workspacesData) return;
      const reorderedWorkspaces = Array.from(workspacesData);
      const [movedWorkspace] = reorderedWorkspaces.splice(
        result.source.index,
        1
      );
      reorderedWorkspaces.splice(result.destination.index, 0, movedWorkspace);
      const workspaceIds = reorderedWorkspaces.map((workspace) => workspace.id);
      const orders = reorderedWorkspaces.map((_, index) => index + 1);
      const resultData = { workspaceIds, orders };
      dndOrders(resultData);
      updateWorkspaceOrder(resultData);
    },
    [workspacesData, dndOrders]
  );

  const updateWorkspaceOrder = async (data) => {
    try {
      await axiosInstance.put("/workspace", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refetch();
    } catch (error) {
      console.error("Error updating workspace order:", error);
    }
  };

  const handleEdit = (workspace) => {
    setIsEditing(true);
    setWorkspaceName({ name: workspace.name }); // Ensure correct name is set
    setEditingWorkspaceId(workspace.id);
    setEditingWorkspaceOrder(workspace.order);
    setIsOpen(true);
  };

  const items = (workspaceId, workspaceOrder, workspaceNameValue) => [
    {
      key: "1",
      label: (
        <div
          className="flex items-center gap-[20px]"
          onClick={() =>
            handleEdit({
              id: workspaceId,
              order: workspaceOrder,
              name: workspaceNameValue, // Pass the correct name
            })
          }
        >
          <p className="text-[14px] font-radioCanada">Edit</p>
          <MdEdit />
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <div
          className="flex items-center gap-[10px] text-red-500"
          onClick={() => {
            setWorkspaceToDelete(workspaceId);
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

  // Sort workspaces by order ascending (lowest order first)
  const sortedWorkspaces = workspacesData
    ? [...workspacesData].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const visibleWorkspaces = sortedWorkspaces
    ? showAll
      ? sortedWorkspaces
      : sortedWorkspaces.slice(0, 3)
    : [];

   useEffect(() => {
     if (user?.roles && user?.selectedRole) {
       const foundRole = user.roles.find((i) => user.selectedRole === i.id);
       setSelectedRole(foundRole);
       // You may keep or remove the console logs as needed for debugging
       console.log(user);
       console.log({ userrole: foundRole });
       console.log({ selectedRole: foundRole });
     }
     // Only run when user changes
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [user]);

  // Determine workspace add eligibility (treat -1 as unlimited)
  const workspaceLimitReached =
    currentPlan &&
    typeof currentPlan.maxWorkspaces === "number" &&
    currentPlan.maxWorkspaces !== -1 && // <- do not enforce limit when -1
    workspacesData &&
    workspacesData.length >= currentPlan.maxWorkspaces;

  // human-friendly display for max workspaces
  const displayMaxWorkspaces =
    currentPlan && typeof currentPlan.maxWorkspaces === "number"
      ? currentPlan.maxWorkspaces === -1
        ? "Unlimited"
        : currentPlan.maxWorkspaces
      : "";

  return (
    <div className="bg-grayDash py-3 sm:py-[14px] md:py-[16px] px-3 sm:px-[15px] md:px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
      {/* Toast Notification */}
      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
      />
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWorkspaceToDelete(null);
        }}
        onDelete={() => workspaceToDelete && handleDelete(workspaceToDelete)}
        title="Delete Workspace"
        message="Are you sure you want to delete this workspace? This action cannot be undone."
      />
      <WorkspaceFormModal
        isOpen={isOpen}
        onClose={handleToggleModal}
        isEditing={isEditing}
        workspaceName={workspaceName}
        onWorkspaceNameChange={handleChange}
        onSubmit={handleOk}
      />
      <div className="frLine flex justify-between items-center">
        <h1 className="text-gray2 font-radioCanada text-[14px] sm:text-[15px] md:text-[16px]">Workspaces</h1>
        {workspacesData && workspacesData.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-white text-[12px] sm:text-[13px] bg-black py-[7px] px-[15px] rounded-[9px]"
          >
            {showAll ? "Show Less" : "See All"}
          </button>
        )}
      </div>
      {error ? (
        <p className="text-red-500 py-[10px]">
          Error occurred at fetching workspaces
        </p>
      ) : (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="workspaces">
            {(provided) => (
              <div
                className={`secLine my-[12px] space-y-[4px] ${
                  showAll
                    ? "h-[200px] overflow-y-auto custom-scrollbar horizontal-scroll pr-1"
                    : ""
                }`}
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {visibleWorkspaces.map((workspace, index) => (
                  <Draggable
                    key={workspace.id}
                    draggableId={workspace.id}
                    index={index}
                  >
                    {(provided) => (
                      <Link
                        to={`/dashboard/workspace/${workspace.id}`}
                        className={`workspace flex items-center text-white bg-grayDash justify-between py-[10px] pl-[21px] pr-[10px] rounded-[8px] ${
                          workspace.id === activeWorkspaceId
                            ? "bg-pink2"
                            : "bg-grayDash"
                        }`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <div className="flex items-center gap-[6px] sm:gap-[8px]">
                          <p className="text-[16px] sm:text-[18px]">#</p>
                          <p className="text-[13px] sm:text-[14px] md:text-[15px]">
                            {!isLoading ? workspace.name : "Loading"}
                          </p>
                        </div>
                        <Dropdown
                          trigger={["click"]}
                          menu={{ items: items(workspace.id, workspace.order, workspace.name) }}
                        >
                          <a onClick={(e) => e.preventDefault()}>
                            <Space>
                              <BsThreeDotsVertical className="cursor-pointer" />
                            </Space>
                          </a>
                        </Dropdown>
                      </Link>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {/* Add workspace button */}
      {selectedRole?.type !== 'MEMBER' ? (
        <div className="addWorkspacebutton">
          <button
            className="flex items-center gap-0 text-white px-[19px] bg-white w-full justify-between py-[10px] rounded-[9px]"
            onClick={() => {
              if (workspaceLimitReached) {
                setUpgradeModalOpen(true);
              } else {
                handleToggleModal();
              }
            }}
            disabled={false}
          >
            <IoAddCircleOutline className="text-gray4 text-[18px]" />
            <p className="text-gray4 text-[14px]">
              {workspacesData && workspacesData.length === 0
                ? "Create first Workspace"
                : "Add worklist"}
            </p>
            {currentPlan && (
              <p className="text-pink2 text-[13px]">
                {currentPlan.name}
                {workspaceLimitReached ? " (limit reached)" : ""}
              </p>
            )}
          </button>
          {workspaceLimitReached && (
            <p className="text-red-400 text-xs mt-1">
              Workspace limit reached for your plan ({displayMaxWorkspaces}). Upgrade to add more.
            </p>
          )}
          <UpgradePlanModal
            isOpen={upgradeModalOpen}
            onClose={() => setUpgradeModalOpen(false)}
            message="You have reached the workspace limit for your current plan. Please upgrade your plan to add more workspaces."
          />
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default Workspaces;
