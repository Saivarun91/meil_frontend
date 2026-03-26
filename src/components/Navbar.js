"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, HelpCircle, User, ArrowLeft, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext"

const pageTitles = {
    "/search": "Search",
    "/requests": "Requests",
    "/materials": "Materials",
    "/governance": "Governance Dashboard",
    "/material_groups": "Material Groups",
    "/material_types": "Material Types",
    "/projects": "Projects",
    "/supergroups": "Supergroups",
    "/validation_lists": "Validation Lists",
    "/material-attributes": "Material Group Attributes",
    // "/validation-lists": "Validation Lists",
    "/dashboard": "Overview",
    "/dashboard/employees": "Employees",
    "/dashboard/companies": "Companies",
    "/dashboard/projects": "Projects",
    "/dashboard/approvals": "Approvals",
    "/dashboard/permissions": "Permissions",
    "/dashboard/roles": "Roles",
    "/dashboard/email-domains": "Email Domains",
};

const backRoutes = {
    "/materials": "/governance",
    "/material_groups": "/governance",
    "/material_types": "/governance",
    "/projects": "/governance",
    "/supergroups": "/governance",
    // "/validation-lists": "/governance",
    // "/validation_lists": "/governance",
    "/material-attributes": "/governance",
    "/pricing": "/governance",
    "/collections": "/search",
    "/insights": "/search",
};

const Navbar = () => {
    const { logout, role } = useAuth()
    const pathname = usePathname();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const pageTitle = pageTitles[pathname] || "Meil";
    const backTarget = backRoutes[pathname];

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-blue-800 shadow-md sticky top-0 z-50">
            {/* Left section with optional back button + title */}
            <div className="flex items-center gap-4">
                {backTarget && (
                    <button
                        onClick={() => router.push(backTarget)}
                        className="flex items-center gap-1 text-gray-700 hover:text-pink-500 cursor-pointer"
                    >
                        <ArrowLeft size={20} className="text-white" />
                        <span className="hidden sm:inline text-white">Back</span>
                    </button>
                )}
            </div>

            {/* Page Title */}
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6 text-gray-700">
                <Link href="/help" className="hover:text-pink-500">
                    <HelpCircle size={22} className="text-white" />
                </Link>
                <Link href="/notifications" className="hover:text-pink-500 relative">
                    <Bell size={22} className="text-white" />
                    <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full px-1">
                        3
                    </span>
                </Link>

                {/* Profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="hover:text-pink-500"
                    >
                        <User size={22} className="text-white" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-20">
                            {role == 'Admin' ? (<Link
                                href="/dashboard/profile"
                                className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                                onClick={() => setDropdownOpen(false)}
                            >
                                Profile
                            </Link>) :
                                (<Link
                                    href="/profile"
                                    className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                                    onClick={() => setDropdownOpen(false)}
                                >
                                    Profile
                                </Link>)}

                            <button
                                onClick={logout}
                                className="w-full text-left px-4 py-2 flex items-center gap-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
