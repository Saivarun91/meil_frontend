"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchRequests, fetchChatMessages, addChatMessage, updateRequest, assignSapItem, assignMaterialGroup, fetchMaterialGroups, fetchItemMasters } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SearchableDropdown from "@/components/SearchableDropdown";

export default function RequestDetailPage() {
  const { id } = useParams();
  // console.log("id : ", id)
  const router = useRouter();
  const { token, user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [sapId, setSapId] = useState("");
  const [materialGroupCode, setMaterialGroupCode] = useState("");
  const [materialGroups, setMaterialGroups] = useState([]);
  const [items, setItems] = useState([]);
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // ?mode=edit if Edit clicked in list\
  // console.log("mode : ", mode)
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);


  const [isEditing, setIsEditing] = useState(false);
  const [editedRequest, setEditedRequest] = useState({
    description: "",
    priority: "High",
    status: "Open",
  });
  const canClose = user?.role === 'MDGT' 
    ? (request?.type === 'material' ? Boolean(request?.sap_item) : 
       request?.type === 'material group' ? Boolean(request?.material_group) : true)
    : true;


  useEffect(() => {
    const loadChat = async () => {
      if (token && id) {
        try {
          const data = await fetchChatMessages(token, id);
          setChatMessages(data);
        } catch (err) {
          console.error("Error loading chat:", err);
        }
      }
    };
    loadChat();
  }, [id, token]);

  // WebSocket connection for real-time chat updates
  useEffect(() => {
    if (!id || !token) return;

    let ws = null;
    let reconnectTimeout = null;
    let isManualClose = false;

    const connectWebSocket = () => {
      // Determine WebSocket URL based on API base URL
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const wsHost = apiUrl.replace(/^https?:\/\//, '');
      // Pass token as query parameter for authentication
      const wsUrl = `${wsProtocol}//${wsHost}/ws/chat/${id}/?token=${encodeURIComponent(token)}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WebSocket connected for request', id);
          // Clear any pending reconnect
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data);
            
            if (data.type === 'chat' && data.message) {
              // Add new message to chat
              setChatMessages(prev => {
                // Check if message already exists to avoid duplicates
                const messageExists = prev.some(msg => 
                  msg.message === data.message.message && 
                  msg.timestamp === data.message.timestamp
                );
                if (messageExists) {
                  console.log('⚠️ Duplicate message ignored');
                  return prev;
                }
                
                console.log('➕ Adding new message to chat');
                return [...prev, {
                  sender: data.message.sender,
                  message: data.message.message,
                  timestamp: data.message.timestamp,
                }];
              });
            } else if (data.type === 'system' && data.message === 'connected') {
              console.log('✅ WebSocket connection confirmed');
            }
          } catch (err) {
            console.error('❌ Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected for request', id, 'Code:', event.code);
          
          // Only reconnect if it wasn't a manual close and not a normal closure
          if (!isManualClose && event.code !== 1000) {
            console.log('🔄 Attempting to reconnect in 3 seconds...');
            reconnectTimeout = setTimeout(() => {
              if (id && token) {
                connectWebSocket();
              }
            }, 3000);
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        // Retry connection after delay
        reconnectTimeout = setTimeout(() => {
          if (id && token) {
            connectWebSocket();
          }
        }, 3000);
      }
    };

    // Initial connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      isManualClose = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [id, token]);


  
  useEffect(() => {
    if (request) {
      setEditedRequest({
        description: request.notes || "",
        priority: request.priority || "High",
        status: request.status || "Open",
      });
    }
  }, [request]);

  useEffect(() => {
    if (mode === "edit") {
      setIsEditing(true); // automatically go into edit mode
    }
  }, [mode]);

  const handleSave = async () => {
    if (!token) {
      setError("No authentication token found");
      return;
    }
    try {
      setSaving(true);
      setError(null);

      await updateRequest(token, id, {
        notes: editedRequest.description,
        request_status: editedRequest.priority,  // ✅ map Priority → request_status
        status: editedRequest.status,            // ✅ map Status → status
      });

      // Refresh request
      const data = await fetchRequests(token);
      const updated = data.find((r) => r.request_id == id);
      setRequest(updated);

      setIsEditing(false);
    } catch (err) {
      setError(
        "Failed to update request: " +
        (err.response?.data?.error || err.message)
      );
      console.error("Error updating request:", err);
    } finally {
      setSaving(false);
    }
  };


  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      await addChatMessage(token, id, message);
      setMessage(""); // clear input
      // Broadcast will arrive via WebSocket; no immediate refetch to avoid duplicates
    } catch (err) {
      console.error("Error sending chat:", err);
    }
  };

  const handleAssignSap = async () => {
    if (!sapId.trim()) return;
    
    // Check if request is closed
    if (request?.status?.toLowerCase() === 'closed') {
      window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'error', message: 'Cannot update SAP ID: Request is closed' } }));
      return;
    }
    
    try {
      await assignSapItem(token, id, sapId.trim());
      window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'success', message: `SAP Item ${sapId} assigned` } }));
      setSapId("");
      // refresh request header to reflect SAP item/status if needed
      const data = await fetchRequests(token);
      const updated = data.find((r) => r.request_id == id);
      setRequest(updated);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'error', message: err.response?.data?.error || 'Failed to assign SAP' } }));
    }
  };

  const handleAssignMaterialGroup = async () => {
    if (!materialGroupCode.trim()) return;
    
    // Check if request is closed
    if (request?.status?.toLowerCase() === 'closed') {
      window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'error', message: 'Cannot update Material Group: Request is closed' } }));
      return;
    }
    
    try {
      await assignMaterialGroup(token, id, materialGroupCode.trim());
      window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'success', message: `Material Group ${materialGroupCode} assigned` } }));
      setMaterialGroupCode("");
      // refresh request header to reflect material group/status if needed
      const data = await fetchRequests(token);
      const updated = data.find((r) => r.request_id == id);
      setRequest(updated);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('showToast', { detail: { type: 'error', message: err.response?.data?.error || 'Failed to assign Material Group' } }));
    }
  };

  // Load material groups when request type is "material group"
  useEffect(() => {
    const loadMaterialGroups = async () => {
      if (token && request?.type === "material group" && user?.role === 'MDGT') {
        try {
          const data = await fetchMaterialGroups(token);
          setMaterialGroups(data || []);
        } catch (err) {
          console.error("Error loading material groups:", err);
        }
      }
    };
    loadMaterialGroups();
  }, [token, request?.type, user?.role]);

  // Load items when request type is "material"
  useEffect(() => {
    const loadItems = async () => {
      if (token && request?.type === "material" && user?.role === 'MDGT') {
        try {
          const data = await fetchItemMasters(token);
          setItems(data || []);
        } catch (err) {
          console.error("Error loading items:", err);
        }
      }
    };
    loadItems();
  }, [token, request?.type, user?.role]);
  console.log("chatMessages : ", chatMessages)
  const getPriorityClasses = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  const getStatusClasses = (status) => {
    switch (status) {
      case "Open":
        return "bg-green-100 text-green-700";
      case "Closed":
        return "bg-gray-200 text-gray-700";
      case "Rejected":
        return "bg-red-200 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  useEffect(() => {
    const load = async () => {
      try {
        if (token) {
          const data = await fetchRequests(token);
          console.log("data : ", data)
          const found = data.find(r => r.request_id == id);
          console.log("found : ", found)
          setRequest(found);
        }
      } catch (err) {
        console.error("Error loading request:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  if (!request) return <p className="p-6 text-red-600">Request not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/requests")}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Requests
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {/* Combined Request Header and Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{request.title || "Request"}</h1>
                  <div className="flex items-center mt-2 flex-wrap gap-2">
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      {request.request_code || `REQ-${id}`}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      • {request.type || "Request"}
                    </span>
                    {request.type === 'material' && request.sap_item && (
                      <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium">
                        Item ID: {request.sap_item}
                      </span>
                    )}
                    {request.type === 'material group' && request.material_group && (
                      <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium">
                        Group: {request.material_group}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${getPriorityClasses(
                      request.request_status || "High"
                    )}`}
                  >
                    {request.request_status || "High"} Priority
                  </span>

                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusClasses(
                      request.status || "Open"
                    )}`}
                  >
                    {request.status || "Open"}
                  </span>

                  {/* <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button> */}
                </div>
              </div>

              {/* Combined Info Grid */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"> */}
              {/* <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Requester</p>
                  <p className="font-medium text-gray-800">{request.created_by || "AK San"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Assigned To</p>
                  <p className="font-medium text-gray-800">{request.assigned_to || "BK San"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Created Date</p>
                  <p className="font-medium text-gray-800">
                    {request.created ? new Date(request.created).toLocaleDateString('en-GB') : "18/12/2024"}
                  </p>
                </div> */}
              {/* <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">Last Updated</p>
                  <p className="font-medium text-gray-800">
                    {request.updated ? new Date(request.updated).toLocaleDateString('en-GB') : "19/12/2024"}
                  </p>
                </div> */}
              {/* </div> */}
              {/* MDGT: Assign SAP Item or Material Group based on type */}
              {user?.role === 'MDGT' && request?.type === 'material' && (
                <div className="mt-4 flex items-end gap-2">
                  <div className="flex-1">
                    <SearchableDropdown
                      options={items}
                      value={sapId}
                      onChange={(value) => setSapId(value || "")}
                      placeholder={request?.status?.toLowerCase() === 'closed' ? "Request is closed - cannot update" : "Select SAP Item ID"}
                      searchPlaceholder="Search items by SAP ID or description..."
                      disabled={request?.status?.toLowerCase() === 'closed'}
                      getOptionLabel={(option) => {
                        if (!option) return "";
                        if (option.sap_item_id) {
                          return `${option.sap_item_id} - ${option.item_desc || ''}`;
                        }
                        return option.item_desc || String(option);
                      }}
                      getOptionValue={(option) => {
                        if (!option) return "";
                        return option.sap_item_id ? String(option.sap_item_id) : "";
                      }}
                    />
                  </div>
                  <button
                    onClick={handleAssignSap}
                    disabled={!sapId.trim() || request?.status?.toLowerCase() === 'closed'}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title={request?.status?.toLowerCase() === 'closed' ? "Cannot update: Request is closed" : ""}
                  >
                    {request?.sap_item ? "Update SAP" : "Assign SAP"}
                  </button>
                </div>
              )}
              {user?.role === 'MDGT' && request?.type === 'material group' && (
                <div className="mt-4 flex items-end gap-2">
                  <div className="flex-1">
                    <SearchableDropdown
                      options={materialGroups}
                      value={materialGroupCode}
                      onChange={(value) => setMaterialGroupCode(value || "")}
                      placeholder={request?.status?.toLowerCase() === 'closed' ? "Request is closed - cannot update" : "Select Material Group"}
                      searchPlaceholder="Search material groups..."
                      disabled={request?.status?.toLowerCase() === 'closed'}
                      getOptionLabel={(option) => {
                        if (!option) return "";
                        if (option.mgrp_code) {
                          return `${option.mgrp_code} - ${option.mgrp_shortname || option.mgrp_longname || ''}`;
                        }
                        return option.mgrp_shortname || option.mgrp_longname || String(option);
                      }}
                      getOptionValue={(option) => {
                        if (!option) return "";
                        return option.mgrp_code || "";
                      }}
                    />
                  </div>
                  <button
                    onClick={handleAssignMaterialGroup}
                    disabled={!materialGroupCode.trim() || request?.status?.toLowerCase() === 'closed'}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title={request?.status?.toLowerCase() === 'closed' ? "Cannot update: Request is closed" : ""}
                  >
                    {request?.material_group ? "Update Material Group" : "Assign Material Group"}
                  </button>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {/* Description */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="font-semibold text-gray-700 mb-3">Description</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea
                          value={editedRequest.description}
                          onChange={(e) =>
                            setEditedRequest({ ...editedRequest, description: e.target.value })
                          }
                          className="w-full border rounded-lg p-2"
                        />

                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        {request.notes ||
                          "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."}
                      </p>
                    )}
                  </div>

                  {user?.role !== 'MDGT' && (
                    <>
                      {request?.type === 'material' && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500 uppercase font-medium mb-1">SAP Item</p>
                          <p className="font-medium text-gray-800">{request.sap_item || "-"}</p>
                        </div>
                      )}
                      {request?.type === 'material group' && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Material Group</p>
                          <p className="font-medium text-gray-800">{request.material_group || "-"}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Conversation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-700 mb-4">Conversation</h2>
              <div className="space-y-4 mb-6">
                {chatMessages.map((chat, index) => {
                  const isCurrentUser = chat.sender === user?.emp_name;

                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`p-4 rounded-lg max-w-md ${isCurrentUser ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">
                            {isCurrentUser ? "You" : chat.sender}
                          </span>
                        </div>
                        <p className="text-sm">{chat.message}</p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {new Date(chat.timestamp).toLocaleString()}
                      </span>
                    </div>
                  );
                })}

              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isEditing}   // 👈 disable while editing
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none
    focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="font-semibold text-gray-700 mb-4 pb-2 border-b">Request History</h2>
              <div className="space-y-4 text-sm text-gray-600 mb-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Created</p>
                    <p>
                      By {request.createdby || "Unknown"} on{" "}
                      {request.created ? new Date(request.created).toLocaleDateString("en-GB") : "-"}
                    </p>
                  </div>
                </div>

                {/* <div className="flex items-start"> */}
                  {/* <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div> */}
                  {/* <div>
                    <p className="font-medium text-gray-700">Assigned</p>
                    <p>
                      To {request.assigned_to || "Unassigned"} on{" "}
                      {request.assigned_date ? new Date(request.assigned_date).toLocaleDateString("en-GB") : "-"}
                    </p>
                  </div> */}
                {/* </div> */}

                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Updated</p>
                    <p>
                      By {request.updatedby || "System"} on{" "}
                      {request.updated ? new Date(request.updated).toLocaleDateString("en-GB") : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <select
                        value={editedRequest.priority}
                        onChange={(e) =>
                          setEditedRequest({ ...editedRequest, priority: e.target.value })
                        }
                        className="border rounded-lg p-2"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>

                      <select
                        value={editedRequest.status}
                        onChange={(e) =>
                          setEditedRequest({ ...editedRequest, status: e.target.value })
                        }
                        className="border rounded-lg p-2"
                      >
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        disabled={
                          user?.role === 'MDGT' && 
                          editedRequest.status === 'Closed' && 
                          ((request?.type === 'material' && !request?.sap_item) || 
                           (request?.type === 'material group' && !request?.material_group))
                        }
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="border px-4 py-2 rounded-lg hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p>
                      <span className="font-medium">Priority:</span>{" "}
                      {request.request_status || "High"}
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {request.status || "Open"}
                    </p>
                    {request?.type === 'material' && (
                      <p>
                        <span className="font-medium">SAP Item:</span>{" "}
                        {request.sap_item || "-"}
                      </p>
                    )}
                    {request?.type === 'material group' && (
                      <p>
                        <span className="font-medium">Material Group:</span>{" "}
                        {request.material_group || "-"}
                      </p>
                    )}
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}