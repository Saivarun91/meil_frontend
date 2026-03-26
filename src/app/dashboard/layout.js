import DashboardLayoutClient from "./layoutClient";

export const metadata = {
  title: "Dashboard - MDM Portal",
  description: "Admin dashboard for managing companies, employees, items, and requests",
};

export default function DashboardLayout({ children }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
