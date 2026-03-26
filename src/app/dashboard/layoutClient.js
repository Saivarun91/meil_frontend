// "use client";

// import "../globals.css";
// import DashboardSidebar from "@/components/DashboardSidebar";
// import Navbar from "@/components/Navbar";
// import Protected from "@/components/Protected";
// import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

// function DashboardLayoutContent({ children }) {
//   const { isDashboardSidebarCollapsed } = useSidebar();

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <DashboardSidebar />

//       {/* Main Content */}
//       <div
//         className={`flex-1 flex flex-col transition-all duration-300 ${isDashboardSidebarCollapsed ? "ml-0 lg:ml-16" : "ml-0 lg:ml-64"
//           }`}
//       >
//         {/* Navbar pinned at the top */}
//         <Navbar />

//         {/* Scrollable content area */}
//         <main className="flex-1 overflow-y-auto p-6 md:p-8">
//           <div className="max-w-7xl mx-auto">{children}</div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default function DashboardLayoutClient({ children }) {
//   return (
//     <Protected allowedRoles={["Admin", "MDGT"]}>
//       <SidebarProvider>
//         <DashboardLayoutContent>{children}</DashboardLayoutContent>
//       </SidebarProvider>
//     </Protected>
//   );
// }

"use client";

import "../globals.css";
import DashboardSidebar from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import Protected from "@/components/Protected";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardLayoutContent({ children }) {
  const { isDashboardSidebarCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isDashboardSidebarCollapsed ? "ml-0 lg:ml-16" : "ml-0 lg:ml-64"
          }`}
      >
        {/* Navbar pinned at the top */}
        <Navbar />

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-4 text-foreground">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayoutClient({ children }) {
  return (
    <Protected allowedRoles={["Admin", "MDGT"]}>
      <SidebarProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </Protected>
  );
}
