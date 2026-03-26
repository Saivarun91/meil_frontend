"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Loader2, User, Building2, ShieldCheck, Search, Filter, Users, Sparkles, CheckSquare, Square, Check,Mail } from "lucide-react";
import {useAuth} from "@/context/AuthContext";
import { useSortableData } from "@/hooks/useSortableData";

export default function ApprovalsPage() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [assigningId, setAssigningId] = useState(null);
    const [assigningMultiple, setAssigningMultiple] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("all");
    const [companies, setCompanies] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState(new Set());
    const [bulkRole, setBulkRole] = useState("");

    const {user,token,role,checkPermission} = useAuth();

    const showToast = (message, type = "info") => {
        window.dispatchEvent(
            new CustomEvent("showToast", { detail: { message, type } })
        );
    };

    // ✅ Fetch employees without role
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/without-role/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to load employees without role");
                const data = await res.json();
                setEmployees(data.employees_without_role || []);
                setFilteredEmployees(data.employees_without_role || []);

                // Extract unique companies
                const uniqueCompanies = [...new Set(data.employees_without_role.map(emp => emp.company))];
                setCompanies(uniqueCompanies);
            } catch (err) {
                showToast("Error loading employees", "error");
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchEmployees();
    }, [token]);

    // ✅ Filter employees based on search and company
    useEffect(() => {
        let result = employees;

        if (searchQuery) {
            result = result.filter(emp =>
                emp.emp_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCompany !== "all") {
            result = result.filter(emp => emp.company === selectedCompany);
        }

        setFilteredEmployees(result);
    }, [searchQuery, selectedCompany, employees]);

    // ✅ Fetch roles
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/userroles/roles/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to load roles");
                const data = await res.json();
                setRoles(data.roles || []);
            } catch (err) {
                showToast("Error loading roles", "error");
            }
        };
        if (token) fetchRoles();
    }, [token]);

    // ✅ Toggle employee selection
    const toggleEmployeeSelection = (empId) => {
        const newSelection = new Set(selectedEmployees);
        if (newSelection.has(empId)) {
            newSelection.delete(empId);
        } else {
            newSelection.add(empId);
        }
        setSelectedEmployees(newSelection);
    };

    // ✅ Select all employees
    const toggleSelectAll = () => {
        if (selectedEmployees.size === filteredEmployees.length) {
            setSelectedEmployees(new Set());
        } else {
            setSelectedEmployees(new Set(filteredEmployees.map(emp => emp.emp_id)));
        }
    };

    // ✅ Assign role to single employee
    const handleAssignRole = async (empId, role) => {
        if (!role) {
            showToast("Please select a role before assigning", "error");
            return;
        }

        // Check permission before proceeding
        if (!checkPermission("approval", "update")) {
            showToast("You don't have permission to assign roles", "error");
            return;
        }

        setAssigningId(empId);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/assign-role/${empId}/`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ role }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Role assignment failed");

            showToast(`✅ Assigned role "${role}" to ${data.emp_name}`, "success");

            // remove assigned employee from list
            setEmployees((prev) => prev.filter((emp) => emp.emp_id !== empId));
            setSelectedEmployees(prev => {
                const newSet = new Set(prev);
                newSet.delete(empId);
                return newSet;
            });
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setAssigningId(null);
        }
    };

    // ✅ Assign role to multiple employees (using backend bulk endpoint)
    const handleBulkAssignRole = async () => {
        if (selectedEmployees.size === 0) {
            showToast("Please select at least one employee", "error");
            return;
        }

        if (!bulkRole) {
            showToast("Please select a role to assign", "error");
            return;
        }

        // Check permission before proceeding
        if (!checkPermission("approval", "update")) {
            showToast("You don't have permission to assign roles", "error");
            return;
        }

        setAssigningMultiple(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/bulk-assign-role/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    emp_ids: Array.from(selectedEmployees),
                    role: bulkRole,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bulk role assignment failed");

            showToast(`✅ ${data.message}`, "success");

            // Remove successfully updated employees
            const successfulIds = data.updated_employees.map(emp => emp.emp_id);
            setEmployees(prev => prev.filter(emp => !successfulIds.includes(emp.emp_id)));

            // Clear selection
            setSelectedEmployees(new Set());
            setBulkRole("");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setAssigningMultiple(false);
        }
    };


    const { sortedData: sortedEmployees, requestSort, getSortIcon } = useSortableData(filteredEmployees);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-violet-600" size={28} />
                <h1 className="text-3xl font-bold text-violet-700">Role Assignment</h1> */}
            {/* </div> */}
            {/* <p className="text-gray-600 mb-8">Assign appropriate roles to employees who don't have one yet</p> */}

            {/* Stats and Filters */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 mb-6 border border-violet-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-violet-100 p-2 rounded-lg">
                            <Users className="text-violet-700" size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-violet-800">{filteredEmployees.length} Employees Need Roles</h3>
                            <p className="text-sm text-gray-600">{selectedEmployees.size} selected</p>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedCompany("all");
                        }}
                        className="px-4 py-2 bg-white text-violet-700 border border-violet-300 rounded-lg text-sm hover:bg-violet-50 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employees by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent appearance-none bg-white"
                        >
                            <option value="all">All Companies</option>
                            {companies.map((company, index) => (
                                <option key={index} value={company}>{company}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedEmployees.size > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-violet-200 mt-4">
                        <h4 className="font-medium text-violet-700 mb-2">Bulk Actions ({selectedEmployees.size} selected)</h4>
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex-1 flex items-center gap-2">
                                <ShieldCheck size={18} className="text-violet-600" />
                                <select
                                    value={bulkRole}
                                    onChange={(e) => setBulkRole(e.target.value)}
                                    className="flex-1 border border-violet-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                >
                                    <option value="">Select role for all</option>
                                    {roles.map((role) => (
                                        <option key={role.userrole_id} value={role.role_name}>
                                            {role.role_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleBulkAssignRole}
                                disabled={assigningMultiple || !bulkRole}
                                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {assigningMultiple ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} /> Assigning...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} /> Assign to All Selected
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center h-64 bg-white rounded-2xl shadow-sm border border-violet-100">
                    <Loader2 className="animate-spin text-violet-600 mb-4" size={40} />
                    <p className="text-violet-700">Loading employees...</p>
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0 shadow-lg rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white uppercase tracking-wide">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Select</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => requestSort('emp_name')}>Employee {getSortIcon('emp_name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => requestSort('company_name')}>Company {getSortIcon('company_name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => requestSort('role_name')}>Role {getSortIcon('role_name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Users size={48} className="mb-4 opacity-50" />
                                            <p className="text-lg font-medium text-gray-500 mb-1">
                                                {employees.length === 0 ? "All employees have roles assigned" : "No employees found"}
                                            </p>
                                            <p className="text-sm">
                                                {employees.length === 0
                                                    ? "You're all caught up! All employees have roles assigned."
                                                    : "Try adjusting your search criteria or filters."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-0 shadow-lg rounded-lg overflow-hidden">
                            {/* Table Header */}
                            <thead>
                                <tr className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white uppercase tracking-wide">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="p-1 rounded hover:bg-white/20 transition-colors"
                                        >
                                            {selectedEmployees.size === filteredEmployees.length ? (
                                                <CheckSquare size={20} />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => requestSort('emp_name')}>Employee {getSortIcon('emp_name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => requestSort('company_name')}>Company {getSortIcon('company_name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none" onClick={() => requestSort('role_name')}>Role {getSortIcon('role_name')}</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody>
                                {sortedEmployees.map((emp, index) => (
                                    <tr
                                        key={emp.emp_id}
                                        className={`transition-all duration-300 hover:bg-purple-50 ${
                                            index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleEmployeeSelection(emp.emp_id)}
                                                className={`p-1 rounded-full transition-colors ${
                                                    selectedEmployees.has(emp.emp_id) 
                                                        ? 'bg-purple-100 text-purple-600' 
                                                        : 'hover:bg-purple-100 text-purple-400'
                                                }`}
                                            >
                                                {selectedEmployees.has(emp.emp_id) ? (
                                                    <Check size={18} />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <User className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <div className="font-medium text-gray-900">{emp.emp_name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {emp.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-gray-900">
                                                <Building2 size={16} className="mr-2 text-purple-600" />
                                                <span>{emp.company}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                onChange={(e) =>
                                                    setEmployees((prev) =>
                                                        prev.map((r) =>
                                                            r.emp_id === emp.emp_id
                                                                ? { ...r, selectedRole: e.target.value }
                                                                : r
                                                        )
                                                    )
                                                }
                                                value={emp.selectedRole || ""}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                            >
                                                <option value="">Select a role</option>
                                                {roles.map((role, index) => (
                                                    <option key={`${role.userrole_id || index}-${role.role_name}`} value={role.role_name}>
                                                        {role.role_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-3">
                                                <button
                                                    disabled={assigningId === emp.emp_id || !emp.selectedRole}
                                                    onClick={() => handleAssignRole(emp.emp_id, emp.selectedRole)}
                                                    className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Assign role"
                                                >
                                                    {assigningId === emp.emp_id ? (
                                                        <Loader2 className="animate-spin" size={18} />
                                                    ) : (
                                                        <CheckCircle size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}