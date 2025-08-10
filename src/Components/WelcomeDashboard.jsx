import React from 'react';
import { BsKanban, BsClockHistory, BsCalendarCheck } from 'react-icons/bs';
import { AiOutlineTeam, AiOutlineStar } from 'react-icons/ai';
import { MdEventAvailable, MdTrendingUp } from 'react-icons/md';
import { RiVipCrownLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

const WelcomeDashboard = () => {
  const stats = [
    {
      title: "Total Events",
      value: "28",
      icon: <MdEventAvailable className="text-4xl text-pink2" />,
      bgColor: "bg-white bg-opacity-[0.03]",
      textColor: "text-pink2"
    },
    {
      title: "Team Members",
      value: "24",
      icon: <AiOutlineTeam className="text-4xl text-[#B296F5]" />,
      bgColor: "bg-white bg-opacity-[0.03]",
      textColor: "text-[#B296F5]"
    },
    {
      title: "Recent Activities",
      value: "67",
      icon: <BsClockHistory className="text-4xl text-[#0EC359]" />,
      bgColor: "bg-white bg-opacity-[0.03]",
      textColor: "text-[#0EC359]"
    },
    {
      title: "Active Projects",
      value: "12",
      icon: <BsKanban className="text-4xl text-[#DC5091]" />,
      bgColor: "bg-white bg-opacity-[0.03]",
      textColor: "text-[#DC5091]"
    }
  ];

  const highlights = [
    {
      title: "Upcoming Events",
      value: "5 events this week",
      icon: <BsCalendarCheck className="text-3xl" />,
      color: "text-[#B296F5]"
    },
    {
      title: "Growth Rate",
      value: "+24% this month",
      icon: <MdTrendingUp className="text-3xl" />,
      color: "text-[#0EC359]"
    },
    {
      title: "Premium Features",
      value: "All features unlocked",
      icon: <RiVipCrownLine className="text-3xl" />,
      color: "text-[#DC5091]"
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 font-radioCanada bg-background min-h-screen"
    >
      {/* Welcome Section with Gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 bg-gradient-to-r from-white/[0.07] to-white/[0.02] p-4 rounded-xl relative overflow-hidden
          shadow-[0_0_10px_rgba(255,255,255,0.03)] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-shadow duration-500"
      >
        <div className="relative z-10">
          <h1 className="text-2xl font-semibold text-white mb-1">Welcome back, Team! <span className="text-pink2">👋</span></h1>
          <p className="text-white/70 text-base">Here's your events overview for today.</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.02] bg-gradient-to-l from-white to-transparent"></div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
      >
        {stats.map((stat, index) => (
          <motion.div 
            key={index}
            variants={item}
            whileHover={{ scale: 1.03, y: -2 }}
            className={`${stat.bgColor} rounded-xl p-3 transition-all duration-500
              shadow-[0_0_8px_rgba(255,255,255,0.02)] hover:shadow-[0_0_12px_rgba(255,255,255,0.03)]
              backdrop-blur-[2px] hover:backdrop-blur-[5px] border border-[#2A2A2A]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 mb-1 text-xs font-medium">{stat.title}</p>
                <h3 className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</h3>
              </div>
              <div className="bg-white/[0.02] p-2 rounded-lg backdrop-blur-[3px] shadow-inner">
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Highlights Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white bg-opacity-[0.03] rounded-xl p-4
          shadow-[0_0_10px_rgba(255,255,255,0.02)] hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]
          backdrop-blur-[2px] transition-all duration-500 border border-[#2A2A2A]"
      >
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <AiOutlineStar className="text-pink2" />
          Highlights
        </h2>
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {highlights.map((highlight, index) => (
            <motion.div 
              key={index}
              variants={item}
              whileHover={{ y: -4 }}
              className="bg-white/[0.02] rounded-lg p-3 transition-all duration-500
                shadow-[0_0_8px_rgba(255,255,255,0.01)] hover:shadow-[0_0_12px_rgba(255,255,255,0.02)]
                backdrop-blur-[3px] border border-[#2A2A2A]"
            >
              <div className={`${highlight.color} mb-2`}>
                {highlight.icon}
              </div>
              <h3 className="text-white/80 font-medium mb-0.5 text-base">{highlight.title}</h3>
              <p className={`${highlight.color} font-bold text-sm`}>{highlight.value}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeDashboard;