import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Button } from 'react-native-paper';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/Firebase';

const allowedStatuses = ['Pending', 'In Review', 'In Transit', 'Approved', 'Rejected', 'Blocked'];

export default function FileDetails() {
  const { id } = useLocalSearchParams();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const docRef = doc(db, 'citizenFiles', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFile({ id: docSnap.id, ...data });
          setStatus(data.status || 'Pending');
          setNotes(data.notes || '');
        } else {
          console.log('File not found.');
        }
      } catch (error) {
        console.error('Error fetching file:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [id]);

  const handleUpdate = async () => {
  try {
    const docRef = doc(db, 'citizenFiles', id as string);

   
    const fileSnap = await getDoc(docRef);
    if (!fileSnap.exists()) throw new Error("File not found");
    const fileData = fileSnap.data();

    const routeQuery = query(
      collection(db, 'fileRoutes'),
      where('fileTypeId', '==', fileData.fileTypeId)
    );
    const routeSnap = await getDocs(routeQuery);
    if (routeSnap.empty) throw new Error("Route not found for this file type");

    const routeData = routeSnap.docs[0].data().route as string[];
    const currentAdminIndex = routeData.indexOf(fileData.administrationId);

    const updatedStatusPerAdmin = { ...fileData.statusPerAdmin };

    if (status.toLowerCase() === 'in transit') {
      
      if (currentAdminIndex >= 0) {
        const prevAdminId = routeData[currentAdminIndex];
        updatedStatusPerAdmin[prevAdminId] = 'Completed';
      }
      
    } else if (status.toLowerCase() === 'approved') {

      updatedStatusPerAdmin[fileData.administrationId] = 'Approved';
    } else {

      updatedStatusPerAdmin[fileData.administrationId] = status;
    }

    await updateDoc(docRef, {
      status,
      notes,
      statusPerAdmin: updatedStatusPerAdmin,

    });

    setFile((prev: any) => ({
      ...prev,
      status,
      notes,
      statusPerAdmin: updatedStatusPerAdmin,
    }));

    Alert.alert('✅ File Updated', `Status: ${status}\nNotes: ${notes || 'None'}`);
  } catch (error) {
    console.error('Error updating file:', error);
    Alert.alert('❌ Error', 'Something went wrong while updating the file.');
  }
};


  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#003366" />;
  }

  if (!file) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>File not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>File Details</Text>

      <Text style={styles.label}>👤 Citizen Name:</Text>
      <Text style={styles.value}>{file.citizenName}</Text>

      <Text style={styles.label}>📄 File Type:</Text>
      <Text style={styles.value}>{file.fileType}</Text>

      <Text style={styles.label}>📌 Current Status:</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={status} onValueChange={(val) => setStatus(val)}>
          {allowedStatuses.map((s) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>📝 Notes:</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Add notes (optional)"
        multiline
      />

      <Button mode="contained" onPress={handleUpdate} style={styles.button}>
        Update File
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  value: {
    marginBottom: 16,
    fontSize: 16,
    color: '#111',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#003366',
  },
});
