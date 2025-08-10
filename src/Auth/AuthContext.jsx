import { createContext, useContext, useState } from "react";
import axiosInstance from "../AxiosInctance/AxiosInctance";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Toast from "../Components/Modals/Toast"; // import Toast

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { sheetId } = useParams();
  const [toast, setToast] = useState({ isOpen: false, type: "success", message: "" });

  const showToast = (type, message) => {
    setToast({ isOpen: true, type, message });
    setTimeout(() => setToast({ ...toast, isOpen: false }), 3000); // auto-close after 3s
  };

  const register = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/registration",
        credentials
      );
      console.log(response);
      localStorage.setItem("token", response.data.token);
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
    } catch (error) {
      console.log(error);
      setLoading(false);
      showToast("error", `${error.response.data.message}`);
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
  const response = await axiosInstance.get("/member", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });
  const changeCompany = async(credentials)=>{
    const token = localStorage.getItem("token");
    try{
      setLoading(true)
      const response = await axiosInstance.patch("/user/change-role", credentials, {
        headers:{
          Authorization: `Bearer ${token}`
        }
    })
    setLoading(false)
    return response
  }catch(err){
    console.log(err);
    
  }
}
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
        members,
        changeCompany,
        updatePassword
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
 