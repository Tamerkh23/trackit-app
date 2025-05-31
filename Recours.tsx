import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { db } from '../config/Firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function Recours() {
  const { code, type, date } = useLocalSearchParams();
  const [message, setMessage] = useState('');


  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your complaint message');
      return;
    }

    try {

      const complaintRef = collection(db, 'complaints');
      await addDoc(complaintRef, {
        trackingNumber: code,
        fileType: type,
        dateSubmitted: date,
        message: message.trim(),
        status: 'blocked', 
        createdAt: Timestamp.now(),
      });

      Alert.alert('Sent', 'Your complaint has been submitted successfully');
      router.push('/(tabs)'); 
    } catch (error) {
      console.error('Error submitting complaint: ', error);
      Alert.alert('Error', 'Failed to submit your complaint');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submit a Complaint</Text>

      {}
      {code && (
        <View style={styles.infoBox}>
          <Text style={styles.label}>Tracking Number:</Text>
          <Text style={styles.value}>{code}</Text>

          <Text style={styles.label}>File Type:</Text>
          <Text style={styles.value}>{type}</Text>

          <Text style={styles.label}>Date Submitted:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
      )}

      <Text style={styles.label}>Your Message:</Text>
      <TextInput
        style={styles.textArea}
        multiline
        placeholder="Describe your issue..."
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#003366',
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
