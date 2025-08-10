import { useContext, useState } from "react";
import { AuthContext } from "../../Auth/AuthContext";

const CreateCompany = () => {
  const [credentials, setCredentials] = useState({ name: "" });
  const { createCompany, loading } = useContext(AuthContext);
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCompany(credentials);
    setCredentials({ name: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20]">
      <div className="max-w-md w-full bg-[#1E1E1E] rounded-2xl shadow-lg border-2 border-[#3A3A3A] overflow-hidden">
        <div className="relative p-8">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />
          <h1 className="text-3xl font-bold text-white mb-8 text-center drop-shadow">
            Create your company
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div>
              <label
                htmlFor="name"
                className="text-[#777C9D] text-lg font-semibold mb-2 block"
              >
                Company name
              </label>
              <div className="relative group">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={credentials.name}
                  onChange={handleChange}
                  placeholder="Company name..."
                  className="w-full min-w-[320px] bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl py-3 pl-6 pr-4 text-white placeholder:text-[#777C9D] text-lg focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>
            <button
              type="submit"
              className="h-14 w-full bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl text-lg font-bold hover:shadow-lg hover:shadow-pink2/20 transition relative overflow-hidden group"
              disabled={loading}
            >
              <span className="relative z-10">
                {!loading ? "Create" : "Loading..."}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink2/0 via-white/20 to-pink2/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;
