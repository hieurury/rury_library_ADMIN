import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;

const getAllReaders = async () => {
  try {
    const response = await axios.get(`${BASE_API}/user/admin/all`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu độc giả:', error);
    throw error;
  }
};

export {
  getAllReaders
};