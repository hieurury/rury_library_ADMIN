import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;

// Lấy tất cả người dùng
const getAllUsers = async () => {
  try {
    const response = await axios.get(`${BASE_API}/user/admin/all`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy thống kê người dùng
const getUserStatistics = async () => {
  try {
    const response = await axios.get(`${BASE_API}/user/admin/statistics`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Khóa tài khoản người dùng
const lockUser = async (userId, reason, duration = 0) => {
  try {
    const response = await axios.put(`${BASE_API}/user/admin/lock/${userId}`, {
      reason,
      duration
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Mở khóa tài khoản người dùng
const unlockUser = async (userId) => {
  try {
    const response = await axios.put(`${BASE_API}/user/admin/unlock/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getAllUsers,
  getUserStatistics,
  lockUser,
  unlockUser
};
