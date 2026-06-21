import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '../hooks/useAuth';

export default function Login(){
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function onLogin(){
    try{
      await login(phone, password);
      router.push('/home');
    }catch(e){
      alert('Login failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VeriTrade — Login</Text>
      <Text>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} />
      <Text>Password</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Login" onPress={onLogin} />
      <Button title="Create account" onPress={()=>router.push('/register')} />
    </View>
  );
}

const styles = StyleSheet.create({ container:{flex:1,padding:20,justifyContent:'center'}, title:{fontSize:20,marginBottom:12}, input:{borderWidth:1,padding:8,marginBottom:12} });
