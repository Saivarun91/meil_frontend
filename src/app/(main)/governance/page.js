"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Layers,
  Tags,
  Grid,
  Users,
  CheckSquare,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // 👈 import AuthContext

const sections = [
  {
    key: "materials",
    title: "Item Masters",
    description: "Manage material items and inventory",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    btn: "Manage Items",
    path: "/materials",
    permissionKey: "item",   // 👈 will match "Manage Materials", "Material View", etc.
  },
  {
    key: "materialGroups",
    title: "Material Groups",
    description: "Organize materials into categories",
    icon: Layers,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    btn: "Manage Material Groups",
    path: "/material_groups",
    permissionKey: "group",      // 👈 matches "Material Groups", "Group Management"
  },
  {
    key: "projects",
    title: "Projects",
    description: "Manage projects and their details",
    icon: Tags,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    btn: "Manage Projects",
    path: "/projects",
    permissionKey: "project",    // 👈 matches "Project Management"
  },
  {
    key: "materialTypes",
    title: "Material Types",
    description: "Classify materials into different types",
    icon: Grid,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    btn: "Manage Material Types",
    path: "/material_types",
    permissionKey: "type",       // 👈 will match "Material Types"
  },
  {
    key: "supergroups",
    title: "Supergroups",
    description: "Define and manage user supergroups",
    icon: Users,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    btn: "Manage Supergroups",
    path: "/supergroups",
    permissionKey: "super", // 👈 matches "Supergroup Permissions"
  },
  // {
  //   key: "validationLists",
  //   title: "Validation Lists",
  //   description: "Maintain lists for validation and compliance",
  //   icon: CheckSquare,
  //   color: "text-gray-700",
  //   bgColor: "bg-gray-50",
  //   btn: "Manage Validation Lists",
  //   path: "/validation-lists",
  //   permissionKey: "validation", // 👈 matches "Validation Lists"
  // },
  {
    key: "materialAttributes",
    title: "Material Group Attributes",
    description: "Configure attributes for material groups",
    icon: Settings,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    btn: "Manage Material Attributes",
    path: "/material-attributes",
    permissionKey: "attribute",  // 👈 matches "Material Attributes"
  },
];

export default function GovernancePage() {
  const router = useRouter();
  const { permissions, loading, checkPermission } = useAuth(); // 👈 get permissions from context

  // ⏳ Show a loading state while permissions are being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading governance modules...
      </div>
    );
  }

  const allowedSections = sections.filter((sec) =>
    permissions.some((p) =>
      p.permission_name.toLowerCase().includes(sec.permissionKey.toLowerCase())
    )
  );
  

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
       
        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allowedSections.map((sec) => (
            <div
              key={sec.key}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="p-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`inline-flex items-center justify-center p-3 rounded-lg ${
                      sec.bgColor || "bg-gray-100"
                    }`}
                  >
                    {React.createElement(sec.icon, {
                      size: 24,
                      className: sec.color,
                    })}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {sec.title}
                  </h2>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6">{sec.description}</p>

                {/* Button */}
                <button
                  onClick={() => router.push(sec.path)}
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center"
                >
                  {sec.btn}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Fallback if no access */}
        {allowedSections.length === 0 && (
          <div className="mt-12 text-center text-gray-500">
            🚫 You don’t have permission to access any governance modules.
          </div>
        )}
      </div>
    </div>
  );
}
