import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../AxiosInctance/AxiosInctance";
import testMemImg from "../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import { Link, useNavigate } from "react-router-dom";

const MembersPage = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["members-page"],
    queryFn: async () => {
      const res = await axiosInstance.get("/member", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    staleTime: 300000,
  });

  const members = Array.isArray(data) ? data : [];

  // Edit modal state
  const [editingMember, setEditingMember] = useState(null);
  const [editType, setEditType] = useState("MEMBER");
  const [editPermissions, setEditPermissions] = useState("ALL");
  const [editView, setEditView] = useState("ALL");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditType(member.type || "MEMBER");
    // normalize permissions: support both array and string
    const perm =
      Array.isArray(member.permissions) && member.permissions.length > 0
        ? member.permissions[0]
        : member.permissions || "ALL";
    setEditPermissions(perm);
    setEditView(member.view || "ALL");
    setEditError("");
  };

  const closeEditModal = () => {
    setEditingMember(null);
    setEditLoading(false);
    setEditError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;
    setEditLoading(true);
    setEditError("");
    try {
      await axiosInstance.put(
        `/member/${editingMember.id}`,
        {
          type: editType,
          permissions: editPermissions,
          view: editView,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await refetch();
      closeEditModal();
    } catch (err) {
      setEditError("Failed to update member. Try again.");
      console.error("Edit member error:", err);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-full mx-auto">
        <div className="bg-grayDash py-3 px-4 rounded-[17px] shadow-xl">
          <div className="frLine flex justify-between items-center mb-3">
            <h1 className="text-gray2 text-[16px] font-radioCanada">Members</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                className="text-white text-[13px] bg-black py-[7px] px-[12px] rounded-[9px]"
              >
                Back
              </button>
              <Link
                to="/dashboard"
                className="text-white text-[13px] bg-black py-[7px] px-[12px] rounded-[9px]"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="text-white py-8 text-center">Loading members...</div>
          ) : error ? (
            <div className="text-red-400 py-4">Failed to load members</div>
          ) : members.length === 0 ? (
            <div className="text-gray2 py-6 text-center">No members found</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id || member.user?.id || Math.random()}
                  className="flex items-center gap-4 bg-[#23272F] p-3 rounded-lg"
                >
                  <img
                    src={
                      member.user?.avatar?.path
                        ? `https://eventify.preview.uz/${member.user.avatar.path}`
                        : testMemImg
                    }
                    alt={member.user?.firstName || member.user?.email || "Member"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm truncate">
                      {member.user?.firstName
                        ? `${member.user.firstName} ${member.user.lastName || ""}`.trim()
                        : member.user?.email || "Unknown User"}
                    </div>
                    <div className="text-gray2 text-xs truncate" title={member.user?.email || ""}>
                      {member.user?.email || "No email"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-pink2 font-medium mr-2">
                      {member.type || (member.member?.role || "").toUpperCase() || "MEMBER"}
                    </div>
                    <button
                      onClick={() => openEditModal(member)}
                      className="text-xs text-white bg-transparent px-2 py-1 rounded hover:bg-white/5 transition"
                      title="Edit member"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Member Modal (inline portal-less) */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeEditModal} />
          <div className="relative bg-[#1E1E1E] rounded-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Edit Member</h2>
              <button onClick={closeEditModal} className="text-gray2">
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[#777C9D] mb-1">Member Type</label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-2 px-3 text-white"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#777C9D] mb-1">Permissions</label>
                <select
                  value={editPermissions}
                  onChange={(e) => setEditPermissions(e.target.value)}
                  className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-2 px-3 text-white"
                >
                  <option value="ALL">ALL</option>
                  <option value="READ">READ</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#777C9D] mb-1">View</label>
                <select
                  value={editView}
                  onChange={(e) => setEditView(e.target.value)}
                  className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-2 px-3 text-white"
                >
                  <option value="ALL">ALL</option>
                  <option value="OWN">OWN</option>
                </select>
              </div>

              {editError && <div className="text-red-400 text-sm">{editError}</div>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 bg-[#2A2A2A] text-[#777C9D] rounded-xl py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 bg-pink2 text-white rounded-xl py-2"
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
