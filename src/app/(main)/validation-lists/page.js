"use client";
import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, CheckSquare, Info, Loader2
} from "lucide-react";
import {
  fetchValidationLists,
  createValidationList,
  updateValidationList,
  deleteValidationList
} from "../../../lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSortableData } from "@/hooks/useSortableData";
import BackButton from "@/components/BackButton";

export default function ValidationListsPage() {
  const [validationLists, setValidationLists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    listname: "",
    listvalue: "",
  });

  // ✅ Role state
  const { user, checkPermission, token } = useAuth();
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    } else {
      const storedRole = localStorage.getItem("role");
      if (storedRole) setRole(storedRole);
    }
  }, [user]);

  // Load data on component mount
  useEffect(() => {
    loadValidationLists();
  }, [token]);

  const loadValidationLists = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      const data = await fetchValidationLists(token);
      setValidationLists(data);
    } catch (err) {
      setError("Failed to load validation lists: " + (err.response?.data?.error || err.message));
      console.error("Error loading validation lists:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter validation lists
  const filteredValidationLists = validationLists.filter(list => {
    const matchesSearch =
      (list.listname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (JSON.stringify(list.listvalue) || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const { sortedData: sortedValidationLists, requestSort, getSortIcon } = useSortableData(filteredValidationLists);

  // Pagination logic
  const totalPages = Math.ceil(sortedValidationLists.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentValidationLists = sortedValidationLists.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Modal handlers
  const handleAddNew = () => {
    setEditingList(null);
    setFormData({
      listname: "",
      listvalue: "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleEdit = (list) => {
    setEditingList(list);
    setFormData({
      listname: list.listname,
      listvalue: Array.isArray(list.listvalue) ? list.listvalue.join(', ') : JSON.stringify(list.listvalue),
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingList(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveList = async () => {
    if (!formData.listname || !formData.listvalue) {
      setError("Please fill in required fields: List Name and List Value");
      return;
    }

    // Check permission before proceeding
    if (editingList) {
      if (!checkPermission("validation", "update")) {
        setError("You don't have permission to update validation lists");
        return;
      }
    } else {
      if (!checkPermission("validation", "create")) {
        setError("You don't have permission to create validation lists");
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");

      const listValueArray = formData.listvalue
        .split(',')
        .map(item => item.trim())
        .filter(item => item);

      const dataToSend = {
        listname: formData.listname,
        listvalue: listValueArray
      };

      if (editingList) {
        await updateValidationList(token, editingList.list_id, dataToSend);
      } else {
        await createValidationList(token, dataToSend);
      }

      await loadValidationLists();
      handleCloseModal();
    } catch (err) {
      setError("Failed to save validation list: " + (err.response?.data?.error || err.message));
      console.error("Error saving validation list:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (list_id) => {
    if (window.confirm("Are you sure you want to delete this validation list? This action cannot be undone.")) {
      // Check permission before proceeding
      if (!checkPermission("validation", "delete")) {
        setError("You don't have permission to delete validation lists");
        return;
      }
      
      try {
        setError(null);
        const token = localStorage.getItem("token");
        await deleteValidationList(token, list_id);
        await loadValidationLists();
      } catch (err) {
        setError("Failed to delete validation list: " + (err.response?.data?.error || err.message));
        console.error("Error deleting validation list:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
       

        {/* Search */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search validation lists by name, type, or values..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {checkPermission("validation", "create") && (
              <button
                onClick={handleAddNew}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Add List
              </button>
            )}
          </div>
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
            <p className="text-gray-600">Loading validation lists...</p>
          </div>
        ) : (
          /* Validation Lists Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('listname')}>List Name{getSortIcon('listname')}</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Values</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('created')}>Created{getSortIcon('created')}</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('updated')}>Updated{getSortIcon('updated')}</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {currentValidationLists.length > 0 ? (
            currentValidationLists.map((list, index) => (
              <tr
                key={list.list_id}
                className={`transition-all duration-200 ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                } hover:bg-purple-50`}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  <div className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded-lg shadow-sm">
                    {list.listname}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div
                    className="truncate"
                    title={Array.isArray(list.listvalue) ? list.listvalue.join(', ') : JSON.stringify(list.listvalue)}
                  >
                    {Array.isArray(list.listvalue) ? list.listvalue.join(', ') : JSON.stringify(list.listvalue)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {list.created ? new Date(list.created).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {list.updated ? new Date(list.updated).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex space-x-2">
                    {checkPermission("validation", "update") && (
                      <button
                        onClick={() => handleEdit(list)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition duration-200"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {checkPermission("validation", "delete") && (
                      <button
                        onClick={() => handleDelete(list.list_id)}
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
              <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                {validationLists.length === 0
                  ? "No validation lists found. Add a new list to get started."
                  : "No validation lists found matching your criteria."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
            {/* Pagination */}
            {totalPages > 1 && (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, sortedValidationLists.length)}</span> of{' '}
              <span className="font-medium">{sortedValidationLists.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
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
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        {/* <div className="bg-blue-50 rounded-lg p-6 mt-6 border border-blue-200">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Validation Lists Guide</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Validation lists define allowed values for various system fields</li>
                <li>They ensure data consistency and compliance across the system</li>
                <li>Use the search bar to find lists by name, type, or values</li>
                <li>Click the "Add List" button to create new validation lists</li>
                <li>Values should be comma-separated (e.g., "Active,Inactive,Pending")</li>
                <li>Use the edit and delete icons to modify or remove lists</li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>

      {/* Validation List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingList ? "Edit Validation List" : "Add New Validation List"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">List Name *</label>
                <input
                  type="text"
                  name="listname"
                  value={formData.listname}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Material Status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">List Values *</label>
                <textarea
                  name="listvalue"
                  value={formData.listvalue}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Active,Inactive,Pending,Discontinued"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter comma-separated values (e.g., &quot;Active,Inactive,Pending&quot;)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveList}
                disabled={saving || !formData.listname || !formData.listvalue}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingList ? "Save Changes" : "Add List"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
