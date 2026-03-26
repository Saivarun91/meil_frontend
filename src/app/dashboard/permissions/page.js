"use client";
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Plus, ChevronDown, ChevronRight, Eye, Edit, Trash2, PenTool, Users, X, Search, Check ,Shield,PlusCircle
    
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PermissionsPage() {
    const [permissions, setPermissions] = useState([]);
    const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/permissions`;
    const [newTempRole, setNewTempRole] = useState("");
    const { token, checkPermission } = useAuth();
    const uniqueRoles = Array.from(
        new Set(
            permissions.flatMap(p => Object.keys(p.template_roles || {}))
        )
    );

    const [expandedFunc, setExpandedFunc] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [viewingPermission, setViewingPermission] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        template_roles: {} // { roleName: { create, write, delete, export, enabled } }
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [toast, setToast] = useState({ show: false, message: "", type: "" });
    const [allRoles, setAllRoles] = useState([]);
    const [selectedRoleFilter, setSelectedRoleFilter] = useState("");

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/userroles/roles/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.roles) {
                    setAllRoles(data.roles.map(r => r.role_name));  // ✅ just names
                }
            })
            .catch(err => console.error("Error fetching roles:", err));
    }, []);

    const refreshPermissions = async () => {
        try {
            const res = await fetch(`${API_BASE}/`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            setPermissions(data.map(p => ({
                id: p.permission_id,
                name: p.permission_name,
                description: p.permission_description,
                createdAt: new Date().toISOString(),
                template_roles: p.template_roles || {}
            })));
        } catch (err) {
            console.error("Failed to refresh permissions:", err);
        }
    };
    useEffect(() => {
        refreshPermissions();
    }, []);
    // const allRoles = ["Admin", "MDGT", "Employee"];
    useEffect(() => {
        fetch(`${API_BASE}/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}` // if JWT auth
            }
        })
            .then(res => res.json())
            .then(data => {
                setPermissions(data.map(p => ({
                    id: p.permission_id,
                    name: p.permission_name,
                    description: p.permission_description,

                    createdAt: new Date().toISOString(),
                    template_roles: p.template_roles || {} // <- add this
                })));
            });
    }, []);

    console.log(permissions)
    useEffect(() => {
        // Reset selected roles when dialogs close
        if (!isAddDialogOpen && !isEditDialogOpen) {
            setSelectedRoles([]);
        }
    }, [isAddDialogOpen, isEditDialogOpen]);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    };

    const toggleExpand = (id) => {
        setExpandedFunc(expandedFunc === id ? null : id);
    };

    const handleRoleToggle = (role) => {
        if (selectedRoles.includes(role)) {
            setSelectedRoles(selectedRoles.filter(r => r !== role));
        } else {
            setSelectedRoles([...selectedRoles, role]);
        }
    };

    const handleAccessChange = (role, accessType) => {
        setFormData(prev => {
            const newAccess = { ...prev.access };
            if (!newAccess[role]) newAccess[role] = { read: false, write: false, view: false };
            newAccess[role][accessType] = !newAccess[role][accessType];
            return { ...prev, access: newAccess };
        });
    };

    const handleExpandedAccessChange = (permissionId, role, accessType) => {
        setPermissions(prev => prev.map(perm => {
            if (perm.id === permissionId) {
                const updatedAccess = {
                    ...perm.access,
                    [role]: {
                        ...perm.access[role],
                        [accessType]: !perm.access[role][accessType]
                    }
                };
                return { ...perm, access: updatedAccess };
            }
            return perm;
        }));
    };
    const handleAddPermission = async () => {

        if (!formData.name) {
            console.log("Errir")
            showToast("Fill all required fields", "error");
            return;
        }

        // Check permission before proceeding
        if (!checkPermission("permission", "create")) {
            showToast("You don't have permission to create permissions", "error");
            return;
        }

        console.log("temp roles : ", formData.template_roles)
        try {

            const res = await fetch(`${API_BASE}/create/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    permission_name: formData.name,
                    permission_description: formData.description,
                    template_roles: formData.template_roles
                })
            });

            console.log(res)

            const data = await res.json();
            if (res.ok) {
                await refreshPermissions();   // ✅ always fetch latest
                setIsAddDialogOpen(false);
                showToast("Permission created successfully");
            } else {
                showToast(data.error || "Failed to create", "error");
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    };


    const handleViewPermission = (permission) => {
        setViewingPermission(permission);
        setIsViewDialogOpen(true);
    };

    const handleEditPermission = (permission) => {
        setEditingPermission(permission);
        setFormData({
            name: permission.name,
            description: permission.description,
            template_roles: permission.template_roles || {} // <- use what's loaded
        });
        setIsEditDialogOpen(true);
    };

    const handleUpdatePermission = async () => {
        // Check permission before proceeding
        if (!checkPermission("permission", "update")) {
            showToast("You don't have permission to update permissions", "error");
            return;
        }

        try {
            console.log("update")
            const res = await fetch(`${API_BASE}/${editingPermission.id}/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({
                    permission_name: formData.name,
                    permission_description: formData.description,
                    template_roles: formData.template_roles
                })
            });

            const data = await res.json();
            if (res.ok) {
                await refreshPermissions();   // ✅ fetch latest data
                setIsEditDialogOpen(false);
                showToast("Permission updated successfully");
            } else {
                showToast(data.error || "Failed to update", "error");
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    };


    const handleDeletePermission = async (permission) => {
        // Check permission before proceeding
        if (!checkPermission("permission", "delete")) {
            showToast("You don't have permission to delete permissions", "error");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/${permission.id}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (res.ok) {
                setPermissions(prev => prev.filter(p => p.id !== permission.id));
                showToast("Permission deleted");
            } else {
                const data = await res.json();
                showToast(data.error || "Failed to delete", "error");
            }
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const filteredPermissions = permissions.filter(permission => {
        const name = permission.name || "";
        const description = permission.description || "";
        const query = searchQuery || "";

        const matchesSearch =
            name.toLowerCase().includes(query.toLowerCase()) ||
            description.toLowerCase().includes(query.toLowerCase());

        // now filtering by template_roles
        const matchesRole =
            !selectedRoleFilter ||
            Object.keys(permission.template_roles || {}).includes(selectedRoleFilter);

        return matchesSearch && matchesRole;
    });




    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="p-6 text-gray-800 bg-gray-50 min-h-screen">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${toast.type === "error" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                    }`}>
                    <div className="flex items-center">
                        <div className="mr-2">
                            {toast.type === "error" ? (
                                <X size={20} className="text-red-600" />
                            ) : (
                                <Check size={20} className="text-green-600" />
                            )}
                        </div>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                    {/* <h1 className="text-3xl font-bold text-indigo-900 font-roboto-slab">Permissions Management</h1> */}
                    {/* <p className="text-gray-600 mt-1">Manage access controls for different functionalities</p> */}
                </div>
                <div className="flex gap-2">
             
                </div>
            </div>

            {/* Stats Cards */}
         

            {/* Search and Filters */}
            <div className="flex flex-col w-full sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search permissions"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex">
                    <select
                        value={selectedRoleFilter}
                        onChange={(e) => setSelectedRoleFilter(e.target.value)}
                        className="px-4 py-2.5 border mr-3 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value="">All permissions</option>
                        {uniqueRoles.map((role) => (
                            <option key={role} value={role}>
                                {role} only
                            </option>
                        ))}
                    </select>
                    {checkPermission("permission", "create") && (
                    <button
                        onClick={() => {
                            setFormData({
                                name: "",
                                description: "",
                                template_roles: {}
                            }); // ✅ reset before opening Add dialog
                            setIsAddDialogOpen(true);
                        }}
                        className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
                    >
                        <Plus size={18} className="group-hover:scale-110 transition-transform" />
                        Create Permission
                    </button>
                )}

                    </div>

                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0 shadow-lg rounded-lg overflow-hidden">
                        {/* Table Header */}
                        <thead>
                            <tr className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white uppercase tracking-wide">
                                <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer select-none hover:brightness-110 transition-all duration-300">
                                    Permission
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Roles
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Created At
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody>
                            {filteredPermissions.length > 0 ? (
                                filteredPermissions.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        onClick={() => toggleExpand(item.id)}
                                        className={`transition-all duration-300 hover:bg-purple-50 cursor-pointer group ${
                                            index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 font-mono bg-purple-50 px-2 py-1 rounded-md inline-block shadow-sm">
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate" title={item.description}>
                                                {item.description}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.keys(item.template_roles || {}).map((role, idx) => (
                                                    <span
                                                        key={`${role}-${idx}`}
                                                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">{formatDate(item.createdAt)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-3">
                                                {checkPermission("permission", "update") && (
                                                    <button
                                                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditPermission(item);
                                                        }}
                                                        title="Edit Permission"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {checkPermission("permission", "delete") && (
                                                    <button
                                                        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition duration-200"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeletePermission(item);
                                                        }}
                                                        title="Delete Permission"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <Shield size={48} className="mb-4 opacity-50" />
                                            <p className="text-lg font-medium text-gray-500 mb-1">
                                                No permissions found
                                            </p>
                                            <p className="text-sm">
                                                Get started by adding a new permission
                                            </p>
                                            {checkPermission("permission", "create") && (
                                                <button
                                                    onClick={() => setIsAddDialogOpen(true)}
                                                    className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition duration-300"
                                                >
                                                    <PlusCircle className="w-5 h-5 mr-2" />
                                                    Add New Permission
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Permission Dialog */}
            {isAddDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Add New Permission</h2>
                            <button onClick={() => setIsAddDialogOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter permission name"
                                    />
                                </div>

                            </div>



                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter permission description"
                                    rows={3}
                                />
                            </div>



                            {/* {selectedRoles.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Access Controls</label>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                                                    <th className="px-4 py-3 font-medium text-gray-700">Read</th>
                                                    <th className="px-4 py-3 font-medium text-gray-700">Write</th>
                                                    <th className="px-4 py-3 font-medium text-gray-700">View</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedRoles.map(role => (
                                                    <tr key={role} className="border-t border-gray-200 even:bg-white odd:bg-gray-50">
                                                        <td className="px-4 py-3 text-left font-medium text-indigo-700">{role}</td>
                                                        {["read", "write", "view"].map(accessType => (
                                                            <td key={accessType} className="py-3 text-center">
                                                                <label className="inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={formData.access[role]?.[accessType] || false}
                                                                        onChange={() => handleAccessChange(role, accessType)}
                                                                    />
                                                                    <div className={`w-9 h-5 ${formData.access[role]?.[accessType] ? 'bg-indigo-600' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all relative rounded-full transition-colors`}></div>
                                                                </label>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )} */}
                            {Object.keys(formData.template_roles || {}).length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Template Roles</label>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Role</th>
                                                    <th className="px-4 py-3">Enabled</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(formData.template_roles).map(([role, data]) => (
                                                    <tr key={role} className="border-t">
                                                        <td className="px-4 py-3 font-medium flex items-center justify-between">
                                                            {role}
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.enabled}
                                                                onChange={() =>
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        template_roles: {
                                                                            ...prev.template_roles,
                                                                            [role]: { enabled: !data.enabled }
                                                                        }
                                                                    }))
                                                                }
                                                            />

                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setFormData(prev => {
                                                                        const updated = { ...prev.template_roles };
                                                                        delete updated[role]; // remove this role
                                                                        return { ...prev, template_roles: updated };
                                                                    })
                                                                }
                                                                className="ml-3 text-red-500 hover:text-red-700 text-xs"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Add Template Role</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter temp role name"
                                        value={newTempRole}
                                        onChange={(e) => setNewTempRole(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newTempRole && !formData.template_roles[newTempRole]) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    template_roles: {
                                                        ...prev.template_roles,
                                                        [newTempRole]: { enabled: true } // default active
                                                    }
                                                }));
                                                setNewTempRole("");
                                            }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Add
                                    </button>
                                </div>
                                {/* 👇 New: Select from existing uniqueRoles */}
                                {uniqueRoles && uniqueRoles.length > 0 && (
                                    <div className="mt-3 flex gap-2">
                                        <select
                                            onChange={(e) => {
                                                const selectedRole = e.target.value;
                                                if (selectedRole && !formData.template_roles[selectedRole]) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        template_roles: {
                                                            ...prev.template_roles,
                                                            [selectedRole]: { enabled: true }
                                                        }
                                                    }));
                                                }
                                                e.target.value = ""; // reset
                                            }}
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="">Select existing role</option>
                                            {uniqueRoles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>




                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setIsAddDialogOpen(false)}
                                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddPermission}
                                    className="px-5 cursor-pointer py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Create Permission
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Permission Dialog */}
            {isViewDialogOpen && viewingPermission && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Permission Details</h2>
                            <button onClick={() => setIsViewDialogOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name</label>
                                    <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                                        {viewingPermission.name}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                                    <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                                        {viewingPermission.slug}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Permission Group</label>
                                <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
                                    {viewingPermission.permissionGroup}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 min-h-[80px]">
                                    {viewingPermission.description}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Roles</label>
                                <div className="flex gap-3 flex-wrap">
                                    {viewingPermission.roles.map(role => (
                                        <span
                                            key={role}
                                            className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-300"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Access Controls</label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                                                <th className="px-4 py-3 font-medium text-gray-700">Read</th>
                                                <th className="px-4 py-3 font-medium text-gray-700">Write</th>
                                                <th className="px-4 py-3 font-medium text-gray-700">View</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingPermission.roles.map(role => (
                                                <tr key={role} className="border-t border-gray-200 even:bg-white odd:bg-gray-50">
                                                    <td className="px-4 py-3 text-left font-medium text-indigo-700">{role}</td>
                                                    {["read", "write", "view"].map(accessType => (
                                                        <td key={accessType} className="py-3 text-center">
                                                            <div className="flex justify-center">
                                                                {viewingPermission.access[role]?.[accessType] ? (
                                                                    <Check size={18} className="text-green-600" />
                                                                ) : (
                                                                    <X size={18} className="text-red-600" />
                                                                )}
                                                            </div>
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setIsViewDialogOpen(false)}
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Permission Dialog */}
            {isEditDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Edit Permission</h2>
                            <button onClick={() => setIsEditDialogOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Permission Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Enter permission name"
                                    />
                                </div>

                            </div>



                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter permission description"
                                    rows={3}
                                />
                            </div>

                            {Object.keys(formData.template_roles || {}).length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Template Roles</label>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">Role</th>
                                                    <th className="px-4 py-3">Enabled</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(formData.template_roles).map(([role, data]) => (
                                                    <tr key={role} className="border-t">
                                                        <td className="px-4 py-3 font-medium">{role}</td>
                                                        <td className="py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={data.enabled}
                                                                onChange={() =>
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        template_roles: {
                                                                            ...prev.template_roles,
                                                                            [role]: { enabled: !data.enabled }
                                                                        }
                                                                    }))
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setFormData(prev => {
                                                                        const updated = { ...prev.template_roles };
                                                                        delete updated[role];
                                                                        return { ...prev, template_roles: updated };
                                                                    })
                                                                }
                                                                className="ml-3 text-red-500 hover:text-red-700 text-xs"
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>

                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Add Template Role</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter temp role name"
                                        value={newTempRole}
                                        onChange={(e) => setNewTempRole(e.target.value)}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newTempRole && !formData.template_roles[newTempRole]) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    template_roles: {
                                                        ...prev.template_roles,
                                                        [newTempRole]: { enabled: true } // default enabled
                                                    }
                                                }));
                                                setNewTempRole("");
                                            }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setIsEditDialogOpen(false)}
                                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePermission}
                                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Update Permission
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}