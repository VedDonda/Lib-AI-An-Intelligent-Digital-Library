import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ShieldCheck, Eye, EyeOff, Loader, ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import BackButton from "../components/BackButton";
import {
    forgotPasswordRequest,
    verifyForgotPasswordOtpRequest,
    resetPasswordRequest,
} from "../lib/authApi";
import logo from "../assets/logo.jpeg";
import "../index.css";

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState("email");

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef([]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [redirectIn, setRedirectIn] = useState(3);

    useEffect(() => {
        if (step !== "done") return;
        setRedirectIn(3);
        const interval = setInterval(() => {
            setRedirectIn((c) => {
                if (c <= 1) {
                    clearInterval(interval);
                    navigate("/login");
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [step]);

    const startResendCooldown = () => {
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown((c) => {
                if (c <= 1) { clearInterval(interval); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) { setError("Please enter your email."); return; }
        setIsLoading(true);
        try {
            await forgotPasswordRequest({ email: email.trim() });
            startResendCooldown();
            setStep("otp");
        } catch (err) {
            setError(err.message || "Failed to send OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpInput = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const updated = [...otp];
        updated[index] = value;
        setOtp(updated);
        if (value && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        const otpStr = otp.join("");
        if (otpStr.length < 6) { setError("Please enter the full 6-digit OTP."); return; }
        setIsLoading(true);
        try {
            const res = await verifyForgotPasswordOtpRequest({ email: email.trim(), otp: otpStr });
            setResetToken(res?.data?.resetToken || "");
            setStep("reset");
        } catch (err) {
            setError(err.message || "Invalid or expired OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError("");
        setIsLoading(true);
        try {
            await forgotPasswordRequest({ email: email.trim() });
            startResendCooldown();
            setOtp(["", "", "", "", "", ""]);
        } catch (err) {
            setError(err.message || "Failed to resend OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");
        if (!newPassword.trim()) { setError("Please enter a new password."); return; }
        if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
        setIsLoading(true);
        try {
            await resetPasswordRequest({ email: email.trim(), resetToken, newPassword });
            setStep("done");
        } catch (err) {
            setError(err.message || "Failed to reset password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 relative z-10">

                {/* <div className="mb-10">
                    <img src={logo} alt="LibAI Logo" className="h-10 w-auto object-contain rounded-lg" />
                </div> */}

                <AnimatePresence>
                    {step !== "done" && (
                        <BackButton
                            onClick={() => {
                                if (step === "otp") { setStep("email"); setError(""); setOtp(["", "", "", "", "", ""]); }
                                else if (step === "reset") { setStep("otp"); setError(""); }
                                else navigate("/login");
                            }}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">

                    {step === "email" && (
                        <motion.div
                            key="email"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold mb-2 tracking-tight">Forgot Password?</h2>
                                <p className="text-zinc-500 text-sm">Enter your email and we'll send you a reset code.</p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-5">
                                {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-zinc-400 ml-1">Email address</label>
                                    <Input
                                        icon={Mail}
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition duration-200"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Send Reset Code"}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {step === "otp" && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-8 mt-2">
                                <h2 className="text-3xl font-bold mb-2 tracking-tight">Check your inbox</h2>
                                <p className="text-zinc-500 text-sm">
                                    We sent a 6-digit code to <span className="text-white font-medium">{email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                                <div className="flex gap-3 justify-between">
                                    {otp.map((digit, i) => (
                                        <input
                                            key={i}
                                            ref={(el) => (otpRefs.current[i] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpInput(i, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-xl font-bold bg-zinc-900/50 border border-zinc-800 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-white outline-none transition duration-200 hover:bg-zinc-900"
                                        />
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition duration-200"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Verify Code"}
                                </motion.button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-zinc-500">
                                    Didn't receive it?{" "}
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={resendCooldown > 0 || isLoading}
                                        className="text-purple-400 hover:text-purple-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {step === "reset" && (
                        <motion.div
                            key="reset"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold mb-2 tracking-tight">Set New Password</h2>
                                <p className="text-zinc-500 text-sm">Choose a strong password for your account.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-400 ml-1">New Password</label>
                                        <Input
                                            icon={Lock}
                                            type={showNew ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            rightElement={
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNew((v) => !v)}
                                                    className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                                                    tabIndex={-1}
                                                >
                                                    {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            }
                                        />
                                    </div>

                                    <PasswordStrengthMeter password={newPassword} />

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-400 ml-1">Confirm Password</label>
                                        <Input
                                            icon={Lock}
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            rightElement={
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirm((v) => !v)}
                                                    className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                                                    tabIndex={-1}
                                                >
                                                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition duration-200"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Reset Password"}
                                </motion.button>
                            </form>
                        </motion.div>
                    )}

                    {step === "done" && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                                className="flex justify-center mb-6"
                            >
                                <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                    <CheckCircle className="size-10 text-green-400" />
                                </div>
                            </motion.div>
                            <h2 className="text-3xl font-bold mb-2 tracking-tight">Password Reset!</h2>
                            <p className="text-zinc-500 text-sm mb-4">Your password has been updated successfully.</p>
                            <p className="text-zinc-600 text-xs">
                                Redirecting to login in <span className="text-purple-400 font-semibold">{redirectIn}s</span>…
                            </p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            <div className="hidden lg:flex w-1/2 relative bg-[#0a0a0a] m-3 rounded-[2rem] overflow-hidden border border-zinc-800/50 shadow-2xl">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-center">

                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative mb-8"
                    >
                        <div className="absolute inset-0 bg-purple-900 blur-2xl opacity-40 rounded-full"></div>
                        <div className="relative w-80 h-80 rounded-full overflow-hidden shadow-inner border border-white/20 backdrop-blur-sm">
                            <img src={logo} alt="LibAI Logo" className="w-full h-full object-cover" />
                        </div>
                    </motion.div>

                    <h1 className="text-2xl font-bold mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Account Recovery
                    </h1>
                    <p className="text-zinc-400 max-w-sm text-base leading-relaxed mb-12">
                        We'll help you regain access to your LibAI account safely and securely.
                    </p>

                    <div className="relative w-full max-w-[200px] h-12 flex items-center justify-center">
                        <motion.div
                            className="absolute w-24 h-1 bg-purple-500/30 rounded-full"
                            animate={{ width: ["20%", "80%", "20%"], opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                            className="absolute w-16 h-1 bg-indigo-500/40 rounded-full blur-[2px]"
                            animate={{ width: ["10%", "60%", "10%"], opacity: [0.2, 0.6, 0.2] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        />
                        <motion.div
                            className="absolute w-2 h-2 bg-white/50 rounded-full"
                            animate={{ x: [-40, 40, -40] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
