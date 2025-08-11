import React, { useEffect, useState } from "react";
import testMemImg from "../../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import { useQuery } from "@tanstack/react-query";


const Viewers = ({ role }) => {

  const token = localStorage.getItem("token");
  const {
    isLoading,
    error,
    data: membersData,
  } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await axiosInstance.get("/member", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    enabled: role != "member" && !!token,
    staleTime: 300000,
    cacheTime: 600000, // cache for 10 minutes
    refetchOnWindowFocus: false, // don't refetch when window/tab is focused

  });
  const [members, setMembers] = useState([]);
  useEffect(() => {
    if (membersData) {
      setMembers(membersData);
    }
  }, [membersData]);
  const viewerMembers = members.filter((member) => member.type === "VIEWER");

  {
    viewerMembers.length > 0 ? (
      viewerMembers.map((member, i) => (
        <div key={i} className="secLine my-[12px] space-y-[4px]">
          <div className="viewer flex items-center gap-[12px]">
            <div className="memImg">
              <img src={testMemImg} alt="" className="w-[28.8px] rounded-[50%]" />
            </div>
            <div className="memText">
              <p className="text-[14px] text-white">Marina - Eli Robinson</p>
              <p className="text-[11px] text-gray2">{member.user.email}</p>
            </div>
          </div>
        </div>
      ))
    ) : (
    <p className="text-gray2 text-sm mt-2">No viewer members found.</p>
  )
  }

  return (<div>
    {(role === "author" || role === "admin") ? (
      <div className="bg-grayDash py-[16px] px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
        <div className="frLine flex justify-between items-center">
          <h1 className="text-gray2 font-radioCanada text-[16px]">Viewers</h1>
          {/* Replace with dynamic check when viewers are fetched from API */}
          {false && (
            <button className="text-white text-[13px] bg-black py-[7px] px-[15px] rounded-[9px]">
              see all
            </button>
          )}
        </div>
        {viewerMembers.length > 0 ? (
          viewerMembers.map((member, i) => (
            <div key={i} className="secLine my-[12px] space-y-[4px]">
              <div className="viewer flex items-center gap-[12px]">
                <div className="memImg">
                  <img
                    src={
                      member.user.avatar?.path
                        ? `https://eventify.preview.uz/${member.user.avatar?.path}`
                        : testMemImg
                    }
                    alt={member.user.firstName || "Viewer"}
                    className="w-[28.8px] h-[28.8px] rounded-full object-cover"
                  />
                </div>
                <div className="memText">
                  <p className="text-[14px] text-white">{`${member.user.firstName} ${member.user.lastName}`}</p>
                  <p
                    className="text-[11px] text-gray2"
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
          <div className="text-gray2 text-center py-4">No viewers found</div>
        )}

      </div>) : (
      <p className="text-gray2 text-[14px]"></p>
    )}
  </div>
  );
};

export default Viewers;
