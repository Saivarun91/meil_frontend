"use client";
import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, Building, Info, Loader2, X
} from "lucide-react";
import { 
  fetchCompanies, 
  createCompany, 
  updateCompany, 
  deleteCompany 
} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";
import { useSortableData } from "@/hooks/useSortableData";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { user, token, role, checkPermission } = useAuth();

  const [formData, setFormData] = useState({
    company_name: "",
    contact: "",
  });

  // Load data on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }
      
      const data = await fetchCompanies(token);
      setCompanies(data || []);
    } catch (err) {
      setError("Failed to load companies: " + (err.response?.data?.message || err.message || "Unknown error"));
      console.error("Error loading companies:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch =
      (company.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.contact || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });
  const { sortedData: sortedCompanies, requestSort, getSortIcon } = useSortableData(filteredCompanies);

  // const role = localStorage.getItem("role");

  // Modal handlers
  const handleAddNew = () => {
    setEditingCompany(null);
    setFormData({
      company_name: "",
      contact: "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name,
      contact: company.contact || "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveCompany = async () => {
    if (!formData.company_name.trim()) {
      setError("Please fill in required field: Company Name");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      if (editingCompany) {
        await updateCompany(token, editingCompany.company_name, formData);
      } else {
        await createCompany(token, formData);
      }

      await loadCompanies();
      handleCloseModal();
    } catch (err) {
      setError("Failed to save company: " + (err.response?.data?.message || err.message || "Unknown error"));
      console.error("Error saving company:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company_name) => {
    if (window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      try {
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        await deleteCompany(token, company_name);
        await loadCompanies();
      } catch (err) {
        setError("Failed to delete company: " + (err.response?.data?.message || err.message || "Unknown error"));
        console.error("Error deleting company:", err);
      }
    }
  };
  console.log("role",role);

  return (
    <div className="min-h-screen bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
       

        {/* Search */}
        <div className="bg-white rounded-lg p-3 shadow-sm mb-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search companies by name or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            {checkPermission("companies", "create") && (
  <button
    onClick={handleAddNew}
    className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
  >
    <Plus size={16} className="mr-1.5" />
    Add Company
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
            <p className="text-sm text-gray-600">Loading companies...</p>
          </div>
        ) : (
          /* Companies Table */
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white uppercase tracking-wide">
                    <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('company_name')}>Company Name{getSortIcon('company_name')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('contact')}>Contact{getSortIcon('contact')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('created')}>Created{getSortIcon('created')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold cursor-pointer select-none" onClick={() => requestSort('updated')}>Updated{getSortIcon('updated')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCompanies.length > 0 ? (
                    sortedCompanies.map((company, index) => (
                      <tr
                        key={company.company_name}
                        className={`transition-all duration-300 hover:bg-purple-50 ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                        }`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-blue-600" />
                            <div className="text-xs font-medium text-gray-900 font-mono bg-purple-50 px-1.5 py-0.5 rounded-md inline-block shadow-sm">
                              {company.company_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-900">{company.contact || "N/A"}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-500">{company.created ? new Date(company.created).toLocaleDateString() : "N/A"}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-500">{company.updated ? new Date(company.updated).toLocaleDateString() : "N/A"}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex space-x-1.5">
                            {checkPermission("companies", "update") && (
                              <button
                                onClick={() => handleEdit(company)}
                                className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-100 transition duration-200"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {checkPermission("companies", "delete") && (
                              <button
                                onClick={() => handleDelete(company.company_name)}
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
                      <td colSpan="5" className="px-3 py-6 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Building size={32} className="mb-2 opacity-50" />
                          <p className="text-sm font-medium text-gray-500 mb-1">
                            {companies.length === 0 ? "No companies found" : "No companies match your criteria"}
                          </p>
                          <p className="text-xs">
                            {companies.length === 0
                              ? "Get started by adding a new company"
                              : "Try adjusting your search or filter"}
                          </p>
                          {companies.length === 0 && checkPermission("companies", "create") && (
                            <button
                              onClick={handleAddNew}
                              className="mt-2 inline-flex items-center px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition duration-300"
                            >
                              <Plus size={16} className="mr-1.5" />
                              Add New Company
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
        )}

        
      </div>

      {/* Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center">
                <Building className="mr-2 text-blue-600" size={18} />
                {editingCompany ? "Edit Company" : "Add New Company"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 grid grid-cols-1 gap-3">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <div className="text-red-600 text-xs">{error}</div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter company name"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-0.5">Enter the full company name (max 20 characters)</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleInputChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter contact information"
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-0.5">Optional contact information (max 20 characters)</p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCompany}
                disabled={saving || !formData.company_name.trim()}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {editingCompany ? "Save Changes" : "Add Company"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
