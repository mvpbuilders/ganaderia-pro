  import { useState } from "react";
  import { Outlet } from "react-router-dom";
  import Sidebar from "./Sidebar";
  import MobileNav from "./MobileNav";
  import TopBar from "./TopBar";

  export default function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
        <MobileNav />
      </div>
    );
  }