import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  // withCredentials removed to avoid CORS issues with wildcard origin
  // If you need cookies/auth, update server CORS to use specific origin instead of "*"
});

export default api;
