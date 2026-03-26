"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";

/**
 * SearchableDropdown - A reusable searchable dropdown component for foreign key fields
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of options to display
 * @param {string|number} props.value - Current selected value (the ID/key)
 * @param {Function} props.onChange - Callback when selection changes (receives the selected value)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Label for the field
 * @param {boolean} props.required - Whether the field is required
 * @param {boolean} props.disabled - Whether the field is disabled
 * @param {Function} props.getOptionLabel - Function to get display label from option (default: option.label || option.name || String(option))
 * @param {Function} props.getOptionValue - Function to get value from option (default: option.value || option.id || option)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.searchPlaceholder - Placeholder for search input
 */
export default function SearchableDropdown({
    options = [],
    value,
    onChange,
    placeholder = "Select an option...",
    label,
    required = false,
    disabled = false,
    getOptionLabel = (option) => {
        // Try common label fields
        if (option.label) return option.label;
        if (option.name) return option.name;
        if (option.project_name) return option.project_name;
        if (option.company_name) return option.company_name;
        if (option.role_name) return option.role_name;
        if (option.emp_name) return option.emp_name;
        if (option.item_desc) return option.item_desc;
        if (option.mat_type_desc) return option.mat_type_desc;
        if (option.mgrp_shortname) return option.mgrp_shortname;
        if (option.sgrp_shortname) return option.sgrp_shortname;
        // Try code fields
        if (option.project_code) return `${option.project_code} - ${option.project_name || ''}`;
        if (option.mgrp_code) return `${option.mgrp_code} - ${option.mgrp_shortname || ''}`;
        if (option.mat_type_code) return `${option.mat_type_code} - ${option.mat_type_desc || ''}`;
        if (option.local_item_id) return `${option.local_item_id} - ${option.item_desc || ''}`;
        // Fallback to string conversion
        return String(option);
    },
    getOptionValue = (option) => {
        // Try common value fields
        if (option.value !== undefined) return option.value;
        if (option.id !== undefined) return option.id;
        if (option.project_code) return option.project_code;
        if (option.company_name) return option.company_name;
        if (option.role_name) return option.role_name;
        if (option.emp_id) return option.emp_id;
        if (option.local_item_id) return option.local_item_id;
        if (option.mgrp_code) return option.mgrp_code;
        if (option.mat_type_code) return option.mat_type_code;
        if (option.sgrp_code) return option.sgrp_code;
        // Fallback to the option itself
        return option;
    },
    className = "",
    searchPlaceholder = "Search...",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);
    const dropdownRef = useRef(null);

    // Filter options based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredOptions(options);
        } else {
            const term = searchTerm.toLowerCase();
            setFilteredOptions(
                options.filter((option) => {
                    const label = getOptionLabel(option).toLowerCase();
                    return label.includes(term);
                })
            );
        }
    }, [searchTerm, options, getOptionLabel]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Find selected option
    const selectedOption = options.find(
        (option) => getOptionValue(option) === value
    );

    const handleSelect = (option) => {
        const optionValue = getOptionValue(option);
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange(null);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500 dark:text-red-400">*</span>}
                </label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
            w-full px-4 py-2 text-left border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${disabled ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed" : "bg-white dark:bg-gray-800 cursor-pointer"}
            ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600"}
            flex items-center justify-between
          `}
                >
                    <span className={selectedOption ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
                        {selectedOption
                            ? getOptionLabel(selectedOption)
                            : placeholder}
                    </span>
                    <div className="flex items-center space-x-2">
                        {selectedOption && !disabled && (
                            <X
                                size={16}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronDown
                            size={16}
                            className={`text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? "transform rotate-180" : ""
                                }`}
                        />
                    </div>
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                                />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="overflow-y-auto max-h-48">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => {
                                    const optionValue = getOptionValue(option);
                                    const optionLabel = getOptionLabel(option);
                                    const isSelected = optionValue === value;

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleSelect(option)}
                                            className={`
                        w-full px-4 py-2 text-left hover:bg-blue-50 dark:hover:bg-gray-700 
                        transition-colors text-gray-900 dark:text-gray-100
                        ${isSelected ? "bg-blue-100 dark:bg-blue-900 font-medium" : ""}
                      `}
                                        >
                                            {optionLabel}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    No options found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

