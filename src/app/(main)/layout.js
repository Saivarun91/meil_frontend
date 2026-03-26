// app/(main)/layout.js
"use client";

import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import "../globals.css";

function MainLayoutContent({ children }) {
    const { isMainSidebarCollapsed } = useSidebar();

    return (
        <div className="flex min-h-screen bg-white overflow-hidden">
            {/* Sidebar (fixed left) */}
            <Sidebar />

            {/* Main section with Navbar on top */}
            <div
                className={`flex-1 flex flex-col transition-all duration-300 ${
                    isMainSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
                }`}
            >
                {/* Navbar */}
                <Navbar />

                {/* Page content */}
                <main className="flex-1 overflow-y-auto px-3">
                    <div className="max-w-7xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}

export default function MainLayout({ children }) {
    return (
        <SidebarProvider>
            <MainLayoutContent>{children}</MainLayoutContent>
        </SidebarProvider>
    );
}
