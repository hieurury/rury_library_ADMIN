import axios from "axios";
const BASE_API = import.meta.env.VITE_BASE_API;


const getAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_API}/sach/all`);
    return response.data;
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};


export { getAllBooks };