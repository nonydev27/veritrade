import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Physical device: set EXPO_PUBLIC_API_URL in mobile/.env to http://YOUR_LAN_IP:5000/api
// Android emulator: http://10.0.2.2:5000/api | iOS simulator: http://localhost:5000/api
const DEFAULT_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!error.response) {
      const hint = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1')
        ? ' On a physical device, set EXPO_PUBLIC_API_URL in mobile/.env to your computer\'s LAN IP.'
        : ' Ensure your phone is on the same Wi‑Fi and the backend is running on 0.0.0.0:5000.';
      error.message = `Network error — cannot reach ${BASE_URL}.${hint}`;
    }
    return Promise.reject(error);
  },
);

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
