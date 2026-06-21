import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import useAuth from '../hooks/useAuth';

export default function Home(){
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VeriTrade Dashboard</Text>
      <Button title="Create Escrow" onPress={()=>router.push('/create-escrow')} />
      <View style={{height:12}} />
      <Button title="USSD Demo (open docs)" onPress={()=>alert('Use POST /api/ussd to simulate USSD flows (see DEPLOYMENT.md)')} />
      <View style={{height:12}} />
      <Button title="Logout" onPress={()=>{ logout(); router.replace('/login'); }} />
    </View>
  );
}

const styles = StyleSheet.create({ container:{flex:1,padding:20,justifyContent:'center'}, title:{fontSize:20,marginBottom:12} });
