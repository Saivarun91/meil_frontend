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
  const [viewActiveTab, setViewActiveTab] = useState("general");
  const [viewMaterialAttributes, setViewMaterialAttributes] = useState({});
  const [customAttributeValues, setCustomAttributeValues] = useState({}); // Store custom values per attribute
  const [tableTab, setTableTab] = useState("raw"); // "raw" or "cleaned"
  const [duplicateMaterials, setDuplicateMaterials] = useState(null); // Store duplicate materials info
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const [formData, setFormData] = useState({
    sap_item_id: "",
    sap_name: "",
    mat_type_code: "",
    mgrp_code: "",
    item_desc: "",
    notes: "",
    search_text: "",
    attributes: {},
    is_final: false,
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
        // Parse UOM - support both single string and comma-separated/array
        let uomArray = [];
        if (attr.uom) {
          if (Array.isArray(attr.uom)) {
            // Flatten nested arrays and filter out empty values
            uomArray = attr.uom.flat().filter(u => u && String(u).trim() !== '');
          } else if (typeof attr.uom === 'string') {
            // Try to parse if it's a string representation of an array
            let parsed = attr.uom.trim();
            if (parsed.startsWith('[') && parsed.endsWith(']')) {
              try {
                // Try to parse as JSON array
                const parsedArray = JSON.parse(parsed);
                if (Array.isArray(parsedArray)) {
                  uomArray = parsedArray.filter(u => u && String(u).trim() !== '').map(u => String(u).trim());
                }
              } catch (e) {
                // If JSON parse fails, try manual parsing
                parsed = parsed.slice(1, -1); // Remove brackets
                uomArray = parsed.split(',').map(u => {
                  let val = u.trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
                  return val;
                }).filter(u => u && u !== '');
              }
            } else if (parsed.includes(',')) {
              // Comma-separated values
              uomArray = parsed.split(',').map(u => u.trim()).filter(u => u && u !== '');
            } else {
              // Single value
              uomArray = [parsed];
            }
          }
        }
        
        // Ensure all UOMs are strings and filter out empty values
        uomArray = uomArray.map(u => String(u).trim()).filter(u => u && u !== '');
        
        attributesObj[attr.attribute_name] = {
          values: attr.possible_values || [],
          uom: uomArray,
          print_priority: attr.print_priority || 0,
        };
      });
      
      setMaterialAttributes(attributesObj);
      return attributesObj; // Return for use in handleView
    } catch (err) {
      console.error("Error loading material attributes:", err);
      const emptyObj = {};
      setMaterialAttributes(emptyObj);
      return emptyObj; // Return empty object on error
    }
  };

  // Get unique groups and types
  const groups = ["all", ...new Set(materials.map(m => m.mgrp_code))];
  const types = ["all", ...new Set(materials.map(m => m.mat_type_code))];

  // Filter materials
  const safe = (v) => (v ? String(v).toLowerCase() : "");

  const filteredMaterials = materials.filter(material => {
    const search = searchTerm.toLowerCase();
  
    const matchesSearch =
      safe(material.item_desc).includes(search) ||
      safe(material.sap_item_id).includes(search) ||
      safe(material.search_text).includes(search);
  
    const matchesGroup =
      filterGroup === "all" || material.mgrp_code === filterGroup;
  
    const matchesType =
      filterType === "all" || material.mat_type_code === filterType;
  
    // Filter by is_final based on active tab
    const matchesFinalStatus = 
      tableTab === "raw" ? (material.is_final === false) : (material.is_final === true);
  
    return matchesSearch && matchesGroup && matchesType && matchesFinalStatus;
  });
  
  // const role = localStorage.getItem("role");

  // Modal handlers
  const handleAddNew = () => {
    setEditingMaterial(null);
    setFormData({
      sap_item_id: "",
      sap_name: "",
      mat_type_code: "",
      mgrp_code: "",
      item_desc: "",
      notes: "",
      search_text: "",
      attributes: {},
      is_final: false,
    });
    setMaterialAttributes({});
    setActiveTab("general");
    setError(null);
    setIsModalOpen(true);
  };

  const handleView = async (material) => {
    setViewingMaterial(material);
    setViewActiveTab("general");
    setViewMaterialAttributes({});
    setIsViewModalOpen(true);
    // Load attributes if material group is available
    if (material.mgrp_code) {
      const attrs = await loadMaterialAttributes(material.mgrp_code);
      setViewMaterialAttributes(attrs);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      sap_item_id: material.sap_item_id || "",
      sap_name: material.sap_name || "",
      mat_type_code: material.mat_type_code || "",
      mgrp_code: material.mgrp_code || "",
      item_desc: material.item_desc || "",
      notes: material.notes || "",
      search_text: material.search_text || "",
      attributes: material.attributes || {},
      is_final: material.is_final || false,
    });
    // Reset custom values
    setCustomAttributeValues({});
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
    setCustomAttributeValues({});
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

  const handleCustomValueChange = (attrName, customValue) => {
    setCustomAttributeValues(prev => ({
      ...prev,
      [attrName]: customValue
    }));
    // Update attribute value (even if empty, to allow clearing)
    handleAttributeChange(attrName, customValue || "");
  };

  const handleUOMChange = (attrName, selectedUOM) => {
    const currentValue = formData.attributes[attrName] || "";
    const attrConfig = materialAttributes[attrName];
    // Extract and clean UOMs - flatten arrays and filter empty values
    let uoms = [];
    if (attrConfig?.uom) {
      if (Array.isArray(attrConfig.uom)) {
        uoms = attrConfig.uom.flat().map(u => String(u).trim()).filter(u => u && u !== '');
      } else {
        const uomStr = String(attrConfig.uom).trim();
        if (uomStr) uoms = [uomStr];
      }
    }
    
    // Extract base value (remove any existing UOM)
    let baseValue = currentValue;
    if (currentValue && uoms.length > 0) {
      for (const uom of uoms) {
        if (currentValue.endsWith(` ${uom}`)) {
          baseValue = currentValue.replace(` ${uom}`, "");
          break;
        }
      }
    }
    
    // Store value with UOM if UOM is selected
    const valueWithUOM = selectedUOM && baseValue ? `${baseValue} ${selectedUOM}` : baseValue;
    handleAttributeChange(attrName, valueWithUOM);
  };

  const handleMgrpCodeChange = async (mgrpCode) => {
    const codeValue = mgrpCode ? String(mgrpCode).trim() : "";
    setFormData(prev => ({ ...prev, mgrp_code: codeValue, attributes: {} }));
    if (codeValue) {
      await loadMaterialAttributes(codeValue);
    }
  };

  // Helper function to check if attributes have values
  const hasAttributeValues = (attributes) => {
    if (!attributes || Object.keys(attributes).length === 0) return false;
    return Object.values(attributes).some(v => v && String(v).trim());
  };

  const handleSaveMaterial = async () => {
    // Check if required fields are filled
    const hasMatType = formData.mat_type_code?.trim();
    const hasMgrpCode = formData.mgrp_code?.trim();
    const hasItemDesc = formData.item_desc?.trim();
    const hasAttributes = hasAttributeValues(formData.attributes);
    
    if (!hasMatType || !hasMgrpCode || (!hasItemDesc && !hasAttributes)) {
      setError("Please fill in required fields: Material Type Code, Material Group Code, and either Short Name or Attributes");
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

      // Prepare form data - ensure all required fields are properly formatted
      // If item_desc is empty but attributes are filled, send a placeholder
      // (backend will auto-generate from attributes and replace the placeholder)
      const dataToSend = {
        ...formData,
        mat_type_code: hasMatType ? String(formData.mat_type_code).trim() : formData.mat_type_code,
        mgrp_code: hasMgrpCode ? String(formData.mgrp_code).trim() : formData.mgrp_code,
        item_desc: hasItemDesc ? formData.item_desc.trim() : (hasAttributes ? "Auto-generated" : formData.item_desc)
      };

      let response;
      if (editingMaterial) {
        response = await updateItemMaster(token, editingMaterial.local_item_id, dataToSend);
      } else {
        response = await createItemMaster(token, dataToSend);
      }

      // Check if response contains duplicate warning
      if (response && response.warning && response.duplicates) {
        setDuplicateMaterials({
          warning: response.warning,
          message: response.message,
          duplicates: response.duplicates
        });
        setShowDuplicateModal(true);
        setSaving(false);
        return; // Don't close modal or reload, wait for user decision
      }

      await loadMaterials();
      handleCloseModal();
    } catch (err) {
      // Check if error response contains duplicate information
      if (err.response?.status === 200 && err.response?.data?.warning && err.response?.data?.duplicates) {
        setDuplicateMaterials({
          warning: err.response.data.warning,
          message: err.response.data.message,
          duplicates: err.response.data.duplicates
        });
        setShowDuplicateModal(true);
        setSaving(false);
        return;
      }
      setError("Failed to save material: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Handle duplicate modal - proceed with creation
  const handleProceedWithDuplicate = async () => {
    if (!formData.mat_type_code?.trim() || !formData.mgrp_code?.trim()) return;

    try {
      setSaving(true);
      setError(null);
      setShowDuplicateModal(false);

      const hasMatType = formData.mat_type_code?.trim();
      const hasMgrpCode = formData.mgrp_code?.trim();
      const hasItemDesc = formData.item_desc?.trim();
      const hasAttributes = hasAttributeValues(formData.attributes);

      const dataToSend = {
        ...formData,
        mat_type_code: hasMatType ? String(formData.mat_type_code).trim() : formData.mat_type_code,
        mgrp_code: hasMgrpCode ? String(formData.mgrp_code).trim() : formData.mgrp_code,
        item_desc: hasItemDesc ? formData.item_desc.trim() : (hasAttributes ? "Auto-generated" : formData.item_desc),
        force_create: true // Add flag to bypass duplicate check
      };

      let response;
      if (editingMaterial) {
        response = await updateItemMaster(token, editingMaterial.local_item_id, dataToSend);
      } else {
        response = await createItemMaster(token, dataToSend);
      }

      // Check again for duplicates (shouldn't happen with force_create, but just in case)
      if (response && response.warning && response.duplicates) {
        setDuplicateMaterials({
          warning: response.warning,
          message: response.message,
          duplicates: response.duplicates
        });
        setShowDuplicateModal(true);
        setSaving(false);
        return;
      }

      await loadMaterials();
      setDuplicateMaterials(null);
      handleCloseModal();
    } catch (err) {
      // Check if error response contains duplicate information
      if (err.response?.status === 200 && err.response?.data?.warning && err.response?.data?.duplicates) {
        setDuplicateMaterials({
          warning: err.response.data.warning,
          message: err.response.data.message,
          duplicates: err.response.data.duplicates
        });
        setShowDuplicateModal(true);
        setSaving(false);
        return;
      }
      setError("Failed to save material: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Handle duplicate modal - cancel
  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setDuplicateMaterials(null);
    setSaving(false);
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

        {/* Materials Table with Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setTableTab("raw")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  tableTab === "raw"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Raw Data
              </button>
              <button
                onClick={() => setTableTab("cleaned")}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  tableTab === "cleaned"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Cleaned Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-2 text-gray-600">Loading materials...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Raw Data Table */}
              {tableTab === "raw" && (
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">SAP Item ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">SAP Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Material Group Long Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Material Group Code</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
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
                          <td className="px-6 py-4 text-sm text-gray-900">{material.sap_name || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(() => {
                              const matchedGroup = materialGroups.find(g => g.mgrp_code === material.mgrp_code);
                              return matchedGroup?.mgrp_longname || material.mgrp_long_name || "-";
                            })()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{material.mgrp_code || "-"}</td>
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
                        <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                          No materials found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* Cleaned Data Table */}
              {tableTab === "cleaned" && (
                <table className="w-full border-collapse">
                  <thead className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">SAP Item ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Material Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Short Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Long Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Search Text</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Updated</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
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
                            <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 font-mono rounded-lg text-sm shadow-sm">
                              {material.sap_item_id || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{material.mat_type_code || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{material.item_desc || material.short_name || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{material.notes || material.long_name || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{material.search_text || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{material.created || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{material.updated || "-"}</td>
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
                        <td colSpan="8" className="px-6 py-8 text-center text-sm text-gray-500">
                          No materials found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">SAP Name</label>
                    <input
                      type="text"
                      name="sap_name"
                      value={formData.sap_name || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SAP Name"
                    />
                  </div>
                  
                  <div>
                    <SearchableDropdown
                      label="Material Type Code "
                      options={materialTypes}
                      value={formData.mat_type_code}
                      onChange={(value) => {
                        const codeValue = value ? String(value).trim() : "";
                        setFormData(prev => ({ ...prev, mat_type_code: codeValue }));
                      }}
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
                      label="Material Group Code "
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Group Long Name</label>
                    <input
                      type="text"
                      value={(() => {
                        const matchedGroup = materialGroups.find(g => g.mgrp_code === formData.mgrp_code);
                        return matchedGroup?.mgrp_longname || "";
                      })()}
                      readOnly
                      className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="Will be populated from selected Material Group"
                      title="Material Group Long Name is automatically set from the selected Material Group"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Name *</label>
                    <textarea
                      name="item_desc"
                      value={formData.item_desc}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Short name (will be auto-populated with attributes if provided)"
                      readOnly={Object.keys(formData.attributes || {}).length > 0 && Object.values(formData.attributes || {}).some(v => v)}
                      title={Object.keys(formData.attributes || {}).length > 0 && Object.values(formData.attributes || {}).some(v => v) ? "Short name is auto-populated from attributes" : ""}
                    />
                    {Object.keys(formData.attributes || {}).length > 0 && Object.values(formData.attributes || {}).some(v => v) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Short name will be automatically generated from attributes when saved
                      </p>
                    )}
                  </div>
                  
                  {/* <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional notes"
                    />
                  </div> */}
                  
                  {/* Is Final Switch - Show in both add and edit forms */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mark as Final
                        </label>
                        <p className="text-xs text-gray-500">
                          Toggle this to move the material to Cleaned Data tab
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_final}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_final: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
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
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {/* Compact Table Header */}
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 border-b border-gray-300 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="col-span-3">Attribute Name</div>
                          <div className="col-span-3">Select Value</div>
                          <div className="col-span-3">Custom Value</div>
                          <div className="col-span-2">UOM</div>
                          <div className="col-span-1">Status</div>
                        </div>
                        
                        {/* Compact Table Body */}
                        <div className="divide-y divide-gray-200">
                          {Object.entries(materialAttributes).map(([attrName, attrConfig]) => {
                            const values = attrConfig.values || [];
                            // Extract and clean UOMs - flatten arrays and filter empty values
                            let uoms = [];
                            if (attrConfig.uom) {
                              if (Array.isArray(attrConfig.uom)) {
                                uoms = attrConfig.uom.flat().map(u => String(u).trim()).filter(u => u && u !== '');
                              } else {
                                const uomStr = String(attrConfig.uom).trim();
                                if (uomStr) uoms = [uomStr];
                              }
                            }
                            const currentValue = formData.attributes[attrName] || "";
                            const customValue = customAttributeValues[attrName] || "";
                            
                            // Extract value and UOM from currentValue if it contains UOM
                            let displayValue = currentValue;
                            let selectedUOM = "";
                            if (currentValue && uoms.length > 0) {
                              // Check if value ends with a UOM
                              for (const uom of uoms) {
                                if (currentValue.endsWith(` ${uom}`)) {
                                  displayValue = currentValue.replace(` ${uom}`, "");
                                  selectedUOM = uom;
                                  break;
                                }
                              }
                            }
                            
                            // Check if current value is from dropdown or custom (after extracting UOM)
                            const isFromDropdown = displayValue && values.includes(displayValue);
                            const isCustomValue = customAttributeValues.hasOwnProperty(attrName) || (displayValue && !isFromDropdown);
                            
                            return (
                              <div key={attrName} className="grid grid-cols-12 gap-2 px-3 py-3 hover:bg-gray-50 transition-colors">
                                {/* Attribute Name */}
                                <div className="col-span-3 flex flex-col">
                                  <span className="text-sm font-medium text-gray-900">{attrName}</span>
                                  {uoms.length > 0 && (
                                    <span className="text-xs text-gray-500 mt-0.5">
                                      {uoms.join(", ")}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Select Value */}
                                <div className="col-span-3">
                                  <select
                                    value={isFromDropdown ? displayValue : ""}
                                    onChange={(e) => {
                                      const selectedValue = e.target.value;
                                      if (selectedValue) {
                                        setCustomAttributeValues(prev => {
                                          const newState = { ...prev };
                                          delete newState[attrName];
                                          return newState;
                                        });
                                        handleAttributeChange(attrName, selectedValue);
                                      } else {
                                        handleAttributeChange(attrName, "");
                                        setCustomAttributeValues(prev => {
                                          const newState = { ...prev };
                                          delete newState[attrName];
                                          return newState;
                                        });
                                      }
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                  >
                                    <option value="">Select...</option>
                                    {values.map((value) => (
                                      <option key={value} value={value}>{value}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                {/* Custom Value Input */}
                                <div className="col-span-3">
                                  <input
                                    type="text"
                                    placeholder="Custom value..."
                                    value={customAttributeValues.hasOwnProperty(attrName) ? customAttributeValues[attrName] : (isFromDropdown ? "" : (displayValue || ""))}
                                    onChange={(e) => {
                                      const newCustomValue = e.target.value;
                                      setCustomAttributeValues(prev => ({
                                        ...prev,
                                        [attrName]: newCustomValue
                                      }));
                                      handleAttributeChange(attrName, newCustomValue || "");
                                    }}
                                    onBlur={() => {
                                      if (!currentValue && !customAttributeValues[attrName]) {
                                        setCustomAttributeValues(prev => {
                                          const newState = { ...prev };
                                          delete newState[attrName];
                                          return newState;
                                        });
                                      }
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                  />
                                </div>
                                
                                {/* UOM Selection */}
                                <div className="col-span-2">
                                  {uoms.length > 0 && displayValue ? (
                                    <select
                                      value={selectedUOM}
                                      onChange={(e) => handleUOMChange(attrName, e.target.value)}
                                      className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                      <option value="">No UOM</option>
                                      {uoms.map((uom) => (
                                        <option key={uom} value={uom}>{uom}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </div>
                                
                                {/* Status */}
                                <div className="col-span-1 flex items-center">
                                  {currentValue ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Set
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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
                disabled={saving || !formData.mat_type_code?.trim() || !formData.mgrp_code?.trim() || (!formData.item_desc?.trim() && !hasAttributeValues(formData.attributes))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                {editingMaterial ? "Save Changes" : "Add Material"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal with Tabs */}
      {isViewModalOpen && viewingMaterial && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setIsViewModalOpen(false);
            setViewingMaterial(null);
            setViewActiveTab("general");
            setViewMaterialAttributes({});
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                View Material Details
              </h2>
              <button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingMaterial(null);
                  setViewActiveTab("general");
                  setViewMaterialAttributes({});
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setViewActiveTab("general")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    viewActiveTab === "general"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  General Info
                </button>
                <button
                  onClick={() => setViewActiveTab("attributes")}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    viewActiveTab === "attributes"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  disabled={!viewingMaterial.mgrp_code}
                >
                  Attributes
                  {!viewingMaterial.mgrp_code && (
                    <span className="ml-2 text-xs text-gray-400">(No Material Group)</span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Tab 1: General Info */}
              {viewActiveTab === "general" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Local Item ID</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.local_item_id || "N/A"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SAP Item ID</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.sap_item_id || "N/A"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SAP Item Name</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.sap_name || "N/A"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Type Code</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.mat_type_code || "N/A"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Group Code</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.mgrp_code || "N/A"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Group Long Name</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {(() => {
                        const matchedGroup = materialGroups.find(g => g.mgrp_code === viewingMaterial.mgrp_code);
                        return matchedGroup?.mgrp_longname || viewingMaterial.mgrp_long_name || "N/A";
                      })()}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Text</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.search_text || "N/A"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.created || "N/A"}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-[60px]">
                      {viewingMaterial.item_desc || viewingMaterial.short_name || "N/A"}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Long Name</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-[60px]">
                      {viewingMaterial.long_name || viewingMaterial.notes || "N/A"}
                    </div>
                  </div>
                  
                  {/* <div className="md:col-span-2"> */}
                    {/* <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 min-h-[60px]">
                      {viewingMaterial.notes || "N/A"}
                    </div> */}
                  {/* </div> */}
                  
                  {viewingMaterial.updated && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Updated</label>
                      <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                        {viewingMaterial.updated}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Is Final</label>
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
                      {viewingMaterial.is_final ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Attributes */}
              {viewActiveTab === "attributes" && (
                <div>
                  {!viewingMaterial.mgrp_code ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No Material Group selected for this material.</p>
                    </div>
                  ) : !viewMaterialAttributes || (viewMaterialAttributes && Object.keys(viewMaterialAttributes).length === 0) ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No attributes found for the selected Material Group.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {/* Compact Table Header */}
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 border-b border-gray-300 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          <div className="col-span-4">Attribute Name</div>
                          <div className="col-span-6">Value</div>
                          <div className="col-span-2">UOM</div>
                        </div>
                        
                        {/* Compact Table Body */}
                        <div className="divide-y divide-gray-200">
                          {Object.entries(viewMaterialAttributes).map(([attrName, attrConfig]) => {
                            const currentValue = viewingMaterial.attributes?.[attrName] || "";
                            const uoms = Array.isArray(attrConfig.uom) ? attrConfig.uom : (attrConfig.uom ? [attrConfig.uom] : []);
                            
                            // Extract UOM from value if present
                            let displayValue = currentValue;
                            let displayUOM = "";
                            let hasUOMInValue = false;
                            if (currentValue && uoms.length > 0) {
                              for (const uom of uoms) {
                                if (currentValue.endsWith(` ${uom}`)) {
                                  displayValue = currentValue.replace(` ${uom}`, "");
                                  displayUOM = uom;
                                  hasUOMInValue = true;
                                  break;
                                }
                              }
                            }
                            
                            // Only show UOM if it was actually used in the value
                            // If no UOM is in the value, show "-" even if UOMs are available
                            const showUOM = hasUOMInValue ? displayUOM : "-";
                            
                            return (
                              <div key={attrName} className="grid grid-cols-12 gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                                <div className="col-span-4">
                                  <span className="text-sm font-medium text-gray-900">{attrName}</span>
                                </div>
                                <div className="col-span-6">
                                  <span className="text-sm text-gray-700">{displayValue || "-"}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-sm text-gray-600">{showUOM}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingMaterial(null);
                  setViewActiveTab("general");
                  setViewMaterialAttributes({});
                }}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Materials Warning Modal */}
      {showDuplicateModal && duplicateMaterials && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Duplicate Material Detected</h2>
                  <p className="text-sm text-gray-500 mt-1">{duplicateMaterials.message}</p>
                </div>
              </div>
              <button 
                onClick={handleCancelDuplicate} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Warning:</strong> The material you are trying to add has the same attributes and material group as the following existing material(s). 
                  Please review the duplicates below before proceeding.
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Duplicate Materials:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border border-gray-300">Local Item ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border border-gray-300">SAP Item ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border border-gray-300">Material Group Code</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border border-gray-300">Short Name</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border border-gray-300">Attributes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duplicateMaterials.duplicates.map((duplicate, index) => (
                        <tr key={duplicate.local_item_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-2 text-sm text-gray-900 border border-gray-300">{duplicate.local_item_id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 border border-gray-300">
                            <span className="font-mono font-semibold text-blue-600">{duplicate.sap_item_id || "N/A"}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 border border-gray-300">{duplicate.mgrp_code}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 border border-gray-300">{duplicate.short_name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 border border-gray-300">
                            {duplicate.attributes && Object.keys(duplicate.attributes).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(duplicate.attributes).map(([key, value]) => (
                                  <span key={key} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {key}: {value}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCancelDuplicate}
                disabled={saving}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProceedWithDuplicate}
                disabled={saving}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}