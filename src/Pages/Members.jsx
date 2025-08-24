import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../AxiosInctance/AxiosInctance";
import testMemImg from "../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import { Link, useNavigate, useLocation } from "react-router-dom";

// Modern and beautiful Pagination component
function ModernPagination({ total, page, pageSize, onPageChange, onPageSizeChange }) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const pageSizes = [4, 8, 16, 32];

	return (
		<div className="w-full flex items-center justify-between bg-grayDash rounded-xl px-6 py-4 mt-6 shadow-lg"> {/* added w-full so this component can stretch to its parent */}
			<div className="flex items-center gap-2 text-[#777C9D]">
				<span>Show per page</span>
				<select
					value={pageSize}
					onChange={e => onPageSizeChange(Number(e.target.value))}
					className="bg-[#23232A] border border-[#444] rounded px-2 py-1 text-[#B2B2D6] focus:outline-none"
				>
					{pageSizes.map(size => (
						<option key={size} value={size}>{size}</option>
					))}
				</select>
			</div>
			<div className="flex items-center gap-4">
				<button
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
					className="p-2 rounded hover:bg-[#29293A] disabled:opacity-40"
					aria-label="Previous"
				>
					<svg width="20" height="20" fill="none" viewBox="0 0 20 20">
						<path d="M13 15l-5-5 5-5" stroke="#B2B2D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
				<span className="text-[#B2B2D6] font-medium">
					Page {page} of {totalPages}
				</span>
				<button
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
					className="p-2 rounded hover:bg-[#29293A] disabled:opacity-40"
					aria-label="Next"
				>
					<svg width="20" height="20" fill="none" viewBox="0 0 20 20">
						<path d="M7 5l5 5-5 5" stroke="#B2B2D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
					</svg>
				</button>
			</div>
		</div>
	);
}

const MembersPage = () => {
	const token = localStorage.getItem("token");
	const navigate = useNavigate();
	const { search } = useLocation();
	// derive type from URL query (support ?type=VIEWERS as requested)
	const urlType = new URLSearchParams(search).get("type")?.toUpperCase();
	const isViewer = urlType === "VIEWERS"; // <= new flag for UI text switching
	// do not default to "MEMBER" — only request VIEWER when explicitly requested,
	// otherwise leave undefined so the backend receives no `type` filter.
	const requestType = isViewer ? "VIEWER" : (urlType || undefined);

	// Read initial page and limit from URL
	const urlParams = new URLSearchParams(search);
	const initialPage = Number(urlParams.get("page")) || 1;
	const initialPageSize = Number(urlParams.get("limit")) || 4;
	const [page, setPage] = useState(initialPage);
	const [pageSize, setPageSize] = useState(initialPageSize);

	// Only show page/limit in URL if not default
	useEffect(() => {
		const params = new URLSearchParams(search);
		if (page !== 1) {
			params.set("page", page);
		} else {
			params.delete("page");
		}
		if (pageSize !== 4) {
			params.set("limit", pageSize);
		} else {
			params.delete("limit");
		}
		navigate({ search: params.toString() }, { replace: true });
		// eslint-disable-next-line
	}, [page, pageSize]);

	const { data, isLoading, error, refetch } = useQuery({
		// include page & pageSize in queryKey so react-query caches per page
		queryKey: ["members-page", requestType, page, pageSize],
		queryFn: async () => {
			if (!token) return { items: [], total: 0 };
			// build params conditionally so `type` is omitted when not set
			const params = { page, limit: pageSize };
			if (requestType) params.type = requestType;
			const res = await axiosInstance.get("/member/paginated", {
				params,
				headers: { Authorization: `Bearer ${token}` },
			});

			// normalize response shapes into { items: [], total: number }
			const raw = res.data;
			let items = [];
			let total = 0;

			if (Array.isArray(raw)) {
				items = raw;
				total = raw.length;
			} else if (Array.isArray(raw?.members)) {
				items = raw.members;
				total = raw.total ?? raw.count ?? raw.meta?.total ?? items.length;
			} else if (Array.isArray(raw?.data?.members)) {
				items = raw.data.members;
				total = raw.total ?? raw.data?.total ?? raw.data?.meta?.total ?? items.length;
			} else if (Array.isArray(raw?.items)) {
				items = raw.items;
				total = raw.total ?? raw.count ?? raw.meta?.total ?? items.length;
			} else {
				// try to find first array inside response
				const arr = Object.values(raw || {}).find((v) => Array.isArray(v));
				if (arr) {
					items = arr;
				}
				total = raw?.total ?? raw?.count ?? raw?.meta?.total ?? items.length;
			}

			return { items: Array.isArray(items) ? items : [], total: Number(total) || items.length };
		},
		staleTime: 300000,
	});

	// data normalized to { items, total }
	const members = Array.isArray(data?.items) ? data.items : [];
	const total = Number(data?.total) || members.length;

	// Edit modal state
	const [editingMember, setEditingMember] = useState(null);
	const [editType, setEditType] = useState("MEMBER");
	// changed: permissions is an array for backend
	const [editPermissions, setEditPermissions] = useState(["ALL"]);
	const [editView, setEditView] = useState("ALL");
	const [editWorkspaces, setEditWorkspaces] = useState([]);
	const [availableWorkspaces, setAvailableWorkspaces] = useState([]);
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState("");

	// fetch available workspaces once (used in edit modal)
	useEffect(() => {
		const fetchWorkspaces = async () => {
			try {
				const res = await axiosInstance.get("/workspace", {
					headers: { Authorization: `Bearer ${token}` },
				});
				// normalize: may be array or { workspaces: [...] }
				const raw = res.data;
				const list =
					Array.isArray(raw) ? raw : raw?.workspaces || raw?.data?.workspaces || raw?.items || [];
				setAvailableWorkspaces(Array.isArray(list) ? list : []);
			} catch (err) {
				console.error("Failed to fetch workspaces:", err);
			}
		};
		if (token) fetchWorkspaces();
	}, [token]);

	const openEditModal = (member) => {
		setEditingMember(member);
		setEditType(member.type || "MEMBER");

		// normalize permissions into array
		if (Array.isArray(member.permissions)) {
			setEditPermissions(member.permissions.length ? member.permissions : ["ALL"]);
		} else if (typeof member.permissions === "string" && member.permissions) {
			setEditPermissions([member.permissions]);
		} else {
			setEditPermissions(["ALL"]);
		}

		setEditView(member.view || "ALL");

		// normalize workspaces -> ensure we store an array of workspace IDs (strings)
		// backend may return member.workspaces as array of objects or array of ids
		const rawWs = member.workspaces || member.workspacesIds || [];
		let wsIds = [];
		if (Array.isArray(rawWs)) {
			wsIds = rawWs
				.map((w) => {
					// if it's an object like { id, name, ... } -> pick id
					if (w && typeof w === "object") return w.id ?? "";
					// otherwise it's already an id/string
					return w;
				})
				.filter(Boolean); // remove empty/falsy
		}
		setEditWorkspaces(wsIds);

		setEditError("");
	};

	// small MultiSelect helper inspired by InviteMemberModal
	const MultiSelect = ({ label, values, onChange, options, getOptionLabel }) => (
		<div className="space-y-2">
			<label className="block text-sm text-[#777C9D]">{label}</label>
			<div className="flex flex-wrap gap-2 p-2 bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl min-h-[48px]">
				{values.map((v) => (
					<span key={v} className="inline-flex items-center px-3 py-1 rounded-lg bg-pink2/20 text-pink2 text-sm">
						{getOptionLabel ? getOptionLabel(v) : v}
						<button
							type="button"
							onClick={() => onChange(values.filter((x) => x !== v))}
							className="ml-2 hover:text-white"
						>
							×
						</button>
					</span>
				))}
				<select
					value=""
					onChange={(e) => {
						const val = e.target.value;
						if (!val) return;
						if (!values.includes(val)) onChange([...values, val]);
						e.target.value = "";
					}}
					className="flex-1 min-w-[100px] bg-[#2A2A2A] text-white focus:outline-none border-none"
				>
					<option value="">Add...</option>
					{options
						.filter((opt) => !values.includes(opt.id ?? opt))
						.map((opt) => (
							<option key={opt.id ?? opt} value={opt.id ?? opt}>
								{getOptionLabel ? getOptionLabel(opt.id ?? opt) : opt.name ?? opt}
							</option>
						))}
				</select>
			</div>
		</div>
	);

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
					permissions: editPermissions, // send array
					view: editView,
					workspaces: editWorkspaces, // send array of ids/strings
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
console.log(total);

	return (
		<div className="min-h-screen px-6 py-8 flex flex-col"> {/* changed: make page a column flex that can grow */}
			<div className="max-w-full flex-1 flex flex-col"> {/* changed: allow inner wrapper to grow (flex-1) */}
				<div className="bg-grayDash  py-3 px-4 rounded-[17px] shadow-xl">
					<div className="frLine flex justify-between items-center mb-3">
						<h1 className="text-gray2 text-[16px] font-radioCanada">
							{isViewer ? "Viewers" : "Members"}
						</h1>
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
						<div className="text-white py-8 text-center">
							{isViewer ? "Loading viewers..." : "Loading members..."}
						</div>
					) : error ? (
						<div className="text-red-400 py-4">
							{isViewer ? "Failed to load viewers" : "Failed to load members"}
						</div>
					) : members.length === 0 ? (
						<div className="text-gray2 py-6 text-center">
							{isViewer ? "No viewers found" : "No members found"}
						</div>
					) : (
						<>
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
											alt={
												member.user?.firstName ||
												member.user?.email ||
												(isViewer ? "Viewer" : "Member")
											}
											className="w-10 h-10 rounded-full object-cover"
										/>
										<div className="flex-1 min-w-0">
											<div className="text-white text-sm truncate">
												{member.user?.firstName
													? `${member.user.firstName} ${member.user.lastName || ""}`.trim()
													: member.user?.email || "Unknown User"}
											</div>
											<div
												className="text-gray2 text-xs truncate"
												title={member.user?.email || ""}
											>
												{member.user?.email || "No email"}
											</div>
										</div>
										<div className="flex items-center gap-3">
											<div className="text-xs text-pink2 font-medium mr-2">
												{member.type ||
													(member.member?.role || "").toUpperCase() ||
													(isViewer ? "VIEWER" : "MEMBER")}
											</div>
											<button
												onClick={() => openEditModal(member)}
												className="text-xs text-white bg-transparent px-2 py-1 rounded hover:bg-white/5 transition"
												title={`Edit ${isViewer ? "viewer" : "member"}`}
											>
												Edit
											</button>
										</div>
									</div>
								))}
							</div>

							{/* Modern Pagination control (removed from here to sticky footer) */}
						</>
					)}
				</div>

				{/* leave some spacing so content isn't hidden beneath sticky footer on small screens */}
				<div className="h-6" />

			</div>

			{/* Sticky pagination bar aligned to the right (mimics Sheets structure) */}
			{total > 0 && (
				<div className="sticky bottom-0 left-0 w-full z-50 pt-4 pb-6"> {/* changed: added w-full so child w-full can expand */}
					<div className="max-w-full  flex"> {/* removed justify-end so child can be full-width */}
						<ModernPagination
							total={total}
							page={page}
							pageSize={pageSize}
							onPageChange={setPage}
							onPageSizeChange={size => {
								setPageSize(size);
								setPage(1);
							}}
						/>
					</div>
				</div>
			)}

			{/* Edit Member Modal (inline portal-less) */}
			{editingMember && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/50" onClick={closeEditModal} />
					<div className="relative bg-[#1E1E1E] rounded-2xl w-full max-w-md p-6 z-10">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-white font-semibold">
								{isViewer ? "Edit Viewer" : "Edit Member"}
							</h2>
							<button onClick={closeEditModal} className="text-gray2">
								✕
							</button>
						</div>
						<form onSubmit={handleEditSubmit} className="space-y-4">
							<div>
								<label className="block text-sm text-[#777C9D] mb-1">
									Member Type
								</label>
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

							<MultiSelect
								label="Permissions"
								values={editPermissions}
								onChange={setEditPermissions}
								options={[
									{ id: "ALL", name: "All" },
									{ id: "READ", name: "Read" },
									{ id: "CREATE", name: "Create" },
									{ id: "UPDATE", name: "Update" },
									{ id: "DELETE", name: "Delete" },
								]}
								getOptionLabel={(id) => {
									const map = {
										ALL: "All",
										READ: "Read",
										CREATE: "Create",
										UPDATE: "Update",
										DELETE: "Delete",
									};
									return map[id] || id;
								}}
							/>

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

							{editView !== "ALL" && (
								<MultiSelect
									label="Workspaces"
									values={editWorkspaces}
									onChange={setEditWorkspaces}
									options={availableWorkspaces}
									getOptionLabel={(id) =>
										availableWorkspaces.find((w) => w.id === id)?.name || id
									}
								/>
							)}

							{editError && (
								<div className="text-red-400 text-sm">{editError}</div>
							)}

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
