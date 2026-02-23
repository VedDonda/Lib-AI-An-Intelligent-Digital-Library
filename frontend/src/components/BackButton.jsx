import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ onClick, className = "absolute top-8 left-8", title = "Go back", ...props }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(-1);
        }
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={handleBack}
            className={`z-[50] p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors focus:outline-none ${className}`}
            title={title}
            {...props}
        >
            <ArrowLeft className="size-5" />
        </motion.button>
    );
};

export default BackButton;
