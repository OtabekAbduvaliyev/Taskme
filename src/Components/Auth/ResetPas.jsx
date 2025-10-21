import React, { useContext, useState, useRef, useEffect } from 'react'
import { AuthContext } from '../../Auth/AuthContext';

const OTP_LENGTH = 6;

const RestoreVerification = () => {
  const email = localStorage.getItem('email');
  const token = localStorage.getItem('auth_verification_token');
  const [otpArr, setOtpArr] = useState(Array(OTP_LENGTH).fill(""));
  const { accountRestoreVerification, loading } = useContext(AuthContext);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (idx, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newArr = [...otpArr];
    newArr[idx] = value;
    setOtpArr(newArr);
    if (value && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpArr[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
    if (paste.length === OTP_LENGTH && /^[0-9]+$/.test(paste)) {
      setOtpArr(paste.split(""));
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      e.preventDefault();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    accountRestoreVerification({ otp: otpArr.join(""), email, token });
    setOtpArr(Array(OTP_LENGTH).fill(""));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181A20]">
      <div className="max-w-md w-full bg-[#1E1E1E] rounded-2xl shadow-lg border-2 border-[#3A3A3A] overflow-hidden">
        <div className="relative p-8">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-pink2/20 to-transparent pointer-events-none" />
          <h1 className="text-3xl font-bold text-white mb-8 text-center drop-shadow">
            Confirm email
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div>
              <label
                htmlFor="otp"
                className="text-[#777C9D] text-lg font-semibold mb-4 block text-center"
              >
                Enter the 6-digit code sent to your email
              </label>
              <div className="flex justify-center items-center gap-1" onPaste={handlePaste}>
                {otpArr.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="off"
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-[#2A2A2A] border-2 border-[#3A3A3A] rounded-xl text-white focus:outline-none focus:border-pink2 focus:ring-1 focus:ring-pink2/50 transition-all duration-300"
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="h-14 w-full bg-gradient-to-r from-pink2 to-pink2/90 text-white rounded-xl text-lg font-bold hover:shadow-lg hover:shadow-pink2/20 transition relative overflow-hidden group"
              disabled={loading || otpArr.some(d => !d)}
            >
              <span className="relative z-10">
                {!loading ? "Verify" : "Loading..."}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink2/0 via-white/20 to-pink2/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RestoreVerification