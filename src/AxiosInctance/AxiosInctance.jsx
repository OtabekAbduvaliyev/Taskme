import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://eventify.preview.uz/api/v1",
});
export default axiosInstance;
