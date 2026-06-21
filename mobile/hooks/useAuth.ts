import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthToken } from '@/services/api';

export default function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('token');
      const u = await AsyncStorage.getItem('user');
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    })();
  }, []);

  async function login(phone: string, password: string) {
    const res = await api.post('/auth/login', { phone, password });
    await setAuthToken(res.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  async function register(name: string, phone: string, password: string, role = 'BUYER') {
    const res = await api.post('/auth/register', { name, phone, password, role });
    await setAuthToken(res.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data;
  }

  async function logout() {
    await setAuthToken(null);
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  return { token, user, login, register, logout };
}
