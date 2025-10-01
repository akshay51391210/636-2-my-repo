import axios from 'axios';

// backend EC2
const axiosInstance = axios.create({
  //baseURL: 'http://3.107.206.208:5001/api',
  baseURL: 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export default axiosInstance;
