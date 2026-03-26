"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Briefcase, Building, Edit2, Save, X } from "lucide-react";

const ProfilePage = () => {
    const { user } = useAuth();
    console.log(user)
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        emp_name: "",
        email: "",
        designation: "",
        role: "",
        company: ""
    });
    const [tempData, setTempData] = useState({ ...profileData });

    // Initialize profile data
    useEffect(() => {
        if (user) {
            const data = {
                emp_name: user.emp_name || "Not provided",
                email: user.email || "Not provided",
                designation: user.designation || "Not provided",
                role: user.role || "Not provided",
                company: user.company_name || "Not provided"
            };
            setProfileData(data);
            setTempData(data);
        }
    }, [user]);

    const handleEdit = () => {
        setTempData({ ...profileData });
        setIsEditing(true);
    };

    const handleSave = () => {
        setProfileData({ ...tempData });
        setIsEditing(false);
        // Here you would typically make an API call to update the profile
    };

    const handleCancel = () => {
        setTempData({ ...profileData });
        setIsEditing(false);
    };

    const handleChange = (field, value) => {
        setTempData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">Employee Profile</h1>
                            {/* {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <Save size={18} />
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                </div>
                            )} */}
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center md:w-1/3">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white mb-4">
                                    <User size={64} />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800 text-center">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={tempData.emp_name}
                                            onChange={(e) => handleChange("emp_name", e.target.value)}
                                            className="text-center bg-gray-100 rounded-lg px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        profileData.emp_name
                                    )}
                                </h2>
                                <p className="text-gray-600 text-center mt-1">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={tempData.designation}
                                            onChange={(e) => handleChange("designation", e.target.value)}
                                            className="text-center bg-gray-100 rounded-lg px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        profileData.designation
                                    )}
                                </p>
                            </div>

                            {/* Details Section */}
                            <div className="md:w-2/3 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Email Field */}
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Mail className="text-blue-500" size={20} />
                                            <span className="text-sm font-medium text-gray-500">Email</span>
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                value={tempData.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                className="w-full bg-white rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-800 font-medium">{profileData.email}</p>
                                        )}
                                    </div>

                                    {/* Role Field */}
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Briefcase className="text-purple-500" size={20} />
                                            <span className="text-sm font-medium text-gray-500">Role</span>
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={tempData.role}
                                                onChange={(e) => handleChange("role", e.target.value)}
                                                className="w-full bg-white rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-800 font-medium">{profileData.role}</p>
                                        )}
                                    </div>

                                    {/* Company Field */}
                                    <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Building className="text-green-500" size={20} />
                                            <span className="text-sm font-medium text-gray-500">Company</span>
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={tempData.company}
                                                onChange={(e) => handleChange("company", e.target.value)}
                                                className="w-full bg-white rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-800 font-medium">{profileData.company}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;