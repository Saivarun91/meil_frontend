// app/material-groups/page.js
"use client";
import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, Folder, Info, Loader2, ChevronLeft, ChevronRight, CheckCircle, PlusCircle, FolderOpen, Eye
} from "lucide-react";
import { 
  fetchMaterialGroups, 
  createMaterialGroup, 
  updateMaterialGroup, 
  deleteMaterialGroup,
  fetchSuperGroups
} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";
import { useSortableData } from "@/hooks/useSortableData";
import BackButton from "@/components/BackButton";
import SearchableDropdown from "@/components/SearchableDropdown";
import ViewModal from "@/components/ViewModal";

export default function MaterialGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [superGroups, setSuperGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingGroup, setViewingGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  const {user,token,role,checkPermission} = useAuth();
  
  const formDataDefaults = {
    mgrp_code: "",
    mgrp_shortname: "",
    mgrp_longname: "",
    sgrp_code: "",
    search_type: "Materials",
    // attribgrpid: "",
    uom_values: [],
    notes: "",
  };

  const [formData, setFormData] = useState(formDataDefaults);
  const [uomInput, setUomInput] = useState("");

  // Load data on component mount
  useEffect(() => {
    if (token) {
      loadMaterialGroups();
      loadSuperGroups();
    }
  }, [token]);

  const loadMaterialGroups = async () => {
    if (!token) {
      // setError("No authentication token found");
      return;
  }
    try {
      setLoading(true);
      
      const data = await fetchMaterialGroups(token);
      setGroups(data || []);
    } catch (err) {
      setError("Failed to load material groups: " + (err.message || "Unknown error"));
      console.error("Error loading material groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuperGroups = async () => {
    if (!token) return;
    try {
      const data = await fetchSuperGroups(token);
      setSuperGroups(data || []);
    } catch (err) {
      console.error("Error loading super groups:", err);
    }
  };

  // Filter groups
  const filteredGroups = groups.filter(group => {
    const matchesSearch =
      (group.mgrp_shortname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.mgrp_longname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.mgrp_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.search_type || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const { sortedData: sortedGroups, requestSort, getSortIcon } = useSortableData(filteredGroups, 'mgrp_code');

  // Pagination
  const totalPages = Math.ceil(sortedGroups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedGroups.length);
  const currentGroups = sortedGroups.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };


  // Modal handlers
  const handleAddNew = () => {
    setEditingGroup(null);
    setFormData(formDataDefaults);
    setIsModalOpen(true);
    setError(null);
  };

  const handleView = (group) => {
    setViewingGroup(group);
    setIsViewModalOpen(true);
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      mgrp_code: group.mgrp_code,
      mgrp_shortname: group.mgrp_shortname,
      mgrp_longname: group.mgrp_longname,
      sgrp_code: group.sgrp_code?.sgrp_code || group.sgrp_code || "",
      search_type: group.search_type || "Materials",
      attribgrpid: group.attribgrpid || "",
      uom_values: group.uom_values || [],
      notes: group.notes || "",
    });
    setUomInput("");
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
    setFormData(formDataDefaults);
    setUomInput("");
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveGroup = async () => {
    if (!formData.mgrp_code || !formData.mgrp_shortname || !formData.mgrp_longname) {
      setError("Please fill in required fields: Code, Short Name, and Long Name");
      return;
    }

    try {
      setSaving(true);
      if (!token) {
        setError("No authentication token found");
        return;
      }

      if (editingGroup) {
        await updateMaterialGroup(token, editingGroup.mgrp_code, formData);
      } else {
        await createMaterialGroup(token, formData);
      }

      await loadMaterialGroups();
      handleCloseModal();
    } catch (err) {
      setError("Failed to save material group: " + (err.message || "Unknown error"));
      console.error("Error saving material group:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mgrp_code) => {
    if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      try {
        if (!token) {
          setError("No authentication token found");
          return;
        }

        await deleteMaterialGroup(token, mgrp_code);
        await loadMaterialGroups();
      } catch (err) {
        setError("Failed to delete material group: " + (err.message || "Unknown error"));
        console.error("Error deleting material group:", err);
      }
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
      
        {/* Search */}
        <div className="bg-white rounded-lg p-2 shadow-sm mb-3 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search groups by name, code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-3 rounded-lg">
              <span className="font-medium text-blue-600">{filteredGroups.length}</span>
              <span className="ml-1">groups found</span>
            </div>
            {checkPermission("group", "create") && (
              <button
                onClick={handleAddNew}
                className="flex items-center px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <Plus size={16} className="mr-1.5" />
                Add Group
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
            <div className="flex">
              <div className="text-red-600 text-xs">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600 transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-gray-600 text-sm">Loading material groups...</p>
          </div>
        ) : (
          /* Groups Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
           <div className="overflow-x-auto">
  <table className="w-full border-separate border-spacing-0 shadow-lg rounded-lg overflow-hidden">
    {/* Table Header */}
    <thead>
      <tr className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white uppercase tracking-wide">
        <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('mgrp_code')}>Code{getSortIcon('mgrp_code')}</th>
        <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('mgrp_shortname')}>Short Name{getSortIcon('mgrp_shortname')}</th>
        <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('mgrp_longname')}>Long Name{getSortIcon('mgrp_longname')}</th>
        <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('sgrp_code')}>Super Group{getSortIcon('sgrp_code')}</th>
        <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('search_type')}>Search Type{getSortIcon('search_type')}</th>
        <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('created')}>Created{getSortIcon('created')}</th>
        <th className="px-3 py-2 text-left text-xs font-semibold">Actions</th>
      </tr>
    </thead>

    {/* Table Body */}
    <tbody>
      {currentGroups.length > 0 ? (
        currentGroups.map((group, index) => (
          <tr
            key={group.mgrp_code}
            className={`transition-all duration-300 hover:bg-purple-50 ${
              index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
            }`}
          >
            <td className="px-3 py-2">
              <div className="text-xs font-medium text-gray-900 font-mono bg-purple-50 px-1.5 py-0.5 rounded-md inline-block shadow-sm">
                {group.mgrp_code}
              </div>
            </td>
            <td className="px-3 py-2">
              <div className="text-xs text-gray-900 font-medium">{group.mgrp_shortname}</div>
            </td>
            <td className="px-3 py-2">
              <div className="text-xs text-gray-900 max-w-xs truncate" title={group.mgrp_longname}>
                {group.mgrp_longname}
              </div>
            </td>
            <td className="px-3 py-2">
              <div className="text-xs text-gray-900">
                {group.supergroup || <span className="text-gray-400 italic">N/A</span>}
              </div>
            </td>
            <td className="px-3 py-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  group.search_type === "service"
                    ? "bg-blue-100 text-blue-800"
                    : group.search_type === "Materials"
                    ? "bg-green-100 text-green-800"
                    : group.search_type === "spares"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {group.search_type || "Materials"}
              </span>
            </td>
            <td className="px-3 py-2">
              <div className="text-xs text-gray-500">{group.created}</div>
            </td>
            <td className="px-3 py-2">
              <div className="flex space-x-1.5">
                <button
                  onClick={() => handleView(group)}
                  className="text-green-600 hover:text-green-800 p-1.5 rounded-full hover:bg-green-100 transition duration-200"
                  title="View"
                >
                  <Eye size={14} />
                </button>
                {checkPermission("group", "update") && (
                  <button
                    onClick={() => handleEdit(group)}
                    className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 transition duration-200"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                )}
                {checkPermission("group", "delete") && (
                  <button
                    onClick={() => handleDelete(group.mgrp_code)}
                    className="text-red-600 hover:text-red-800 p-1.5 rounded-full hover:bg-red-100 transition duration-200"
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
          <td colSpan="7" className="px-3 py-6 text-center">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <FolderOpen size={32} className="mb-2 opacity-50" />
              <p className="text-sm font-medium text-gray-500 mb-1">
                {groups.length === 0 ? "No material groups found" : "No groups match your criteria"}
              </p>
              <p className="text-xs">
                {groups.length === 0
                  ? "Get started by adding a new material group"
                  : "Try adjusting your search or filter"}
              </p>
              {groups.length === 0 && checkPermission("group", "create") && (
                <button
                  onClick={handleAddNew}
                  className="mt-2 inline-flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition duration-300"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add New Group
                </button>
              )}
            </div>
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
                    className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Previous
                  </button>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-700 mx-2">
                      Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{endIndex}</span> of{' '}
                      <span className="font-medium">{sortedGroups.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show limited page numbers with ellipsis for many pages
                        if (totalPages <= 7 || Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium transition-colors duration-200 ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600 font-bold'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        }
                        
                        // Show ellipsis for gaps in pagination
                        if (page === currentPage - 3 || page === currentPage + 3) {
                          return (
                            <span key={page} className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                              ...
                            </span>
                          );
                        }
                        
                        return null;
                      })}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        {/* <div className="bg-blue-50 rounded-xl p-6 mt-6 border border-blue-200">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-xl mr-4">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Material Groups Guide</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Groups help organize materials into logical categories</li>
                <li>Use the search bar to find groups by name, code, or description</li>
                <li>Click the "Add Group" button to create new material categories</li>
                <li>Use the edit and delete icons to modify or remove groups</li>
                <li>Deleting a group will not delete the materials in that group</li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>

      {/* Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingGroup ? "Edit Material Group" : "Add New Material Group"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:col-span-2">
                  <div className="text-red-600 text-xs">{error}</div>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Material Group Code *</label>
                <input
                  type="text"
                  name="mgrp_code"
                  value={formData.mgrp_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="GRP-001"
                  disabled={editingGroup}
                />
                {editingGroup && (
                  <p className="text-xs text-gray-500 mt-0.5">Code cannot be changed</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Short Name *</label>
                <input
                  type="text"
                  name="mgrp_shortname"
                  value={formData.mgrp_shortname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Fasteners"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Long Name *</label>
                <input
                  type="text"
                  name="mgrp_longname"
                  value={formData.mgrp_longname}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Fasteners and Hardware Components"
                />
              </div>
              
              <div>
                <SearchableDropdown
                  label="Super Group Code"
                  options={superGroups}
                  value={formData.sgrp_code}
                  onChange={(value) => setFormData(prev => ({ ...prev, sgrp_code: value || "" }))}
                  placeholder="Select super group..."
                  searchPlaceholder="Search super groups..."
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return option.sgrp_code ? `${option.sgrp_code} - ${option.sgrp_name || ''}` : (option.sgrp_name || String(option));
                  }}
                  getOptionValue={(option) => {
                    if (typeof option === 'string') return option;
                    return option.sgrp_code || option;
                  }}
                />
              </div>
              
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Group ID</label>
                <input
                  type="text"
                  name="attribgrpid"
                  value={formData.attribgrpid}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="ATTR-001"
                />
              </div> */}
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Search Type *
                </label>
                <select
                  name="search_type"
                  value={formData.search_type || "Materials"}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Materials">Materials</option>
                  <option value="service">Service</option>
                  <option value="spares">Spares</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Base Unit of Measure</label>
                <div className="flex gap-2 mb-1.5">
                  <input
                    type="text"
                    value={uomInput}
                    onChange={(e) => setUomInput(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = uomInput.trim().toUpperCase();
                        if (val && !formData.uom_values.includes(val)) {
                          setFormData(prev => ({ ...prev, uom_values: [...prev.uom_values, val] }));
                          setUomInput("");
                        }
                      }
                    }}
                    placeholder="Enter UOM and press Enter or click Add"
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = uomInput.trim().toUpperCase();
                      if (val && !formData.uom_values.includes(val)) {
                        setFormData(prev => ({ ...prev, uom_values: [...prev.uom_values, val] }));
                        setUomInput("");
                      }
                    }}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                {formData.uom_values.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.uom_values.map((uom, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                        {uom}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, uom_values: prev.uom_values.filter((_, idx) => idx !== i) }))}
                          className="ml-1.5 text-green-600 hover:text-green-800"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Additional notes and description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-3 border-t">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-3 py-1.5 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroup}
                disabled={saving || !formData.mgrp_code || !formData.mgrp_shortname || !formData.mgrp_longname}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                {editingGroup ? "Save Changes" : "Add Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingGroup(null);
        }}
        data={viewingGroup}
        title="View Material Group Details"
        fieldLabels={{
          mgrp_code: "Material Group Code",
          mgrp_shortname: "Short Name",
          mgrp_longname: "Long Name",
          sgrp_code: "Super Group",
          search_type: "Search Type",
          attribgrpid: "Attribute Group ID",
          notes: "Notes",
          created: "Created",
          createdby: "Created By",
          updated: "Updated",
          updatedby: "Updated By"
        }}
      />
    </div>
  );
}