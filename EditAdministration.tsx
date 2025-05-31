 import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/Firebase';

export default function EditAdministration() {
  const {
    id,
    adminName,
    email,
    phone,
    employeeEmail,
    adminPassword,
    employeePassword,
  } = useLocalSearchParams();

  const [updatedName, setUpdatedName] = useState(adminName as string);
  const [updatedEmail, setUpdatedEmail] = useState(email as string);
  const [updatedPhone, setUpdatedPhone] = useState(phone as string);
  const [updatedEmployeeEmail, setUpdatedEmployeeEmail] = useState(employeeEmail as string);
  const [updatedAdminPassword, setUpdatedAdminPassword] = useState(adminPassword as string);
  const [updatedEmployeePassword, setUpdatedEmployeePassword] = useState(employeePassword as string);

  const handleSave = async () => {
    if (
      !updatedName.trim() ||
      !updatedEmail.trim() ||
      !updatedPhone.trim() ||
      !updatedEmployeeEmail.trim() ||
      !updatedAdminPassword.trim() ||
      !updatedEmployeePassword.trim()
    ) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      const adminRef = doc(db, 'approvedAdministrations', id as string);
      await updateDoc(adminRef, {
        adminName: updatedName,
        email: updatedEmail,
        phone: updatedPhone,
        employeeEmail: updatedEmployeeEmail,
        adminPassword: updatedAdminPassword,
        employeePassword: updatedEmployeePassword,
      });

      Alert.alert('Success', 'Administration updated successfully.');
      router.back();
    } catch (error) {
      console.error('Error updating admin:', error);
      Alert.alert('Error', 'Failed to update administration.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Administration</Text>

      <TextInput
        style={styles.input}
        placeholder="Administration Name"
        value={updatedName}
        onChangeText={setUpdatedName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={updatedEmail}
        onChangeText={setUpdatedEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={updatedPhone}
        onChangeText={setUpdatedPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Employee Email"
        value={updatedEmployeeEmail}
        onChangeText={setUpdatedEmployeeEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Admin Password"
        value={updatedAdminPassword}
        onChangeText={setUpdatedAdminPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Employee Password"
        value={updatedEmployeePassword}
        onChangeText={setUpdatedEmployeePassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});