import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;

const getAllBorrows = async () => {
  try {
    const response = await axios.get(`${BASE_API}/borrow/admin/all`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

const getBorrowWithBillId = async (billId) => {
  try {
    const response = await axios.get(`${BASE_API}/borrow/${billId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

const getBorrowsWithUserId = async (userId) => {
  try {
    const response = await axios.get(`${BASE_API}/borrow/user/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

const createBorrow = async (borrowData) => {
  try {
    const response = await axios.post(`${BASE_API}/borrow/add`, borrowData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

const returnBook = async (returnData) => {
  try {
    const response = await axios.put(`${BASE_API}/borrow/admin/return`, returnData);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export {
  getAllBorrows,
  getBorrowWithBillId,
  createBorrow,
  getBorrowsWithUserId,
  returnBook
};