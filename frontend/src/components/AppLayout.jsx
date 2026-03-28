import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const AppLayout = () => {
    return (
        <div className="h-screen bg-[#050505] flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
