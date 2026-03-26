"use client";
import { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
    const [isMainSidebarCollapsed, setIsMainSidebarCollapsed] = useState(false);
    const [isDashboardSidebarCollapsed, setIsDashboardSidebarCollapsed] = useState(false);

    return (
        <SidebarContext.Provider value={{
            isMainSidebarCollapsed,
            setIsMainSidebarCollapsed,
            isDashboardSidebarCollapsed,
            setIsDashboardSidebarCollapsed
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};
