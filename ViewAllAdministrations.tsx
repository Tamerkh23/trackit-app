 import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/Firebase';

interface Administration {
  id: string;
  adminName: string;
  email: string;
  phone: string;
  employeeEmail: string;
  adminPassword: string;
  employeePassword: string;
}

export default function ViewAllAdministrations() {
  const [admins, setAdmins] = useState<Administration[]>([]);

  useEffect(() => {
    fetchApprovedAdmins();
  }, []);

  const fetchApprovedAdmins = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'approvedAdministrations'));
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        adminName: docSnap.data().adminName,
        email: docSnap.data().email,
       
        phone: docSnap.data().phone,
        employeeEmail: docSnap.data().employeeEmail,
        adminPassword: docSnap.data().adminPassword,
        employeePassword: docSnap.data().employeePassword,
      }));
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching approved admins:', error);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this administration?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'approvedAdministrations', id));
            setAdmins((prev) => prev.filter((admin) => admin.id !== id));
            Alert.alert('Deleted', 'Administration deleted successfully.');
          } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('Error', 'Failed to delete administration.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>All Approved Administrations</Text>

      {admins.map((admin) => (
        <View key={admin.id} style={styles.card}>
          <Text style={styles.cardTitle}>{admin.adminName}</Text>
          <Text style={styles.cardText}>Email: {admin.email}</Text>
          <Text style={styles.cardText}>Phone: {admin.phone}</Text>
          <Text style={styles.cardText}>Employee Email: {admin.employeeEmail}</Text>
          <Text style={styles.cardText}>Admin Password: {admin.adminPassword}</Text>
          <Text style={styles.cardText}>Employee Password: {admin.employeePassword}</Text>

          <View style={styles.cardButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                router.push({
                  pathname: '/EditAdministration',
                  params: {
                    id: admin.id,
                    adminName: admin.adminName,
                    email: admin.email,
                    phone: admin.phone,
                    employeeEmail: admin.employeeEmail,
                    adminPassword: admin.adminPassword,
                    employeePassword: admin.employeePassword,
                  },
                })
              }
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(admin.id)}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {admins.length === 0 && (
        <Text style={styles.emptyText}>No approved administrations found.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 40,
    fontStyle: 'italic',
  },
}); 