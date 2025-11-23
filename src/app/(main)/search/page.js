"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createRequest, fetchProjects, fetchFavorites, addFavorite, removeFavorite } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SearchableDropdown from "@/components/SearchableDropdown";
import { Loader2, Star } from "lucide-react";

export default function MaterialSearchPage() {
  // Section 1 states (existing)
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const router = useRouter();

  // Section 2 states
  const [searchTab, setSearchTab] = useState("freeText"); // "freeText", "drillDown", "materialGroup"

  // Search type filter - maps to MatGroup.search_type
  const [searchType, setSearchType] = useState(""); // "service", "Materials", "spares", or "" for all

  // Free text search states
  const [freeTextQuery, setFreeTextQuery] = useState("");
  const [freeTextResults, setFreeTextResults] = useState([]);
  const [freeTextLoading, setFreeTextLoading] = useState(false);
  const [selectedFreeTextGroup, setSelectedFreeTextGroup] = useState("");

  // Drill down search states
  const [superGroups, setSuperGroups] = useState([]);
  const [selectedSuperGroup, setSelectedSuperGroup] = useState("");
  const [materialGroupsBySuper, setMaterialGroupsBySuper] = useState([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [superGroupsLoading, setSuperGroupsLoading] = useState(false);
  const [selectedDrillDownGroup, setSelectedDrillDownGroup] = useState("");
  const [materialGroupSearchTerm, setMaterialGroupSearchTerm] = useState("");

  // Material group search states
  const [materialGroupCode, setMaterialGroupCode] = useState("");
  const [similarMaterialGroups, setSimilarMaterialGroups] = useState([]);
  const [loadingSimilarGroups, setLoadingSimilarGroups] = useState(false);
  
  // Favorites state
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [favoriteGroupsData, setFavoriteGroupsData] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoriteCodes, setFavoriteCodes] = useState(new Set()); // Track which groups are favorited

  // Request modal states
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    project_code: "",
    notes: "",
    type: "material group"
  });
  const [projects, setProjects] = useState([]);
  const [savingRequest, setSavingRequest] = useState(false);
  const [requestError, setRequestError] = useState(null);

  // backend results + loading (you already added these — keep them)
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  // === REPLACED: remove filteredGroups computed from undefined materialGroups ===
  // const filteredGroups = materialGroups.filter(...)
  // Instead use the backend results directly:
  const displayGroups = results;

  const handleGroupSelect = (code) => setSelectedGroup(code);
  const handleSelectClick = () => {
    if (selectedGroup) router.push(`/materials/${selectedGroup}`);
  };

  // Load super groups for drill down search
  useEffect(() => {
    const fetchSuperGroups = async () => {
      setSuperGroupsLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/super-groups/`);
        if (res.ok) {
          const data = await res.json();
          console.log("Super groups fetched:", data);
          setSuperGroups(data || []);
        } else {
          console.error("Failed to fetch super groups:", res.status, res.statusText);
          setSuperGroups([]);
        }
      } catch (err) {
        console.error("Error fetching super groups:", err);
        setSuperGroups([]);
      } finally {
        setSuperGroupsLoading(false);
      }
    };
    if (searchTab === "drillDown") {
      fetchSuperGroups();
    } else {
      // Reset when switching away from drill down
      setSuperGroups([]);
      setSelectedSuperGroup("");
      setMaterialGroupsBySuper([]);
      setSelectedDrillDownGroup("");
    }
  }, [searchTab]);

  // Load material groups when super group is selected
  useEffect(() => {
    const fetchMaterialGroups = async () => {
      if (!selectedSuperGroup) {
        setMaterialGroupsBySuper([]);
        setMaterialGroupSearchTerm(""); // Reset search when no super group selected
        return;
      }
      setDrillDownLoading(true);
      try {
        const url = searchType 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/super-groups/${selectedSuperGroup}/material-groups/?search_type=${searchType}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/super-groups/${selectedSuperGroup}/material-groups/`;
      const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setMaterialGroupsBySuper(data);
          setMaterialGroupSearchTerm(""); // Reset search when new groups are loaded
        } else {
          setMaterialGroupsBySuper([]);
        }
      } catch (err) {
        console.error("Error fetching material groups:", err);
        setMaterialGroupsBySuper([]);
      } finally {
        setDrillDownLoading(false);
      }
    };
    if (searchTab === "drillDown" && selectedSuperGroup) {
      fetchMaterialGroups();
    }
  }, [selectedSuperGroup, searchTab, searchType]);

  // Filter material groups based on search term
  const filteredMaterialGroups = materialGroupsBySuper.filter((group) => {
    if (!materialGroupSearchTerm.trim()) return true;
    const searchLower = materialGroupSearchTerm.toLowerCase();
    return (
      (group.mgrp_code && group.mgrp_code.toLowerCase().includes(searchLower)) ||
      (group.mgrp_shortname && group.mgrp_shortname.toLowerCase().includes(searchLower)) ||
      (group.mgrp_longname && group.mgrp_longname.toLowerCase().includes(searchLower))
    );
  });

  // Free text search handler
  const handleFreeTextSearch = async () => {
    if (!freeTextQuery.trim()) return;
    setFreeTextLoading(true);
    try {
      const body = { query: freeTextQuery };
      if (searchType) {
        body.search_type = searchType;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/search/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        // Deduplicate by mgrp_code - keep only the first occurrence (highest rank)
        const seen = new Set();
        const uniqueResults = data.filter((group) => {
          const code = group.mgrp_code ?? group.code;
          if (seen.has(code)) {
            return false;
          }
          seen.add(code);
          return true;
        });
        setFreeTextResults(uniqueResults);
      } else {
        setFreeTextResults([]);
      }
    } catch (err) {
      console.error("Free text search failed:", err);
      setFreeTextResults([]);
    } finally {
      setFreeTextLoading(false);
    }
  };

  // Handle free text group select
  const handleFreeTextSelect = () => {
    if (selectedFreeTextGroup) {
      router.push(`/materials/${selectedFreeTextGroup}`);
    }
  };

  // Handle drill down group select
  const handleDrillDownSelect = () => {
    if (selectedDrillDownGroup) {
      router.push(`/materials/${selectedDrillDownGroup}`);
    }
  };

  // Handle material group code search (case-insensitive)
  const handleMaterialGroupSearch = (code = null) => {
    const searchCode = code || materialGroupCode;
    if (searchCode && searchCode.trim()) {
      // Normalize to uppercase for consistency (backend handles case-insensitive search)
      const normalizedCode = searchCode.trim().toUpperCase();
      router.push(`/materials/${normalizedCode}`);
    }
  };

  // Fetch similar material groups as user types
  useEffect(() => {
    const fetchSimilarGroups = async () => {
      if (!materialGroupCode.trim() || materialGroupCode.trim().length < 2) {
        setSimilarMaterialGroups([]);
        return;
      }

      setLoadingSimilarGroups(true);
      try {
        const body = { query: materialGroupCode };
        if (searchType) {
          body.search_type = searchType;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/search/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          const data = await res.json();
          // Deduplicate and limit to top 5 results
          const seen = new Set();
          const uniqueResults = data
            .filter((group) => {
              const code = group.mgrp_code ?? group.code;
              if (seen.has(code)) {
                return false;
              }
              seen.add(code);
              return true;
            })
            .slice(0, 5);
          setSimilarMaterialGroups(uniqueResults);
        } else {
          setSimilarMaterialGroups([]);
        }
      } catch (err) {
        console.error("Error fetching similar groups:", err);
        setSimilarMaterialGroups([]);
      } finally {
        setLoadingSimilarGroups(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSimilarGroups();
    }, 300); // Debounce for 300ms

    return () => clearTimeout(debounceTimer);
  }, [materialGroupCode]);

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

  // Load favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      if (token) {
        try {
          const favoritesData = await fetchFavorites(token);
          // Extract mgrp_code from favorites
          const codes = favoritesData.map(fav => fav.mgrp_code);
          setFavorites(codes);
          setFavoriteCodes(new Set(codes));
          setFavoriteGroupsData(favoritesData);
        } catch (err) {
          console.error("Error loading favorites:", err);
          // Fallback to localStorage if API fails
          const savedFavorites = JSON.parse(localStorage.getItem('materialFavorites') || '[]');
          setFavorites(savedFavorites);
          setFavoriteCodes(new Set(savedFavorites));
        }
      } else {
        // Fallback to localStorage if no token
        const savedFavorites = JSON.parse(localStorage.getItem('materialFavorites') || '[]');
        setFavorites(savedFavorites);
        setFavoriteCodes(new Set(savedFavorites));
      }
    };
    loadFavorites();
  }, [token]);

  // Load favorites when modal opens
  useEffect(() => {
    const loadFavoritesForModal = async () => {
      if (isFavoritesModalOpen && token) {
        setLoadingFavorites(true);
        try {
          const favoritesData = await fetchFavorites(token);
          setFavoriteGroupsData(favoritesData);
          const codes = favoritesData.map(fav => fav.mgrp_code);
          setFavorites(codes);
          setFavoriteCodes(new Set(codes));
        } catch (err) {
          console.error("Error loading favorites:", err);
        } finally {
          setLoadingFavorites(false);
        }
      }
    };
    loadFavoritesForModal();
  }, [isFavoritesModalOpen, token]);

  // Toggle favorite function
  const handleToggleFavorite = async (mgrpCode, e) => {
    e?.stopPropagation(); // Prevent navigation when clicking star
    if (!token) return;
    
    const isFavorited = favoriteCodes.has(mgrpCode);
    
    try {
      if (isFavorited) {
        await removeFavorite(token, mgrpCode);
        setFavoriteCodes(prev => {
          const newSet = new Set(prev);
          newSet.delete(mgrpCode);
          return newSet;
        });
        setFavorites(prev => prev.filter(code => code !== mgrpCode));
        setFavoriteGroupsData(prev => prev.filter(fav => fav.mgrp_code !== mgrpCode));
      } else {
        await addFavorite(token, mgrpCode);
        setFavoriteCodes(prev => new Set(prev).add(mgrpCode));
        setFavorites(prev => [...prev, mgrpCode]);
        // Optionally fetch the full group data
        try {
          const favoritesData = await fetchFavorites(token);
          setFavoriteGroupsData(favoritesData);
        } catch (err) {
          console.error("Error refreshing favorites:", err);
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // Load favorite material groups data when showFavorites is true
  useEffect(() => {
    const loadFavoriteGroups = async () => {
      if (showFavorites && token && favorites.length > 0) {
        setLoadingFavorites(true);
        try {
          // Fetch favorites from backend
          const favoritesData = await fetchFavorites(token);
          setFavoriteGroupsData(favoritesData);
          // Update favorites list with codes
          const codes = favoritesData.map(fav => fav.mgrp_code);
          setFavorites(codes);
          setFavoriteCodes(new Set(codes));
        } catch (err) {
          console.error("Error loading favorites:", err);
          // Fallback: try to load from individual API calls
          if (favorites.length > 0) {
            try {
              const groupsData = await Promise.all(
                favorites.map(async (code) => {
                  try {
                    const res = await fetch(
                      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/by-code/${code}/`
                    );
                    if (res.ok) {
                      const data = await res.json();
                      return { mgrp_code: code, ...data.group };
                    }
                    return null;
                  } catch (err) {
                    console.error(`Error loading favorite ${code}:`, err);
                    return null;
                  }
                })
              );
              setFavoriteGroupsData(groupsData.filter(g => g !== null));
            } catch (err2) {
              console.error("Error loading favorites from individual calls:", err2);
            }
          }
        } finally {
          setLoadingFavorites(false);
        }
      } else if (showFavorites && favorites.length > 0) {
        // Fallback to localStorage-based loading
        setLoadingFavorites(true);
        try {
          const groupsData = await Promise.all(
            favorites.map(async (code) => {
              try {
                const res = await fetch(
                  `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/matgroups/by-code/${code}/`
                );
                if (res.ok) {
                  const data = await res.json();
                  return { mgrp_code: code, ...data.group };
                }
                return null;
              } catch (err) {
                console.error(`Error loading favorite ${code}:`, err);
                return null;
              }
            })
          );
          setFavoriteGroupsData(groupsData.filter(g => g !== null));
        } catch (err) {
          console.error("Error loading favorites:", err);
        } finally {
          setLoadingFavorites(false);
        }
      }
    };
    loadFavoriteGroups();
  }, [showFavorites, token]);

  // Handle Material Group Not Found button click
  const handleMaterialGroupNotFound = () => {
    setRequestFormData({
      project_code: "",
      notes: "",
      type: "material group"
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
        type: "material group"
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
      type: "material group"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full bg-white shadow-md overflow-hidden">
        {/* Merged Section */}
        <div className="flex flex-col md:flex-row p-6 w-full">
          {/* Left Section - Search */}
          <div className="flex flex-col w-full md:w-1/2 pr-0 md:pr-6 mb-6 md:mb-0">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Search Criteria</h2>
            <div className="flex gap-4 justify-around">

              <div className="mb-6">
                <div className="block text-sm font-medium text-gray-700 mb-2">Search Type</div>
                <div className="space-x-6">
                  <div className="mb-2">

                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="searchType"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={searchType === "Materials"}
                        onChange={() => setSearchType("Materials")}
                      />
                      <span className="text-gray-700">Materials</span>
                    </label>
                  </div>
                  <div className="mb-2">

                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="searchType"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={searchType === "service"}
                        onChange={() => setSearchType("service")}
                      />
                      <span className="text-gray-700">Service</span>
                    </label>
                  </div>
                  <div className="mb-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="searchType"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={searchType === "spares"}
                        onChange={() => setSearchType("spares")}
                      />
                      <span className="text-gray-700">Spares</span>
                    </label>
                  </div>
                  <div className="mb-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="searchType"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={searchType === ""}
                        onChange={() => setSearchType("")}
                      />
                      <span className="text-gray-700">All</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Radio buttons for tabs */}
              <div className="mb-6">
                <div className="block text-sm font-medium text-gray-700 mb-2">Search Method</div>
                <div className="space-x-6 ">
                  <div className="mb-2">

                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="searchTab"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={searchTab === "freeText"}
                        onChange={() => {
                          setSearchTab("freeText");
                          setSelectedFreeTextGroup("");
                          setFreeTextResults([]);
                        }}
                      />
                      <span className="text-gray-700">Free Text Search</span>
                    </label>
                  </div>
                  <div className="mb-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="searchTab"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={searchTab === "drillDown"}
                        onChange={() => {
                          setSearchTab("drillDown");
                          setSelectedSuperGroup("");
                          setSelectedDrillDownGroup("");
                          setMaterialGroupsBySuper([]);
                          setMaterialGroupSearchTerm("");
                        }}
                      />
                      <span className="text-gray-700">Drill Down Search</span>
                    </label>
                  </div>
                  <div className="mb-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="searchTab"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        checked={searchTab === "materialGroup"}
                        onChange={() => {
                          setSearchTab("materialGroup");
                          setMaterialGroupCode("");
                        }}
                      />
                      <span className="text-gray-700">Material Group</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content - Description Area */}
            <div className="mb-4">
              {searchTab === "freeText" && (
                <>
                  <label htmlFor="free-text-description" className="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
                  <textarea
                    id="free-text-description"
                    placeholder="Enter search query (searches in short name, long name, search text, etc.)..."
                    value={freeTextQuery}
                    onChange={(e) => setFreeTextQuery(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex space-x-4 mt-4">
                    <button
                      onClick={handleFreeTextSearch}
                      disabled={freeTextLoading || !freeTextQuery.trim()}
                      className={`py-2 px-6 rounded-md shadow focus:outline-none transition-colors ${freeTextLoading || !freeTextQuery.trim()
                        ? "bg-blue-300 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      {freeTextLoading ? "Searching..." : "Search"}
                    </button>
                    <button
                      onClick={() => {
                        setFreeTextQuery("");
                        setFreeTextResults([]);
                        setSelectedFreeTextGroup("");
                      }}
                      className="bg-gray-200 text-gray-700 py-2 px-6 rounded-md shadow hover:bg-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}

              {searchTab === "drillDown" && (
                <div className="flex flex-col space-y-4">
                  <div>
                    <div className="block text-sm font-medium text-gray-700 mb-2">Super Groups</div>
                    <div className="border border-gray-200 rounded-md h-48 overflow-y-auto shadow-inner">
                      {superGroupsLoading ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2">Loading super groups...</p>
                        </div>
                      ) : superGroups.length > 0 ? (
                        superGroups.map((superGroup) => (
                          <div
                            key={superGroup.super_code}
                            onClick={() => setSelectedSuperGroup(superGroup.super_code)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedSuperGroup(superGroup.super_code);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            className={`p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${selectedSuperGroup === superGroup.super_code ? "bg-blue-100 border-l-4 border-l-blue-600" : ""
                              }`}
                          >
                            <div className="font-semibold text-blue-700">{superGroup.super_code}</div>
                            <div className="text-sm text-gray-600">{superGroup.super_name || superGroup.short_name}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {superGroupsLoading ? "Loading super groups..." : "No super groups found."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {searchTab === "materialGroup" && (
                <>
                  <label htmlFor="material-group-code" className="block text-sm font-medium text-gray-700 mb-2">Material Group Code</label>
                  <div className="relative">
                    <input
                      id="material-group-code"
                      type="text"
                      placeholder="Enter material group code..."
                      value={materialGroupCode}
                      onChange={(e) => setMaterialGroupCode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleMaterialGroupSearch();
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {/* Similar Groups Helper */}
                    {similarMaterialGroups.length > 0 && materialGroupCode.trim().length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">Similar Material Groups</div>
                        {similarMaterialGroups.map((group) => {
                          const code = group.mgrp_code ?? group.code;
                          const name = group.notes || group.mgrp_shortname || group.mgrp_longname || "";
                          return (
                            <div
                              key={code}
                              className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex justify-between items-center"
                            >
                              <div
                                onClick={() => {
                                  setMaterialGroupCode(code);
                                  setSimilarMaterialGroups([]);
                                  // Use the selected code directly instead of waiting for state update
                                  handleMaterialGroupSearch(code);
                                }}
                                className="flex-1"
                              >
                                <div className="font-semibold text-sm text-blue-700">{code}</div>
                                {name && <div className="text-xs text-gray-600">{name}</div>}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(code, e);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
                                title={favoriteCodes.has(code) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star
                                  className={`h-4 w-4 ${favoriteCodes.has(code) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-4 mt-4">
                    <button
                      onClick={handleMaterialGroupSearch}
                      disabled={!materialGroupCode.trim()}
                      className={`py-2 px-6 rounded-md shadow focus:outline-none transition-colors ${!materialGroupCode.trim()
                        ? "bg-blue-300 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      Search
                    </button>
                    <button
                      onClick={() => {
                        setMaterialGroupCode("");
                        setSimilarMaterialGroups([]);
                      }}
                      className="bg-gray-200 text-gray-700 py-2 px-6 rounded-md shadow hover:bg-gray-300"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Recent Searches */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-gray-200">Electrical wires</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-gray-200">Safety equipment</span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs cursor-pointer hover:bg-gray-200">Hand tools</span>
              </div>
            </div>
          </div>

          {/* Right Section - Results */}
          <div className="flex flex-col w-full md:w-1/2">
            {searchTab === "freeText" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Material Groups</h2>
                  <span className="text-sm text-gray-500">
                    {freeTextLoading ? "Searching..." : `${freeTextResults.length} results`}
                  </span>
                </div>

                <div className="border border-gray-200 rounded-md h-72 overflow-y-auto shadow-inner">
                  {freeTextLoading ? (
                    <div className="p-4 text-center text-gray-500">Searching...</div>
                  ) : freeTextResults.length > 0 ? (
                    freeTextResults.map((group) => {
                      const code = group.mgrp_code ?? group.code;
                      const name = group.notes;
                      const rank = group.rank ?? "";
                      return (
                        <div
                          key={code}
                          onClick={() => router.push(`/materials/${code}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/materials/${code}`);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-semibold text-blue-700">{code}</div>
                              <div className="text-sm text-gray-600">{name}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-xs bg-green-400 text-white p-2 font-mono rounded-md">
                                Rank: {rank}
                              </div>
                              <button
                                onClick={(e) => handleToggleFavorite(code, e)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                title={favoriteCodes.has(code) ? "Remove from favorites" : "Add to favorites"}
                              >
                                <Star
                                  className={`h-5 w-5 ${favoriteCodes.has(code) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {freeTextQuery.trim()
                        ? "No material groups found. Try a different search term."
                        : "Enter a search query and click Search."}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleMaterialGroupNotFound}
                    className="bg-red-600 text-white py-2 px-6 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex-1"
                  >
                    Material Group Not Found
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md transition-colors">Create New Request</button>
                    <button 
                      onClick={() => setIsFavoritesModalOpen(true)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md transition-colors"
                    >
                      View Favorites
                    </button>
                  </div>
                </div>
              </>
            )}

            {searchTab === "drillDown" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Material Groups</h2>
                  <span className="text-sm text-gray-500">
                    {drillDownLoading ? "Loading..." : materialGroupSearchTerm.trim()
                      ? `${filteredMaterialGroups.length} of ${materialGroupsBySuper.length} results`
                      : `${materialGroupsBySuper.length} results`}
                  </span>
                </div>

                {/* Search input for material groups */}
                {materialGroupsBySuper.length > 0 && !drillDownLoading && (
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search material groups by code or name..."
                      value={materialGroupSearchTerm}
                      onChange={(e) => setMaterialGroupSearchTerm(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="border border-gray-200 rounded-md h-72 overflow-y-auto shadow-inner">
                  {drillDownLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : filteredMaterialGroups.length > 0 ? (
                    filteredMaterialGroups.map((group) => (
                      <div
                        key={group.mgrp_code}
                        onClick={() => router.push(`/materials/${group.mgrp_code}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            router.push(`/materials/${group.mgrp_code}`);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-semibold text-blue-700">{group.mgrp_code}</div>
                            <div className="text-sm text-gray-600">{group.mgrp_longname || group.mgrp_shortname}</div>
                          </div>
                          <button
                            onClick={(e) => handleToggleFavorite(group.mgrp_code, e)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title={favoriteCodes.has(group.mgrp_code) ? "Remove from favorites" : "Add to favorites"}
                          >
                            <Star
                              className={`h-5 w-5 ${favoriteCodes.has(group.mgrp_code) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                            />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {selectedSuperGroup
                        ? materialGroupSearchTerm.trim()
                          ? `No material groups found matching "${materialGroupSearchTerm}".`
                          : "No material groups found for this super group."
                        : "Select a super group from the left to view material groups."}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleMaterialGroupNotFound}
                    className="bg-red-600 text-white py-2 px-6 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex-1"
                  >
                    Material Group Not Found
                  </button>

                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md transition-colors">Create New Request</button>
                    <button 
                      onClick={() => setIsFavoritesModalOpen(true)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md transition-colors"
                    >
                      View Favorites
                    </button>
                  </div>
                </div>
              </>
            )}

            {searchTab === "materialGroup" && (
              <>
                {showFavorites ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-700">My Favorites</h2>
                      <span className="text-sm text-gray-500">
                        {favoriteGroupsData.length} {favoriteGroupsData.length === 1 ? 'favorite' : 'favorites'}
                      </span>
                    </div>
                    <div className="border border-gray-200 rounded-md h-72 overflow-y-auto shadow-inner">
                      {loadingFavorites ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2">Loading favorites...</p>
                        </div>
                      ) : favoriteGroupsData.length > 0 ? (
                        favoriteGroupsData.map((group) => {
                          const code = group.mgrp_code || group.code;
                          const name = group.mgrp_longname || group.mgrp_shortname || "";
                          return (
                            <div
                              key={code}
                              onClick={() => router.push(`/materials/${code}`)}
                              className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <div className="font-semibold text-blue-700">{code}</div>
                              <div className="text-sm text-gray-600">{name}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {favoriteGroupsData.length === 0
                            ? "No favorites yet. Add materials to your favorites list to see them here."
                            : "Error loading favorites. Please try again."}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="border border-gray-200 rounded-md p-6 h-72 flex flex-col items-center justify-center text-center">
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                      Enter Material Group Code
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter a material group code in the search field and click Search to navigate.
                    </p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md transition-colors">Create New Request</button>
                    <button 
                      onClick={() => setIsFavoritesModalOpen(true)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md transition-colors"
                    >
                      View Favorites
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-100 p-4 text-center text-xs text-gray-500 w-full">
          © 2023 Company Name. All rights reserved. | v2.4.1
        </div>
      </div>

      {/* Favorites Modal */}
      {isFavoritesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                My Favorites
              </h2>
              <button 
                onClick={() => setIsFavoritesModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {loadingFavorites ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading favorites...</span>
                </div>
              ) : favoriteGroupsData.length > 0 ? (
                <div className="space-y-3">
                  {favoriteGroupsData.map((fav) => {
                    const code = fav.mgrp_code;
                    const name = fav.mgrp_longname || fav.mgrp_shortname || '';
                    
                    return (
                      <div
                        key={fav.id || code}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors flex justify-between items-center"
                      >
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            router.push(`/materials/${code}`);
                            setIsFavoritesModalOpen(false);
                          }}
                        >
                          <div className="font-semibold text-blue-700">{code}</div>
                          {name && <div className="text-sm text-gray-600 mt-1">{name}</div>}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              router.push(`/materials/${code}`);
                              setIsFavoritesModalOpen(false);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            View
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await removeFavorite(token, code);
                                // Refresh favorites list
                                const favoritesData = await fetchFavorites(token);
                                setFavoriteGroupsData(favoritesData);
                                const codes = favoritesData.map(f => f.mgrp_code);
                                setFavorites(codes);
                                setFavoriteCodes(new Set(codes));
                              } catch (err) {
                                console.error("Error removing favorite:", err);
                              }
                            }}
                            className="p-2 hover:bg-red-50 rounded transition-colors"
                            title="Remove from favorites"
                          >
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No favorites yet</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Click the star icon on any material group to add it to your favorites
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setIsFavoritesModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Create Request - Material Group Not Found
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

              <input type="hidden" name="type" value="material group" />
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
