import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Loader, BookOpen, ShieldCheck, RefreshCw, CheckCircle } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyOtpRequest, resendOtpRequest } from "../lib/authApi";
import "../index.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerifyOtpPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const emailFromQuery = searchParams.get("email") || "";

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputRefs = useRef([]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // only digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // take last char
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!pasted) return;
        const newOtp = [...otp];
        for (let i = 0; i < pasted.length; i++) {
            newOtp[i] = pasted[i];
        }
        setOtp(newOtp);
        const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const otpString = otp.join("");
        if (otpString.length < OTP_LENGTH) {
            setError("Please enter the complete 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            await verifyOtpRequest({ email: emailFromQuery, otp: otpString });
            setSuccess("Email verified successfully! Redirecting to login...");
            setTimeout(() => navigate("/login"), 1500);
        } catch (apiError) {
            setError(apiError.message || "Verification failed.");
            setOtp(Array(OTP_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0 || isResending) return;
        setError("");
        setSuccess("");
        setIsResending(true);
        try {
            await resendOtpRequest({ email: emailFromQuery });
            setSuccess("A new OTP has been sent to your email.");
            setResendCooldown(RESEND_COOLDOWN);
            setOtp(Array(OTP_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        } catch (apiError) {
            setError(apiError.message || "Failed to resend OTP.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
            {/* Left Panel — Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 relative z-10">
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <BookOpen className="size-5 text-purple-400" />
                        </div>
                        <span className="text-lg font-bold tracking-wide">LibAI</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/15 rounded-lg">
                                <ShieldCheck className="size-6 text-purple-400" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Verify Email</h2>
                        </div>
                        <p className="text-zinc-500 text-sm mt-2">
                            We sent a 6-digit code to{" "}
                            <span className="text-purple-400 font-medium">{emailFromQuery || "your email"}</span>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        {error && (
                            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                        )}
                        {success && (
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2"
                            >
                                <CheckCircle className="size-4 flex-shrink-0" />
                                <span>{success}</span>
                            </motion.div>
                        )}

                        {/* OTP Input Boxes */}
                        <div className="flex justify-center gap-3">
                            {otp.map((digit, index) => (
                                <motion.input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border 
                                        ${digit
                                            ? "border-purple-500/60 bg-purple-500/10 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                                            : "border-zinc-700 bg-zinc-900/50 text-white"
                                        }
                                        focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30
                                        transition-all duration-200 caret-transparent selection:bg-transparent`}
                                    style={{ caretColor: "transparent" }}
                                />
                            ))}
                        </div>

                        {/* Verify Button */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition duration-200"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Verify Email"}
                        </motion.button>
                    </form>

                    {/* Resend */}
                    <div className="mt-6 text-center space-y-3">
                        <p className="text-sm text-zinc-500">
                            Didn't receive the code?{" "}
                            <button
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || isResending}
                                className={`font-medium inline-flex items-center gap-1 ${resendCooldown > 0
                                        ? "text-zinc-600 cursor-not-allowed"
                                        : "text-purple-400 hover:text-purple-300"
                                    } transition-colors`}
                            >
                                {isResending ? (
                                    <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-3 h-3" />
                                )}
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                            </button>
                        </p>
                        <p className="text-sm text-zinc-500">
                            Wrong email?{" "}
                            <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                                Sign up again
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right Panel — Decorative */}
            <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] m-3 rounded-[2rem] overflow-hidden border border-zinc-800/50 shadow-2xl">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-green-600/15 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-center">
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative mb-8"
                    >
                        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-30 rounded-full"></div>
                        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-inner flex items-center justify-center border border-white/20 backdrop-blur-sm">
                            <Mail className="size-14 text-white/90" />
                        </div>
                    </motion.div>

                    <h1 className="text-2xl font-bold mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Check Your Inbox
                    </h1>
                    <p className="text-zinc-400 max-w-sm text-base leading-relaxed mb-12">
                        We've sent a verification code to your email. Enter it to activate your account.
                    </p>

                    {/* Animated dots */}
                    <div className="flex gap-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 bg-green-400/50 rounded-full"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;
