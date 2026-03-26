'use client';
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Folder, Info, Loader2 } from "lucide-react";
import { useSortableData } from "@/hooks/useSortableData";
import { 
  fetchProjects, 
  createProject, 
  updateProject, 
  deleteProject 
} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";  

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [newProject, setNewProject] = useState({
        project_code: "",
        project_name: "",
    });
    const [editProject, setEditProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const {user,token,role,checkPermission} = useAuth();
    // Load data on component mount
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            // const token = localStorage.getItem("token");
            if (!token) {
                setError("No authentication token found");
                return;
            }
            
            const data = await fetchProjects(token);
            setProjects(data || []);
        } catch (err) {
            setError("Failed to load projects: " + (err.message || "Unknown error"));
            console.error("Error loading projects:", err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Add Project
    const handleAdd = async () => {
        if (!newProject.project_code || !newProject.project_name) {
            setError("Please fill in required fields: Project Code and Project Name");
            return;
        }
        if (!/^\d+$/.test(newProject.project_code)) {
            setError("Project Code must contain numbers only");
            return;
        }
        if (newProject.project_code.length < 3 || newProject.project_code.startsWith("0")) {
            setError("Project Code must be at least 3 digits and must not start with 0");
            return;
        }

        // Check permission before proceeding
        if (!checkPermission("project", "create")) {
            setError("You don't have permission to create projects");
            return;
        }

        try {
            setSaving(true);
            // const token = localStorage.getItem("token");
            if (!token) {
                setError("No authentication token found");
                return;
            }

            await createProject(token, newProject);
            await loadProjects();
            setNewProject({ project_code: "", project_name: "" });
            setIsModalOpen(false);
        } catch (err) {
            const msg = err.response?.data?.error || err.message || "Unknown error";
            setError(msg);
            console.error("Error creating project:", err);
        } finally {
            setSaving(false);
        }
    };

    // ✅ Update Project
    const handleUpdate = async () => {
        if (!editProject.project_name) {
            setError("Project name is required");
            return;
        }

        // Check permission before proceeding
        if (!checkPermission("project", "update")) {
            setError("You don't have permission to update projects");
            return;
        }

        try {
            setSaving(true);
            // const token = localStorage.getItem("token");
            if (!token) {
                setError("No authentication token found");
                return;
            }

            await updateProject(token, editProject.id, { project_name: editProject.project_name });
            await loadProjects();
            setEditProject(null);
            setIsModalOpen(false);
            setIsEditing(false);
        } catch (err) {
            setError("Failed to update project: " + (err.message || "Unknown error"));
            console.error("Error updating project:", err);
        } finally {
            setSaving(false);
        }
    };

    // ✅ Delete Project with confirmation
    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
            // Check permission before proceeding
            if (!checkPermission("project", "delete")) {
                setError("You don't have permission to delete projects");
                return;
            }
            
            try {
                //  const token = localStorage.getItem("token");
                if (!token) {
                    setError("No authentication token found");
                    return;
                }

                await deleteProject(token, id);
                await loadProjects();
            } catch (err) {
                setError("Failed to delete project: " + (err.message || "Unknown error"));
                console.error("Error deleting project:", err);
            }
        }
    };

    // ✅ Open Edit Modal
    const openEditModal = (project) => {
        setEditProject(project);
        setIsEditing(true);
        setIsModalOpen(true);
        setError(null);
    };

    // ✅ Open Add Modal
    const openAddModal = () => {
        setNewProject({ project_code: "", project_name: "" });
        setIsEditing(false);
        setIsModalOpen(true);
        setError(null);
    };

    // Filter projects based on search term
    const filteredProjects = projects.filter(project => 
        project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const { sortedData: sortedProjects, requestSort, getSortIcon } = useSortableData(filteredProjects);

    // Pagination logic
    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProjects = sortedProjects.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-3">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h1 className="font-default text-lg font-bold text-gray-800 flex items-center">
                            <Folder className="mr-1.5" size={20} />
                            Project Management
                        </h1>
                        <p className="text-xs text-gray-600">Create and manage your projects</p>
                    </div>
                    {checkPermission("project", "create") && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                        >
                            <Plus size={14} className="mr-1.5" />
                            Add Project
                        </button>
                    )}
                </div>

                {/* Search Section */}
                <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search projects by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                        <div className="flex">
                            <div className="text-red-600 text-xs">{error}</div>
                            <button 
                                onClick={() => setError(null)}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                        <p className="text-sm text-gray-600">Loading projects...</p>
                    </div>
                ) : (
                    /* Projects Table */
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="font-default px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('project_code')}>Code{getSortIcon('project_code')}</th>
                                        <th className="font-default px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('project_name')}>Name{getSortIcon('project_name')}</th>
                                        <th className="font-default px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('created')}>Created{getSortIcon('created')}</th>
                                        <th className="font-default px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('createdby')}>Created By{getSortIcon('createdby')}</th>
                                        <th className="font-default px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('updated')}>Last Updated{getSortIcon('updated')}</th>
                                        <th className="font-default px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('updatedby')}>Updated By{getSortIcon('updatedby')}</th>
                                        <th className="font-default px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentProjects.length > 0 ? (
                                        currentProjects.map((proj) => (
                                            <tr key={proj.id || proj.project_code} className="hover:bg-gray-50 transition duration-150">
                                                <td className="font-default px-3 py-2 text-xs font-medium text-gray-900">{proj.project_code}</td>
                                                <td className="px-3 py-2 text-xs text-gray-900">{proj.project_name}</td>
                                                <td className="px-3 py-2 text-xs text-gray-700">{proj.created}</td>
                                                <td className="px-3 py-2 text-xs text-gray-700">{proj.createdby || "N/A"}</td>
                                                <td className="px-3 py-2 text-xs text-gray-700">{proj.updated}</td>
                                                <td className="px-3 py-2 text-xs text-gray-700">{proj.updatedby || "N/A"}</td>
                                                <td className="px-3 py-2 text-xs text-gray-700">
                                                    <div className="flex space-x-1.5">
                                                        {checkPermission("project", "update") && (
                                                            <button
                                                                onClick={() => openEditModal(proj)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                                title="Edit"
                                                            >
                                                                <Edit size={14} />
                                                            </button>
                                                        )}
                                                        {checkPermission("project", "delete") && (
                                                            <button
                                                                onClick={() => handleDelete(proj.id || proj.project_code, proj.project_name)}
                                                                className="text-red-600 hover:text-red-800"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-3 py-4 text-center text-xs text-gray-500">
                                                {projects.length === 0 
                                                    ? "No projects found. Add a new project to get started." 
                                                    : "No projects match your search criteria."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-white px-3 py-2 flex items-center justify-between border-t border-gray-200 sm:px-4">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="ml-2 relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-gray-700">
                                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                            <span className="font-medium">{Math.min(endIndex, sortedProjects.length)}</span> of{' '}
                                            <span className="font-medium">{sortedProjects.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium ${
                                                        page === currentPage
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Info Section */}
                <div className="bg-blue-50 rounded-lg p-3 mt-3 border border-blue-200">
                    <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-lg mr-2">
                            <Info className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-blue-800 mb-1">Project Management Guide</h3>
                            <ul className="list-disc list-inside text-xs text-blue-700 space-y-0.5">
                                <li>Use the search bar to find projects by name or code</li>
                                <li>Click the &quot;Add Project&quot; button to create new projects</li>
                                <li>Use the edit and delete icons to modify or remove projects</li>
                                <li>Project codes must be unique for each project</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex justify-between items-center p-3 border-b">
                            <h2 className="text-base font-semibold text-gray-800">
                                {isEditing ? "Edit Project" : "Add New Project"}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-3">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
                                    <div className="text-red-600 text-xs">{error}</div>
                                </div>
                            )}
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Project Code {!isEditing && "*"}
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Enter unique project code (numbers only)"
                                        value={isEditing ? editProject.project_code : newProject.project_code}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            isEditing
                                                ? setEditProject({ ...editProject, project_code: val })
                                                : setNewProject({ ...newProject, project_code: val });
                                        }}
                                        disabled={isEditing}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {isEditing && (
                                        <p className="text-xs text-gray-500 mt-0.5">Project code cannot be changed</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Project Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter project name"
                                        value={isEditing ? editProject.project_name : newProject.project_name}
                                        onChange={(e) =>
                                            isEditing
                                                ? setEditProject({ ...editProject, project_name: e.target.value })
                                                : setNewProject({ ...newProject, project_name: e.target.value })
                                        }
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={saving}
                                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={isEditing ? handleUpdate : handleAdd}
                                    disabled={saving || (isEditing ? !editProject.project_name : !newProject.project_code || !newProject.project_name)}
                                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                                    {isEditing ? "Save Changes" : "Add Project"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
