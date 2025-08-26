import React, { useContext, useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";
import logo from "../../assets/b4a0bd5e0894dd27c9b0053b36ac6208.png";
import { IoSettingsSharp } from "react-icons/io5";
import Workspaces from "./Workspaces";
import Members from "./Members";
import Viewers from "./Viewers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { Link } from "react-router-dom";
import { AuthContext } from "../../Auth/AuthContext";
import { FiX } from "react-icons/fi";

const Sidebar = () => {
	const token = localStorage.getItem("token");
	const queryClient = useQueryClient();
	const { showToast } = useContext(AuthContext);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [createCompanyName, setCreateCompanyName] = useState("");
	const [createLoading, setCreateLoading] = useState(false);
	const { data, isLoading, error } = useQuery({
		queryKey: ["sidebar-userinfo"],
		queryFn: async () =>
			await axiosInstance.get("/user/info", {
				headers: { Authorization: `Bearer ${token}` },
			}),
	});
	const user = data?.data || {};
	const selectedRoleObj = useMemo(
		() => user?.roles?.find((i) => i.id === user.selectedRole) || null,
		[user]
	);
	const role = (selectedRoleObj?.type || "").toLowerCase();
	const hasCompany = useMemo(
		() =>
			!!(
				selectedRoleObj?.company &&
				(selectedRoleObj.company.id || selectedRoleObj.company._id)
			),
		[selectedRoleObj]
	);
	// Keep localStorage flags updated for other parts of the app that read them
	try {
		localStorage.setItem("hasCompany", JSON.stringify(hasCompany));
		localStorage.setItem("selectedRoleType", role || "");
	} catch {}

	const handleCreateCompany = async () => {
		if (!createCompanyName.trim()) return;
		setCreateLoading(true);
		try {
			const res = await axiosInstance.post(
				"/company",
				{ name: createCompanyName.trim() },
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			// Close modal and clear
			setShowCreateModal(false);
			setCreateCompanyName("");
			// Invalidate user info so Sidebar re-renders with company present
			try {
				await queryClient.invalidateQueries(["sidebar-userinfo"]);
				await queryClient.invalidateQueries(["userinfo"]);
			} catch {}
			// Persist flags
			try {
				localStorage.setItem("hasCompany", JSON.stringify(true));
			} catch {}
			// Toast
			if (showToast)
				showToast("success", "Company created successfully");
		} catch (err) {
			const message = err?.response?.data?.message || "Error creating company";
			if (showToast) showToast("error", message);
		} finally {
			setCreateLoading(false);
		}
	};

	// focus input when modal opens
	const createInputRef = useRef(null);
	useEffect(() => {
		if (showCreateModal) {
			const t = setTimeout(() => {
				if (createInputRef.current) {
					createInputRef.current.focus();
					createInputRef.current.select?.();
				}
			}, 220);
			return () => clearTimeout(t);
		}
	}, [showCreateModal]);

	return (
		<>
			<div className="h-screen flex flex-col py-3 sm:py-4 lg:py-5 xl:py-[22px] px-3 sm:px-4 lg:px-5 xl:px-[31px] border-r border-1 border-grayDash overflow-y-auto sidebar-container custom-scrollbar">
				<div className="brand flex items-center justify-between bg-pink rounded-[16px] p-4 lg:p-5 xl:p-6 w-full">
					<div className="flex items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-[23px]">
						<div className="flex-shrink-0">
							<img
								src={logo}
								alt="Logo"
								className="w-6 h-6 sm:w-7 sm:h-7 lg:w-[28px] xl:w-[30px] lg:h-[28px] xl:h-[30px] rounded-[5px] object-contain"
							/>
						</div>
						<a
							href="/dashboard"
							className="font-bold text-white whitespace-nowrap text-[16px] sm:text-[18px] lg:text-[20px] xl:text-[22px] hover:opacity-90"
						>
							Task me
						</a>
					</div>
				</div>

				{hasCompany && (
					<div className="workspaces mt-6 lg:mt-8">
						<Workspaces user={user} />
					</div>
				)}
				{!hasCompany && (
					<div className="mt-6 lg:mt-8">
						<button
							onClick={() => setShowCreateModal(true)}
							className="w-full flex items-center justify-center gap-2 bg-pink2 text-white rounded-[12px] py-3 font-semibold hover:opacity-95"
						>
							+ Create Company
						</button>
					</div>
				)}

				{/* Only show members/viewers for author or admin and when company exists */}
				{hasCompany && (
					<>
						<div className="members mt-6 lg:mt-8">
							<Members role={role} />
						</div>
						<div className="viewers mt-6 lg:mt-8">
							<Viewers role={role} />
						</div>
					</>
				)}

				{/* Create Company Modal - moved to portal and redesigned like InviteMemberModal */}
				{ReactDOM.createPortal(
					<AnimatePresence>
						{showCreateModal && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 z-50 flex items-center justify-center"
							>
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="absolute inset-0 bg-black/50 backdrop-blur-sm"
									onClick={() => {
										if (!createLoading) setShowCreateModal(false);
									}}
								/>

								<motion.div
									initial={{ scale: 0.98, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0.98, opacity: 0 }}
									transition={{ type: "spring", duration: 0.35 }}
									className="relative bg-[#1E1E1E] rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
								>
									<div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />

									<div className="relative p-6">
										<motion.button
											whileHover={{ scale: 1.05, rotate: 90 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => {
												if (!createLoading) setShowCreateModal(false);
											}}
											className="absolute top-4 right-4 text-gray2 hover:text-white transition-colors"
										>
											<FiX size={22} />
										</motion.button>

										<div className="flex items-center gap-4 mb-6">
											<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink2/20 to-pink2/10 flex items-center justify-center">
												{/* simple icon/text for company */}
												<span className="text-pink2 font-medium text-lg">
													C
												</span>
											</div>
											<div>
												<h3 className="text-2xl font-semibold text-white">
													Create Company
												</h3>
												<p className="text-[#777C9D] text-sm">
													Create a new company to manage workspaces and
													members
												</p>
											</div>
										</div>

										<form
											onSubmit={(e) => {
												e.preventDefault();
												handleCreateCompany();
											}}
											className="space-y-5"
										>
											<div>
												<label className="block text-sm text-[#C4E1FE] mb-2">
													Company Name
												</label>
												<input
													ref={createInputRef}
													type="text"
													value={createCompanyName}
													onChange={(e) => setCreateCompanyName(e.target.value)}
													className="w-full bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/30 transition-all"
													placeholder="e.g. Acme Inc"
													disabled={createLoading}
													required
												/>
											</div>

											<div className="flex justify-end gap-3 pt-2">
												<button
													type="button"
													onClick={() => setShowCreateModal(false)}
													className="px-4 py-2 rounded-lg bg-transparent text-white border border-[#3A3A3A] hover:bg-white/5"
													disabled={createLoading}
												>
													Cancel
												</button>
												<button
													type="submit"
													disabled={
														createLoading || !createCompanyName.trim()
													}
													className={`px-4 py-2 rounded-lg bg-gradient-to-r from-pink2 to-pink2/90 text-white hover:opacity-95 ${
														createLoading
															? "opacity-60 cursor-not-allowed"
															: ""
													}`}
												>
													{createLoading ? "Creating..." : "Create"}
												</button>
											</div>
										</form>
									</div>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>,
					document.getElementById("modal-root")
				)}

				<Link to="/settings" className="settings mt-auto pt-[30px] pb-3 px-1">
					<button className="flex w-full bg-white rounded-[9px] py-3 lg:py-3 xl:py-[10px] px-5 lg:px-5 xl:pl-[20px] gap-2 lg:gap-[3px] items-center font-radioCanada hover:bg-gray-100 transition-colors">
						<IoSettingsSharp className="text-lg lg:text-xl xl:text-[22px] text-grayDash" />
						<p className="text-responsive-sm">Settings</p>
					</button>
				</Link>
			</div>
		</>
	);
};

export default Sidebar;

