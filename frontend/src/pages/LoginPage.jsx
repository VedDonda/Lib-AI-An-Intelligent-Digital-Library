import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import { loginRequest } from "../lib/authApi";
import "../index.css";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
            const loggedInName = response?.data?.user?.name || "User";
            setSuccess(`${loggedInName} logged in successfully.`);
        } catch (apiError) {
            setError(apiError.message || "Unable to login.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] text-white overflow-hidden">
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-28 relative z-10">
                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <BookOpen className="size-5 text-purple-400" />
                        </div>
                        <span className="text-lg font-bold tracking-wide">LibAI</span>
                    </div>
                </div>

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
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]"></div>

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-center">

                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative mb-8"
                    >
                        <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-40 rounded-full"></div>
                        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 shadow-inner flex items-center justify-center border border-white/20 backdrop-blur-sm">
                            <BookOpen className="size-14 text-white/90" />
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
