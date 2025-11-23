import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // Update if needed

// Function to create an axios instance with token dynamically
const createAxiosInstance = (token) => {
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
};

// API functions that receive token as argument


// ROLES
export const fetchRoles = (token) => {
    const a = createAxiosInstance(token);
    return a.get("/userroles/roles/").then(res => res.data);
};

export const fetchRolesWithPermissions = (token) => {
    const a = createAxiosInstance(token);
    return a.get("/userroles/roles/all/").then(res => res.data);
};

export const createRole = (token, data) => {
    const a = createAxiosInstance(token);
    return a.post("/userroles/roles/create/", data).then(res => res.data);
};

export const updateRole = (token, id, data) => {
    const a = createAxiosInstance(token);
    return a.put(`/userroles/roles/update/${id}/`, data).then(res => res.data);
};

export const deleteRole = (token, id) => {
    const a = createAxiosInstance(token);
    return a.delete(`/userroles/roles/delete/${id}/`).then(res => res.data);
};

// PERMISSIONS
export const fetchPermissions = (token) => {
    const a = createAxiosInstance(token);
    return a.get("/permissions/").then(res => res.data);

};

export const fetchRolePermissions = (token, roleName) => {
    const a = createAxiosInstance(token);
    return a.get(`/userroles/roles/permissions/${encodeURIComponent(roleName)}/`).then(res => res.data);
};

export const updateRolePermissions = (token, payload) => {
    const a = createAxiosInstance(token);
    return a.put(`/userroles/roles/permissions/update/`, payload).then(res => res.data);
};

export const assignRolePermissions = (token, payload) => {
    const a = createAxiosInstance(token);
    // payload = { role_name, assignments: [{ permission_id, can_create, can_update, can_delete, can_export }] }
    return a.post("/userroles/roles/permissions/assign/", payload).then(res => res.data);
};

export const removeRolePermission = (token, role_name, permission_id) => {
    const a = createAxiosInstance(token);
    return a.delete("/userroles/roles/permissions/remove/", {
        data: { role_name, permission_id }
    }).then(res => res.data);
};

// Material Groups API
export const fetchMaterialGroups = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("matgroups/list/").then(res => res.data);
};

export const createMaterialGroup = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("matgroups/create/", data).then(res => res.data);
};

export const updateMaterialGroup = (token, mgrp_code, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`matgroups/${mgrp_code}/update/`, data).then(res => res.data);
};

export const deleteMaterialGroup = (token, mgrp_code) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`matgroups/${mgrp_code}/delete/`).then(res => res.data);
};

// Material Types API
export const fetchMaterialTypes = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("materialtype/materialtypes/").then(res => res.data);
};

export const createMaterialType = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("materialtype/materialtypes/create/", data).then(res => res.data);
};

export const updateMaterialType = (token, mat_type_code, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`materialtype/materialtypes/update/${mat_type_code}/`, data).then(res => res.data);
};

export const deleteMaterialType = (token, mat_type_code) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`materialtype/materialtypes/delete/${mat_type_code}/`).then(res => res.data);
};

// Projects API
export const fetchProjects = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("projects/list/").then(res => res.data);
};

export const createProject = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("projects/create/", data).then(res => res.data);
};

export const updateProject = (token, project_code, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`projects/${project_code}/update/`, data).then(res => res.data);
};

export const deleteProject = (token, project_code) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`projects/${project_code}/delete/`).then(res => res.data);
};

// Email Domains API
export const fetchEmailDomains = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("emaildomains/list/").then(res => res.data);
};

export const createEmailDomain = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("emaildomains/create/", data).then(res => res.data);
};

export const updateEmailDomain = (token, pk, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`emaildomains/${pk}/update/`, data).then(res => res.data);
};

export const deleteEmailDomain = (token, pk) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`emaildomains/${pk}/delete/`).then(res => res.data);
};

// Companies API
export const fetchCompanies = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("company/companies/").then(res => res.data);
};

export const createCompany = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("company/companies/create/", data).then(res => res.data);
};

export const updateCompany = (token, company_name, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`company/companies/update/${company_name}/`, data).then(res => res.data);
};

export const deleteCompany = (token, company_name) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`company/companies/delete/${company_name}/`).then(res => res.data);
};

// Requests API
export const fetchRequests = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("requests/list/").then(res => res.data);
};

export const createRequest = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("requests/create/", data).then(res => res.data);
};

export const updateRequest = (token, request_id, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`requests/update/${request_id}/`, data).then(res => res.data);
};

export const deleteRequest = (token, request_id) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`requests/delete/${request_id}/`).then(res => res.data);
};

// Assign SAP Item (MDGT only)
export const assignSapItem = (token, request_id, sap_item) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`requests/assign-sap/${request_id}/`, { sap_item }).then(res => res.data);
};

// Assign Material Group (MDGT only)
export const assignMaterialGroup = (token, request_id, material_group) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`requests/assign-material-group/${request_id}/`, { material_group }).then(res => res.data);
};

// Item Master API
export const fetchItemMasters = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("itemmaster/list/").then(res => res.data);
};

 export const createItemMaster = async (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    try {
        const response = await axiosInstance.post("itemmaster/create/", data);
        // Check if response contains duplicate warning (status 200 with warning)
        if (response.data && response.data.warning && response.data.duplicates) {
            // Return the warning data so frontend can handle it
            return response.data;
        }
        return response.data;
    } catch (error) {
        // Check if error response contains duplicate information (status 200)
        if (error.response && error.response.status === 200 && error.response.data && error.response.data.warning) {
            return error.response.data;
        }
        throw error;
    }
};

export const updateItemMaster = (token, local_item_id, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`itemmaster/update/${local_item_id}/`, data).then(res => res.data);
};

export const deleteItemMaster = (token, local_item_id) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`itemmaster/delete/${local_item_id}/`).then(res => res.data);
};

// Super Groups API
export const fetchSuperGroups = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("supergroup/supergroups/list/").then(res => res.data);
};

export const createSuperGroup = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("supergroup/supergroups/create/", data).then(res => res.data);
};

export const updateSuperGroup = (token, sgrp_code, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`supergroup/supergroups/update/${sgrp_code}/`, data).then(res => res.data);
};

export const deleteSuperGroup = (token, sgrp_code) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`supergroup/supergroups/delete/${sgrp_code}/`).then(res => res.data);
};

// Validation Lists API
export const fetchValidationLists = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("validationlists/validation-lists/").then(res => res.data);
};

export const createValidationList = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("validationlists/validation-lists/create/", data).then(res => res.data);
};

export const updateValidationList = (token, list_id, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`validationlists/validation-lists/${list_id}/update/`, data).then(res => res.data);
};

export const deleteValidationList = (token, list_id) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`validationlists/validation-lists/${list_id}/delete/`).then(res => res.data);
};

// Material Attributes API
export const fetchMaterialAttributes = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("matgattribute/list/").then(res => res.data);
};

export const createMaterialAttribute = (token, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("matgattribute/create/", data).then(res => res.data);
};

export const updateMaterialAttribute = (token, attrib_id, data) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.put(`matgattribute/update/${attrib_id}/`, data).then(res => res.data);
};

export const deleteMaterialAttribute = (token, attrib_id) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`matgattribute/delete/${attrib_id}/`).then(res => res.data);
};

// Chat API
export const fetchChatMessages = (token, request_id) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance
        .get(`requests/chat/${request_id}/`)
        .then(res => res.data);
};

export const addChatMessage = (token, request_id, message) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance
        .post(`requests/chat/add/${request_id}/`, { message })
        .then(res => res.data);
};

// Favorites API
export const fetchFavorites = (token) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.get("favorites/list/").then(res => res.data);
};

export const addFavorite = (token, mgrp_code) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("favorites/add/", { mgrp_code }).then(res => res.data);
};

export const removeFavorite = (token, mgrp_code) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.post("favorites/remove/", { mgrp_code }).then(res => res.data);
};

export const removeFavoriteById = (token, favorite_id) => {
    const axiosInstance = createAxiosInstance(token);
    return axiosInstance.delete(`favorites/remove/${favorite_id}/`).then(res => res.data);
};