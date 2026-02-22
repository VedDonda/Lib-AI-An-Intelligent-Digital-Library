import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader, User, GraduationCap, Library, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { registerRequest } from "../lib/authApi";
import "../index.css";
import logo from "../assets/logo.jpeg";

const SignUpPage = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!role) {
            setError("Please select a role first.");
            return;
        }

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError("Please fill name, email and password.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await registerRequest({
                role,
                name: name.trim(),
                email: email.trim(),
                password,
            });
            setSuccess(response?.message || "OTP sent! Redirecting to verification...");
            setName("");
            setEmail("");
            setPassword("");

            setTimeout(() => {
                navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
            }, 900);
        } catch (apiError) {
            setError(apiError.message || "Unable to register user.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 relative z-10">

                <AnimatePresence>
                    {role && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onClick={() => setRole(null)}
                            className="absolute top-8 left-8 z-50 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
                            title="Back to role selection"
                        >
                            <ArrowLeft className="size-5" />
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <img src={logo} alt="LibAI Logo" className="h-10 w-auto object-contain rounded-lg" />
                    </div>
                </div> */}

                <AnimatePresence mode="wait">
                    {!role ? (
                        <motion.div
                            key="role-selection"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold mb-2 tracking-tight">Join as...</h2>
                                <p className="text-zinc-500 text-sm">Choose your role to get started.</p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setRole("student")}
                                    className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all group flex items-center gap-4 text-left"
                                >
                                    <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                        <GraduationCap className="size-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Student</h3>
                                        <p className="text-xs text-zinc-500">Access resources for your studies</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setRole("librarian")}
                                    className="w-full p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all group flex items-center gap-4 text-left"
                                >
                                    <div className="p-3 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                        <Library className="size-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Librarian</h3>
                                        <p className="text-xs text-zinc-500">Manage and organize the library</p>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-sm text-zinc-500">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                                        Login
                                    </Link>
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="signup-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="mb-6 relative">
                                <h2 className="text-3xl font-bold mb-2 tracking-tight">
                                    {role === "student" ? "Student" : "Librarian"} Account
                                </h2>
                                <p className="text-zinc-500 text-sm">Create your account to continue.</p>
                            </div>

                            <form onSubmit={handleSignUp} className="space-y-4">
                                {error ? (
                                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                                ) : null}
                                {success ? (
                                    <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</p>
                                ) : null}

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-400 ml-1">Full Name</label>
                                        <Input
                                            icon={User}
                                            type="text"
                                            placeholder="Enter your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-400 ml-1">Email address</label>
                                        <Input
                                            icon={Mail}
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-zinc-400 ml-1">Password</label>
                                        <Input
                                            icon={Lock}
                                            type="password"
                                            placeholder="Create a password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <PasswordStrengthMeter password={password} />

                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition duration-200 mt-2"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Sign Up"}
                                </motion.button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-zinc-500">
                                    Already have an account?{" "}
                                    <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                                        Login
                                    </Link>
                                </p>
                            </div>
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
                        <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-40 rounded-full"></div>
                        <div className="relative w-28 h-28 rounded-full overflow-hidden shadow-inner border border-white/20 backdrop-blur-sm">
                            <img src={logo} alt="LibAI Logo" className="w-full h-full object-cover" />
                        </div>
                    </motion.div>

                    <h1 className="text-2xl font-bold mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Start Your Journey
                    </h1>
                    <p className="text-zinc-400 max-w-sm text-base leading-relaxed mb-12">
                        "A room without books is like a body without a soul."
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

export default SignUpPage;
