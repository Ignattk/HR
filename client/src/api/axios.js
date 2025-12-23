import axios from "axios";

const api = axios.create({
  baseURL: "https://hr-r8py.onrender.com/api",
  // withCredentials removed to avoid CORS issues with wildcard origin
  // If you need cookies/auth, update server CORS to use specific origin instead of "*"
});

export default api;
