import { AnimatePresence,motion } from 'framer-motion';
import React, { useState, useEffect } from 'react'
import { FaRegTrashAlt } from 'react-icons/fa';
import { GoFileSymlinkFile } from 'react-icons/go';
import { IoIosArrowForward } from 'react-icons/io';
import { IoClose } from 'react-icons/io5';
import SelecterMobile from './SelecterMobile';

const Selecter = ({ selectedTasks, setItemsPerPage, setCurrentPage,itemsPerPage,currentPage,filteredTasks,setSelectedTasks,handleMoveTask,setDeleteModalOpen,isHidden, handleDeleteTasks, pagination }) => {
  // detect mobile (simple)
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // derive pagination values (prefer server-provided metadata)
  const totalPages = pagination?.pages ?? Math.max(1, Math.ceil((filteredTasks?.length || 0) / itemsPerPage));
  const serverPage = pagination?.page ?? currentPage;

  return (
    <div className={`${isHidden ? "block" : "block"} `}>
      <AnimatePresence mode="wait">
        {isMobile ? (
          // render mobile variant
          <SelecterMobile
            selectedTasks={selectedTasks}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            filteredTasks={filteredTasks}
            setSelectedTasks={setSelectedTasks}
            handleMoveTask={handleMoveTask}
            setDeleteModalOpen={setDeleteModalOpen}
            isHidden={isHidden}
            handleDeleteTasks={handleDeleteTasks}
            pagination={pagination}
          />
        ) : (
          // Desktop UI: unchanged markup (keeps original behavior)
          <motion.div
            key={
              selectedTasks?.length > 0
                ? "actions-selected"
                : "actions-pagination"
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className=" flex  gap-[10px]"
          >
            {selectedTasks?.length > 0 && (
              <div className="w-1/2">
                <div className="font-radioCanada flex deleter bg-grayDash rounded-[14px] h-[64px]">
                  <div className="numberOfSelectedTasks bg-pink2 flex items-center rounded-s-[14px] px-[27px]">
                    <p className="text-white">{selectedTasks?.length}</p>
                  </div>
                  <div className="actions flex items-center text-white justify-between w-full pl-[23px] pr-[15px] border-r my-[11px] border-gray">
                    <div className="textPart">
                      <h2>Selected tasks</h2>
                    </div>
                    <div className="iconPart flex gap-[24px]">
                      <div
                        className="moave text-pink2 cursor-pointer hover:opacity-80"
                        onClick={() => handleMoveTask()}
                      >
                        <GoFileSymlinkFile className="m-auto" />
                        <p className="text-[12px]">Move</p>
                      </div>
                      <div
                        className="delete text-[#C6C8D6] cursor-pointer hover:text-pink2"
                        onClick={() => handleDeleteTasks()}
                      >
                        <FaRegTrashAlt className="m-auto" />
                        <p className="text-[12px]">Delete</p>
                      </div>
                    </div>
                  </div>
                  <div className="close flex items-center px-[16px]">
                    <IoClose
                      className="text-[25px] text-white2 cursor-pointer"
                      onClick={() => setSelectedTasks([])}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className={`${selectedTasks?.length > 0 ? "w-1/2" : "w-full"} `}>
              <div className="pagination bg-grayDash flex items-center rounded-[14px] px-[18px] justify-between h-[64px]">
                <div className="shpp flex items-center gap-[12px]">
                  <p className="text-white2">Show per page</p>
                  <div className="select rounded-[14px]">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-[3px] bg-grayDash border border-gray text-white2 w-auto"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={40}>40</option>
                      <option value={50}>50</option>
                      <option value={80}>80</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                <div className="pages flex items-center gap-[12px]">
                  <p className="text-white2">
                    Page {serverPage} of {totalPages}
                  </p>
                  <div>
                    <div className="flex items-center gap-[6px]">
                      <div
                        className="prev bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                        onClick={() =>
                          serverPage > 1 && setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                      >
                        <IoIosArrowForward className="text-white2 rotate-180 text-[20px]" />
                      </div>
                      <div
                        className="next bg-grayDash rounded-[14px] flex items-center justify-center cursor-pointer p-[6px] hover:bg-gray"
                        onClick={() =>
                          serverPage < totalPages && setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                        }
                      >
                        <IoIosArrowForward className="text-pink2 text-[20px]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Selecter