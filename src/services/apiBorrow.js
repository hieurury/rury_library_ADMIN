import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;

const getAllBorrows = async () => {
  try {
    const response = await axios.get(`${BASE_API}/borrow/admin/all`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu mượn sách:', error);
    throw error;
  }
};

const getBorrowWithBillId = async (billId) => {
  try {
    const response = await axios.get(`${BASE_API}/borrow/${billId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu mượn sách theo billId:', error);
    throw error;
  }
};

const createBorrow = async (borrowData) => {
  try {
    const response = await axios.post(`${BASE_API}/borrow/add`, borrowData);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo mượn sách:', error);
    throw error;
  }
};

export {
  getAllBorrows,
  getBorrowWithBillId,
  createBorrow
};