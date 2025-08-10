import React, { useState } from "react";
import logo from "../../assets/b4a0bd5e0894dd27c9b0053b36ac6208.png";
import { IoSettingsSharp } from "react-icons/io5";
import Workspaces from "./Workspaces";
import Members from "./Members";
import Viewers from "./Viewers";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { Link } from "react-router-dom";
import Settings from "../Settings/Settings";
import { createPortal } from "react-dom";

const Sidebar = () => {
  const token = localStorage.getItem("token");
  const { data, isLoading, error } = useQuery({
    queryKey: ["sidebar-userinfo"],
    queryFn: async () =>
      await axiosInstance.get("/user/info", {
        headers: { Authorization: `Bearer ${token}` },
      }),
  });
  const user = data?.data || {};
  const role = user?.roles
    ?.find((i) => i.id === user.selectedRole)
    ?.type?.toLowerCase();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="h-screen flex flex-col py-4 lg:py-5 xl:py-[22px] px-4 lg:px-5 xl:px-[31px] border-r border-1 border-grayDash overflow-y-auto sidebar-container custom-scrollbar">
        <div className="brand flex items-center justify-between bg-pink rounded-[16px] p-4 lg:p-5 xl:p-6 w-full">
          <div className="flex items-center gap-3 lg:gap-4 xl:gap-[23px]">
            <div className="flex-shrink-0">
              <img
                src={logo}
                alt="Logo"
                className="w-7 h-7 lg:w-[28px] xl:w-[30px] lg:h-[28px] xl:h-[30px] rounded-[5px] object-contain"
              />
            </div>
            <h1 className="text-responsive-xl font-bold text-white whitespace-nowrap">
              Eventify
            </h1>
          </div>
        </div>

        <div className="workspaces mt-6 lg:mt-8">
          <Workspaces user={user} />
        </div>

        {/* Only show members/viewers for author or admin */}
        {
          <>
            <div className="members mt-6 lg:mt-8">
              <Members role={role} />
            </div>
            <div className="viewers mt-6 lg:mt-8">
              <Viewers role={role}/>
            </div>
          </>
        }

        <Link
          to="#"
          className="settings xl:mt-auto pt-[30px]"
          onClick={e => {
            e.preventDefault();
            setShowSettings(true);
          }}
        >
          <button className="flex w-full bg-white rounded-[9px] py-2 lg:py-3 xl:py-[10px] px-4 lg:px-5 xl:pl-[20px] gap-2 lg:gap-[3px] items-center font-radioCanada hover:bg-gray-100 transition-colors">
            <IoSettingsSharp className="text-lg lg:text-xl xl:text-[22px] text-grayDash" />
            <p className="text-responsive-sm">Settings</p>
          </button>
        </Link>
      </div>
      {showSettings &&
        createPortal(
          <Settings onClose={() => setShowSettings(false)} />,
          document.body
        )
      }
    </>
  );
};

export default Sidebar;
