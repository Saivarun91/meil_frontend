"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Search, Loader2, Trash2, Eye, Package, Share2, Users } from "lucide-react";
import { fetchFavorites, removeFavorite, shareMaterial, fetchSharedMaterials, fetchEmployees } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useSortableData } from "@/hooks/useSortableData";
import BackButton from "@/components/BackButton";

export default function FavoritesPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("favorites"); // "favorites" or "shared"
  const [favorites, setFavorites] = useState([]);
  const [sharedMaterials, setSharedMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState(null);

  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingItem, setSharingItem] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [sharing, setSharing] = useState(false);

  // View details states
  const [viewingItem, setViewingItem] = useState(null);
  const [itemDetails, setItemDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (token) {
      loadFavorites();
      loadSharedMaterials();
      loadEmployees();
    }
  }, [token]);

  const loadFavorites = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFavorites(token);
      setFavorites(data || []);
    } catch (err) {
      setError("Failed to load favorites: " + (err.message || "Unknown error"));
      console.error("Error loading favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSharedMaterials = async () => {
    if (!token) return;
    try {
      const data = await fetchSharedMaterials(token);
      setSharedMaterials(data || []);
    } catch (err) {
      console.error("Error loading shared materials:", err);
    }
  };

  const loadEmployees = async () => {
    if (!token) return;
    try {
      const data = await fetchEmployees(token);
      // Filter out current user
      const filtered = data.filter(emp => emp.emp_id !== user?.emp_id);
      setEmployees(filtered || []);
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  };

  const handleRemoveFavorite = async (favoriteId, localItemId, sapItemId) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to remove this material from favorites?")) {
      return;
    }

    try {
      setRemovingId(favoriteId);
      const itemData = localItemId
        ? { local_item_id: localItemId }
        : { sap_item_id: sapItemId };
      await removeFavorite(token, itemData);
      await loadFavorites();
    } catch (err) {
      setError("Failed to remove favorite: " + (err.message || "Unknown error"));
      console.error("Error removing favorite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleShare = (item) => {
    setSharingItem(item);
    setSelectedUsers([]);
    setUserSearchTerm("");
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    if (!token || !sharingItem || selectedUsers.length === 0) return;

    try {
      setSharing(true);
      const itemData = sharingItem.local_item_id
        ? { local_item_id: sharingItem.local_item_id }
        : { sap_item_id: sharingItem.sap_item_id };

      const sharedWithIds = selectedUsers.map(u => u.emp_id);
      await shareMaterial(token, {
        ...itemData,
        shared_with: sharedWithIds
      });

      setShowShareModal(false);
      setSharingItem(null);
      setSelectedUsers([]);
      alert(`Material shared with ${selectedUsers.length} user(s) successfully!`);
      await loadSharedMaterials();
    } catch (err) {
      setError("Failed to share material: " + (err.response?.data?.error || err.message));
      console.error("Error sharing material:", err);
    } finally {
      setSharing(false);
    }
  };

  const toggleUserSelection = (employee) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.emp_id === employee.emp_id);
      if (exists) {
        return prev.filter(u => u.emp_id !== employee.emp_id);
      } else {
        return [...prev, employee];
      }
    });
  };

  const handleViewDetails = async (item) => {
    setViewingItem(item);
    setItemDetails(null);
    setLoadingDetails(true);

    try {
      const itemId = item.local_item_id || item.sap_item_id;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/items/${itemId}/details/`
      );
      if (res.ok) {
        const details = await res.json();
        setItemDetails(details);
      } else {
        setError("Failed to load item details");
      }
    } catch (err) {
      console.error("Error loading item details:", err);
      setError("Failed to load item details: " + (err.message || "Unknown error"));
    } finally {
      setLoadingDetails(false);
    }
  };

  // Filter data based on search term
  const filteredFavorites = favorites.filter((fav) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fav.item_desc?.toLowerCase().includes(searchLower) ||
      fav.item_long_name?.toLowerCase().includes(searchLower) ||
      fav.mgrp_code?.toLowerCase().includes(searchLower) ||
      fav.mgrp_shortname?.toLowerCase().includes(searchLower) ||
      fav.mgrp_longname?.toLowerCase().includes(searchLower) ||
      (fav.local_item_id && fav.local_item_id.toString().includes(searchLower)) ||
      (fav.sap_item_id && fav.sap_item_id.toString().includes(searchLower))
    );
  });

  const filteredSharedMaterials = sharedMaterials.filter((shared) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      shared.item_desc?.toLowerCase().includes(searchLower) ||
      shared.item_long_name?.toLowerCase().includes(searchLower) ||
      shared.shared_by_name?.toLowerCase().includes(searchLower) ||
      shared.mgrp_code?.toLowerCase().includes(searchLower) ||
      (shared.local_item_id && shared.local_item_id.toString().includes(searchLower)) ||
      (shared.sap_item_id && shared.sap_item_id.toString().includes(searchLower))
    );
  });

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = userSearchTerm.toLowerCase();
    return (
      emp.emp_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.role?.toLowerCase().includes(searchLower)
    );
  });

  const currentData = activeTab === "favorites" ? filteredFavorites : filteredSharedMaterials;
  const currentDataLength = activeTab === "favorites" ? favorites.length : sharedMaterials.length;
  const { sortedData: sortedCurrentData, requestSort, getSortIcon } = useSortableData(currentData);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        {/* Header */}
        <div className="mb-3">

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Favorites</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentDataLength} {currentDataLength === 1 ? "item" : "items"} {activeTab === "favorites" ? "saved" : "shared with you"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-3 border-b border-gray-200">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`py-2 px-1 border-b-2 font-medium text-xs ${activeTab === "favorites"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Favorites ({favorites.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`py-2 px-1 border-b-2 font-medium text-xs ${activeTab === "shared"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Shared with me ({sharedMaterials.length})
              </div>
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "favorites" ? "favorites" : "shared materials"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading...</span>
          </div>
        ) : currentData.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('item_desc')}>Item Description {getSortIcon('item_desc')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('item_long_name')}>Long Name {getSortIcon('item_long_name')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('local_item_id')}>Local Item ID {getSortIcon('local_item_id')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('sap_item_id')}>SAP Item ID {getSortIcon('sap_item_id')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('mgrp_code')}>Material Group {getSortIcon('mgrp_code')}</th>
                    {activeTab === "shared" && (
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('shared_by_name')}>Shared By {getSortIcon('shared_by_name')}</th>
                    )}
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase cursor-pointer select-none" onClick={() => requestSort('created')}>Date {getSortIcon('created')}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCurrentData.map((item, index) => {
                    const itemName = item.item_desc || "Material";
                    const itemLongName = item.item_long_name;
                    const mgrpCode = item.mgrp_code;
                    const isShared = activeTab === "shared";

                    return (
                      <tr
                        key={item.id}
                        className={`transition-all duration-200 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          } hover:bg-blue-50`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">

                            <span className="text-xs font-medium text-gray-900">{itemName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs text-gray-700">{itemLongName || "-"}</span>
                        </td>
                        <td className="px-3 py-2">
                          {item.local_item_id ? (
                            <div className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 font-mono rounded-md text-xs shadow-sm">
                              {item.local_item_id}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {item.sap_item_id ? (
                            <div className="inline-block px-1.5 py-0.5 bg-green-100 text-green-800 font-mono rounded-md text-xs shadow-sm">
                              {item.sap_item_id}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs text-gray-700">
                            {mgrpCode ? (
                              <div>
                                <div className="font-medium">{mgrpCode}</div>
                                {item.mgrp_shortname && (
                                  <div className="text-xs text-gray-500">{item.mgrp_shortname}</div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </div>
                        </td>
                        {isShared && (
                          <td className="px-3 py-2">
                            {item.shared_by_name ? (
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-blue-600" />
                                <div>
                                  <div className="text-xs font-medium text-gray-900">{item.shared_by_name}</div>
                                  {item.shared_by_email && (
                                    <div className="text-xs text-gray-500">{item.shared_by_email}</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-3 py-2">
                          {item.created ? (
                            <span className="text-xs text-gray-600">
                              {new Date(item.created).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />

                            </button>
                            {!isShared && (
                              <>
                                <button
                                  onClick={() => handleShare(item)}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
                                  title="Share material"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveFavorite(item.id, item.local_item_id, item.sap_item_id)}
                                  disabled={removingId === item.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-xs font-medium disabled:opacity-50"
                                  title="Remove from favorites"
                                >
                                  {removingId === item.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : searchTerm ? (
          <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
            <Search className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No {activeTab === "favorites" ? "favorites" : "shared materials"} found matching &quot;{searchTerm}&quot;</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-blue-600 hover:text-blue-700 text-xs"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="text-center py-6 bg-white rounded-lg border border-gray-200">
            <Star className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm font-medium">
              {activeTab === "favorites" ? "No favorites yet" : "No shared materials yet"}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {activeTab === "favorites"
                ? "Start adding materials to your favorites to see them here"
                : "Materials shared with you will appear here"}
            </p>
            {activeTab === "favorites" && (
              <button
                onClick={() => router.push("/search")}
                className="mt-3 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Materials
              </button>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && sharingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-3 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  Share Material
                </h2>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSharingItem(null);
                    setSelectedUsers([]);
                    setUserSearchTerm("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>{sharingItem.item_desc}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    Select users to share this material with
                  </p>
                </div>

                {/* User Search */}
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1.5">
                      Selected ({selectedUsers.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUsers.map((user) => (
                        <span
                          key={user.emp_id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {user.emp_name}
                          <button
                            onClick={() => toggleUserSelection(user)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users List */}
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500">
                      No users found
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredEmployees.map((employee) => {
                        const isSelected = selectedUsers.find(u => u.emp_id === employee.emp_id);
                        return (
                          <div
                            key={employee.emp_id}
                            onClick={() => toggleUserSelection(employee)}
                            className={`p-2 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-xs text-gray-900">{employee.emp_name}</p>
                                <p className="text-xs text-gray-500">{employee.email}</p>
                                {employee.role && (
                                  <p className="text-xs text-gray-400 mt-0.5">{employee.role}</p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="text-blue-600">
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 p-3 border-t">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSharingItem(null);
                    setSelectedUsers([]);
                    setUserSearchTerm("");
                  }}
                  disabled={sharing}
                  className="px-3 py-1.5 text-sm border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareSubmit}
                  disabled={sharing || selectedUsers.length === 0}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sharing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Share with {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Item Details Modal */}
      {viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-3 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-800">
                Material Details
              </h2>
              <button
                onClick={() => {
                  setViewingItem(null);
                  setItemDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading details...</span>
                </div>
              ) : itemDetails ? (
                <div className="space-y-3">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Item Description</label>
                        <div className="bg-gray-50 p-2 rounded-md text-xs">{itemDetails.item?.item_desc || itemDetails.item?.short_name || viewingItem.item_desc}</div>
                      </div>
                      {itemDetails.item?.sap_id && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">SAP ID</label>
                          <div className="bg-gray-50 p-2 rounded-md text-xs font-mono">{itemDetails.item.sap_id}</div>
                        </div>
                      )}
                      {itemDetails.item?.local_item_id && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Local Item ID</label>
                          <div className="bg-gray-50 p-2 rounded-md text-xs font-mono">{itemDetails.item.local_item_id}</div>
                        </div>
                      )}
                      {itemDetails.item?.mat_type_desc && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Material Type</label>
                          <div className="bg-gray-50 p-2 rounded-md text-xs">{itemDetails.item.mat_type_desc}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {itemDetails.item?.notes && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Description</h3>
                      <div className="bg-gray-50 p-2 rounded-md text-xs">{itemDetails.item.notes}</div>
                    </div>
                  )}

                  {/* Attributes */}
                  {itemDetails.item?.attributes && Object.keys(itemDetails.item.attributes).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Attributes</h3>
                      <div className="space-y-2">
                        {Object.entries(itemDetails.item.attributes).map(([key, value]) => {
                          const attrDef = itemDetails.attributes?.find(attr => attr.attrib_name === key);
                          const uom = attrDef?.unit;
                          return (
                            <div key={key} className="border rounded-lg p-2 bg-gray-50">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {key}
                                {uom && <span className="ml-1.5 text-xs text-gray-500">({uom})</span>}
                              </label>
                              <div className="text-xs text-gray-700 font-medium bg-white px-2 py-1 border border-gray-200 rounded-lg">
                                {value || "-"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">Failed to load item details</p>
                  <button
                    onClick={() => handleViewDetails(viewingItem)}
                    className="mt-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
