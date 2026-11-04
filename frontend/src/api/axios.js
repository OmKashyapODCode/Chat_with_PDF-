import axios from 'axios';

// All API calls go through this axios instance.
// VITE_API_URL is set in .env file (e.g. http://localhost:8000)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
