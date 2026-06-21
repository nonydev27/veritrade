import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import api from '../services/api';
import { useRouter } from 'expo-router';

export default function CreateEscrow(){
  const router = useRouter();
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [seller, setSeller] = useState('');

  async function onCreate(){
    try{
      const res = await api.post('/escrow/create', { item, amount, seller_phone: seller });
      alert('Transaction created: ' + (res.data.transactionCode || 'no-code'));
      router.push('/home');
    }catch(e){
      alert('Create failed');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Escrow</Text>
      <Text>Item</Text>
      <TextInput style={styles.input} value={item} onChangeText={setItem} />
      <Text>Amount</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType='numeric' />
      <Text>Seller Phone</Text>
      <TextInput style={styles.input} value={seller} onChangeText={setSeller} />
      <Button title="Create" onPress={onCreate} />
    </View>
  );
}

const styles = StyleSheet.create({ container:{flex:1,padding:20,justifyContent:'center'}, title:{fontSize:20,marginBottom:12}, input:{borderWidth:1,padding:8,marginBottom:12} });
