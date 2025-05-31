import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/Firebase'; 
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
    
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

   
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const role = userDocSnap.data().role;

        switch (role) {
          case 'superadmin':
            router.replace('/TamerDashboard');
            break;
          case 'admin':
            router.replace('/AdminDashboard');
            break;
          case 'employee':
            router.replace('/EmployeeDashboard');
            break;
          case 'citizen':
            router.replace('/(tabs)');
            break;
          default:
            Alert.alert('Error', 'Unknown user role');
        }
      } else {
        Alert.alert('Error', 'User role not found in Firestore');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Track It</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.registerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/Register')}>
          <Text style={styles.registerLink}>Register here</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF', 
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    color: '#003366',
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderColor: '#999',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#003366',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    maxWidth: 380,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#333',
  },
  registerLink: {
    color: '#003366',
    fontWeight: '600',
  },
});
