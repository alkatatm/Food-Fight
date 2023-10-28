import axios from 'axios';

const instance = axios.create({
  baseURL: "https://food-fight.onrender.com/",
});

// Add a request interceptor
instance.interceptors.request.use((config) => {
  // Check for JWT token in local storage and add to headers if exists
  const token = localStorage.getItem('jwtToken');
  if (token) {
    console.log('Generated token', token);
    config.headers.Authorization = `${token}`;
  }
  return config;
}, (error) => {
    console.log(error);
  return Promise.reject(error);
});

export default instance;
