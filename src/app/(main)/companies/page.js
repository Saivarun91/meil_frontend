"use client";
import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, Building, Info, Loader2, Eye
} from "lucide-react";
import { 
  fetchCompanies, 
  createCompany, 
  updateCompany, 
  deleteCompany 
} from "@/lib/api";
import {useAuth} from "@/context/AuthContext";
import ViewModal from "@/components/ViewModal";
import { useSortableData } from "@/hooks/useSortableData";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const {user,token,role} = useAuth();
  const [formData, setFormData] = useState({
    company_name: "",
  });

  // Load data on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      // const token = user.token;
      if (!token) {
        setError("No authentication token found");
        return;
      }
      
      const data = await fetchCompanies(token);
      setCompanies(data || []);
    } catch (err) {
      setError("Failed to load companies: " + (err.message || "Unknown error"));
      console.error("Error loading companies:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch =
      (company.company_name || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });
  const { sortedData: sortedCompanies, requestSort, getSortIcon } = useSortableData(filteredCompanies);

  // const role = localStorage.getItem("role");

  // Modal handlers
  const handleAddNew = () => {
    setEditingCompany(null);
    setFormData({
      company_name: "",
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleView = (company) => {
    setViewingCompany(company);
    setIsViewModalOpen(true);
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name,
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
    if (!formData.company_name) {
      setError("Please fill in required field: Company Name");
      return;
    }

    try {
      setSaving(true);
      // const token = localStorage.getItem("token");
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
      setError("Failed to save company: " + (err.message || "Unknown error"));
      console.error("Error saving company:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company_name) => {
    if (window.confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      try {
        // const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        await deleteCompany(token, company_name);
        await loadCompanies();
      } catch (err) {
        setError("Failed to delete company: " + (err.message || "Unknown error"));
        console.error("Error deleting company:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-default text-2xl font-bold text-gray-800 flex items-center">
              <Building className="mr-2" size={28} />
              Companies Management
            </h1>
            <p className="text-gray-600">Manage company information and organizational structure</p>
          </div>
          {role === "MDGT" && (
            <button
              onClick={handleAddNew}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} className="mr-2" />
              Add Company
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search companies by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
            <p className="text-gray-600">Loading companies...</p>
          </div>
        ) : (
          /* Companies Table */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="font-default px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('company_name')}>Company Name{getSortIcon('company_name')}</th>
                    <th className="font-default px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('created')}>Created{getSortIcon('created')}</th>
                    <th className="font-default px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => requestSort('updated')}>Updated{getSortIcon('updated')}</th>
                    <th className="font-default px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCompanies.length > 0 ? (
                    sortedCompanies.map((company) => (
                      <tr key={company.company_name} className="hover:bg-gray-50">
                        <td className="font-default px-6 py-4 text-sm font-medium text-gray-900">{company.company_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{company.created}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{company.updated}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleView(company)}
                              className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition duration-200"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEdit(company)}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition duration-200"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(company.company_name)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition duration-200"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                        {companies.length === 0 
                          ? "No companies found. Add a new company to get started." 
                          : "No companies found matching your criteria."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6 border border-blue-200">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Companies Guide</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Companies represent different organizations in the system</li>
                <li>Users are associated with companies for organizational structure</li>
                <li>Use the search bar to find companies by name</li>
                <li>Click the &quot;Add Company&quot; button to create new companies</li>
                <li>Use the edit and delete icons to modify or remove companies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingCompany ? "Edit Company" : "Add New Company"}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company Name"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the full company name</p>
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
                onClick={handleSaveCompany}
                disabled={saving || !formData.company_name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingCompany ? "Save Changes" : "Add Company"}
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
          setViewingCompany(null);
        }}
        data={viewingCompany}
        title="View Company Details"
        fieldLabels={{
          company_name: "Company Name",
          created: "Created",
          updated: "Updated"
        }}
      />
    </div>
  );
}
