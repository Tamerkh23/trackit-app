import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { db, auth } from '../config/Firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

type Complaint = {
  id: string;
  trackingNumber: string;
  message: string;
  administrationId: string;

  citizenName?: string;
  fileType?: string;
  date?: string;
  status?: string;
};

export default function RecoursManagement() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          setComplaints([]);
          setLoading(false);
          return;
        }

        const complaintsRef = collection(db, 'complaints');
        const q = query(complaintsRef, where('administrationId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const tempComplaints: Complaint[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();

    
          const fileQuery = query(
            collection(db, 'citizenFiles'),
            where('trackingNumber', '==', data.trackingNumber)
          );
          const fileSnap = await getDocs(fileQuery);

          if (!fileSnap.empty) {
            const fileDoc = fileSnap.docs[0].data();
            if (fileDoc.status && fileDoc.status.toLowerCase() === 'blocked') {
              tempComplaints.push({
                id: docSnap.id,
                trackingNumber: data.trackingNumber,
                message: data.message,
                administrationId: data.administrationId,
                citizenName: fileDoc.citizenName || 'Unknown',
                fileType: fileDoc.fileType || 'Unknown',
                date: fileDoc.createdAt ? fileDoc.createdAt.toDate().toLocaleDateString() : 'Unknown',
                status: fileDoc.status,
              });
            }
          }
        }

        setComplaints(tempComplaints);
      } catch (error) {
        console.error('Error loading complaints:', error);
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const renderItem = ({ item }: { item: Complaint }) => (
    <View style={styles.card}>
      <Text style={styles.title}>📄 {item.fileType}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Citizen:</Text> {item.citizenName}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Tracking #:</Text> {item.trackingNumber}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Date:</Text> {item.date}</Text>
      <Text style={styles.detail}><Text style={styles.label}>Message:</Text> {item.message}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: '/FileDetails',
            params: { id: item.trackingNumber },
          })
        }
      >
        <Text style={styles.buttonText}>📂 View / Manage File</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>📨 Incoming Complaints</Text>
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No complaints yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#003366',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    color: '#003366',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#003366',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: '#666',
  },
});
