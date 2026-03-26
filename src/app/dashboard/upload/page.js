"use client";

import { useState, useRef } from "react";
import { Download, UploadCloud, FileText, ChevronDown, Info } from "lucide-react";
import { Toast } from "@/components/Toast";

export default function UploadPage() {
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedPhase, setSelectedPhase] = useState("1"); // For ItemMaster phase selection
    const fileInputRef = useRef(null);

    const templates = ["project", "EmailDomain", "Employee", "MaterialType", "MatgAttributeItem", "Material", "ValidationLists", "SuperGroup", "MatGroup", "ItemMaster", "Company"];

    const triggerToast = (type, message) => {
        window.dispatchEvent(new CustomEvent('showToast', {
            detail: { type, message }
        }));
    };

    const handleDownload = async (templateType = "base") => {
        if (!selectedTemplate) {
            triggerToast("error", "Please select a template first!");
            return;
        }

        try {
            const templateName = selectedTemplate === "ItemMaster" && templateType === "attributes" 
                ? "ItemMaster Attributes" 
                : selectedTemplate === "ItemMaster" 
                    ? "ItemMaster Base Values" 
                    : selectedTemplate;
            
            triggerToast("success", `Generating ${templateName} template...`);

            const url = selectedTemplate === "ItemMaster"
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/download-template/?model=${selectedTemplate}&type=${templateType}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/download-template/?model=${selectedTemplate}`;

            const response = await fetch(url, {
                method: "GET",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to generate template");
            }

            // Get the blob from response
            const blob = await response.blob();
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            
            // Set filename based on template type
            const filename = selectedTemplate === "ItemMaster" && templateType === "attributes"
                ? "ItemMaster_Attributes_template.xlsx"
                : selectedTemplate === "ItemMaster"
                    ? "ItemMaster_Base_Values_template.xlsx"
                    : `${selectedTemplate}_template.xlsx`;
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            triggerToast("success", `${templateName} template downloaded successfully!`);
        } catch (error) {
            console.error("Download error:", error);
            triggerToast("error", error.message || "Failed to download template");
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const validTypes = [".xlsx", ".csv"];
        const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

        if (!validTypes.includes(fileExtension)) {
            triggerToast("error", "Please upload only Excel or CSV files");
            return;
        }

        if (!selectedTemplate) {
            triggerToast("error", "Please select a template first!");
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", selectedTemplate);
        
        // For ItemMaster, add phase parameter
        if (selectedTemplate === "ItemMaster") {
            formData.append("phase", selectedPhase);
        }

        try {
            const url = selectedTemplate === "ItemMaster"
                ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/bulk-upload/?model=${selectedTemplate}&phase=${selectedPhase}`
                : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/bulk-upload/?model=${selectedTemplate}`;
            
            const response = await fetch(url, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            console.log("Result : ", result);
            if (!response.ok) {
                throw new Error(result.error || "Upload failed");
            }

            setUploadProgress(100);
            triggerToast("success", result.message || `${file.name} uploaded successfully!`);
        } catch (error) {
            console.error("Upload error:", error);
            triggerToast("error", error.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const event = { target: { files: [file] } };
            handleFileUpload(event);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center p-6">
            <div className="w-full max-w-5xl">
                {/* Toast Component */}
                <Toast />

                {/* Page Heading */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Data Management Portal
                    </h1>
                    <p className="text-gray-600">
                        Download templates and upload data for your organization
                    </p>
                </div>

                {/* Template Selector */}
                <div className="mb-8 bg-white rounded-2xl shadow-md p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Data Template
                    </label>
                    <div className="relative">
                        <select
                            value={selectedTemplate}
                            onChange={(e) => {
                                setSelectedTemplate(e.target.value);
                                // Reset phase when template changes
                                if (e.target.value !== "ItemMaster") {
                                    setSelectedPhase("1");
                                }
                            }}
                            className="w-full md:w-1/2 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-3 pr-10 appearance-none bg-white"
                        >
                            <option value="">-- Choose a template --</option>
                            {templates.map((tpl) => (
                                <option key={tpl} value={tpl}>
                                    {tpl}
                                </option>
                            ))}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 md:mr-48">
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        </div>
                        </select>
                    </div>
                </div>

                {/* Flex Layout - only show if a template is selected */}
                {selectedTemplate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Download Template Section */}
                        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
                            <div className="flex items-center mb-4">
                                <div className="p-3 rounded-full bg-indigo-100 mr-4">
                                    <Download className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Download Template
                                </h2>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">
                                Get the pre-formatted Excel template for the selected table. Ensure you use the correct format to avoid upload errors.
                            </p>
                            {selectedTemplate === "ItemMaster" ? (
                                <div className="mt-auto space-y-2">
                                    <button
                                        onClick={() => handleDownload("base")}
                                        disabled={!selectedTemplate}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow hover:bg-indigo-700 transition-colors"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Base Values Template
                                    </button>
                                    <button
                                        onClick={() => handleDownload("attributes")}
                                        disabled={!selectedTemplate}
                                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl shadow hover:bg-blue-700 transition-colors"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Attributes Template
                                    </button>
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs text-blue-800 font-medium mb-1">Note:</p>
                                        <p className="text-xs text-blue-700">
                                            Download and upload Base Values and Attributes separately. Each template includes sample data.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleDownload()}
                                    disabled={!selectedTemplate}
                                    className="mt-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow hover:bg-indigo-700 transition-colors"
                                >
                                    <Download className="w-5 h-5" />
                                    Download {selectedTemplate} Template
                                </button>
                            )}
                        </div>

                        {/* Upload Section */}
                        <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col transition-all hover:shadow-lg">
                            <div className="flex items-center mb-4">
                                <div className="p-3 rounded-full bg-green-100 mr-4">
                                    <UploadCloud className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Upload Data
                                </h2>
                            </div>
                            <p className="text-gray-500 text-sm mb-6">
                                Upload your filled Excel file to insert records into{" "}
                                {selectedTemplate}. Files should be in .xlsx or .csv format.
                            </p>
                            
                            {/* Phase Selection for ItemMaster */}
                            {selectedTemplate === "ItemMaster" && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Upload Phase
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="phase"
                                                value="1"
                                                checked={selectedPhase === "1"}
                                                onChange={(e) => setSelectedPhase(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Phase 1: Base Values</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="phase"
                                                value="2"
                                                checked={selectedPhase === "2"}
                                                onChange={(e) => setSelectedPhase(e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm text-gray-700">Phase 2: Attributes</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Phase 1: Upload base item information. Phase 2: Upload attribute settings.
                                    </p>
                                </div>
                            )}

                            {/* Upload Box */}
                            <label
                                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all
                    ${isUploading ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {isUploading ? (
                                    <div className="w-full px-6">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-indigo-600 h-2.5 rounded-full transition-all"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-indigo-600 mt-3">
                                            Uploading... {uploadProgress}%
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-500 text-center px-4">
                                            Drag & drop your file here or click to browse
                                        </span>
                                        <span className="text-xs text-gray-400 mt-2">
                                            Supports .xlsx, .csv files
                                        </span>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.csv"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}