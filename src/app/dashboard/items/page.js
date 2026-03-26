// app/dashboard/items/page.js
"use client";
import { useState } from "react";
import { Package, Plus, Edit, Trash2, Search, Box, DollarSign } from "lucide-react";
import { useSortableData } from "@/hooks/useSortableData";

export default function ItemsPage() {
    const [items, setItems] = useState([
        { id: 101, name: "Laptop", type: "Electronics", quantity: 15, price: 1200, status: "In Stock" },
        { id: 102, name: "Office Chair", type: "Furniture", quantity: 25, price: 250, status: "In Stock" },
        { id: 103, name: "Notebook", type: "Stationery", quantity: 200, price: 5, status: "In Stock" },
        { id: 104, name: "Projector", type: "Electronics", quantity: 0, price: 800, status: "Out of Stock" },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: "", type: "", quantity: "", price: "", status: "In Stock"
    });
    const [searchTerm, setSearchTerm] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            setItems(items.map(i =>
                i.id === editingItem.id ? { ...formData, id: editingItem.id, quantity: parseInt(formData.quantity), price: parseFloat(formData.price) } : i
            ));
        } else {
            const newItem = {
                ...formData,
                id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 101,
                quantity: parseInt(formData.quantity),
                price: parseFloat(formData.price)
            };
            setItems([...items, newItem]);
        }
        setShowModal(false);
        setFormData({ name: "", type: "", quantity: "", price: "", status: "In Stock" });
        setEditingItem(null);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ ...item, quantity: item.quantity.toString(), price: item.price.toString() });
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this item?")) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const { sortedData: sortedItems, requestSort, getSortIcon } = useSortableData(filteredItems);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Items</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                    <Plus className="w-5 h-5 mr-1" />
                    Add Item
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('name')}>Item {getSortIcon('name')}</th>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('type')}>Type {getSortIcon('type')}</th>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('quantity')}>Quantity {getSortIcon('quantity')}</th>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('price')}>Price {getSortIcon('price')}</th>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
                            <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mr-3">
                                            <Package className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{item.name}</div>
                                            <div className="text-sm text-gray-500">ID: {item.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-700">{item.type}</td>
                                <td className="p-4 text-gray-700">{item.quantity}</td>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 text-gray-500" />
                                        <span>{item.price.toFixed(2)}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                    <div className="relative">
                                        <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="In Stock">In Stock</option>
                                        <option value="Out of Stock">Out of Stock</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingItem(null);
                                        setFormData({ name: "", type: "", quantity: "", price: "", status: "In Stock" });
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingItem ? 'Update' : 'Create'} Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}