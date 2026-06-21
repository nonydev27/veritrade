import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '../hooks/useAuth';

export default function Register(){
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  async function onRegister(){
    try{
      await register(name, phone, password);
      router.push('/home');
    }catch(e){
      alert('Register failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} />
      <Text>Password</Text>
      <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Register" onPress={onRegister} />
      <Button title="Back to login" onPress={()=>router.push('/login')} />
    </View>
  );
}

const styles = StyleSheet.create({ container:{flex:1,padding:20,justifyContent:'center'}, title:{fontSize:20,marginBottom:12}, input:{borderWidth:1,padding:8,marginBottom:12} });
