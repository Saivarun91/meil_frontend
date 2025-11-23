"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createRequest, fetchProjects, addFavorite, removeFavorite, fetchFavorites } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function MaterialDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { token } = useAuth(); // Move useAuth before useEffect that uses token
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Load favorite status on mount
  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (slug && token) {
        try {
          const favorites = await fetchFavorites(token);
          const isFav = favorites.some(fav => fav.mgrp_code === slug);
          setIsFavorite(isFav);
        } catch (err) {
          console.error("Error loading favorite status:", err);
          // Fallback to localStorage if API fails
          const localFavorites = JSON.parse(localStorage.getItem('materialFavorites') || '[]');
          setIsFavorite(localFavorites.includes(slug));
        }
      }
    };
    loadFavoriteStatus();
  }, [slug, token]);
  
  // New state for the search flow
  const [materialGroup, setMaterialGroup] = useState(null);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingItemDetails, setLoadingItemDetails] = useState(false);
  const [error, setError] = useState(null);

  // Request modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    project_code: "",
    notes: "",
    type: "material"
  });
  const [projects, setProjects] = useState([]);
  const [savingRequest, setSavingRequest] = useState(false);
  const [requestError, setRequestError] = useState(null);

  // Fetch material group info and material types on mount
  useEffect(() => {
    const fetchMaterialGroupAndTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch material group details
        const groupRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/by-code/${slug}/`
        );
        if (!groupRes.ok) {
          throw new Error("Material group not found");
        }
        const groupData = await groupRes.json();
        setMaterialGroup(groupData.group);

        // Fetch material types for this group
        const typesRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/${slug}/materials/`
        );
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          setMaterialTypes(typesData);
        }
      } catch (err) {
        console.error("Error fetching material group:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchMaterialGroupAndTypes();
    }
  }, [slug]);

  // Fetch all items in the group directly (no material type selection needed)
  useEffect(() => {
    const fetchItems = async () => {
      if (!slug) {
        setItems([]);
        setSelectedItem(null);
        setItemDetails(null);
        return;
      }

      setLoadingItems(true);
      try {
        // Use items_by_group to get all items in the group
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/${slug}/items/`
        );
        if (res.ok) {
          const itemsData = await res.json();
          // Format items to ensure consistent structure
          const formattedItems = itemsData
            .map(item => {
              // Handle mgrp_code - could be object (ForeignKey) or string
              let mgrpCode = item.mgrp_code;
              if (typeof mgrpCode === 'object' && mgrpCode !== null) {
                mgrpCode = mgrpCode.mgrp_code || mgrpCode;
              }
              
              // Handle mat_type_code - could be object (ForeignKey) or string
              let matTypeCode = item.mat_type_code;
              if (typeof matTypeCode === 'object' && matTypeCode !== null) {
                matTypeCode = matTypeCode.mat_type_code || matTypeCode;
              }
              
              return {
                local_item_id: item.local_item_id,
                sap_id: item.sap_item_id,
                item_desc: item.item_desc || item.short_name,
                notes: item.notes || item.long_name,
                mgrp_code: mgrpCode || slug, // Ensure it matches the slug
                mat_type_code: matTypeCode,
              };
            })
            .filter(item => {
              // Double-check: only include items that match the selected material group
              return item.mgrp_code === slug;
            });
          
          setItems(formattedItems);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setItems([]);
      } finally {
        setLoadingItems(false);
      }
    };

    if (slug) {
      fetchItems();
    }
  }, [slug]);

  // Fetch item details when item is selected
  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!selectedItem) {
        setItemDetails(null);
        return;
      }

      setLoadingItemDetails(true);
      try {
        const itemId = selectedItem.local_item_id || selectedItem.sap_id;
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/items/${itemId}/details/`
        );
        if (res.ok) {
          const detailsData = await res.json();
          setItemDetails(detailsData);
        } else {
          setItemDetails(null);
        }
      } catch (err) {
        console.error("Error fetching item details:", err);
        setItemDetails(null);
      } finally {
        setLoadingItemDetails(false);
      }
    };

    fetchItemDetails();
  }, [selectedItem]);

  // Handle Share
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load projects for request modal
  useEffect(() => {
    const loadProjects = async () => {
      if (token && isRequestModalOpen) {
        try {
          const data = await fetchProjects(token);
          setProjects(data || []);
        } catch (err) {
          console.error("Error loading projects:", err);
        }
      }
    };
    loadProjects();
  }, [token, isRequestModalOpen]);

  // Handle Item Not Found button click
  const handleItemNotFound = () => {
    setRequestFormData({
      project_code: "",
      notes: "",
      type: "material"
    });
    setRequestError(null);
    setIsRequestModalOpen(true);
  };

  // Handle request form input change
  const handleRequestInputChange = (e) => {
    const { name, value } = e.target;
    setRequestFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save request
  const handleSaveRequest = async () => {
    if (!requestFormData.project_code) {
      setRequestError("Please select a project");
      return;
    }

    try {
      setSavingRequest(true);
      setRequestError(null);
      if (!token) {
        setRequestError("No authentication token found");
        return;
      }

      await createRequest(token, requestFormData);
      setIsRequestModalOpen(false);
      setRequestFormData({
        project_code: "",
        notes: "",
        type: "material"
      });
      // Show success message (you can use toast here)
      alert("Request created successfully!");
    } catch (err) {
      setRequestError("Failed to create request: " + (err.response?.data?.error || err.message));
      console.error("Error creating request:", err);
    } finally {
      setSavingRequest(false);
    }
  };

  // Handle close request modal
  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    setRequestError(null);
    setRequestFormData({
      project_code: "",
      notes: "",
      type: "material"
    });
  };

  // Toggle Favorite
  const toggleFavorite = async () => {
    if (!token || !slug) return;
    
    const newFavoriteStatus = !isFavorite;
    
    try {
      if (newFavoriteStatus) {
        // Add to favorites
        await addFavorite(token, slug);
        setIsFavorite(true);
      } else {
        // Remove from favorites
        await removeFavorite(token, slug);
        setIsFavorite(false);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      // Fallback to localStorage if API fails
      const favorites = JSON.parse(localStorage.getItem('materialFavorites') || '[]');
      if (newFavoriteStatus) {
        if (!favorites.includes(slug)) {
          favorites.push(slug);
          localStorage.setItem('materialFavorites', JSON.stringify(favorites));
        }
        setIsFavorite(true);
      } else {
        const updatedFavorites = favorites.filter(fav => fav !== slug);
        localStorage.setItem('materialFavorites', JSON.stringify(updatedFavorites));
        setIsFavorite(false);
      }
    }
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    setSelectedItem(item);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading material group...</p>
        </div>
      </div>
    );
  }

  if (error || !materialGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-5 text-lg font-medium text-gray-900">Material Group Not Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              The material group code <span className="font-mono font-bold">{slug}</span> does not exist in our database.
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push("/search")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Search
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-800 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Material Group</h1>
            </div>
            <button
              onClick={toggleFavorite}
              className="p-2 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isFavorite ? (
                <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Group Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Material Group: <span className="font-mono text-blue-700">{slug}</span>
                </h2>
                <p className="text-gray-600 mt-1">{materialGroup.mgrp_longname || materialGroup.mgrp_shortname}</p>
              </div>
              <button
                onClick={() => router.push("/search")}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Search
              </button>
            </div>
          </div>

          {/* Items + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Items List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-inner">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-700">
                    Available Items {loadingItems ? "(Loading...)" : `(${items.length})`}
                  </h3>
                </div>
                <div className="h-72 overflow-y-auto">
                  {loadingItems ? (
                    <div className="p-4 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2">Loading items...</p>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="mt-2">No items found for this material type</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.local_item_id || item.sap_id}
                        onClick={() => handleItemSelect(item)}
                        className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
                          selectedItem?.local_item_id === item.local_item_id
                            ? "bg-blue-50 border-l-4 border-l-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-mono text-sm text-blue-700">
                            {item.sap_id ? `SAP: ${item.sap_id}` : `ID: ${item.local_item_id}`}
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800 mt-1">
                          {item.item_desc}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {item.notes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Item Details */}
              <div>
                {loadingItemDetails ? (
                  <div className="border border-gray-200 rounded-lg shadow-inner p-6 h-72 flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading item details...</p>
                  </div>
                ) : itemDetails ? (
                  <div className="border border-gray-200 rounded-lg shadow-inner p-4 h-72 overflow-y-auto">
                    <div className="mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {itemDetails.item.item_desc}
                          </h3>
                          <p className="text-sm text-gray-500 font-mono">
                            {itemDetails.item.sap_id ? `SAP ID: ${itemDetails.item.sap_id}` : `Local ID: ${itemDetails.item.local_item_id}`}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Available
                        </span>
                      </div>
                    </div>

                    {itemDetails.item.notes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Description
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          {itemDetails.item.notes}
                        </div>
                      </div>
                    )}

                    {itemDetails.item.mat_type_desc && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Material Type
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          {itemDetails.item.mat_type_desc}
                        </div>
                      </div>
                    )}

                    {/* Item Attributes - Display actual values */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Attributes</h4>
                      {itemDetails.item.attributes && Object.keys(itemDetails.item.attributes).length > 0 ? (
                        <div className="space-y-4">
                          {Object.entries(itemDetails.item.attributes).map(([key, value]) => {
                            // Find the attribute definition to get UOM
                            const attrDef = itemDetails.attributes?.find(attr => attr.attrib_name === key);
                            const uom = attrDef?.unit;
                            
                            return (
                              <div key={key} className="border rounded-lg p-4 bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {key}
                                  {uom && (
                                    <span className="ml-2 text-xs text-gray-500"></span>
                                  )}
                                </label>
                                <div className="text-sm text-gray-700 font-medium bg-white px-4 py-2 border border-gray-200 rounded-lg">
                                  {value || "-"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-500 text-center">
                          No attributes defined for this item
                        </div>
                      )}
                    </div>

                    {/* Buttons inside details */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={handleShare}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {copied ? "Copied!" : "Share"}
                      </button>
                    </div>
                  </div>
                ) : selectedItem ? (
                  <div className="border border-gray-200 rounded-lg shadow-inner p-6 h-72 flex flex-col items-center justify-center text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading item details...</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg shadow-inner p-6 h-72 flex flex-col items-center justify-center text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                      No item selected
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Select an item from the list to view its details.
                    </p>
                  </div>
                )}
              </div>
          </div>

          {items.length === 0 && !loadingItems && (
            <div className="border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-500">No items found for this material group.</p>
            </div>
          )}

          {/* Item Not Found button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleItemNotFound}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Request Material
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-100 p-4 text-center text-xs text-gray-500">
          © 2023 Company Name. All rights reserved. | v2.4.1
        </div>
      </div>

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Create Request - Item Not Found
              </h2>
              <button onClick={handleCloseRequestModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 gap-4">
              {requestError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-600 text-sm">{requestError}</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Code *</label>
                <select
                  name="project_code"
                  value={requestFormData.project_code}
                  onChange={handleRequestInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((project) => (
                    <option key={project.project_code} value={project.project_code}>
                      {project.project_code} - {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={requestFormData.notes}
                  onChange={handleRequestInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              <input type="hidden" name="type" value="material" />
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={handleCloseRequestModal}
                disabled={savingRequest}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRequest}
                disabled={savingRequest || !requestFormData.project_code}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {savingRequest && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
