'use client';
import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Folder, Info, Loader2, Eye } from "lucide-react";
import { 
  fetchProjects, 
  createProject, 
  updateProject, 
  deleteProject 
} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";
import ViewModal from "@/components/ViewModal";
import { useSortableData } from "@/hooks/useSortableData";  

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [newProject, setNewProject] = useState({
        project_code: "",
        project_name: "",
    });
    const [editProject, setEditProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingProject, setViewingProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const {user,token,role,checkPermission} = useAuth();
    // Load data on component mount
    useEffect(() => {
        if (token) {
            loadProjects();
        }
    }, [token]);

    const loadProjects = async () => {
        if (!token) return; // don't try if no token yet
        try {
            setLoading(true);
            // // const token = localStorage.getItem("token");
            // if (!token) {
            //     setError("No authentication token found");
            //     return;
            // }
            
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
            setError("Project Code must be at least 4 digits and must not start with 0");
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
        console.log("editProject", editProject);
        console.log("project_code", editProject.project_code);

        try {
            setSaving(true);
            // const token = localStorage.getItem("token");
            if (!token) {
                setError("No authentication token found");
                return;
            }
            console.log("editProject", editProject);
            await updateProject(token, editProject.project_code, { project_name: editProject.project_name });
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

    // ✅ Open View Modal
    const openViewModal = (project) => {
        setViewingProject(project);
        setIsViewModalOpen(true);
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

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
            

                {/* Search Section */}
                <div className="bg-white w-full rounded-lg flex p-4 shadow-sm mb-6">
                    <div className="relative w-7/8 mr-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search projects by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {checkPermission("project", "create") && (
                        <button
                            onClick={openAddModal}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                        >
                            <Plus size={18} className="mr-2" />
                            Add Project
                        </button>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="text-red-600 text-sm">{error}</div>
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
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                        <p className="text-gray-600">Loading projects...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full border-collapse">
      {/* Table Header */}
      <thead className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white shadow-md">
        <tr>
          <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('project_code')}>Code{getSortIcon('project_code')}</th>
          <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('project_name')}>Name{getSortIcon('project_name')}</th>
          <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('created')}>Created{getSortIcon('created')}</th>
          <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('createdby')}>Created By{getSortIcon('createdby')}</th>
          <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('updated')}>Last Updated{getSortIcon('updated')}</th>
          <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('updatedby')}>Updated By{getSortIcon('updatedby')}</th>
          <th className="px-6 py-3 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
        </tr>
      </thead>

      {/* Table Body */}
      <tbody>
        {sortedProjects.length > 0 ? (
          sortedProjects.map((proj, index) => (
            <tr
              key={proj.id || proj.project_code}
              className={`transition-all duration-200 ${
                index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
              } hover:bg-purple-50`}
            >
              <td className="px-6 py-4">
                <div className="inline-block px-2 py-1 bg-purple-100 text-purple-800 font-mono rounded-lg shadow-sm text-sm">
                  {proj.project_code}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{proj.project_name}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{proj.created}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{proj.createdby || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{proj.updated}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{proj.updatedby || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openViewModal(proj)}
                    className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition duration-200"
                    title="View"
                  >
                    <Eye size={16} />
                  </button>
                  {checkPermission("project", "update") && (
                    <button
                      onClick={() => openEditModal(proj)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition duration-200"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {checkPermission("project", "delete") && (
                    <button
                      onClick={() => handleDelete(proj.id || proj.project_code, proj.project_name)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition duration-200"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan="7"
              className="px-6 py-8 text-center text-sm text-gray-500"
            >
              {projects.length === 0
                ? "No projects found. Add a new project to get started."
                : "No projects match your search criteria."}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
                  
                  
                )}

                {/* Info Section */}
                {/* <div className="bg-blue-50 rounded-lg p-6 mt-6 border border-blue-200">
                    <div className="flex items-start">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                            <Info className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Project Management Guide</h3>
                            <ul className="list-disc list-inside text-blue-700 space-y-1">
                                <li>Use the search bar to find projects by name or code</li>
                                <li>Click the "Add Project" button to create new projects</li>
                                <li>Use the edit and delete icons to modify or remove projects</li>
                                <li>Project codes must be unique for each project</li>
                            </ul>
                        </div>
                    </div>
                </div> */}
            </div>

            {/* Project Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {isEditing ? "Edit Project" : "Add New Project"}
                            </h2>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <div className="text-red-600 text-sm">{error}</div>
                                </div>
                            )}
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {isEditing && (
                                        <p className="text-xs text-gray-500 mt-1">Project code cannot be changed</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter project name"
                                        value={isEditing ? editProject.project_name : newProject.project_name}
                                        onChange={(e) =>
                                            isEditing
                                                ? setEditProject({ ...editProject, project_name: e.target.value })
                                                : setNewProject({ ...newProject, project_name: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={saving}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={isEditing ? handleUpdate : handleAdd}
                                    disabled={saving || (isEditing ? !editProject.project_name : !newProject.project_code || !newProject.project_name)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                >
                                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                    {isEditing ? "Save Changes" : "Add Project"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            <ViewModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingProject(null);
                }}
                data={viewingProject}
                title="View Project Details"
                fieldLabels={{
                    id: "ID",
                    project_code: "Project Code",
                    project_name: "Project Name",
                    created: "Created",
                    createdby: "Created By",
                    updated: "Updated",
                    updatedby: "Updated By"
                }}
            />
        </div>
    );
}