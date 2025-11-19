"use client";
import { useState, useEffect } from "react";
import {
  Plus, Edit, Trash2, Search, Settings, Loader2, PlusCircle, X, Eye
} from "lucide-react";
import { fetchMaterialAttributes, createMaterialAttribute, updateMaterialAttribute, deleteMaterialAttribute, fetchMaterialGroups } from "../../../lib/api";
import {useAuth} from "@/context/AuthContext";
import SearchableDropdown from "@/components/SearchableDropdown";
import ViewModal from "@/components/ViewModal";

export default function MaterialAttributesPage() {
  const [attributes, setAttributes] = useState([]);
  const [materialGroups, setMaterialGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingAttribute, setViewingAttribute] = useState(null);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // For creating multiple attributes at once
  const [formData, setFormData] = useState({
    mgrp_code: "",
    attributes: [], // List of attribute objects: [{ attribute_name, possible_values, uom, print_priority, validation }]
  });
  
  // For adding new attribute in form
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValues, setNewAttrValues] = useState([]);
  const [newAttrValueInput, setNewAttrValueInput] = useState("");
  const [newAttrPrintPriority, setNewAttrPrintPriority] = useState(0);
  const [newAttrValidation, setNewAttrValidation] = useState("");
  const [newAttrHasUOM, setNewAttrHasUOM] = useState(false);
  const [newAttrUnits, setNewAttrUnits] = useState([]);
  const [newAttrUnitInput, setNewAttrUnitInput] = useState("");
  
  // For editing single attribute
  const [editFormData, setEditFormData] = useState({
    attribute_name: "",
    possible_values: [],
    uom: [],
    print_priority: 0,
    validation: "",
  });
  const [editHasUOM, setEditHasUOM] = useState(false);
  const [editValueInput, setEditValueInput] = useState("");
  const [editUnitInput, setEditUnitInput] = useState("");
  
  const {user,token,role,checkPermission} = useAuth();
  
  // Load data on component mount
  useEffect(() => {
    if (token) {
      loadAttributes();
      loadMaterialGroups();
    }
  }, [token]);


  const loadAttributes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMaterialAttributes(token);
      setAttributes(data || []);
    } catch (err) {
      setError("Failed to load material attributes: " + (err.response?.data?.error || err.message));
      console.error("Error loading material attributes:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMaterialGroups = async () => {
    try {
      const data = await fetchMaterialGroups(token);
      setMaterialGroups(data || []);
      console.log("Loaded material groups:", data?.length || 0);
    } catch (err) {
      console.error("Error loading material groups:", err);
      setError("Failed to load material groups: " + (err.response?.data?.error || err.message));
    }
  };

  // Filter attributes
  const filteredAttributes = attributes.filter(attribute => {
    const matchesSearch =
      (attribute.mgrp_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attribute.attribute_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (attribute.possible_values || []).some(value => 
        value.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAttributes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAttributes = filteredAttributes.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Modal handlers
  const handleAddNew = () => {
    setEditingAttribute(null);
    setFormData({
      mgrp_code: "",
      attributes: [],
    });
    setNewAttrName("");
    setNewAttrValues([]);
    setNewAttrValueInput("");
    setNewAttrPrintPriority(0);
    setNewAttrValidation("");
    setNewAttrHasUOM(false);
    setNewAttrUnits([]);
    setNewAttrUnitInput("");
    setIsModalOpen(true);
    setError(null);
    // Reload material groups if empty
    if (materialGroups.length === 0 && token) {
      loadMaterialGroups();
    }
  };

  const handleView = (attribute) => {
    setViewingAttribute(attribute);
    setIsViewModalOpen(true);
  };

  const handleEdit = (attribute) => {
    setEditingAttribute(attribute);
    // Handle UOM - could be string or array
    const uomValue = attribute.uom || "";
    const uomArray = Array.isArray(uomValue) ? uomValue : (uomValue ? [uomValue] : []);
    const hasUOM = uomArray.length > 0;
    setEditHasUOM(hasUOM);
    setEditFormData({
      attribute_name: attribute.attribute_name || "",
      possible_values: attribute.possible_values || [],
      uom: uomArray,
      print_priority: attribute.print_priority || 0,
      validation: attribute.validation || "",
    });
    setEditValueInput("");
    setEditUnitInput("");
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAttribute(null);
    setEditFormData({
      attribute_name: "",
      possible_values: [],
      uom: [],
      print_priority: 0,
      validation: "",
    });
    setEditHasUOM(false);
    setEditValueInput("");
    setEditUnitInput("");
    setError(null);
  };


  const addValueToNewAttr = () => {
    if (!newAttrValueInput.trim()) {
      setError("Please enter a value");
      return;
    }
    if (newAttrValues.includes(newAttrValueInput.trim())) {
      setError("This value already exists");
      return;
    }
    setNewAttrValues(prev => [...prev, newAttrValueInput.trim()]);
    setNewAttrValueInput("");
    setError(null);
  };

  const removeValueFromNewAttr = (index) => {
    setNewAttrValues(prev => prev.filter((_, i) => i !== index));
  };

  const addUOMToNewAttr = () => {
    if (!newAttrUnitInput.trim()) {
      setError("Please enter a UOM");
      return;
    }
    if (newAttrUnits.includes(newAttrUnitInput.trim())) {
      setError("This UOM already exists");
      return;
    }
    setNewAttrUnits(prev => [...prev, newAttrUnitInput.trim()]);
    setNewAttrUnitInput("");
    setError(null);
  };

  const removeUOMFromNewAttr = (index) => {
    setNewAttrUnits(prev => prev.filter((_, i) => i !== index));
  };

  const addAttributeToForm = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setError(null); // Clear any previous errors
    
    if (!newAttrName || !newAttrName.trim()) {
      setError("Attribute name is required");
      return;
    }

    if (newAttrValues.length === 0) {
      setError("At least one value is required");
      return;
    }

    // Check if unit is required when UOM is enabled
    if (newAttrHasUOM && newAttrUnits.length === 0) {
      setError("At least one Unit of Measure is required when UOM is enabled");
      return;
    }

    // Check if attribute name already exists in the list
    if (formData.attributes.some(attr => attr.attribute_name === newAttrName.trim())) {
      setError("Attribute name already exists in the list");
      return;
    }

    const newAttr = {
      attribute_name: newAttrName.trim(),
      possible_values: newAttrValues,
      print_priority: parseInt(newAttrPrintPriority) || 0,
    };

    if (newAttrValidation) {
      newAttr.validation = newAttrValidation;
    }

    // Add units if UOM is enabled
    if (newAttrHasUOM && newAttrUnits.length > 0) {
      newAttr.uom = newAttrUnits.length === 1 ? newAttrUnits[0] : newAttrUnits;
    }

    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, newAttr]
    }));

    // Reset form
    setNewAttrName("");
    setNewAttrValues([]);
    setNewAttrValueInput("");
    setNewAttrPrintPriority(0);
    setNewAttrValidation("");
    setNewAttrHasUOM(false);
    setNewAttrUnits([]);
    setNewAttrUnitInput("");
    setError(null);
  };

  const removeAttributeFromForm = (index) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleSaveAttribute = async () => {
    // Check permission before proceeding
    if (editingAttribute) {
      if (!checkPermission("attribute", "update")) {
        setError("You don't have permission to update material attributes");
        return;
      }
    } else {
      if (!checkPermission("attribute", "create")) {
        setError("You don't have permission to create material attributes");
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      if (editingAttribute) {
        // Update single attribute
        if (!editFormData.attribute_name || !editFormData.possible_values || editFormData.possible_values.length === 0) {
          setError("Attribute name and at least one value are required");
          setSaving(false);
          return;
        }

        // Check if UOM is required when enabled
        const uomArray = Array.isArray(editFormData.uom) ? editFormData.uom : (editFormData.uom ? [editFormData.uom] : []);
        if (editHasUOM && uomArray.length === 0) {
          setError("At least one Unit of Measure is required when UOM is enabled");
          setSaving(false);
          return;
        }

        const dataToSend = {
          attribute_name: editFormData.attribute_name,
          possible_values: editFormData.possible_values,
          uom: editHasUOM && uomArray.length > 0 ? (uomArray.length === 1 ? uomArray[0] : uomArray) : null,
          print_priority: editFormData.print_priority || 0,
          validation: editFormData.validation || null,
        };

        await updateMaterialAttribute(token, editingAttribute.id, dataToSend);
      } else {
        // Create multiple attributes
        if (!formData.mgrp_code) {
          setError("Material Group Code is required");
          setSaving(false);
          return;
        }

        if (formData.attributes.length === 0) {
          setError("At least one attribute must be defined");
          setSaving(false);
          return;
        }

        const dataToSend = {
          mgrp_code: formData.mgrp_code,
          attributes: formData.attributes,
        };

        await createMaterialAttribute(token, dataToSend);
      }

      await loadAttributes();
      handleCloseModal();
    } catch (err) {
      setError("Failed to save material attribute: " + (err.response?.data?.error || err.message));
      console.error("Error saving material attribute:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this material attribute? This action cannot be undone.")) {
      // Check permission before proceeding
      if (!checkPermission("attribute", "delete")) {
        setError("You don't have permission to delete material attributes");
        return;
      }
      
      try {
        setError(null);
        await deleteMaterialAttribute(token, id);
        await loadAttributes();
      } catch (err) {
        setError("Failed to delete material attribute: " + (err.response?.data?.error || err.message));
        console.error("Error deleting material attribute:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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

        {/* Search */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search attributes by material group or attribute name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {checkPermission("attribute", "create") && (
              <button
                type="button"
                onClick={handleAddNew}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} className="mr-2" />
                Add Attribute
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading material attributes...</p>
          </div>
        ) : (
          /* Attributes Table */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0 shadow-lg rounded-lg overflow-hidden">
                {/* Table Header */}
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white uppercase tracking-wide">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Material Group</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Attribute Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Possible Values</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">UOM</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Priority</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Updated</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {currentAttributes.length > 0 ? (
                    currentAttributes.map((attribute, index) => (
                      <tr
                        key={attribute.id}
                        className={`transition-all duration-300 hover:bg-purple-50 ${
                          index % 2 === 0 ? "bg-gray-50" : "bg-gray-100"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 font-mono bg-purple-50 px-2 py-1 rounded-md inline-block shadow-sm">
                            {attribute.mgrp_code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {attribute.attribute_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {attribute.possible_values && attribute.possible_values.length > 0 ? (
                              attribute.possible_values.slice(0, 3).map((value, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                  {value}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400 italic">No values</span>
                            )}
                            {attribute.possible_values && attribute.possible_values.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{attribute.possible_values.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(() => {
                              let uomValue = attribute.uom || "";
                              let uomArray = [];
                              
                              // Handle different UOM formats
                              if (Array.isArray(uomValue)) {
                                uomArray = uomValue.filter(u => u != null && u !== "");
                              } else if (typeof uomValue === 'string') {
                                // Try to parse if it's a JSON string
                                try {
                                  const parsed = JSON.parse(uomValue);
                                  uomArray = Array.isArray(parsed) ? parsed.filter(u => u != null && u !== "") : (parsed ? [parsed] : []);
                                } catch (e) {
                                  // Check if it looks like a Python list string like "['kg', 'g']"
                                  if (uomValue.trim().startsWith('[') && uomValue.trim().endsWith(']')) {
                                    try {
                                      // Replace single quotes with double quotes for JSON parsing
                                      const jsonString = uomValue.replace(/'/g, '"');
                                      const parsed = JSON.parse(jsonString);
                                      uomArray = Array.isArray(parsed) ? parsed.filter(u => u != null && u !== "") : [];
                                    } catch (e2) {
                                      // If still fails, treat as single string value
                                      uomArray = uomValue.trim() ? [uomValue.trim()] : [];
                                    }
                                  } else {
                                    // If not JSON, treat as single string value
                                    uomArray = uomValue.trim() ? [uomValue.trim()] : [];
                                  }
                                }
                              } else if (uomValue) {
                                uomArray = [uomValue];
                              }
                              
                              return uomArray.length > 0 ? (
                                <>
                                  {uomArray.slice(0, 3).map((uom, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                                    >
                                      {String(uom).trim()}
                                    </span>
                                  ))}
                                  {uomArray.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      +{uomArray.length - 3} more
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 italic">-</span>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {attribute.print_priority || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {attribute.created ? new Date(attribute.created).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {attribute.updated ? new Date(attribute.updated).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleView(attribute)}
                              className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-100 transition duration-200"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            {checkPermission("attribute", "update") && (
                              <button
                                onClick={() => handleEdit(attribute)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100 transition duration-200"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {checkPermission("attribute", "delete") && (
                              <button
                                onClick={() => handleDelete(attribute.id)}
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition duration-200"
                                title="Delete"
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
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <Settings size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium text-gray-500 mb-1">
                            {attributes.length === 0 ? "No material attributes found" : "No attributes match your criteria"}
                          </p>
                          <p className="text-sm">
                            {attributes.length === 0
                              ? "Get started by adding a new material attribute"
                              : "Try adjusting your search or filter"}
                          </p>
                          {attributes.length === 0 && checkPermission("attribute", "create") && (
                            <button
                              onClick={handleAddNew}
                              className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md shadow hover:bg-purple-700 transition duration-300"
                            >
                              <PlusCircle className="w-5 h-5 mr-2" />
                              Add New Attribute
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
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredAttributes.length)}</span> of{' '}
                      <span className="font-medium">{filteredAttributes.length}</span> results
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
      </div>

      {/* Attribute Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingAttribute ? "Edit Material Attribute" : "Add New Material Attribute"}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}
              
              {editingAttribute ? (
                /* Edit Single Attribute */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Group</label>
                    <input
                      type="text"
                      value={editingAttribute.mgrp_code || ''}
                      disabled
                      className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Name *</label>
                    <input
                      type="text"
                      value={editFormData.attribute_name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, attribute_name: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Color"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Possible Values *</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={editValueInput}
                        onChange={(e) => setEditValueInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (editValueInput.trim() && !editFormData.possible_values.includes(editValueInput.trim())) {
                              setEditFormData(prev => ({ ...prev, possible_values: [...prev.possible_values, editValueInput.trim()] }));
                              setEditValueInput("");
                            }
                          }
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter a value and press Enter or click Add"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editValueInput.trim() && !editFormData.possible_values.includes(editValueInput.trim())) {
                            setEditFormData(prev => ({ ...prev, possible_values: [...prev.possible_values, editValueInput.trim()] }));
                            setEditValueInput("");
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    {editFormData.possible_values.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editFormData.possible_values.map((value, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {value}
                            <button
                              type="button"
                              onClick={() => {
                                setEditFormData(prev => ({
                                  ...prev,
                                  possible_values: prev.possible_values.filter((_, i) => i !== index)
                                }));
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Print Priority</label>
                    <input
                      type="number"
                      value={editFormData.print_priority}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, print_priority: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit of Measure (UOM)</label>
                    <div className="flex items-center space-x-4 mb-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="editUOM"
                          checked={editHasUOM === true}
                          onChange={() => {
                            setEditHasUOM(true);
                            if (!Array.isArray(editFormData.uom) || editFormData.uom.length === 0) {
                              setEditFormData(prev => ({ ...prev, uom: [] }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="editUOM"
                          checked={editHasUOM === false}
                          onChange={() => {
                            setEditHasUOM(false);
                            setEditFormData(prev => ({ ...prev, uom: [] }));
                            setEditUnitInput("");
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                    {editHasUOM && (
                      <>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={editUnitInput}
                            onChange={(e) => setEditUnitInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const uomArray = Array.isArray(editFormData.uom) ? editFormData.uom : [];
                                if (editUnitInput.trim() && !uomArray.includes(editUnitInput.trim())) {
                                  setEditFormData(prev => ({
                                    ...prev,
                                    uom: [...(Array.isArray(prev.uom) ? prev.uom : (prev.uom ? [prev.uom] : [])), editUnitInput.trim()]
                                  }));
                                  setEditUnitInput("");
                                }
                              }
                            }}
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter UOM and press Enter or click Add"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const uomArray = Array.isArray(editFormData.uom) ? editFormData.uom : [];
                              if (editUnitInput.trim() && !uomArray.includes(editUnitInput.trim())) {
                                setEditFormData(prev => ({
                                  ...prev,
                                  uom: [...(Array.isArray(prev.uom) ? prev.uom : (prev.uom ? [prev.uom] : [])), editUnitInput.trim()]
                                }));
                                setEditUnitInput("");
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                        {Array.isArray(editFormData.uom) && editFormData.uom.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editFormData.uom.map((unit, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                              >
                                {unit}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditFormData(prev => ({
                                      ...prev,
                                      uom: (Array.isArray(prev.uom) ? prev.uom : (prev.uom ? [prev.uom] : [])).filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="ml-2 text-green-600 hover:text-green-800"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validation</label>
                    <select
                      value={editFormData.validation}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, validation: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select validation type</option>
                      <option value="alpha">Alpha</option>
                      <option value="numeric">Numeric</option>
                      <option value="alphanumeric">Alphanumeric</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* Create Multiple Attributes */
                <>
                  {/* Material Group Selection */}
                  <div>
                    <SearchableDropdown
                      label="Material Group Code *"
                      options={materialGroups}
                      value={formData.mgrp_code}
                      onChange={(value) => setFormData(prev => ({ ...prev, mgrp_code: value || "" }))}
                      placeholder={materialGroups.length === 0 ? "Loading material groups..." : "Select material group..."}
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
                    {materialGroups.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">No material groups available. Please ensure material groups are created first.</p>
                    )}
                  </div>
                  

                  {/* Add New Attribute Form */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Add New Attribute</h3>
                      {formData.attributes.length > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {formData.attributes.length} {formData.attributes.length === 1 ? 'Attribute' : 'Attributes'} Added
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attribute Name *</label>
                        <input
                          type="text"
                          value={newAttrName}
                          onChange={(e) => setNewAttrName(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Color"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Values *</label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newAttrValueInput}
                            onChange={(e) => setNewAttrValueInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addValueToNewAttr();
                              }
                            }}
                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter a value and press Enter or click Add"
                          />
                          <button
                            type="button"
                            onClick={addValueToNewAttr}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add
                          </button>
                        </div>
                        {newAttrValues.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {newAttrValues.map((value, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {value}
                                <button
                                  type="button"
                                  onClick={() => removeValueFromNewAttr(index)}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Print Priority</label>
                        <input
                          type="number"
                          value={newAttrPrintPriority}
                          onChange={(e) => setNewAttrPrintPriority(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Validation</label>
                        <select
                          value={newAttrValidation}
                          onChange={(e) => setNewAttrValidation(e.target.value)}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select validation type</option>
                          <option value="alpha">Alpha</option>
                          <option value="numeric">Numeric</option>
                          <option value="alphanumeric">Alphanumeric</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit of Measure (UOM)</label>
                        <div className="flex items-center space-x-4 mb-3">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="newUOM"
                              checked={newAttrHasUOM === true}
                              onChange={() => {
                                setNewAttrHasUOM(true);
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="newUOM"
                              checked={newAttrHasUOM === false}
                              onChange={() => {
                                setNewAttrHasUOM(false);
                                setNewAttrUnits([]);
                                setNewAttrUnitInput("");
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                        {newAttrHasUOM && (
                          <>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={newAttrUnitInput}
                                onChange={(e) => setNewAttrUnitInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addUOMToNewAttr();
                                  }
                                }}
                                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter UOM and press Enter or click Add"
                              />
                              <button
                                type="button"
                                onClick={addUOMToNewAttr}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>
                            {newAttrUnits.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {newAttrUnits.map((unit, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                                  >
                                    {unit}
                                    <button
                                      type="button"
                                      onClick={() => removeUOMFromNewAttr(index)}
                                      className="ml-2 text-green-600 hover:text-green-800"
                                    >
                                      <X size={14} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addAttributeToForm}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Plus size={18} className="mr-2" />
                          Add Attribute
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Existing Attributes */}
                  {formData.attributes.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Defined Attributes ({formData.attributes.length})</h3>
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <div className="min-w-full">
                          {/* Compact Table Header */}
                          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 border-b border-gray-300 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="col-span-3">Attribute Name</div>
                            <div className="col-span-4">Possible Values</div>
                            <div className="col-span-1">Priority</div>
                            <div className="col-span-2">UOM</div>
                            <div className="col-span-1">Validation</div>
                            <div className="col-span-1">Action</div>
                          </div>
                          
                          {/* Compact Table Body */}
                          <div className="divide-y divide-gray-200">
                            {formData.attributes.map((attr, index) => (
                              <div key={index} className="grid grid-cols-12 gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors">
                                <div className="col-span-3">
                                  <span className="text-sm font-medium text-gray-900">{attr.attribute_name}</span>
                                </div>
                                <div className="col-span-4">
                                  <div className="flex flex-wrap gap-1">
                                    {attr.possible_values && attr.possible_values.length > 0 ? (
                                      attr.possible_values.slice(0, 3).map((value, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                        >
                                          {value}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">No values</span>
                                    )}
                                    {attr.possible_values && attr.possible_values.length > 3 && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                        +{attr.possible_values.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="col-span-1">
                                  <span className="text-sm text-gray-600">{attr.print_priority || 0}</span>
                                </div>
                                <div className="col-span-2">
                                  <div className="flex flex-wrap gap-1">
                                    {(() => {
                                      const uomValue = attr.uom || "";
                                      const uomArray = Array.isArray(uomValue) ? uomValue : (uomValue ? [uomValue] : []);
                                      return uomArray.length > 0 ? (
                                        uomArray.map((uom, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                                          >
                                            {uom}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs text-gray-400 italic">-</span>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <div className="col-span-1">
                                  <span className="text-xs text-gray-600">{attr.validation || "-"}</span>
                                </div>
                                <div className="col-span-1 flex items-center">
                                  <button
                                    onClick={() => removeAttributeFromForm(index)}
                                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Remove"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
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
                onClick={handleSaveAttribute}
                disabled={
                  saving || 
                  (editingAttribute 
                    ? (!editFormData.attribute_name || !editFormData.possible_values || editFormData.possible_values.length === 0)
                    : (!formData.mgrp_code || formData.attributes.length === 0)
                  )
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingAttribute ? "Save Changes" : "Add Attributes"}
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
          setViewingAttribute(null);
        }}
        data={viewingAttribute}
        title="View Material Attribute Details"
        fieldLabels={{
          id: "Attribute ID",
          mgrp_code: "Material Group Code",
          attribute_name: "Attribute Name",
          possible_values: "Possible Values",
          uom: "Unit of Measure",
          print_priority: "Print Priority",
          validation: "Validation",
          created: "Created",
          updated: "Updated",
          createdby: "Created By",
          updatedby: "Updated By"
        }}
      />
    </div>
  );
}
