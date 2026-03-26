"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Filter, Check, ChevronRight, X, MessageCircle, Package, BarChart3, Users, Bell, User, LogOut } from "lucide-react";

export default function Home() {
  const [searchByNumber, setSearchByNumber] = useState("");
  const [searchByDescription, setSearchByDescription] = useState("");
  const [numberResults, setNumberResults] = useState(null);
  const [descriptionResults, setDescriptionResults] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newMaterialComment, setNewMaterialComment] = useState("");
  const [newGroupComment, setNewGroupComment] = useState("");
  // const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("materials");

  // useEffect(() => {
  //   if (typeof window !== "undefined") {
  //     const name = localStorage.getItem("userName") || "User";
  //     setUserName(name);
  //   }
  // }, []);

  const handleLogout = () => {
    // if (typeof window !== "undefined") {
    //   localStorage.removeItem("isLoggedIn");
    //   localStorage.removeItem("userName");
    // }
    window.location.href = "/login";
  };

  // Sample data for demonstration
  const sampleMaterials = [
    { id: "MAT001", description: "Stainless Steel Bolt 10mm", group: "Fasteners", match: 95 },
    { id: "MAT002", description: "Stainless Steel Nut 10mm", group: "Fasteners", match: 87 },
    { id: "MAT005", description: "Steel Bolt 10mm Galvanized", group: "Fasteners", match: 78 },
    { id: "MAT008", description: "Stainless Steel Washer 10mm", group: "Fasteners", match: 72 },
    { id: "MAT012", description: "Stainless Steel Anchor Bolt", group: "Anchors", match: 65 },
  ];

  const sampleGroups = [
    { id: "GRP001", name: "Fasteners", description: "Nuts, bolts, screws and washers", relevance: 92 },
    { id: "GRP005", name: "Metal Components", description: "Various metal parts and components", relevance: 85 },
    { id: "GRP008", name: "Construction Hardware", description: "Hardware for construction purposes", relevance: 76 },
  ];

  const stats = [
    { label: "Total Materials", value: "1,248", icon: Package, change: "+12% this month" },
    { label: "Material Groups", value: "42", icon: BarChart3, change: "+3 new groups" },
    { label: "Active Users", value: "86", icon: Users, change: "+5 this week" },
  ];

  const handleSearchByNumber = () => {
    if (!searchByNumber.trim()) {
      showToast("Please enter a material number", "error");
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // For demo purposes, let's assume MAT001 and MAT005 exist
      if (searchByNumber.toUpperCase() === "MAT001") {
        setNumberResults({
          found: true,
          material: { id: "MAT001", description: "Stainless Steel Bolt 10mm", group: "Fasteners" }
        });
      } else if (searchByNumber.toUpperCase() === "MAT005") {
        setNumberResults({
          found: true,
          material: { id: "MAT005", description: "Steel Bolt 10mm Galvanized", group: "Fasteners" }
        });
      } else {
        setNumberResults({ found: false });
      }
    }, 800);
  };

  const handleSearchByDescription = () => {
    if (!searchByDescription.trim()) {
      showToast("Please enter a material description", "error");
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // Filter materials based on description for demo
      const filteredMaterials = sampleMaterials.filter(material =>
        material.description.toLowerCase().includes(searchByDescription.toLowerCase())
      );

      setDescriptionResults({
        materials: filteredMaterials,
        groups: sampleGroups
      });
    }, 800);
  };

  const addToIndent = (material) => {
    if (!selectedMaterials.some(item => item.id === material.id)) {
      setSelectedMaterials([...selectedMaterials, material]);
      showToast(`${material.id} added to indent`, "success");
    } else {
      showToast(`${material.id} is already in indent`, "info");
    }
  };

  const toggleMaterialSelection = (material) => {
    if (selectedMaterials.some(item => item.id === material.id)) {
      setSelectedMaterials(selectedMaterials.filter(item => item.id !== material.id));
    } else {
      setSelectedMaterials([...selectedMaterials, material]);
    }
  };

  const submitNewMaterialRequest = () => {
    // In a real app, this would call an API
    showToast("Material creation request submitted", "success");
    setShowNewMaterialModal(false);
    setNewMaterialComment("");
  };

  const submitNewGroupRequest = () => {
    // In a real app, this would call an API
    showToast("Material group creation request submitted", "success");
    setShowNewGroupModal(false);
    setNewGroupComment("");
  };

  const showToast = (message, type) => {
    const event = new CustomEvent('showToast', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Watermark Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[345deg]">
          <img
            src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
            alt="MEIL Logo Watermark"
            className="w-96 h-48 object-contain filter grayscale"
          />
        </div>

        {/* Additional watermarks in corners */}
        <div className="absolute top-10 left-10 text-[#002147] text-center opacity-3 rotate-[345deg]">
          <img
            src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
            alt="MEIL Logo"
            className="w-16 h-8 object-contain filter grayscale"
          />
        </div>
        <div className="absolute top-10 right-10 text-[#002147] text-center opacity-3 rotate-[345deg]">
          <img
            src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
            alt="MEIL Logo"
            className="w-16 h-8 object-contain filter grayscale"
          />
        </div>
        <div className="absolute bottom-10 left-10 text-[#002147] text-center opacity-3 rotate-[345deg]">
          <img
            src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
            alt="MEIL Logo"
            className="w-16 h-8 object-contain filter grayscale"
          />
        </div>
        <div className="absolute bottom-10 right-10 text-[#002147] text-center opacity-3 rotate-[345deg]">
          <img
            src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
            alt="MEIL Logo"
            className="w-16 h-8 object-contain filter grayscale"
          />
        </div>
      </div>
      {/* Watermark Background */}
      {/* <div className="fixed inset-0 pointer-events-none opacity-5 z-0"> */}
      {/* Center watermark */}
      {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
    <img
      src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
      alt="MEIL Logo Watermark"
      className="w-96 h-48 object-contain filter grayscale"
    />
  </div> */}

      {/* Additional watermarks in corners */}
      {/* <div className="absolute top-10 left-10 text-[#002147] text-center opacity-3">
    <img
      src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
      alt="MEIL Logo"
      className="w-16 h-8 object-contain filter grayscale"
    />
  </div>
  <div className="absolute top-10 right-10 text-[#002147] text-center opacity-3">
    <img
      src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
      alt="MEIL Logo"
      className="w-16 h-8 object-contain filter grayscale"
    />
  </div>
  <div className="absolute bottom-10 left-10 text-[#002147] text-center opacity-3">
    <img
      src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
      alt="MEIL Logo"
      className="w-16 h-8 object-contain filter grayscale"
    />
  </div>
  <div className="absolute bottom-10 right-10 text-[#002147] text-center opacity-3">
    <img
      src="https://meil.in/sites/default/files/meil_logo_old_update_24.png"
      alt="MEIL Logo"
      className="w-16 h-8 object-contain filter grayscale"
    />
  </div>
</div> */}



      {/* Header */}
      {/* <div className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-[#002147] to-[#7F56D9] p-2 rounded-lg mr-3">
              <Package className="text-white" size={24} />
            </div>
            <h1 className="font-default text-2xl font-bold bg-gradient-to-r from-[#002147] to-[#7F56D9] bg-clip-text text-transparent">
              Megha Materials Hub
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative group">
              <button className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#002147] to-[#7F56D9] rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{userName}</span>
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                  <LogOut size={16} className="mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-default text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <stat.icon className="text-blue-600" size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}