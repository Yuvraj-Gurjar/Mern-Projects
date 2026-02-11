import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:8080/api" 
    : "https://mern-projects-uqjn.onrender.com/api",
  withCredentials: true,
});