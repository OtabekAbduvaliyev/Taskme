import React, { useEffect, useState } from "react";
import testMemImg from "../../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { useNavigate } from "react-router-dom";

const Viewers = ({ role }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const {
    isLoading,
    error,
    data: membersData,
  } = useQuery({
    queryKey: ["members_sidebar_viewers"],
    queryFn: async () => {
      // sidebar uses non-paginated endpoint
      const response = await axiosInstance.get("/member", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // keep original shape handling: some endpoints returned array or { members: [...] }
      // return the raw data and normalize in effect below
      return response.data;
    },
    enabled: !!token && (role === "author" || role === "admin"),
    retry: false,
    staleTime: 300000,
    cacheTime: 600000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [members, setMembers] = useState([]);
  useEffect(() => {
    if (membersData) {
      // support either array or { members: [...] } shaped response
      const list = Array.isArray(membersData) ? membersData : membersData?.members || [];
      setMembers(list);
    }
  }, [membersData]);
  const viewerMembers = members.filter((member) => member.type === "VIEWER"); // already filtered by type=VIEWER on backend

  // rendering handled in return

  return (
    <div>
      {(role === "author" || role === "admin") ? (
        <div className="bg-grayDash py-3 sm:py-[14px] md:py-[16px] px-3 sm:px-[15px] md:px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl w-full">
          <div className="frLine flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
            <h1 className="text-gray2 font-radioCanada text-[14px] sm:text-[15px] md:text-[16px]">Viewers</h1>
            {viewerMembers.length > 2 && (
              <button
                className="w-full sm:w-auto text-white text-[12px] sm:text-[13px] py-[8px] px-[12px] rounded-[9px] text-center bg-transparent hover:bg-white/5 transition"
                onClick={() => navigate("/dashboard/members?type=VIEWERS")}
                title="See all viewers"
                aria-label="See all viewers"
              >
                See All
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="text-gray2 text-center py-4">Loading viewers...</div>
          ) : error ? (
            <div className="text-red-400 text-center py-4">Failed to load viewers</div>
          ) : viewerMembers.length > 0 ? (
            viewerMembers.map((member, i) => (
              <div key={i} className="secLine my-[12px] space-y-[4px]">
                <div
                  onClick={() => navigate("/dashboard/members?type=VIEWERS")}
                  className="viewer flex items-center gap-[12px] cursor-pointer"
                >
                  <div className="memImg">
                    <img
                      src={
                        member.user.avatar?.path
                          ? `https://eventify.preview.uz/${member.user.avatar?.path}`
                          : testMemImg
                      }
                      alt={
                        member.user?.firstName
                          ? `${member.user.firstName} ${member.user.lastName || ""}`.trim()
                          : "Unknown User"
                      }
                      className="w-6 h-6 sm:w-[28.8px] sm:h-[28.8px] rounded-full object-cover"
                    />
                  </div>
                  <div className="memText">
                    <p className="text-[13px] sm:text-[14px] md:text-[15px] text-white">
                      {member.user?.firstName
                        ? `${member.user.firstName} ${member.user.lastName || ""}`.trim()
                        : "Unknown User"}
                    </p>
                    <p
                      className="text-[10px] sm:text-[11px] md:text-[12px] text-gray2"
                      style={{
                        maxWidth: "140px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block"
                      }}
                      title={member.user.email || "No email"}
                    >
                      {member.user.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray2 text-center py-4">Viewers not exist yet</div>
          )}
        </div>
      ) : (
        <p className="text-gray2 text-[14px]"></p>
      )}
    </div>
  );
};

export default Viewers;
