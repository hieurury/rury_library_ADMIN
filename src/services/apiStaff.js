import axios from 'axios';

const BASE_API = import.meta.env.VITE_BASE_API;

// Lấy tất cả nhân viên
export const getAllStaff = async (masterKey = null) => {
    try {
        const headers = {};
        if (masterKey) {
            headers.masterKey = masterKey;
        }
        const response = await axios.get(`${BASE_API}/account/admin/all`, { headers });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Lấy thông tin nhân viên theo MSNV
export const getStaffById = async (msnv) => {
    try {
        const response = await axios.get(`${BASE_API}/account/admin/${msnv}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Tạo nhân viên mới
export const createStaff = async (data) => {
    try {
        const response = await axios.post(`${BASE_API}/account/admin/create`, data);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Cập nhật thông tin nhân viên
export const updateStaff = async (msnv, data, masterKey = null) => {
    try {
        const headers = {};
        if (masterKey) {
            headers.masterKey = masterKey;
        }
        const response = await axios.put(`${BASE_API}/account/admin/${msnv}`, data, { headers });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Xóa nhân viên
export const deleteStaff = async (msnv, masterKey = null) => {
    try {
        const headers = {};
        if (masterKey) {
            headers.masterKey = masterKey;
        }
        const response = await axios.delete(`${BASE_API}/account/admin/${msnv}`, { headers });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Lấy thống kê nhân viên
export const getStaffStatistics = async (masterKey = null) => {
    try {
        const headers = {};
        if (masterKey) {
            headers.masterKey = masterKey;
        }
        const response = await axios.get(`${BASE_API}/account/admin/statistics`, { headers });
        return response.data;
    } catch (error) {
        throw error;
    }
};
