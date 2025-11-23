"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    FilePlus,
    ClipboardList,
    ShieldCheck,
    LogOut,
    User,
    Package,
    Search,
    Star,
  } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";

export default function Sidebar() {
    const pathname = usePathname();
    const { user, role, permissions, logout } = useAuth();
    console.log(permissions)

    const navItems = [
      { name: "Home", href: "/app", icon: Home,keywords: ["home"] },
      { name: "Search", href: "/search", icon: Search,keywords: ["search"] },
      { name: "Favorites", href: "/favorites", icon: Star,keywords: ["favorites", "favourites", "search"] },
      { name: "Requests", href: "/requests", icon: FilePlus,keywords: ["request"] },
      { name: "Materials", href: "/materials", icon: Package,keywords: ["materials"] },
      { name: "Governance", href: "/governance", icon: ShieldCheck,keywords: ["governance"] },
      { name: "Admin Panel", href: "/dashboard/employees", icon: Home,keywords: ["dashboard"] }
    
    ];

    // 🔑 Filter items based on permissions + CRUD flags
    const allowedNavItems = navItems.filter((item) => {
        const perm = permissions.find((p) =>
            item.keywords.some((kw) =>
                p.permission_name.toLowerCase().includes(kw)
            )
        );
        // return perm && (perm.can_create || perm.can_update || perm.can_delete || perm.can_export);
        return perm

    });


    return (
        <aside className="w-64 h-screen bg-[#2f3190] flex flex-col fixed left-0 top-0 shadow-xl z-10">
            {/* Logo */}
            <div className="text-center py-6 border-b border-white/10 items-center justify-center">
                <Image
                    src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
                    alt="MEIL Logo"
                    className="bg-amber-50 w-3/4 mx-6 p-3 rounded-md"
                    width={800}
                    height={500}
                />
            </div>

            {/* User Info */}
            {user && (
                <div className="px-4 py-3 mt-4 mx-4 bg-white/10 rounded-lg flex items-center gap-3">
                    <div className="bg-[#7F56D9] p-2 rounded-full">
                        <User size={16} className="text-white" />
                    </div>
                    <div className="text-white text-sm">
                        <p className="font-medium">{user.emp_name || user.email}</p>
                        <p className="text-xs opacity-80">Role: {role || "N/A"}</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 mt-6 overflow-y-auto">
                <ul className="space-y-2 px-4">
                    {allowedNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group relative overflow-hidden ${isActive
                                        ? "bg-red-500 text-white shadow-lg"
                                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? "animate-pulse" : ""} />
                                    {item.name}
                                    {isActive && (
                                        <span className="absolute right-3 w-2 h-2 bg-white rounded-full animate-ping"></span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}

                    {user && (
                        <li>
                            <button
                                onClick={logout}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium w-full text-left text-gray-300 hover:bg-white/10 hover:text-white"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </li>
                    )}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-xs text-gray-400">
                © {new Date().getFullYear()} MEIL MDM
                <p className="mt-1 text-[10px] opacity-70">v2.0 Enhanced</p>
            </div>
        </aside>
    );
}