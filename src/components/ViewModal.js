"use client";
import { X } from "lucide-react";

/**
 * ViewModal - A reusable modal component for displaying table row data
 * Matches the styling of edit modals with 2-3 column layout
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Object} props.data - The data object to display
 * @param {string} props.title - Title for the modal
 * @param {Object} props.fieldLabels - Optional custom labels for fields
 */
export default function ViewModal({ isOpen, onClose, data, title = "View Details", fieldLabels = {} }) {
  if (!isOpen || !data) return null;

  // Format field names for display (convert snake_case to Title Case)
  const formatFieldName = (fieldName) => {
    // Use custom label if provided
    if (fieldLabels[fieldName]) {
      return fieldLabels[fieldName];
    }
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render attributes in a user-friendly format
  const renderAttributes = (attributes) => {
    if (!attributes || typeof attributes !== 'object' || Object.keys(attributes).length === 0) {
      return <div className="text-gray-500 italic">No attributes defined</div>;
    }

    return (
      <div className="space-y-3">
        {Object.entries(attributes).map(([attrName, attrValue]) => {
          // Check if it's a complex attribute object (like in material-attributes)
          if (typeof attrValue === 'object' && attrValue !== null && !Array.isArray(attrValue)) {
            const hasConfig = attrValue.values || attrValue.print_priority !== undefined || attrValue.validation || attrValue.unit || attrValue.max_length;
            
            if (hasConfig) {
              // Complex attribute with configuration
              return (
                <div key={attrName} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-semibold text-blue-900 text-sm mb-2">{attrName}</div>
                  <div className="space-y-1 text-sm">
                    {attrValue.values && (
                      <div className="text-gray-700">
                        <span className="font-medium">Values:</span> {Array.isArray(attrValue.values) ? attrValue.values.join(", ") : attrValue.values}
                      </div>
                    )}
                    {attrValue.print_priority !== undefined && (
                      <div className="text-gray-700">
                        <span className="font-medium">Print Priority:</span> {attrValue.print_priority}
                      </div>
                    )}
                    {attrValue.validation && (
                      <div className="text-gray-700">
                        <span className="font-medium">Validation:</span> {attrValue.validation}
                      </div>
                    )}
                    {attrValue.unit && (
                      <div className="text-gray-700">
                        <span className="font-medium">Unit:</span> {attrValue.unit}
                      </div>
                    )}
                    {attrValue.max_length && (
                      <div className="text-gray-700">
                        <span className="font-medium">Max Length:</span> {attrValue.max_length}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          }
          
          // Simple attribute value (like in materials)
          return (
            <div key={attrName} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900 text-sm">{attrName}</span>
                <span className="text-gray-700 text-sm">{String(attrValue || "N/A")}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Format field values for display
  const formatFieldValue = (value, fieldName) => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'None';
    }
    if (typeof value === 'object' && value !== null) {
      // Handle nested objects (like sgrp_code object)
      if (value.sgrp_code) return value.sgrp_code;
      if (value.mgrp_code) return value.mgrp_code;
      if (value.company_name) return value.company_name;
      // For complex objects, show as JSON (except attributes which are handled separately)
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // Get all keys from the data object, excluding internal fields
  const dataKeys = Object.keys(data).filter(key => {
    // Filter out internal/technical fields
    return !key.startsWith('_') && !key.startsWith('__') && key !== 'id';
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataKeys.map((key) => {
            const value = data[key];
            const displayName = formatFieldName(key);
            
            // Special handling for attributes field
            if (key === 'attributes' && typeof value === 'object' && value !== null) {
              return (
                <div key={key} className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {displayName}
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white">
                    {renderAttributes(value)}
                  </div>
                </div>
              );
            }
            
            const displayValue = formatFieldValue(value, key);
            const isLongValue = displayValue.length > 100;
            const isVeryLongValue = displayValue.length > 200 || (typeof value === 'object' && value !== null && !Array.isArray(value));

              return (
                <div
                  key={key}
                  className={isVeryLongValue ? "md:col-span-2" : ""}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {displayName}
                  </label>
                  {isLongValue ? (
                    <div className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 text-sm whitespace-pre-wrap break-words min-h-[60px]">
                      {displayValue}
                    </div>
                  ) : (
                    <div className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-gray-900">
                      {displayValue}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

