import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import testMemImg from "../../assets/default-avatar-icon-of-social-media-user-vector.jpg";
import InviteMemberModal from "../Modals/InviteMemberModal";
import axiosInstance from "../../AxiosInctance/AxiosInctance";
import { useNavigate } from "react-router-dom";

const Members = ({ role }) => {
  const navigate = useNavigate();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  // local showAll kept only for internal layout measurement; navigation opens full page
  const [showAll, setShowAll] = useState(false);
  const token = localStorage.getItem("token");

  // refs and measured container height for showing 3 items with internal scroll
  const itemRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(null);

  const {
    isLoading,
    error,
    data: membersData,
  } = useQuery({
    queryKey: ["members"], // non-paginated sidebar list uses simple key
    queryFn: async () => {
      // sidebar uses non-paginated endpoint for small quick list
      const response = await axiosInstance.get("/member", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // normalize possible response shapes into an array
      const raw = response.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.members)) return raw.members;
      // fallback to empty array
      return [];
    },
    // enabled: role != "member" && !!token,
    staleTime: 300000,
    cacheTime: 600000, // cache for 10 minutes
    refetchOnWindowFocus: false, // don't refetch when window/tab is focused
  });
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (membersData) {
      // membersData is already an array from /member endpoint
      setMembers(Array.isArray(membersData) ? membersData : []);
    }
  }, [membersData]);

  // When showAll is false, render only first 3 (old behavior).
  // When showAll is true, render all members but constrain the list to height of 3 items and allow scrolling.
  const displayedMembers = showAll ? members : members.slice(0, 3);

  // Measure one item height after render and compute height for 3 visible items.
  useLayoutEffect(() => {
    if (itemRef.current) {
      const itemHeight = itemRef.current.offsetHeight || 48; // fallback
      // vertical spacing between items in this design is 4px (space-y-[4px]) -> there are 2 gaps between 3 items
      const verticalGap = 4;
      const totalHeight = itemHeight * 3 + verticalGap * 2;
      setContainerHeight(totalHeight);
    }
  }, [members, showAll]);

  // if (isLoading && role === "MEMBER") {
  //   return (
  //     <div className="bg-grayDash py-[16px] px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
  //       <div className="text-white text-center">Loading members...</div>
  //     </div>
  //   );
  // 
  return (
    <div>
      {role === "author" || role === "admin" ? (
        <div className="bg-grayDash py-3 sm:py-[14px] md:py-[16px] px-3 sm:px-[15px] md:px-[17px] rounded-[17px] font-radioCanada mt-[18px] shadow-xl">
          <div className="frLine flex justify-between items-center">
            <h1 className="text-gray2 font-radioCanada text-[14px] sm:text-[15px] md:text-[16px]">
              Members
            </h1>
            {members.length > 2 && (
              <button
                className="text-white text-[12px] sm:text-[13px] bg-black py-[7px] px-[15px] rounded-[9px]"
                onClick={() => navigate("/dashboard/members")}
                title="See all members"
              >
                See All
              </button>
            )}
          </div>

          {/* When the sidebar shows a truncated list, keep same layout.
              Full list is rendered on the dedicated Members page at /dashboard/members */}
          <div
            className="secLine my-[12px] space-y-[4px]"
            style={{
              maxHeight: undefined,
              overflowY: undefined,
            }}
          >
            {isLoading ? (
              <div className="text-gray2 text-center py-4">Loading members...</div>
            ) : error ? (
              <div className="text-red-400 text-center py-4">Failed to load members</div>
            ) : displayedMembers.length > 0 ? (
              displayedMembers.map((member, index) => (
                // make the whole member row clickable and accessible
                <div
                  key={member.id || index}
                  ref={index === 0 ? itemRef : null}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate("/dashboard/members")}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate("/dashboard/members");
                  }}
                  className="member flex items-center gap-[12px] cursor-pointer"
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
                      className="w-6 h-6 sm:w-[28.8px] sm:h-[28.8px] rounded-full object-cover"
                    />
                  </div>
                  <div className="memText">
                    <p className="text-[13px] sm:text-[14px] md:text-[15px] text-white">
                      {member.user.firstName
                        ? member.user.firstName + " " + member.user.lastName
                        : "Unknown User"}
                    </p>
                    <p
                      className="text-[10px] sm:text-[11px] md:text-[12px] text-gray2"
                      style={{
                        maxWidth: "140px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                      title={member.user.email || "No email"}
                    >
                      {member.user.email || "No email"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray2 text-center py-4">Members not exist yet</div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray2 text-[14px]"></p>
        </div>
      )}

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
    </div>
  );
};

export default Members;
