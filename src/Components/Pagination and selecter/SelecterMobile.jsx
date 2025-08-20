import React from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { GoFileSymlinkFile } from "react-icons/go";
import { IoIosArrowForward } from "react-icons/io";
import { IoClose } from "react-icons/io5";

const SelecterMobile = ({
  selectedTasks,
  setItemsPerPage,
  setCurrentPage,
  itemsPerPage,
  currentPage,
  filteredTasks,
  setSelectedTasks,
  handleMoveTask,
  setDeleteModalOpen,
  isHidden,
  handleDeleteTasks,
  pagination,
}) => {
  // prefer server-side pagination metadata when available
  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil((filteredTasks?.length || 0) / itemsPerPage));
  const serverPage = pagination?.page ?? currentPage;

  return (
    // fixed container uses same horizontal padding as task list (p-2 in SheetTabel)
    // outer is transparent so no extra gray "before block" background appears
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-6 pb-3 pointer-events-auto">
      <div className="w-full max-w-full mx-auto flex flex-col gap-3">
        {/* Selected actions card (full width) */}
        {selectedTasks?.length > 0 && (
          <div className="w-full bg-[#2A2D36] rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-pink2 text-white rounded-md px-3 py-1 font-semibold">{selectedTasks.length}</div>
              <div className="text-white">Selected</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMoveTask()}
                className="flex items-center gap-2 px-3 py-2 bg-[#353847] rounded-lg text-white"
                aria-label="Move"
              >
                <GoFileSymlinkFile />
                <span className="text-sm">Move</span>
              </button>
              <button
                onClick={() => handleDeleteTasks()}
                className="flex items-center gap-2 px-3 py-2 bg-[#353847] rounded-lg text-white"
                aria-label="Delete"
              >
                <FaRegTrashAlt />
                <span className="text-sm">Delete</span>
              </button>
              <button
                onClick={() => setSelectedTasks([])}
                className="ml-1 p-2 bg-transparent rounded-full text-white"
                aria-label="Close selection"
              >
                <IoClose size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Pagination and per-page card (full width) */}
        <div className="w-full bg-[#2A2D36] rounded-lg p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-1/2">
            <label className="text-white2 text-sm">Per page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-[#23272F] text-white rounded-md px-3 py-2 w-full"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-1/2 justify-end">
            <button
              onClick={() => serverPage > 1 && setCurrentPage(serverPage - 1)}
              className="p-2 bg-[#23272F] rounded-md text-white"
              aria-label="Previous"
              disabled={serverPage <= 1}
            >
              <IoIosArrowForward className="rotate-180" />
            </button>
            <div className="text-white text-sm px-2">
              {serverPage}/{totalPages}
            </div>
            <button
              onClick={() => serverPage < totalPages && setCurrentPage(serverPage + 1)}
              className="p-2 bg-pink2 rounded-md text-white"
              aria-label="Next"
              disabled={serverPage >= totalPages}
            >
              <IoIosArrowForward />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelecterMobile;
