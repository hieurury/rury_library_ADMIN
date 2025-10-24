import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;


const getAllPackages = async () => {
    try {
        const response = await axios.get(`${BASE_API}/package/all`);
        return response.data;
    } catch (error) {
        console.error("Error fetching packages:", error);
        throw error;
    }
};

const createPackage = async (packageData) => {
    try {
        const response = await axios.post(`${BASE_API}/package/add`, packageData);
        return response.data;
    } catch (error) {
        console.error("Error creating package:", error);
        throw error;
    }
};

const updatePackage = async (id, packageData) => {
    try {
        const response = await axios.put(`${BASE_API}/package/update/${id}`, packageData);
        return response.data;
    } catch (error) {
        console.error("Error updating package:", error);
        throw error;
    }
};

const deletePackage = async (id) => {
    try {
        const response = await axios.delete(`${BASE_API}/package/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting package:", error);
        throw error;
    }
};

export {
    getAllPackages,
    createPackage,
    updatePackage,
    deletePackage
};