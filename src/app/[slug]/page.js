// "use client";
// import { useParams, useRouter } from "next/navigation";
// import { useState } from "react";

// export default function MaterialDetailPage() {
//   const { slug } = useParams();
//   const router = useRouter();
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [copied, setCopied] = useState(false);
//   const [isFavorite, setIsFavorite] = useState(false);

//   // Example data (replace with API later)
//   const materialData = {
//     MEASTMULT: {
//       groupName: "MEASURING TOOLS / INSTRUMENTS - MULTIMETER ELECTRICAL",
//       items: [
//         {
//           code: "2010345673",
//           name: "RUBBER SHEET 5MM",
//           longDescription:
//             "Rubber sheet IS:1234 with dia 50 mm and length 100 mm mild steel",
//           specifications: "ISO 9001 Certified, Weather Resistant",
//           attributes: {
//             "INNER DIAMETER": "50 MM",
//             "OUTER DIAMETER": "100 MM",
//             "THICKNESS": "10 MM",
//             "NUMBER OF HOLES": "4",
//             "MATERIAL": "Nitrile Rubber",
//             "TENSILE STRENGTH": "15 MPa",
//             "OPERATING TEMP": "-40°C to 100°C",
//           },
//         },
//         {
//           code: "2010345693",
//           name: "RUBBER STAMP PNG",
//           longDescription:
//             "Rubber stamp IS:887676 with dia 45 mm and length 90 mm mild steel",
//           specifications: "Food Grade, Chemical Resistant",
//           attributes: {
//             "INNER DIAMETER": "150 MM",
//             "OUTER DIAMETER": "250 MM",
//             "THICKNESS": "12 MM",
//             "NUMBER OF HOLES": "8",
//             "MATERIAL": "Silicone Rubber",
//             "TENSILE STRENGTH": "10 MPa",
//             "OPERATING TEMP": "-60°C to 200°C",
//           },
//         },
//       ],
//     },
//     GASESARGO: {
//       groupName: "GASES – ARGON",
//       items: [
//         {
//           code: "GAS00123",
//           name: "ARGON GAS CYLINDER",
//           longDescription: "High purity argon gas for welding applications",
//           specifications: "99.99% Pure, Industrial Grade",
//           attributes: {
//             "CAPACITY": "50 L",
//             "PRESSURE": "200 BAR",
//             "VALVE TYPE": "BS3",
//             "TEST DATE": "2023-05-15",
//             "NEXT TEST": "2028-05-15",
//           },
//         },
//       ],
//     },
//   };

//   const data = materialData[slug] || null;

//   // Handle Share
//   const handleShare = () => {
//     navigator.clipboard.writeText(window.location.href);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   // Handle Item Not Found
//   const handleItemNotFound = () => {
//     alert("⚠️ Item not found request has been submitted!");
//   };

//   // Toggle Favorite
//   const toggleFavorite = () => {
//     setIsFavorite(!isFavorite);
//   };

//   if (!data) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="bg-white shadow-xl rounded-xl p-8 max-w-md w-full">
//           <div className="text-center">
//             <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
//               <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </div>
//             <h3 className="mt-5 text-lg font-medium text-gray-900">Material Group Not Found</h3>
//             <p className="mt-2 text-sm text-gray-500">
//               The material group code <span className="font-mono font-bold">{slug}</span> does not exist in our database.
//             </p>
//             <div className="mt-6">
//               <button
//                 onClick={() => router.push("/search")}
//                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
//               >
//                 <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                 </svg>
//                 Back to Search
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
//   else{

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
//         {/* Header */}
//         <div className="bg-blue-800 text-white p-6">
//           <div className="flex justify-between items-start">
//             <div>
//               <h1 className="text-2xl font-bold">Material G</h1>
//               <p className="text-blue-100 mt-1">Detailed specifications and attributes</p>
//             </div>
//             <button
//               onClick={toggleFavorite}
//               className="p-2 rounded-full bg-blue-700 hover:bg-blue-600 transition-colors"
//               aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
//             >
//               {isFavorite ? (
//                 <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
//                   <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
//                 </svg>
//               ) : (
//                 <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
//                 </svg>
//               )}
//             </button>
//           </div>
//         </div>
        
//         {/* Breadcrumb */}
//         <div className="flex p-4 bg-gray-100 text-sm text-gray-600">
//           <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/")}>Home</span>
//           <span className="mx-2">/</span>
//           <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/search")}>Procurement</span>
//           <span className="mx-2">/</span>
//           <span className="cursor-pointer hover:text-blue-600">Material Groups</span>
//           <span className="mx-2">/</span>
//           <span className="font-medium text-blue-600">{slug}</span>
//         </div>
        
//         <div className="p-6">
//           {/* Group Header */}
//           <div className="mb-6">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Material Group: <span className="font-mono text-blue-700">{slug}</span>
//                 </h2>
//                 <p className="text-gray-600 mt-1">{data.groupName}</p>
//               </div>
//               <button
//                 onClick={() => router.push("/search")}
//                 className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//                 </svg>
//                 Back to Search
//               </button>
//             </div>
//           </div>

//           {/* Items + Details */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Items List */}
//             <div className="border border-gray-200 rounded-lg overflow-hidden shadow-inner">
//               <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
//                 <h3 className="text-lg font-medium text-gray-700">Available Items ({data.items.length})</h3>
//               </div>
//               <div className="h-72 overflow-y-auto">
//                 {data.items.length === 0 ? (
//                   <div className="p-4 text-center text-gray-500">
//                     <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     <p className="mt-2">No items found in this group</p>
//                   </div>
//                 ) : (
//                   data.items.map((item) => (
//                     <div
//                       key={item.code}
//                       onClick={() => setSelectedItem(item)}
//                       className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors ${
//                         selectedItem?.code === item.code 
//                           ? "bg-blue-50 border-l-4 border-l-blue-600" 
//                           : "hover:bg-gray-50"
//                       }`}
//                     >
//                       <div className="flex justify-between items-start">
//                         <div className="font-mono text-sm text-blue-700">{item.code}</div>
//                         <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">In Stock</span>
//                       </div>
//                       <div className="text-sm font-medium text-gray-800 mt-1">{item.name}</div>
//                       <div className="text-xs text-gray-500 mt-1 line-clamp-1">{item.longDescription}</div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Item Details */}
//             <div>
//               {selectedItem ? (
//                 <div className="border border-gray-200 rounded-lg shadow-inner p-4 h-72 overflow-y-auto">
//                   <div className="mb-4">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <h3 className="text-lg font-semibold text-gray-800">{selectedItem.name}</h3>
//                         <p className="text-sm text-gray-500 font-mono">{selectedItem.code}</p>
//                       </div>
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                         Available
//                       </span>
//                     </div>
//                   </div>

//                   <div className="mb-4">
//                     <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
//                     <div className="bg-gray-50 p-3 rounded-md text-sm">
//                       {selectedItem.longDescription}
//                     </div>
//                   </div>

//                   <div className="mb-4">
//                     <h4 className="text-sm font-medium text-gray-700 mb-1">Specifications</h4>
//                     <div className="bg-gray-50 p-3 rounded-md text-sm">
//                       {selectedItem.specifications}
//                     </div>
//                   </div>

//                   <div className="mb-4">
//                     <div className="flex justify-between items-center mb-2">
//                       <h4 className="text-sm font-medium text-gray-700">Attributes</h4>
//                       <span className="text-xs text-gray-500">{Object.keys(selectedItem.attributes).length} properties</span>
//                     </div>
//                     <div className="border border-gray-200 rounded-md overflow-hidden">
//                       <table className="min-w-full divide-y divide-gray-200">
//                         <thead className="bg-gray-50">
//                           <tr>
//                             <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attribute</th>
//                             <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
//                             <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
//                           </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200">
//                           {Object.entries(selectedItem.attributes).map(([attr, value]) => (
//                             <tr key={attr}>
//                               <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{attr}</td>
//                               <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{value}</td>
//                               <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">LENGTH</td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   </div>

//                   {/* Buttons */}
//                   <div className="flex space-x-3 pt-4">
//                     <button
//                       onClick={handleShare}
//                       className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                     >
//                       {copied ? (
//                         <>
//                           <svg className="mr-2 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                           </svg>
//                           Copied!
//                         </>
//                       ) : (
//                         <>
//                           <svg className="mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
//                           </svg>
//                           Share
//                         </>
//                       )}
//                     </button>
//                     <button
//                       onClick={handleItemNotFound}
//                       className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
//                     >
//                       <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//                       </svg>
//                       Item Not Found
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="border border-gray-200 rounded-lg shadow-inner p-6 h-72 flex flex-col items-center justify-center text-center">
//                   <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                   <h3 className="mt-4 text-sm font-medium text-gray-900">No item selected</h3>
//                   <p className="mt-2 text-sm text-gray-500">Select an item from the list to view its details.</p>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {/* Additional Info */}
//           <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
//               <h4 className="text-sm font-medium text-blue-800 mb-1">Inventory Status</h4>
//               <p className="text-xs text-blue-600">All items in this group are currently in stock</p>
//             </div>
//             <div className="bg-green-50 p-4 rounded-lg border border-green-100">
//               <h4 className="text-sm font-medium text-green-800 mb-1">Lead Time</h4>
//               <p className="text-xs text-green-600">Typically ships within 2-3 business days</p>
//             </div>
//             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
//               <h4 className="text-sm font-medium text-purple-800 mb-1">Quality Certification</h4>
//               <p className="text-xs text-purple-600">ISO 9001:2015 Certified</p>
//             </div>
//           </div>
//         </div>
        
//         {/* Footer */}
//         <div className="bg-gray-100 p-4 text-center text-xs text-gray-500">
//           © 2023 Company Name. All rights reserved. | v2.4.1
//         </div>
//       </div>
//     </div>
//   );
//   }
// }