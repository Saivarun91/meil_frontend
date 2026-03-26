// DashboardSidebar.js - Dynamic with permissions
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    Users,
    LogOut,
    User,
    ShieldCheck,
    Building,
    Building2,
    FilePlus,
    ClipboardList,
    Package,
    ArrowBigDown,
    Mail,
    Upload
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";
const permissionRouteMap = [
//   { name: "Overview", href: "/dashboard", icon: Home,keywords: ["dashboard"] },
  { name: "Employees/Users", href: "/dashboard/employees", icon: Users,keywords: ["employee"] },
  { name: "Companies", href: "/dashboard/companies", icon: Building,keywords: ["companies"] },
  { name: "Projects", href: "/dashboard/projects", icon: Building2,keywords: ["projects"] },
  { name: "Approvals", href: "/dashboard/approvals", icon: ShieldCheck,keywords: ["approval"] },
  { name: "Permissions", href: "/dashboard/permissions", icon: ShieldCheck,keywords: ["permission"] },
  { name: "Roles", href: "/dashboard/roles", icon: ShieldCheck,keywords: ["role"] },
  { name: "Email Domains", href: "/dashboard/email-domains", icon: Mail,keywords: ["email"] },
  {name: "Uploads", href: "/dashboard/upload", icon: Upload,keywords: ["upload"] },
  // { name: "User Dashboard", href: "/app", icon: Home },
];

export default function DashboardSidebar() {
    const pathname = usePathname();
    const { user, role, permissions, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Build nav items dynamically
   // Build nav items dynamically in correct order
const navItems = permissionRouteMap.filter((route) => {
  return permissions.some((p) =>
    route.keywords.some((kw) =>
      p.permission_name.toLowerCase().includes(kw)
    )
  );
});



    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-violet-600 to-purple-700 text-white p-2 rounded-md shadow-lg"
            >
                {isCollapsed ? "☰" : "✕"}
            </button>

            <aside
                className={`w-64 h-screen bg-gradient-to-b from-violet-800 via-purple-800 to-violet-900 flex flex-col fixed left-0 top-0 shadow-2xl z-40 transition-all ${isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
                    }`}
            >
                {/* Logo */}
                <div className="text-center py-6 border-b border-violet-600/30">
                    <Image
                        src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
                        alt="MEIL Logo"
                        className="bg-white w-3/4 mx-6 p-3 rounded-md"
                        width={800}
                        height={500}
                    />
                </div>

                {/* User Card */}
                {user && (
                    <div className="px-4 py-3 mt-4 mx-4 bg-violet-700/40 rounded-xl flex items-center gap-3">
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-2 rounded-full">
                            <User size={16} className="text-white" />
                        </div>
                        <div className="text-white text-sm">
                            <p className="font-medium">{user.emp_name || user.email}</p>
                            <p className="text-xs opacity-80">Role: {role || "N/A"}</p>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 mt-4 overflow-y-auto">
                    <ul className="space-y-2 px-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isActive
                                            ? "bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg"
                                            : "text-violet-100 hover:bg-violet-700/40 hover:text-white"
                                            }`}
                                    >
                                        <Icon size={20} className={isActive ? "animate-pulse" : ""} />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                        <li key="user-dashboard">
                            <Link
                                href="/app"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${pathname === "/app"
                                    ? "bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg"
                                    : "text-violet-100 hover:bg-violet-700/40 hover:text-white"
                                    }`}
                            >
                                <Home size={20} className={pathname === "/app" ? "animate-pulse" : ""} />
                                User Dashboard
                            </Link>
                        </li>


                        {user && (
                            <li>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium w-full text-left text-violet-100 hover:bg-violet-700/40 hover:text-white"
                                >
                                    <LogOut size={20} />
                                    Logout
                                </button>
                            </li>
                        )}
                    </ul>
                </nav>

            </aside>
        </>
    );
}
