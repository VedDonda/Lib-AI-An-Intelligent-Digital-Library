import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const AppLayout = () => {
    return (
        <div className="h-screen bg-[#050505] flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
