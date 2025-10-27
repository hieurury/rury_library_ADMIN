import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;


const getAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_API}/sach/all`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getBookTemplate = async (MASACH) => {
  try {
    const response = await axios.get(`${BASE_API}/sach/template/${MASACH}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const updateBook = async (id, bookData) => {
    try {
        const response = await axios.put(`${BASE_API}/sach/admin/update/${id}`, bookData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export { getAllBooks, getBookTemplate, updateBook };