import { useState, useEffect } from 'react';
import api, { setAuthToken, loadAuthToken } from '../services/api';

export default function useAuth(){
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(()=>{
    (async ()=>{
      const t = await loadAuthToken();
      if(t){ setTokenState(t); }
    })();
  }, []);

  async function login(phone, password){
    const res = await api.post('/auth/login', { phone, password });
    const t = res.data.token;
    await setAuthToken(t);
    setTokenState(t);
    setUser(res.data.user || null);
    return res.data;
  }

  async function register(name, phone, password){
    const res = await api.post('/auth/register', { name, phone, password });
    const t = res.data.token;
    await setAuthToken(t);
    setTokenState(t);
    setUser(res.data.user || null);
    return res.data;
  }

  async function logout(){ await setAuthToken(null); setTokenState(null); setUser(null); }

  return { token, user, login, register, logout };
}
