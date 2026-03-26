"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Protected({ children, allowedRoles = [] }) {
    const [role, setRole] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const userRole = localStorage.getItem("role");
        setRole(userRole);

        if (!allowedRoles.includes(userRole)) {
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        }
    }, [router, allowedRoles]);

    if (role === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-gray-600 text-lg">Checking authorization...</p>
            </div>
        );
    }

    if (!allowedRoles.includes(role)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-red-500 text-xl font-semibold">
                    You are not authorized. Redirecting to login...
                </p>
            </div>
        );
    }

    return children;
}
