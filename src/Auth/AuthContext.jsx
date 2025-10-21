import { createContext, useContext, useState } from "react";
import axiosInstance from "../AxiosInctance/AxiosInctance";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "../Components/Modals/Toast"; // import Toast
import React from "react";
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); // <-- NEW
  const [loading, setLoading] = useState(false);
  const { sheetId } = useParams();
  const [toast, setToast] = useState({ isOpen: false, type: "success", message: "" });
  const [switchingCompany, setSwitchingCompany] = useState(false);

  const queryClient = useQueryClient();

  const showToast = (type, message) => {
    setToast({ isOpen: true, type, message });
    // use functional update to avoid stale closure
    setTimeout(() => setToast(t => ({ ...t, isOpen: false })), 3000); // auto-close after 3s
  };

  // Show any queued toast from a previous page reload/navigation
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("postReloadToast");
      if (raw) {
        const payload = JSON.parse(raw);
        if (payload && payload.type && payload.message) {
          // Allow the app to mount, then show toast
          setTimeout(() => showToast(payload.type, payload.message), 200);
        }
      }
      localStorage.removeItem("postReloadToast");
    } catch {}
  }, []);

  const register = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/registration",
        credentials
      );
      console.log(response);
      localStorage.setItem("auth_verification_token", response.data.token);
      setLoading(false);
      navigate("/verification");
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };
  const login = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      console.log(response);
      localStorage.setItem("token", response.data.token.access);
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };

  const verification = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/registration/verify",
        credentials
      );
      console.log(response);
      localStorage.setItem("token", response.data.token.access);
      setLoading(false);
      showToast("success", "Your account created successfully");
      navigate("/createcompany");
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", "You entered incorrect otp");
    }
  };

  const createCompany = async (credentials) => {
    const token = localStorage.getItem("token");
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post("/company", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
      showToast("success", "You created company successfully");
      const responseInfo = await axiosInstance.get("/user/info", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(responseInfo);
      localStorage.setItem("selectedRoleType", JSON.stringify(responseInfo.data.roles.find(r => r.id === responseInfo.data.selectedRole).type));
      navigate("/subscriptions");
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };

  const restoreAccount = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/restore", credentials);
      localStorage.setItem("email", credentials.email);
      localStorage.setItem("auth_verification_token", response.data.token);
      console.log(response);
      setLoading(false);
      showToast("success", "We sent verification code to your account");
      navigate("/reset-password");
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", "Please check email field");
    }
  };

  const accountRestoreVerification = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/restore/verify",
        credentials
      );
      console.log(response);
      localStorage.setItem("token", response.data.token.access);
      setLoading(false);
      showToast("success", "Your signed in successfully");
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.message}`);
    }
  };

  const createWorkspace = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.post("/workspace", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
      // Return created workspace so caller can navigate to it
      return response.data;
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
      return null;
    }
  };

  const dndOrders = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put("/workspace", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };

  const dndOrdersSheets = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put("/sheet", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };

  const dndOrdersTasks = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put("/task/reorder", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };

  // Reorder columns (calls backend endpoint /column/reorder)
  const dndOrdersColumns = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put("/column/reorder", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error?.response?.data?.message || error.message}`);
      // rethrow so callers can react if needed
      throw error;
    }
  };

  const createSheet = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    // Validation
    if (
      !credentials.name ||
      !credentials.workspaceId ||
      !credentials.columns ||
      !credentials.columns.length
    ) {
      setLoading(false);
      showToast("error", "Please fill all required fields (name, workspace, columns)");
      return null;
    }
    try {
      const response = await axiosInstance.post("/sheet", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
      return null;
    }
  };

  const updateSheet = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put(
        `/sheet/${sheetId}`,
        credentials,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };

  const createColumn = async (credentials) => {
    credentials.type = credentials.type.toUpperCase();
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.post("/column", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };

  const createTask = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.post("/task", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
    }
  };
const fetchMembers = async () => {
  const token = localStorage.getItem("token");
  if (!token) return []; // don't attempt request without token
  const response = await axiosInstance.get("/member", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // Normalize common response shapes to an array
  const raw = response?.data;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.members)) return raw.members;
  if (Array.isArray(raw.data?.members)) return raw.data.members;
  if (Array.isArray(raw.items)) return raw.items;
  // fallback: find first array in response object
  const arr = Object.values(raw).find((v) => Array.isArray(v));
  return Array.isArray(arr) ? arr : [];
};
  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    // Only run members fetch when a token is present (prevents fetching on public auth pages)
    enabled: !!localStorage.getItem("token"),
    staleTime: 300000,
    // keep a longer cache for sidebar usage
    cacheTime: 600000,
  });
  const changeCompany = async (credentials, options = { deferToast: false }) => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      setSwitchingCompany(true);
      const response = await axiosInstance.patch("/user/change-role", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoading(false);
      setSwitchingCompany(false);

      // Persist the selected role locally (so client can read immediately)
      try {
        const selectedRoleId = credentials.roleId || response?.data?.selectedRole;
        if (selectedRoleId) localStorage.setItem("selectedRole", selectedRoleId);
      } catch {}

      // Invalidate related queries so workspace/sheet/member data will be refetched
      try {
        queryClient.invalidateQueries(["userinfo"]);
        queryClient.invalidateQueries(["workspaces"]);
        queryClient.invalidateQueries(["members"]);
        queryClient.invalidateQueries(["sheets"]);
        queryClient.invalidateQueries(["sheetlocation"]);
        queryClient.invalidateQueries(["tasks"]);
      } catch (e) {
        console.warn("Failed to invalidate queries", e);
      }

      // Return structured result; caller can decide when to show toast (deferred)
      return {
        success: true,
        message: "Company switched successfully",
        data: response.data,
      };
    } catch (err) {
      console.log(err);
      setLoading(false);
      setSwitchingCompany(false);
      const message = err?.response?.data?.message || "Failed to change company";
      return { success: false, message };
    }
  };

  // Update password function
  const updatePassword = async ({ oldPassword, newPassword }) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.patch(
        "/user/change-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLoading(false);
      showToast("success", "Password updated successfully.");
      return response;
    } catch (error) {
      setLoading(false);
      showToast("error", error?.response?.data?.message || "Failed to update password.");
      throw error;
    }
  };

  // Guard: if a company exists but plan doesn't, redirect to /subscriptions.
  // If no company exists, do nothing (stay where user is).
  React.useEffect(() => {
    const guard = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      console.log({token});
      // avoid loops: if already on subscriptions, don't navigate
      if (location.pathname === "/subscriptions") return;

      try {
        // fetch minimal user info
        const userRes = await axiosInstance.get("/user/info", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = userRes?.data || {};
        const hasCompany = Array.isArray(user.roles) && user.roles.some(r => r?.company?.id || r?.company?._id);
        const selectedRole = Array.isArray(user.roles) ? user.roles.find(r => r?.id === user?.selectedRole) : null;
        const isAuthor = String(selectedRole?.type || '').toUpperCase() === 'AUTHOR';

        // If no company -> do nothing
        if (!hasCompany) return;

        // Only authors should be redirected to pick a plan
        if (!isAuthor) return;

        // Company exists: check current plan
        try {
          const planRes = await axiosInstance.get("/company/current-plan", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const currentPlan = planRes?.data || null;
          const planExists = !!(currentPlan && (currentPlan.name || currentPlan.id || currentPlan._id || currentPlan.price !== undefined));
          if (!planExists) {
            navigate("/subscriptions", { replace: true });
            return;
          }
        } catch (planErr) {
          // If plan check fails, send user to subscriptions to pick a plan
          navigate("/subscriptions", { replace: true });
          return;
        }
      } catch (err) {
         console.log(err);
        // If fetching user fails (token invalid/expired), clear token and go to login
        try { localStorage.removeItem("token"); } catch {}
        navigate("/login", { replace: true });
      }
    };

    guard();
  }, [location.pathname, navigate]);

  return (
    <AuthContext.Provider
      value={{
        register,
        verification,
        loading,
        login,
        createCompany,
        restoreAccount,
        accountRestoreVerification,
        createWorkspace,
        dndOrders,
        createSheet,
        createColumn,
        updateSheet,
        createTask,
        dndOrdersSheets,
        dndOrdersTasks,
        dndOrdersColumns,
        members,
        changeCompany,
        showToast,
        updatePassword,
        switchingCompany,
      }}
    >
      {children}
      <Toast
        isOpen={toast.isOpen}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </AuthContext.Provider>
  );
};
export { AuthContext, AuthProvider };
