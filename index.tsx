import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../../config/Firebase';

export default function TrackingHome() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to log out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: () => router.push('/Login'),
                },
              ],
              { cancelable: true }
            );
          }}
          style={{ marginRight: 15 }}
        >
          <Text style={{ fontSize: 18, color: '#003366' }}>🔓</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/Myfiles')}
          style={{ marginLeft: 15 }}
        >
          <Text style={{ fontSize: 18, color: '#003366' }}>📁 My Files</Text>
        </TouchableOpacity>
      ),
      title: 'Welcome',
    });
  }, [navigation]);

  const handleTrack = async () => {
    const trimmedTrackingNumber = trackingNumber.trim();
    if (!trimmedTrackingNumber) {
      Alert.alert('Error', 'Please enter a tracking number');
      return;
    }

    try {
   
      const q = query(
        collection(db, 'citizenFiles'),
        where('trackingNumber', '==', trimmedTrackingNumber)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Not Found', 'No file found with this tracking number.');
        return;
      }

      const fileDoc = querySnapshot.docs[0];
      const fileData = fileDoc.data();

      const userUid = auth.currentUser?.uid;
      if (!userUid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

  
      const userTrackedFilesRef = collection(db, 'userTrackedFiles');
      const userFileQuery = query(
        userTrackedFilesRef,
        where('userId', '==', userUid),
        where('trackingNumber', '==', trimmedTrackingNumber)
      );
      const userFileSnap = await getDocs(userFileQuery);
      if (!userFileSnap.empty) {
    
        router.push({
          pathname: '/TrackingResult',
          params: { code: trimmedTrackingNumber },
        });
        return;
      }

  
      await addDoc(userTrackedFilesRef, {
        userId: userUid,
        trackingNumber: trimmedTrackingNumber,
        fileType: fileData.fileType,
        status: fileData.status,
        dateSubmitted: fileData.createdAt?.toDate() || null,
      });

      Alert.alert('Success', 'File added to your tracked files');
      setTrackingNumber('');

  
      router.push({
        pathname: '/TrackingResult',
        params: { code: trimmedTrackingNumber },
      });
    } catch (error) {
      console.error('Error checking tracking number:', error);
      Alert.alert('Error', 'Something went wrong while checking the tracking number.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Track Your File</Text>
      </View>

      <Text style={styles.label}>Enter your tracking number</Text>

      <TextInput
        style={styles.input}
        placeholder="Tracking Number"
        value={trackingNumber}
        onChangeText={setTrackingNumber}
        keyboardType="default"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleTrack}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#003366',
  },
  label: {
    fontSize: 18,
    marginBottom: 12,
    color: '#003366',
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#003366',
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
  },
});
