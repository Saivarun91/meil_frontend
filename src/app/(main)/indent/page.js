// app/indent/page.js
"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Download, Upload, FileText, Package, ArrowLeft, Loader2 } from "lucide-react";
import { fetchRequests, createRequest, updateRequest, deleteRequest } from "../../../lib/api";
import {useAuth} from "@/context/AuthContext";
import { useSortableData } from "@/hooks/useSortableData";

export default function IndentPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [newItem, setNewItem] = useState({ 
        user_text: "", 
        reply_text: "", 
        notes: "", 
        sap_item: "", 
        closetime: "", 
        status: "", 
        timetaken: "" 
    });
    const [userName, setUserName] = useState("");
    const {user,token,role} = useAuth();
    useEffect(() => {
        // // Get user info from localStorage
        // const name = localStorage.getItem("userName") || "User";
        setUserName(user);
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            // const token = localStorage.getItem("token");
            const data = await fetchRequests(token);
            setRequests(data);
        } catch (err) {
            setError("Failed to load requests: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const addItem = async () => {
        if (!newItem.user_text) {
            setError("Please enter user text");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            // const token = localStorage.getItem("token");
            await createRequest(token, newItem);
            setNewItem({ 
                user_text: "", 
                reply_text: "", 
                notes: "", 
                sap_item: "", 
                closetime: "", 
                status: "", 
                timetaken: "" 
            });
            await loadRequests();
        } catch (err) {
            setError("Failed to add request: " + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const removeItem = async (request_id) => {
        if (window.confirm("Are you sure you want to delete this request?")) {
            try {
                setError(null);
                //  const token = localStorage.getItem("token");
                await deleteRequest(token, request_id);
                await loadRequests();
            } catch (err) {
                setError("Failed to delete request: " + (err.response?.data?.error || err.message));
            }
        }
    };

    const submitIndent = () => {
        // This could be enhanced to submit all pending requests
        const event = new CustomEvent('showToast', {
            detail: { message: "Indent submitted successfully!", type: 'success' }
        });
        window.dispatchEvent(event);
    };

    const { sortedData: sortedRequests, requestSort, getSortIcon } = useSortableData(requests);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <div>
                        <h1 className="font-default text-2xl font-bold text-gray-800">Create Indent</h1>
                        <p className="text-gray-600">Create and manage material indents for procurement</p>
                    </div>
                </div>

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

                {/* Stats Cards */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-3 rounded-lg mr-4">
                                <FileText className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Items</p>
                                <p className="text-2xl font-bold text-gray-900">{indentItems.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-3 rounded-lg mr-4">
                                <ShoppingCart className="text-green-600" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Ready to Submit</p>
                                <p className="text-2xl font-bold text-gray-900">{indentItems.length > 0 ? "Yes" : "No"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center">
                            <div className="bg-purple-100 p-3 rounded-lg mr-4">
                                <Package className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Last Submitted</p>
                                <p className="text-2xl font-bold text-gray-900">2 days ago</p>
                            </div>
                        </div>
                    </div>
                </div> */}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm">
                        <Download size={18} />
                        Export Indent
                    </button>
                    <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm">
                        <Upload size={18} />
                        Import Items
                    </button>
                </div>

                {/* Add Item Form */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Request</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">User Text *</label>
                            <input
                                type="text"
                                placeholder="Enter your request details"
                                value={newItem.user_text}
                                onChange={(e) => setNewItem({ ...newItem, user_text: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SAP Item</label>
                            <input
                                type="text"
                                placeholder="SAP Item ID"
                                value={newItem.sap_item}
                                onChange={(e) => setNewItem({ ...newItem, sap_item: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reply Text</label>
                            <input
                                type="text"
                                placeholder="Reply text"
                                value={newItem.reply_text}
                                onChange={(e) => setNewItem({ ...newItem, reply_text: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <input
                                type="text"
                                placeholder="Status"
                                value={newItem.status}
                                onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Close Time</label>
                            <input
                                type="date"
                                value={newItem.closetime}
                                onChange={(e) => setNewItem({ ...newItem, closetime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Taken</label>
                            <input
                                type="text"
                                placeholder="Time taken"
                                value={newItem.timetaken}
                                onChange={(e) => setNewItem({ ...newItem, timetaken: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                placeholder="Additional notes"
                                value={newItem.notes}
                                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={addItem}
                        disabled={saving}
                        className="bg-gradient-to-r from-[#002147] to-[#7F56D9] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition flex items-center gap-2 shadow-md disabled:opacity-50"
                    >
                        {saving && <Loader2 className="animate-spin h-4 w-4" />}
                        <Plus size={18} />
                        Add Request
                    </button>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Requests</h2>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            {requests.length} requests
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                            <span className="ml-2 text-gray-600">Loading requests...</span>
                        </div>
                    ) : requests.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="font-default p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('request_id')}>Request ID {getSortIcon('request_id')}</th>
                                        <th className="font-default p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('user_text')}>User Text {getSortIcon('user_text')}</th>
                                        <th className="font-default p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('sap_item')}>SAP Item {getSortIcon('sap_item')}</th>
                                        <th className="font-default p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
                                        <th className="font-default p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('created')}>Created {getSortIcon('created')}</th>
                                        <th className="font-default p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sortedRequests.map((request) => (
                                        <tr key={request.request_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="font-default p-4 font-mono text-blue-600 font-semibold">{request.request_id}</td>
                                            <td className="p-4">{request.user_text || '-'}</td>
                                            <td className="p-4">{request.sap_item || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {request.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">{request.created || '-'}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => removeItem(request.request_id)}
                                                    className="text-red-500 hover:text-red-700 transition p-1 rounded-full hover:bg-red-50"
                                                    title="Delete request"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 mb-1">No requests found</h3>
                            <p className="text-gray-500">Add requests to see them here.</p>
                        </div>
                    )}

                    {requests.length > 0 && (
                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button
                                onClick={submitIndent}
                                className="bg-gradient-to-r from-[#002147] to-[#7F56D9] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
                            >
                                <ShoppingCart size={20} />
                                Submit Indent
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}