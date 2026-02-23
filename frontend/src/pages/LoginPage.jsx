import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import BackButton from "../components/BackButton";
import { loginRequest } from "../lib/authApi";
import { useAuth } from "../context/AuthContext";
import "../index.css";
import logo from "../assets/logo.jpeg";

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!email.trim() || !password.trim()) {
            setError("Please enter email and password.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await loginRequest({
                email: email.trim(),
                password,
            });
            const { user, accessToken } = response?.data || {};
            login(accessToken, user);
            setSuccess(`Welcome back, ${user?.name || "User"}!`);
            setTimeout(() => navigate("/dashboard"), 800);
        } catch (apiError) {
            setError(apiError.message || "Unable to login.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 relative z-10">
                {/* <div className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <img src={logo} alt="LibAI Logo" className="h-10 w-auto object-contain rounded-lg" />
                    </div>
                </div> */}

                <BackButton onClick={() => navigate("/")} />

                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome Back</h2>
                    <p className="text-zinc-500 text-sm">Enter your email and password to access your library.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error ? (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                    ) : null}
                    {success ? (
                        <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</p>
                    ) : null}

                    <div className="space-y-4">
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
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                }
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link
                            to="/forgot-password"
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors ml-auto"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition duration-200"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : "Login"}
                    </motion.button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-500">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
                            Register
                        </Link>
                    </p>
                </div>
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
                        <div className="relative w-80 h-80 rounded-full overflow-hidden shadow-inner border border-purple-200/20 backdrop-blur-sm">
                            <img src={logo} alt="LibAI Logo" className="w-full h-full object-cover" />
                        </div>
                    </motion.div>

                    <h1 className="text-2xl font-bold mb-3 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                        Unlock Infinite Knowledge
                    </h1>
                    <p className="text-zinc-400 max-w-sm text-base leading-relaxed mb-12">
                        Your intelligent digital library assistant. Read, analyze, and discover books with the power of AI.
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
export default LoginPage;
