// AuthContext.jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [token, setToken] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    console.log(user)

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        const savedRole = localStorage.getItem("role");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setRole(savedRole);

            axios
                .get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/userroles/roles/permissions/${savedRole}/`, {
                    headers: { Authorization: `Bearer ${savedToken}` },
                })
                .then(res => setPermissions(res.data.permissions || []))
                .catch(() => setPermissions([]));
        }

        setLoading(false);
    }, []);

    const fetchPermissionsForRole = async (roleName, authToken) => {
        try {
            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/userroles/roles/permissions/${roleName}/`,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            setPermissions(res.data.permissions || []);
        } catch {
            setPermissions([]);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/employee/login/`,
                { email, password }
            );
            const data = res.data;

            // Check if role is not assigned
            if (!data.role || data.role === null || data.role === "") {
                return { 
                    success: false, 
                    error: "Role not assigned", 
                    roleNotAssigned: true 
                };
            }

            setToken(data.token);
            setUser({
                emp_id: data.emp_id,
                emp_name: data.emp_name,
                email: data.email,
                company_name: data.company_name,
                role: data.role,
                designation: data.designation ,
            });
            setRole(data.role);

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({
                emp_id: data.emp_id,
                emp_name: data.emp_name,
                email: data.email,
                company_name: data.company_name,
                designation: data.designation || "designation",
            }));
            localStorage.setItem("role", data.role);

            const permRes = await axios.get(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/userroles/roles/permissions/${data.role}/`,
                { headers: { Authorization: `Bearer ${data.token}` } }
            );
            setPermissions(permRes.data.permissions || []);

            router.push("/app");
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || "Login failed" };
        }
    };


    const logout = () => {
        setUser(null);
        setRole(null);
        setToken(null);
        setPermissions([]);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        router.push("/login");
    };

    // 🔑 New helper function
    const checkPermission = (keyword, action = null) => {
        if (!permissions || permissions.length === 0) return false;

        keyword = keyword.toLowerCase();

        const perm = permissions.find((p) =>
            p.permission_name.toLowerCase().includes(keyword)
        );

        if (!perm) return false;
        if (!action) return true;

        return perm[`can_${action}`] === true;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                role,
                token,
                permissions,
                loading,
                login,
                logout,
                fetchPermissionsForRole,
                checkPermission, // 👈 exposed to all components
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
