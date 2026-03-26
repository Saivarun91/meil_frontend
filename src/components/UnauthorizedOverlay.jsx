"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function UnauthorizedOverlay({ children }) {
    const { role } = useAuth(); // 👈 directly from context
    const [visible, setVisible] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (role === null) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                router.push("/"); // redirect to home (or /login)
            }, 10000);

            return () => clearTimeout(timer);
        }
    }, [role, router]);

    if (role === null && visible) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
                    <p className="text-gray-700">You are not authorized</p>
                    <p className="text-gray-700">Please contact the admini via email abc@gmail.com</p>
                    <p className="mt-2 text-sm text-gray-500">Redirecting you to home...</p>
                </div>
            </div>
        );
    }

    return children; // ✅ only render content if role is valid
}
