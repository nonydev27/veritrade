import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = 'http://YOUR_IP:5000/api'; // replace YOUR_IP with your machine IP or 10.0.2.2 for Android emulator

const api = axios.create({ baseURL, timeout: 5000 });

export async function setAuthToken(token){
  if(token){
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    await AsyncStorage.setItem('token', token);
  }else{
    delete api.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('token');
  }
}

export async function loadAuthToken(){
  const token = await AsyncStorage.getItem('token');
  if(token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  return token;
}

export default api;
