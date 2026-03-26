"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton({ 
    href = "/governance", 
    label = "Back to Governance",
    className = ""
}) {
    const router = useRouter();

    const handleBack = () => {
        router.push(href);
    };

    return (
        <button
            onClick={handleBack}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 ${className}`}
        >
            <ArrowLeft size={16} />
            {label}
        </button>
    );
}
