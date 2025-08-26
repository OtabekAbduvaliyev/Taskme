import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'

const Home = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Add shared button styles (default + hover)
  const btnDefault = 'px-7 py-2 rounded-xl bg-white text-pink2 font-bold text-lg shadow-lg hover:bg-pink2 hover:text-white transition-all duration-300';
  const btnAlt = 'px-7 py-2 rounded-xl bg-[#23272F] text-white font-bold text-lg border border-pink2 shadow-lg hover:bg-pink2 hover:text-white transition-all duration-300';

  return (
    <div className="min-h-screen bg-[#181A20] flex items-center justify-center relative overflow-hidden">
      {/* Modern gradient and geometric background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-pink2/10 via-[#23272F]/40 to-[#181A20]" />
        <div className="absolute top-10 left-10 w-64 h-64 bg-pink2/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#23272F]/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-pink2/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="mb-8"
        >
          <span className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-pink2/20 to-pink2/10 text-pink2 font-semibold text-sm tracking-wide mb-4">
            Welcome to <span className='text-white'>Eventify</span>
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
            Organize. Collaborate. <br />
            <span className="bg-gradient-to-r from-pink2 to-pink2/80 bg-clip-text text-transparent">
              Make Events Happen
            </span>
          </h1>
          <p className="text-lg text-[#C4E1FE]  max-w-xl mx-auto leading-relaxed">
            The modern platform for teams and creators to plan, manage, and celebrate events together. Designed for comfort, speed, and style.
          </p>
        </motion.div>
        {/* Auth Buttons - placed below hero text */}
        <div className="mt-2 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="/login"
            className={btnDefault}
          >
            Login
          </a>
          <a
            href="/register"
            className={btnAlt}
          >
            Register
          </a>
        </div>
      </div>
    </div>
  )
}

export default Home