"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, Search, Loader2, Trash2, Eye, Package } from "lucide-react";
import { fetchFavorites, removeFavorite } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import BackButton from "@/components/BackButton";

export default function FavoritesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState(null);

  // Load favorites on mount
  useEffect(() => {
    if (token) {
      loadFavorites();
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

  const handleRemoveFavorite = async (mgrpCode, favoriteId) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to remove this item from favorites?")) {
      return;
    }

    try {
      setRemovingId(favoriteId || mgrpCode);
      await removeFavorite(token, mgrpCode);
      // Reload favorites after removal
      await loadFavorites();
    } catch (err) {
      setError("Failed to remove favorite: " + (err.message || "Unknown error"));
      console.error("Error removing favorite:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleViewMaterial = (mgrpCode) => {
    router.push(`/materials/${mgrpCode}`);
  };

  // Filter favorites based on search term
  const filteredFavorites = favorites.filter((fav) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fav.mgrp_code?.toLowerCase().includes(searchLower) ||
      fav.mgrp_shortname?.toLowerCase().includes(searchLower) ||
      fav.mgrp_longname?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search favorites by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading favorites...</span>
          </div>
        ) : filteredFavorites.length > 0 ? (
          /* Favorites Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFavorites.map((fav) => {
              const code = fav.mgrp_code;
              const name = fav.mgrp_longname || fav.mgrp_shortname || "";
              const favoriteId = fav.id;

              return (
                <div
                  key={favoriteId || code}
                  className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-lg text-blue-700">{code}</h3>
                        {name && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{name}</p>
                        )}
                      </div>
                    </div>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewMaterial(code)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleRemoveFavorite(code, favoriteId)}
                      disabled={removingId === (favoriteId || code)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from favorites"
                    >
                      {removingId === (favoriteId || code) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {fav.created && (
                    <p className="text-xs text-gray-400 mt-3">
                      Added on {new Date(fav.created).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : searchTerm ? (
          /* No Results for Search */
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No favorites found matching &quot;{searchTerm}&quot;</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear search
            </button>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No favorites yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Start adding material groups to your favorites to see them here
            </p>
            <button
              onClick={() => router.push("/search")}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Materials
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


