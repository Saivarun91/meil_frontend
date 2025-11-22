"use client";
import { useState, useEffect } from "react";
import {
    Plus, Edit, Trash2, Search, FileText, Info, Loader2, Eye, MessageSquare, Save, X, Tag
} from "lucide-react";
import {
    fetchRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    assignSapItem,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";


export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [isSapModalOpen, setIsSapModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        project_code: "",
        notes: "",
    });
    const [chatData, setChatData] = useState({
        user_text: "",
        reply_text: "",
    });
    const [notesData, setNotesData] = useState({
        notes: "",
    });
    const [sapData, setSapData] = useState({
        sap_item: "",
    });
    const { role, token, loading: authLoading, checkPermission } = useAuth(); // include loading and checkPermission

    useEffect(() => {
        if (!authLoading && token) {
            loadRequests();
        }
    }, [authLoading, token]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            // const token = localStorage.getItem("token");
            console.log("token : ", token)
            setError(null);
            if (!token) {
                setError("No authentication token found");
                return;
            }

            const data = await fetchRequests(token);
            console.log("data : ", data)
            setRequests(data || []);
        } catch (err) {
            setError("Failed to load requests: " + (err.response?.data?.error || err.message));
            console.error("Error loading requests:", err);
        } finally {
            setLoading(false);
        }
    };
    console.log("formdata : ", formData)

    // Filter requests
    const filteredRequests = requests.filter(request => {
        // Convert user_text into a single string
        const userText = Array.isArray(request.user_text)
            ? request.user_text.map(c => 
                typeof c === "string" ? c : JSON.stringify(c)  // stringify objects
              ).join(" ")
            : (request.user_text || "");
    
        // Convert reply_text into a single string
        const replyText = Array.isArray(request.reply_text)
            ? request.reply_text.map(c => 
                typeof c === "string" ? c : JSON.stringify(c)
              ).join(" ")
            : (request.reply_text || "");
    
        const matchesSearch =
            String(userText).toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(replyText).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (request.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (request.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (request.sap_item || "").toLowerCase().includes(searchTerm.toLowerCase());
    
        return matchesSearch;
    });
    
    // Modal handlers
    const handleAddNew = () => {
        setEditingRequest(null);
        setFormData({
            project_code: "",
            notes: "",
        });
        setIsModalOpen(true);
        setError(null);
    };

    const handleEdit = (request) => {
        console.log("request : ", request.request_id)
        router.push(`/requests/${request.request_id}?mode=edit`);
      };
      

    const handleChatUpdate = (request) => {
        setEditingRequest(request);
        setChatData({
            user_text: request.user_text || "",
            reply_text: request.reply_text || "",
        });
        setIsChatModalOpen(true);
        setError(null);
    };

    const handleNotesUpdate = (request) => {
        setEditingRequest(request);
        setNotesData({
            notes: request.notes || "",
        });
        setIsNotesModalOpen(true);
        setError(null);
    };

    const handleSapAssign = (request) => {
        setEditingRequest(request);
        setSapData({
            sap_item: request.sap_item || "",
        });
        setIsSapModalOpen(true);
        setError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsChatModalOpen(false);
        setIsNotesModalOpen(false);
        setIsSapModalOpen(false);
        setEditingRequest(null);
        setError(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleChatInputChange = (e) => {
        const { name, value } = e.target;
        setChatData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNotesInputChange = (e) => {
        const { name, value } = e.target;
        setNotesData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSapInputChange = (e) => {
        const { name, value } = e.target;
        setSapData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveRequest = async () => {
        if (!formData.project_code) {
            setError("Please fill in required field: Project ID");
            return;
        }

        // Check permission before proceeding
        if (editingRequest) {
            if (!checkPermission("request", "update")) {
                setError("You don't have permission to update requests");
                return;
            }
        } else {
            if (!checkPermission("request", "create")) {
                setError("You don't have permission to create requests");
                return;
            }
        }

        try {
            setSaving(true);
            setError(null);
            if (!token) {
                setError("No authentication token found");
                return;
            }

            if (editingRequest) {
                await updateRequest(token, editingRequest.request_id, formData);
            } else {
                await createRequest(token, formData);
            }

            await loadRequests();
            handleCloseModal();
        } catch (err) {
            setError("Failed to save request: " + (err.response?.data?.error || err.message));
            console.error("Error saving request:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveChat = async () => {
        try {
            setSaving(true);
            setError(null);
            if (!token) {
                setError("No authentication token found");
                return;
            }

            await updateRequest(token, editingRequest.request_id, chatData);
            await loadRequests();
            handleCloseModal();
        } catch (err) {
            setError("Failed to update chat: " + (err.response?.data?.error || err.message));
            console.error("Error updating chat:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotes = async () => {
        try {
            setSaving(true);
            setError(null);
            if (!token) {
                setError("No authentication token found");
                return;
            }

            await updateRequest(token, editingRequest.request_id, notesData);
            await loadRequests();
            handleCloseModal();
        } catch (err) {
            setError("Failed to update notes: " + (err.response?.data?.error || err.message));
            console.error("Error updating notes:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSap = async () => {
        if (!sapData.sap_item) {
            setError("Please enter SAP Item ID");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            if (!token) {
                setError("No authentication token found");
                return;
            }

            await assignSapItem(token, editingRequest.request_id, sapData.sap_item);
            await loadRequests();
            handleCloseModal();
        } catch (err) {
            setError("Failed to assign SAP item: " + (err.response?.data?.error || err.message));
            console.error("Error assigning SAP item:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (request_id) => {
        if (window.confirm("Are you sure you want to delete this request? This action cannot be undone.")) {
            // Check permission before proceeding
            if (!checkPermission("request", "delete")) {
                setError("You don't have permission to delete requests");
                return;
            }
            
            try {
                setError(null);
                if (!token) {
                    setError("No authentication token found");
                    return;
                }

                await deleteRequest(token, request_id);
                await loadRequests();
            } catch (err) {
                setError("Failed to delete request: " + (err.response?.data?.error || err.message));
                console.error("Error deleting request:", err);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open':
                return 'bg-blue-100 text-blue-800';
            case 'closed':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                {/* <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="font-default text-2xl font-bold text-gray-800 flex items-center">
                            <FileText className="mr-2" size={28} />
                            Requests Management
                        </h1>
                        <p className="text-gray-600">Manage and track material requests with chat functionality</p>
                    </div>
                    {checkPermission("request", "create") && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={18} className="mr-2" />
                            Add Request
                        </button>
                    )}
                </div> */}

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
                        <div className="relative flex-1 w-3/4">
                            <Search className="absolute left-3  top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search requests by text, status, notes, or SAP item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {checkPermission("request", "create") && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center px-4 w-1/8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus size={18} className="mr-2" />
                            Add Request
                        </button>
                    )}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                        <p className="text-gray-600">Loading requests...</p>
                    </div>
                ) : (
                    /* Requests Table */
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>

                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredRequests.length > 0 ? (
                                        filteredRequests.map((request) => (
                                          <tr key={request.request_id} className="hover:bg-gray-50">
                                          <td
  onClick={() => router.push(`/requests/${request.request_id}`)}
  className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
>
  {request.request_id}
</td>
<td
  onClick={() => router.push(`/requests/${request.request_id}`)}
  className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
>
  <div className="flex flex-col">
    <span className="font-medium capitalize">{request.type || "N/A"}</span>
    {request.type === 'material' && request.sap_item && (
      <span className="text-xs text-gray-500 mt-0.5">Item ID: {request.sap_item}</span>
    )}
    {request.type === 'material group' && request.material_group && (
      <span className="text-xs text-gray-500 mt-0.5">Group: {request.material_group}</span>
    )}
  </div>
</td>
<td
  onClick={() => router.push(`/requests/${request.request_id}`)}
  className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
>
  {request.project_code || "N/A"}
</td>
<td
  onClick={() => router.push(`/requests/${request.request_id}`)}
  className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
>
  {request.notes || "N/A"}
</td>

                                          <td className="px-6 py-4 text-sm text-gray-900">
                                            {request.created_by || request.createdby || "N/A"}
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-900">
                                            {request.created ? new Date(request.created).toLocaleDateString() : "N/A"}
                                          </td>
                                          <td className="px-6 py-4 text-sm text-gray-900">
  <div className="flex space-x-2">
    {/* Update */}
    {checkPermission("request", "update") && (
      <button
        onClick={() => handleEdit(request)}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
        title="Update Request"
      >
        <Edit size={16} />
      </button>
    )}

    {/* Delete */}
    {checkPermission("request", "delete") && (
      <button
        onClick={() => handleDelete(request.request_id)}
        className="p-2 text-red-600 hover:bg-red-100 rounded"
        title="Delete Request"
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
                                            <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                                                {requests.length === 0
                                                    ? "No requests found. Add a new request to get started."
                                                    : "No requests found matching your criteria."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Info Section */}
                {/* <div className="bg-blue-50 rounded-lg p-6 mt-6 border border-blue-200">
                    <div className="flex items-start">
                        <div className="bg-blue-100 p-3 rounded-lg mr-4">
                            <Info className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">Requests Guide</h3>
                            <ul className="list-disc list-inside text-blue-700 space-y-1">
                                <li>Use the chat icon to update conversation between parties</li>
                                <li>Use the edit icon to update notes when required</li>
                                <li>MDGT role can assign SAP items using the tag icon</li>
                                <li>Only Admins, SuperAdmins, and MDGT can delete requests</li>
                                <li>Use the search bar to find requests by various criteria</li>
                            </ul>
                        </div>
                    </div>
                </div> */}
            </div>

            {/* Request Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editingRequest ? "Edit Request" : "Add New Request"}
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Code *</label>
                                <input
                                    type="text"
                                    name="project_code"   // ✅ correct
                                    value={formData.project_code}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter Project Code"
                                />

                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Additional notes..."
                                />
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
                                onClick={handleSaveRequest}
                                disabled={saving || !formData.project_code}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                {editingRequest ? "Save Changes" : "Add Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Update Modal */}
            {isChatModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">Update Chat Conversation</h2>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">User Text</label>
                                <textarea
                                    name="user_text"
                                    value={chatData.user_text}
                                    onChange={handleChatInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="User's message or request..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reply Text</label>
                                <textarea
                                    name="reply_text"
                                    value={chatData.reply_text}
                                    onChange={handleChatInputChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Response or reply..."
                                />
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
                                onClick={handleSaveChat}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Update Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Update Modal */}
            {isNotesModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">Update Notes</h2>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={notesData.notes}
                                    onChange={handleNotesInputChange}
                                    rows={6}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Update notes for this request..."
                                />
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
                                onClick={handleSaveNotes}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                <Save className="h-4 w-4 mr-2" />
                                Update Notes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SAP Assignment Modal */}
            {isSapModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-800">Assign SAP Item</h2>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">SAP Item ID *</label>
                                <input
                                    type="text"
                                    name="sap_item"
                                    value={sapData.sap_item}
                                    onChange={handleSapInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter SAP Item ID"
                                />
                                <p className="text-xs text-gray-500 mt-1">This will assign the SAP item to the request and close it</p>
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
                                onClick={handleSaveSap}
                                disabled={saving || !sapData.sap_item}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                                <Tag className="h-4 w-4 mr-2" />
                                Assign SAP Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}