"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Home,
    FilePlus,
    ShieldCheck,
    LogOut,
    User,
    Package,
    Search,
    Star,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUnreadCount } from "../lib/api";
import Image from "next/image";

export default function Sidebar() {
    const pathname = usePathname();
    const { user, role, permissions, logout, token } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    console.log(permissions)

    // Fetch unread count
    useEffect(() => {
        const fetchUnread = async () => {
            if (token) {
                try {
                    const data = await getUnreadCount(token);
                    setUnreadCount(data.unread_count || 0);
                } catch (error) {
                    console.error("Error fetching unread count:", error);
                    setUnreadCount(0);
                }
            }
        };

        if (token) {
            fetchUnread();
            // Refresh every 30 seconds
            const interval = setInterval(fetchUnread, 30000);
            return () => clearInterval(interval);
        }
    }, [token]);

    // Also refresh when navigating to/from requests page
    useEffect(() => {
        if (token && (pathname === "/requests" || pathname.startsWith("/requests/"))) {
            const fetchUnread = async () => {
                try {
                    const data = await getUnreadCount(token);
                    setUnreadCount(data.unread_count || 0);
                } catch (error) {
                    console.error("Error fetching unread count:", error);
                }
            };
            fetchUnread();
        }
    }, [pathname, token]);

    // Listen for custom event to refresh unread count
    useEffect(() => {
        const handleRefreshUnread = async () => {
            if (token) {
                try {
                    const data = await getUnreadCount(token);
                    setUnreadCount(data.unread_count || 0);
                } catch (error) {
                    console.error("Error fetching unread count:", error);
                }
            }
        };

        window.addEventListener("refreshUnreadCount", handleRefreshUnread);
        return () => {
            window.removeEventListener("refreshUnreadCount", handleRefreshUnread);
        };
    }, [token]);

    const navItems = [
        { name: "Home", href: "/app", icon: Home, keywords: ["home"] },
        { name: "Search", href: "/search", icon: Search, keywords: ["search"] },
        { name: "Favorites", href: "/favorites", icon: Star, keywords: ["favorites", "favourites", "search"] },
        { name: "Requests", href: "/requests", icon: FilePlus, keywords: ["request"] },
        { name: "Materials", href: "/materials", icon: Package, keywords: ["materials"] },
        { name: "Governance", href: "/governance", icon: ShieldCheck, keywords: ["governance"] },
        { name: "Admin Panel", href: "/dashboard/employees", icon: Home, keywords: ["dashboard"] }

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
                        const showUnreadBadge = item.name === "Requests" && unreadCount > 0;
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
                                    {showUnreadBadge && (
                                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                    {isActive && !showUnreadBadge && (
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

        </aside>
    );
}