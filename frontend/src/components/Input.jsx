import { motion } from "framer-motion";

const Input = ({ icon: Icon, ...props }) => {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Icon className="size-5 text-zinc-500" />
            </div>
            <input
                {...props}
                className="w-full pl-10 pr-3 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-white placeholder-zinc-600 transition duration-200 outline-none hover:bg-zinc-900"
            />
        </div>
    );
};

export default Input;
