import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;

// Lấy danh sách bills chờ lấy sách
const getPendingPickupBills = async () => {
  try {
    const response = await axios.get(`${BASE_API}/bill/admin/pending-pickup`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Xác nhận lấy sách
const confirmPickup = async (pickupData) => {
  try {
    const response = await axios.post(`${BASE_API}/bill/admin/confirm-pickup`, pickupData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Lấy chi tiết bill theo mã
const getBillById = async (maBill) => {
  try {
    const response = await axios.get(`${BASE_API}/bill/get/${maBill}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export {
  getPendingPickupBills,
  confirmPickup,
  getBillById
};
