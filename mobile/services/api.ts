import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your machine's local IP when testing on a physical device
// For Android emulator use: http://10.0.2.2:5000/api
// For iOS simulator use: http://localhost:5000/api
const BASE_URL = 'http://100.66.247.137:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 8000 });

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function setAuthToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem('token', token);
  } else {
    await AsyncStorage.removeItem('token');
  }
}

export async function loadAuthToken() {
  return await AsyncStorage.getItem('token');
}

export default api;
