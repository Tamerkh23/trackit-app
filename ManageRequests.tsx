import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  getDocs,
  collection,
  doc,
  deleteDoc,
  setDoc,
  addDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/Firebase';

interface AdminRequest {
  id: string;
  adminName: string;
  email: string;
  phone: string;
  description: string;
  employeeEmail: string;
  adminPassword: string;
  employeePassword: string;
}

export default function ManageRequests() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'adminRequests'));
      const data: AdminRequest[] = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<AdminRequest, 'id'>),
      }));
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleDecision = async (request: AdminRequest, accepted: boolean) => {
    const docRef = doc(db, 'adminRequests', request.id);

    if (accepted) {
      try {
        const adminDocRef = await addDoc(collection(db, 'approvedAdministrations'), {
          adminName: request.adminName,
          email: request.email,
          phone: request.phone,
          description: request.description,
          employeeEmail: request.employeeEmail,
          adminPassword: request.adminPassword,
          employeePassword: request.employeePassword,
          createdAt: new Date().toISOString(),
        });

        const administrationId = adminDocRef.id;

        await setDoc(adminDocRef, {
          ...request,
          administrationId,
          createdAt: new Date().toISOString(),
        });

        const adminUser = await createUserWithEmailAndPassword(
          auth,
          request.email,
          request.adminPassword
        );
        await setDoc(doc(db, 'users', adminUser.user.uid), {
          email: request.email,
          role: 'admin',
          name: request.adminName,
          administrationId,
          uid: adminUser.user.uid,
        });

        const empUser = await createUserWithEmailAndPassword(
          auth,
          request.employeeEmail,
          request.employeePassword
        );
        await setDoc(doc(db, 'users', empUser.user.uid), {
          email: request.employeeEmail,
          role: 'employee',
          administrationId,
          uid: empUser.user.uid,
        });

        await deleteDoc(docRef);

        Alert.alert('Success', 'Administration approved successfully.');
      } catch (error: any) {
        console.error('Error accepting request:', error);
        Alert.alert('Error', error.message);
      }
    } else {
      await deleteDoc(docRef);
      Alert.alert('Request Rejected', 'The request has been rejected.');
    }

    setRequests((prev) => prev.filter((req) => req.id !== request.id));
  };

  const renderItem = ({ item }: { item: AdminRequest }) => (
    <View style={styles.card}>
      <Text style={styles.label}>
        Description: <Text style={styles.value}>{item.description}</Text>
      </Text>
      <Text style={styles.label}>
        Admin Name: <Text style={styles.value}>{item.adminName}</Text>
      </Text>
      <Text style={styles.label}>
        Admin Email: <Text style={styles.value}>{item.email}</Text>
      </Text>
      <Text style={styles.label}>
        Phone: <Text style={styles.value}>{item.phone}</Text>
      </Text>
      <Text style={styles.label}>
        Admin Password: <Text style={styles.code}>{item.adminPassword}</Text>
      </Text>
      <Text style={styles.label}>
        Employee Email: <Text style={styles.value}>{item.employeeEmail}</Text>
      </Text>
      <Text style={styles.label}>
        Employee Password: <Text style={styles.code}>{item.employeePassword}</Text>
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#28a745' }]}
          onPress={() => handleDecision(item, true)}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#dc3545' }]}
          onPress={() => handleDecision(item, false)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administration Requests</Text>

      {requests.length === 0 ? (
        <Text style={styles.empty}>No pending requests</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
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
  card: {
    backgroundColor: '#f4f4f4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontWeight: 'normal',
    color: '#000',
  },
  code: {
    fontWeight: 'bold',
    color: '#003366',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  button: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 60,
  },
});
