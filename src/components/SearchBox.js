"use client";
import { useState } from "react";

export default function SearchBox({ label, placeholder, onSearch }) {
    const [query, setQuery] = useState("");

    return (
        <div className="flex gap-2">
            <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
            />
            <button
                onClick={() => onSearch(query)}
                className="bg-gradient-to-r from-[#7F56D9] to-[#EC4899] px-5 py-3 rounded-lg font-semibold text-white hover:opacity-90"
            >
                {label}
            </button>
        </div>
    );
}
