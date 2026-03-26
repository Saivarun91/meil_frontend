// components/Toast.js
"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export function Toast() {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleToast = (event) => {
            setToast(event.detail);
            setTimeout(() => setToast(null), 3000);
        };

        window.addEventListener('showToast', handleToast);
        return () => window.removeEventListener('showToast', handleToast);
    }, []);

    if (!toast) return null;

    const icons = {
        success: <CheckCircle className="h-5 w-5" />,
        error: <XCircle className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
    };

    const colors = {
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        info: "bg-blue-50 border-blue-200 text-blue-800",
    };

    return (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className={`flex items-center p-4 rounded-lg shadow-lg max-w-md border ${colors[toast.type]}`}>
                <div className="mr-3">
                    {icons[toast.type]}
                </div>
                <p className="font-medium flex-1">
                    {toast.message}
                </p>
                <button
                    onClick={() => setToast(null)}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}