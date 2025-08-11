import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import testMemImg from "../../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import InviteMemberModal from "../Modals/InviteMemberModal";
import { useState } from "react";
import axiosInstance from "../../AxiosInctance/AxiosInctance";

const Members = ({role}) => {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
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

  const displayedMembers = showAll ? members : members.slice(0, 3);

  // if (isLoading && role === "MEMBER") {
  //   return (
  //     <div className="bg-grayDash py-[16px] px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
  //       <div className="text-white text-center">Loading members...</div>
  //     </div>
  //   );
  // }

  return (
    <div>
             {(role === "author" || role === "admin") ? (
      <div className="bg-grayDash py-[16px] px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
        <div className="frLine flex justify-between items-center">
          <h1 className="text-gray2 font-radioCanada text-[16px]">Members</h1>
          {members.length > 2 && (
            <button
              className="text-white text-[13px] bg-black py-[7px] px-[15px] rounded-[9px]"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "show less" : "see all"}
            </button>
          )}
        </div>
 
        <div className="secLine my-[12px] space-y-[4px]">
          {displayedMembers.length > 0 ? (
            displayedMembers.map((member, index) => (
              <div
                key={member.id || index}
                className="member flex items-center gap-[12px]"
              >
                <div className="memImg">
                  <img
                    src={
                      member.user.avatar?.path
                        ? `https://eventify.preview.uz/${member.user.avatar?.path}`
                        : testMemImg
                    }
                    alt={
                      member.user.firstName
                        ? member.user.firstName
                        : "Member Image"
                    }
                    className="w-[28.8px] h-[28.8px] rounded-full object-cover"
                  />
                </div>
                <div className="memText">
                  <p className="text-[14px] text-white ">
                    {member.user.firstName
                      ? member.user.firstName + " " + member.user.lastName
                      : "Unknown User"}
                  </p>
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
            ))
          ) : (
            <div className="text-gray2 text-center py-4">No members found</div>
          )}
      </div>
        </div>):
        <div><p className="text-gray2 text-[14px]"></p></div> 
        }

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

export default Members;
