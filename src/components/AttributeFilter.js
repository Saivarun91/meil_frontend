// AttributeFilter.js - Enhanced with interactive filtering
export default function AttributeFilter({ onFilterSelect, selectedFilters }) {
    const filterOptions = [
        { id: "construction", name: "Construction Materials" },
        { id: "metal", name: "Metal Pipes" },
        { id: "plumbing", name: "Plumbing" },
        { id: "electrical", name: "Electrical" },
        { id: "hardware", name: "Hardware" },
    ];

    return (
        <div className="space-y-4">
            <p className="text-gray-600">
                Select material groups to filter results:
            </p>

            <div className="space-y-2">
                {filterOptions.map(option => (
                    <div
                        key={option.id}
                        className={`flex justify-between items-center rounded-lg px-3 py-2 cursor-pointer transition-all ${selectedFilters.includes(option.name)
                                ? "bg-gradient-to-r from-[#7F56D9]/20 to-[#EC4899]/20 border border-[#7F56D9]/30"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                        onClick={() => onFilterSelect(option.name)}
                    >
                        <span className={selectedFilters.includes(option.name) ? "font-medium text-[#7F56D9]" : ""}>
                            {option.name}
                        </span>
                        <button
                            className={`px-3 py-1 rounded-lg text-sm ${selectedFilters.includes(option.name)
                                    ? "bg-gradient-to-r from-[#7F56D9] to-[#EC4899] text-white"
                                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                                }`}
                        >
                            {selectedFilters.includes(option.name) ? "Selected" : "Select"}
                        </button>
                    </div>
                ))}
            </div>

            {selectedFilters.length > 0 && (
                <button
                    className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
                    onClick={() => onFilterSelect("clear-all")}
                >
                    Clear All Filters
                </button>
            )}
        </div>
    );
}