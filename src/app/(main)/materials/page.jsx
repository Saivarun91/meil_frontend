// app/materials/page.js
"use client";
import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, Package, Info, Loader2, Eye
} from "lucide-react";
import { fetchItemMasters, createItemMaster, updateItemMaster, deleteItemMaster, fetchMaterialGroups, fetchMaterialTypes, fetchMaterialAttributes } from "../../../lib/api";
import {useAuth} from "@/context/AuthContext";
import BackButton from "@/components/BackButton";
import SearchableDropdown from "@/components/SearchableDropdown";
import ViewModal from "@/components/ViewModal";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [materialGroups, setMaterialGroups] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [materialAttributes, setMaterialAttributes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  
  const [formData, setFormData] = useState({
    sap_item_id: "",
    mat_type_code: "",
    mgrp_code: "",
    item_desc: "",
    notes: "",
    search_text: "",
    attributes: {},
  });
  const {user,token,role,checkPermission} = useAuth();
  // Load materials on component mount
  useEffect(() => {
    if (token) {
      loadMaterials();
      loadMaterialGroups();
      loadMaterialTypes();
    }
  }, [token]);

  // Load attributes when switching to attributes tab if material group is selected
  useEffect(() => {
    if (activeTab === "attributes" && formData.mgrp_code && Object.keys(materialAttributes).length === 0) {
      loadMaterialAttributes(formData.mgrp_code);
    }
  }, [activeTab, formData.mgrp_code]);


  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchItemMasters(token);
      setMaterials(data);
    } catch (err) {
      setError("Failed to load materials: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadMaterialGroups = async () => {
    try {
      const data = await fetchMaterialGroups(token);
      setMaterialGroups(data || []);
    } catch (err) {
      console.error("Error loading material groups:", err);
    }
  };

  const loadMaterialTypes = async () => {
    try {
      const data = await fetchMaterialTypes(token);
      setMaterialTypes(data || []);
    } catch (err) {
      console.error("Error loading material types:", err);
    }
  };

  const loadMaterialAttributes = async (mgrpCode) => {
    try {
      const data = await fetchMaterialAttributes(token);
      // Filter attributes for the selected material group
      const attributesForGroup = data.filter(attr => attr.mgrp_code === mgrpCode);
      
      // Transform the list of attributes into the expected format
      // { "Color": { "values": [...], ... }, "Size": { "values": [...], ... } }
      const attributesObj = {};
      attributesForGroup.forEach(attr => {
        attributesObj[attr.attribute_name] = {
          values: attr.possible_values || [],
          uom: attr.uom || null,
          print_priority: attr.print_priority || 0,
        };
      });
      
      setMaterialAttributes(attributesObj);
    } catch (err) {
      console.error("Error loading material attributes:", err);
      setMaterialAttributes({});
    }
  };

  // Get unique groups and types
  const groups = ["all", ...new Set(materials.map(m => m.mgrp_code))];
  const types = ["all", ...new Set(materials.map(m => m.mat_type_code))];

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch =
      material.item_desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.sap_item_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.search_text?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup =
      filterGroup === "all" || material.mgrp_code === filterGroup;

    const matchesType =
      filterType === "all" || material.mat_type_code === filterType;

    return matchesSearch && matchesGroup && matchesType;
  });
  // const role = localStorage.getItem("role");

  // Modal handlers
  const handleAddNew = () => {
    setEditingMaterial(null);
    setFormData({
      sap_item_id: "",
      mat_type_code: "",
      mgrp_code: "",
      item_desc: "",
      notes: "",
      search_text: "",
      attributes: {},
    });
    setMaterialAttributes({});
    setActiveTab("general");
    setError(null);
    setIsModalOpen(true);
  };

  const handleView = (material) => {
    setViewingMaterial(material);
    setIsViewModalOpen(true);
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      sap_item_id: material.sap_item_id || "",
      mat_type_code: material.mat_type_code || "",
      mgrp_code: material.mgrp_code || "",
      item_desc: material.item_desc || "",
      notes: material.notes || "",
      search_text: material.search_text || "",
      attributes: material.attributes || {},
    });
    if (material.mgrp_code) {
      loadMaterialAttributes(material.mgrp_code);
    }
    setActiveTab("general");
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAttributeChange = (attrName, attrValue) => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attrName]: attrValue
      }
    }));
  };

  const handleMgrpCodeChange = async (mgrpCode) => {
    setFormData(prev => ({ ...prev, mgrp_code: mgrpCode || "", attributes: {} }));
    if (mgrpCode) {
      await loadMaterialAttributes(mgrpCode);
    }
  };

  const handleSaveMaterial = async () => {
    if (!formData.mat_type_code || !formData.mgrp_code || !formData.item_desc) {
      setError("Please fill in required fields: Material Type Code, Material Group Code, and Item Description");
      return;
    }

    // Check permission before proceeding
    if (editingMaterial) {
      if (!checkPermission("item", "update")) {
        setError("You don't have permission to update materials");
        return;
      }
    } else {
      if (!checkPermission("item", "create")) {
        setError("You don't have permission to create materials");
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      // const token = localStorage.getItem("token");

      if (editingMaterial) {
        await updateItemMaster(token, editingMaterial.local_item_id, formData);
      } else {
        await createItemMaster(token, formData);
      }

      await loadMaterials();
      handleCloseModal();
    } catch (err) {
      setError("Failed to save material: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (local_item_id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      // Check permission before proceeding
        if (!checkPermission("item", "delete")) {
        setError("You don't have permission to delete materials");
        return;
      }
      
      try {
        setError(null);
        //  const token = localStorage.getItem("token");
        await deleteItemMaster(token, local_item_id);
        await loadMaterials();
      } catch (err) {
        setError("Failed to delete material: " + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
      

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search materials by name, code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Groups</option>
                {groups.filter(g => g !== "all").map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Types</option>
                {types.filter(t => t !== "all").map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {checkPermission("item", "create") && (
              <button
                onClick={handleAddNew}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} className="mr-2" />
                Add Material
              </button>
            )}
          </div>
        </div>

        {/* Materials Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
  {loading ? (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      <span className="ml-2 text-gray-600">Loading materials...</span>
    </div>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        {/* Table Header */}
        <thead className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">SAP Item ID</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Material Type</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Material Group</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Description</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Notes</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Created</th>
            <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Actions</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((material, index) => (
              <tr
                key={material.local_item_id}
                className={`transition-all duration-200 ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                } hover:bg-purple-50`}
              >
                <td className="px-6 py-4">
                  <div className="inline-block px-2 py-1 bg-purple-100 text-purple-800 font-mono rounded-lg text-sm shadow-sm">
                    {material.sap_item_id || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{material.mat_type_code || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{material.mgrp_code || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{material.item_desc || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{material.notes || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{material.created || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleView(material)}
                      className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition duration-200"
                      title="View"
                    >
                      <Eye size={16} />
                    </button>
                    {checkPermission("item", "update") && (
                      <button
                        onClick={() => handleEdit(material)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition duration-200"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {checkPermission("item", "delete") && (
                      <button
                        onClick={() => handleDelete(material.local_item_id)}
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
              <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                No materials found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )}
</div>

        {/* Info Section */}
        {/* <div className="bg-blue-50 rounded-lg p-6 mt-6 border border-blue-200">
          <div className="flex items-start">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Materials Management Guide</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Use the search bar to find materials by name, code, or description</li>
                <li>Filter materials by <b>group</b> or <b>type</b> using the dropdown filters</li>
                <li>Click the "Add Material" button to create new inventory items</li>
                <li>Use the edit and delete icons to modify or remove materials</li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>

      {/* Material Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingMaterial ? "Edit Material" : "Add New Material"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("general")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "general"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  General Info
                </button>
                <button
                  onClick={() => setActiveTab("attributes")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === "attributes"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  disabled={!formData.mgrp_code}
                >
                  Attributes
                  {!formData.mgrp_code && (
                    <span className="ml-2 text-xs text-gray-400">(Select Material Group first)</span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}

              {/* Tab 1: General Info */}
              {activeTab === "general" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SAP Item ID</label>
                    <input
                      type="text"
                      name="sap_item_id"
                      value={formData.sap_item_id}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SAP Item ID"
                    />
                  </div>
                  
                  <div>
                    <SearchableDropdown
                      label="Material Type Code *"
                      options={materialTypes}
                      value={formData.mat_type_code}
                      onChange={(value) => setFormData(prev => ({ ...prev, mat_type_code: value || "" }))}
                      placeholder="Select material type..."
                      searchPlaceholder="Search material types..."
                      required
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return option.mat_type_code ? `${option.mat_type_code} - ${option.mat_type_desc || ''}` : (option.mat_type_desc || String(option));
                      }}
                      getOptionValue={(option) => {
                        if (typeof option === 'string') return option;
                        return option.mat_type_code || option;
                      }}
                    />
                  </div>
                  
                  <div>
                    <SearchableDropdown
                      label="Material Group Code *"
                      options={materialGroups}
                      value={formData.mgrp_code}
                      onChange={handleMgrpCodeChange}
                      placeholder="Select material group..."
                      searchPlaceholder="Search material groups..."
                      required
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return option.mgrp_code ? `${option.mgrp_code} - ${option.mgrp_shortname || option.mgrp_longname || ''}` : (option.mgrp_shortname || option.mgrp_longname || String(option));
                      }}
                      getOptionValue={(option) => {
                        if (typeof option === 'string') return option;
                        return option.mgrp_code || option;
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Text</label>
                    <input
                      type="text"
                      name="search_text"
                      value={formData.search_text}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search text"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Description *</label>
                    <textarea
                      name="item_desc"
                      value={formData.item_desc}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Item description"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Attributes */}
              {activeTab === "attributes" && (
                <div>
                  {!formData.mgrp_code ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Please select a Material Group in the General Info tab first.</p>
                    </div>
                  ) : Object.keys(materialAttributes).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No attributes found for the selected Material Group.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(materialAttributes).map(([attrName, attrConfig]) => {
                        const values = attrConfig.values || [];
                        const currentValue = formData.attributes[attrName] || "";
                        return (
                          <div key={attrName} className="border rounded-lg p-4 bg-gray-50">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {attrName}
                              {attrConfig.uom && (
                                <span className="ml-2 text-xs text-gray-500">({attrConfig.uom})</span>
                              )}
                            </label>
                            <select
                              value={currentValue}
                              onChange={(e) => handleAttributeChange(attrName, e.target.value)}
                              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">Select {attrName}</option>
                              {values.map((value) => (
                                <option key={value} value={value}>{value}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-4 py-2 border rounded-lg text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMaterial}
                disabled={saving || !formData.mat_type_code || !formData.mgrp_code || !formData.item_desc}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                {editingMaterial ? "Save Changes" : "Add Material"}
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
          setViewingMaterial(null);
        }}
        data={viewingMaterial}
        title="View Material Details"
        fieldLabels={{
          local_item_id: "Local Item ID",
          sap_item_id: "SAP Item ID",
          mat_type_code: "Material Type Code",
          mgrp_code: "Material Group Code",
          item_desc: "Item Description",
          search_text: "Search Text",
          attributes: "Attributes",
          notes: "Notes",
          created: "Created",
          updated: "Updated"
        }}
      />
    </div>
  );
}