"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createRequest, fetchProjects, addFavorite, removeFavorite, fetchFavorites } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function MaterialDetailPage() {
  const { slug: rawSlug } = useParams();
  const slug = rawSlug ? decodeURIComponent(rawSlug) : rawSlug;
  const router = useRouter();
  const { token } = useAuth(); // Move useAuth before useEffect that uses token
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMaterials, setFavoriteMaterials] = useState([]);
  const [showFavoritesList, setShowFavoritesList] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load favorite materials on mount
  useEffect(() => {
    const loadFavoriteMaterials = async () => {
      if (token) {
        try {
          const favorites = await fetchFavorites(token, "item");
          setFavoriteMaterials(favorites || []);
        } catch (err) {
          console.error("Error loading favorite materials:", err);
          setFavoriteMaterials([]);
        }
      }
    };
    loadFavoriteMaterials();
  }, [token]);

  // Check if selected item is favorite
  useEffect(() => {
    if (selectedItem && favoriteMaterials.length > 0) {
      const isFav = favoriteMaterials.some(
        fav => fav.local_item_id === selectedItem.local_item_id ||
          (fav.sap_item_id && fav.sap_item_id === selectedItem.sap_id)
      );
      setIsFavorite(isFav);
    } else {
      setIsFavorite(false);
    }
  }, [selectedItem, favoriteMaterials]);

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

  // Handle Add to Favorites
  const handleAddToFavorites = async () => {
    if (!token || !selectedItem) return;

    try {
      const itemData = selectedItem.local_item_id
        ? { local_item_id: selectedItem.local_item_id }
        : { sap_item_id: selectedItem.sap_id };

      await addFavorite(token, itemData);
      setIsFavorite(true);

      // Reload favorites list
      const favorites = await fetchFavorites(token, "item");
      setFavoriteMaterials(favorites || []);

      alert("Material added to favorites!");
    } catch (err) {
      console.error("Error adding to favorites:", err);
      alert("Failed to add to favorites: " + (err.response?.data?.error || err.message));
    }
  };

  // Handle Remove from Favorites
  const handleRemoveFromFavorites = async () => {
    if (!token || !selectedItem) return;

    try {
      const itemData = selectedItem.local_item_id
        ? { local_item_id: selectedItem.local_item_id }
        : { sap_item_id: selectedItem.sap_id };

      await removeFavorite(token, itemData);
      setIsFavorite(false);

      // Reload favorites list
      const favorites = await fetchFavorites(token, "item");
      setFavoriteMaterials(favorites || []);

      alert("Material removed from favorites!");
    } catch (err) {
      console.error("Error removing from favorites:", err);
      alert("Failed to remove from favorites: " + (err.response?.data?.error || err.message));
    }
  };

  // Handle Search Materials
  const handleSearchMaterials = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Search in current material group items
      const query = searchQuery.toLowerCase();
      const filtered = items.filter(item => {
        return (
          (item.item_desc && item.item_desc.toLowerCase().includes(query)) ||
          (item.sap_id && item.sap_id.toString().toLowerCase().includes(query)) ||
          (item.local_item_id && item.local_item_id.toString().toLowerCase().includes(query)) ||
          (item.notes && item.notes.toLowerCase().includes(query))
        );
      });
      setSearchResults(filtered);
    } catch (err) {
      console.error("Error searching materials:", err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, items]);

  // Auto-search when query changes (debounced)
  useEffect(() => {
    if (!showSearchModal) return;

    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchMaterials();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showSearchModal, handleSearchMaterials]);

  // Handle Add Material from Search
  const handleAddMaterialFromSearch = async (item) => {
    if (!token) {
      alert("Please login to add favorites");
      return;
    }

    try {
      const itemData = item.local_item_id
        ? { local_item_id: item.local_item_id }
        : { sap_item_id: item.sap_id };

      await addFavorite(token, itemData);

      // Reload favorites list
      const favorites = await fetchFavorites(token, "item");
      setFavoriteMaterials(favorites || []);

      setShowSearchModal(false);
      setSearchQuery("");
      setSearchResults([]);
      alert("Material added to favorites!");
    } catch (err) {
      console.error("Error adding material to favorites:", err);
      alert("Failed to add to favorites: " + (err.response?.data?.error || err.message));
    }
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

  // Toggle Favorite (for selected item)
  const toggleFavorite = async () => {
    if (!selectedItem) {
      alert("Please select a material first");
      return;
    }

    if (isFavorite) {
      await handleRemoveFromFavorites();
    } else {
      await handleAddToFavorites();
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading material group...</p>
        </div>
      </div>
    );
  }

  if (error || !materialGroup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white shadow-xl rounded-lg p-4 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-3 text-sm font-medium text-gray-900">Material Group Not Found</h3>
            <p className="mt-1 text-xs text-gray-500">
              The material group code <span className="font-mono font-bold">{slug}</span> does not exist in our database.
            </p>
            <div className="mt-3">
              <button
                onClick={() => router.push("/search")}
                className="inline-flex items-center px-3 py-1.5 text-xs border border-transparent font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-800 text-white p-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-bold">Material Group</h1>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col min-h-0">
        {/* Group Header */}
        <div className="mb-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Material Group: <span className="font-mono text-blue-700">{slug}</span>
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">{materialGroup.mgrp_longname || materialGroup.mgrp_shortname}</p>
            </div>
            <button
              onClick={() => router.push("/search")}
              className="flex items-center px-3 py-1.5 text-xs border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Search
            </button>
          </div>
        </div>

        {/* Items + Details - Two Column Layout with Individual Scrollbars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
          {/* Items List - Left Column */}
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Available Items {loadingItems ? "(Loading...)" : `(${items.length})`}
            </h3>
            <div className="flex-1 overflow-y-auto">
              {loadingItems ? (
                <div className="p-3 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-1.5 text-xs">Loading items...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400"
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
                  <p className="mt-1.5 text-xs">No items found for this material type</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.local_item_id || item.sap_id}
                      onClick={() => handleItemSelect(item)}
                      className={`px-3 py-2 cursor-pointer transition-colors ${selectedItem?.local_item_id === item.local_item_id
                          ? "bg-blue-50 border-l-4 border-l-blue-600"
                          : "hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="font-mono text-xs text-blue-700">
                          {item.sap_id ? `SAP: ${item.sap_id}` : `ID: ${item.local_item_id}`}
                        </div>
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      </div>
                      <div className="text-xs font-medium text-gray-800 mt-0.5">
                        {item.item_desc}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Item Details - Right Column */}
          <div className="flex flex-col min-h-0">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Item Details
            </h3>
            <div className="flex-1 overflow-y-auto">
              {loadingItemDetails ? (
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-xs text-gray-500">Loading item details...</p>
                </div>
              ) : itemDetails ? (
                <div>
                  <div className="mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">
                          {itemDetails.item.item_desc}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {itemDetails.item.sap_id ? `SAP ID: ${itemDetails.item.sap_id}` : `Local ID: ${itemDetails.item.local_item_id}`}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Available
                      </span>
                    </div>
                  </div>

                  {itemDetails.item.notes && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                        Description
                      </h4>
                      <div className="bg-gray-50 p-2 text-xs">
                        {itemDetails.item.notes}
                      </div>
                    </div>
                  )}

                  {itemDetails.item.mat_type_desc && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-700 mb-0.5">
                        Material Type
                      </h4>
                      <div className="bg-gray-50 p-2 text-xs">
                        {itemDetails.item.mat_type_desc}
                      </div>
                    </div>
                  )}

                  {/* Item Attributes - Display actual values in table format */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1.5">Attributes</h4>
                    {itemDetails.item.attributes && Object.keys(itemDetails.item.attributes).length > 0 ? (
                      <div className="bg-gray-50">
                        <table className="w-full">
                          <tbody>
                            {Object.entries(itemDetails.item.attributes).map(([key, value], index) => {
                              // Find the attribute definition to get UOM
                              const attrDef = itemDetails.attributes?.find(attr => attr.attrib_name === key);
                              const uom = attrDef?.unit;

                              return (
                                <tr key={key} className={index !== Object.keys(itemDetails.item.attributes).length - 1 ? "border-b border-gray-200" : ""}>
                                  <td className="px-2 py-1.5 text-xs font-medium text-gray-700">
                                    {key}
                                    {uom && (
                                      <span className="ml-1.5 text-xs text-gray-500">({uom})</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5 text-xs text-gray-700 font-medium text-right bg-white">
                                    {value || "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-2 text-xs text-gray-500 text-center">
                        No attributes defined for this item
                      </div>
                    )}
                  </div>

                  {/* Buttons inside details */}
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleFavorite}
                      className={`inline-flex items-center px-3 py-1.5 text-xs border rounded-md shadow-sm font-medium ${isFavorite
                          ? "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                          : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                        }`}
                    >
                      {isFavorite ? (
                        <>
                          <svg className="mr-1.5 h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          Remove from Favorites
                        </>
                      ) : (
                        <>
                          <svg className="mr-1.5 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Add to Favorites
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : selectedItem ? (
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-xs text-gray-500">Loading item details...</p>
                </div>
              ) : (
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400"
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
                  <h3 className="mt-2 text-xs font-medium text-gray-900">
                    No item selected
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Select an item from the list to view its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {items.length === 0 && !loadingItems && (
          <div className="mt-3 p-3 text-center">
            <p className="text-xs text-gray-500">No items found for this material group.</p>
          </div>
        )}

        {/* Item Not Found button */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleItemNotFound}
            className="inline-flex items-center px-3 py-1.5 text-xs border border-transparent font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
          >
            <svg
              className="mr-1.5 h-4 w-4"
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
      <div className="bg-gray-100 p-2 text-center text-xs text-gray-500">
        © 2023 Company Name. All rights reserved. | v2.4.1
      </div>

      {/* Favorites List Sidebar */}
      {showFavoritesList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Favorite Materials ({favoriteMaterials.length})
              </h2>
              <button
                onClick={() => setShowFavoritesList(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {favoriteMaterials.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <p className="text-xs">No favorite materials yet</p>
                  <p className="text-xs mt-1">Add materials to favorites to see them here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {favoriteMaterials.map((fav) => (
                    <div
                      key={fav.id}
                      className="border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xs font-medium text-gray-800">{fav.item_desc}</h3>
                          {fav.item_long_name && (
                            <p className="text-xs text-gray-600 mt-0.5">{fav.item_long_name}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-gray-500">
                            {fav.local_item_id && (
                              <span className="font-mono">ID: {fav.local_item_id}</span>
                            )}
                            {fav.sap_item_id && (
                              <span className="font-mono">SAP: {fav.sap_item_id}</span>
                            )}
                            {fav.mgrp_code && (
                              <span>Group: {fav.mgrp_code}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!token) return;
                            try {
                              const itemData = fav.local_item_id
                                ? { local_item_id: fav.local_item_id }
                                : { sap_item_id: fav.sap_item_id };
                              await removeFavorite(token, itemData);
                              const favorites = await fetchFavorites(token, "item");
                              setFavoriteMaterials(favorites || []);
                            } catch (err) {
                              console.error("Error removing favorite:", err);
                              alert("Failed to remove favorite");
                            }
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                          title="Remove from favorites"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Materials Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Search & Add Materials to Favorites
              </h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              <div className="mb-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearchMaterials();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchMaterials();
                      }
                    }}
                    placeholder="Search by name, ID, or SAP ID..."
                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearchMaterials}
                    disabled={searchLoading}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {searchLoading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p className="text-xs">{searchQuery ? "No materials found" : "Enter a search query to find materials"}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {searchResults.map((item) => {
                      const isAlreadyFavorite = favoriteMaterials.some(
                        fav => fav.local_item_id === item.local_item_id ||
                          (fav.sap_item_id && fav.sap_item_id === item.sap_id)
                      );
                      return (
                        <div
                          key={item.local_item_id || item.sap_id}
                          className="p-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-xs font-medium text-gray-800">{item.item_desc}</h3>
                              {item.notes && (
                                <p className="text-xs text-gray-600 mt-0.5">{item.notes}</p>
                              )}
                              <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs text-gray-500">
                                {item.local_item_id && (
                                  <span className="font-mono">ID: {item.local_item_id}</span>
                                )}
                                {item.sap_id && (
                                  <span className="font-mono">SAP: {item.sap_id}</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddMaterialFromSearch(item)}
                              disabled={isAlreadyFavorite || !token}
                              className={`ml-2 px-3 py-1.5 text-xs rounded-md font-medium ${isAlreadyFavorite
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                            >
                              {isAlreadyFavorite ? "Already Added" : "Add to Favorites"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-3 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Create Request - Item Not Found
              </h2>
              <button onClick={handleCloseRequestModal} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <div className="p-3 grid grid-cols-1 gap-2">
              {requestError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <div className="text-red-600 text-xs">{requestError}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project Code *</label>
                <select
                  name="project_code"
                  value={requestFormData.project_code}
                  onChange={handleRequestInputChange}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={requestFormData.notes}
                  onChange={handleRequestInputChange}
                  rows={3}
                  className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>

              <input type="hidden" name="type" value="material" />
            </div>

            <div className="flex justify-end space-x-2 p-3 border-t">
              <button
                onClick={handleCloseRequestModal}
                disabled={savingRequest}
                className="px-3 py-1.5 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRequest}
                disabled={savingRequest || !requestFormData.project_code}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {savingRequest && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
