import React, { useContext, useState } from "react";
import { AuthContext } from "../../Auth/AuthContext";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import AuthCard from "./AuthCard";
import AuthInput from "./AuthInput";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Register = () => {
  const [credentials, setCredentials] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useContext(AuthContext);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    register(credentials);
  };

  return (
    <AuthLayout>
      <div className="max-w-md mx-auto mt-16 bg-[#1E1E1E] rounded-2xl shadow-lg border-2 border-[#3A3A3A] overflow-hidden">
        <div className="relative p-8">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />
          <h1 className="text-3xl font-bold text-white mb-8 text-center drop-shadow">
            Register
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="text-[#777C9D] text-lg font-semibold mb-2 block">
                First Name
              </label>
              <AuthInput
                id="firstName"
                name="firstName"
                type="text"
                required
                value={credentials.firstName}
                onChange={handleChange}
                placeholder="First Name"
                className="w-full min-w-[320px] bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="text-[#777C9D] text-lg font-semibold mb-2 block">
                Last Name
              </label>
              <AuthInput
                id="lastName"
                name="lastName"
                type="text"
                required
                value={credentials.lastName}
                onChange={handleChange}
                placeholder="Last Name"
                className="w-full min-w-[320px] bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 px-4 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="text-[#777C9D] text-lg font-semibold mb-2 block">
                Email address
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777C9D] group-hover:text-pink2 transition-colors">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M4 4h16v16H4V4zm0 0l8 8 8-8" />
                  </svg>
                </span>
                <AuthInput
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={credentials.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full min-w-[320px] bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 pl-4 pr-4 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-[#777C9D] text-lg font-semibold mb-2 block">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777C9D] group-hover:text-pink2 transition-colors">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 17a2 2 0 0 0 2-2V9a2 2 0 0 0-4 0v6a2 2 0 0 0 2 2zm6 0V9a6 6 0 0 0-12 0v8" />
                  </svg>
                </span>
                <AuthInput
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full min-w-[320px] bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 pl-4 pr-12 text-white placeholder:text-[#777C9D] focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777C9D] hover:text-pink2 transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}
                </button>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="h-14 w-full bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl text-lg font-bold hover:shadow-lg hover:shadow-pink2/20 transition relative overflow-hidden group"
              disabled={loading}
            >
              <span className="relative z-10">{loading ? "Loading..." : "Register"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink2/0 via-white/20 to-pink2/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </form>

          <div className="mt-8 text-center text-[#777C9D] text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-pink2 font-semibold hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
