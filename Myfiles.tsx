import React, { useState, useEffect } from 'react';
import {
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  View,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { db, auth } from '../../config/Firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

type FileType = {
  code: string;
  type: string;
  status: string;
  date: string;
};

export default function MyFiles() {
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserFiles = async () => {
      setLoading(true);

      try {
        const user = auth.currentUser;
        if (!user) {
          setFiles([]);
          setLoading(false);
          return;
        }

        const userTrackedFilesRef = collection(db, 'userTrackedFiles');
        const q = query(userTrackedFilesRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        const trackedNumbers = querySnapshot.docs.map(doc => doc.data().trackingNumber);

      
        const fetchedFiles: FileType[] = [];

        for (const trackingNumber of trackedNumbers) {
          const fileQuery = query(
            collection(db, 'citizenFiles'),
            where('trackingNumber', '==', trackingNumber)
          );
          const fileSnapshot = await getDocs(fileQuery);

          if (!fileSnapshot.empty) {
            const fileDoc = fileSnapshot.docs[0];
            const data = fileDoc.data();

            fetchedFiles.push({
              code: data.trackingNumber,
              type: data.fileType || 'Unknown',
              status: data.status || 'Unknown',
              date: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : 'Unknown',
            });
          }
        }

        setFiles(fetchedFiles);
      } catch (error) {
        console.error('Error fetching tracked files:', error);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserFiles();
  }, []);

  const renderItem = ({ item }: { item: FileType }) => (
    <View style={styles.card}>
      <Text style={styles.label}>
        Tracking Number: <Text style={styles.value}>{item.code}</Text>
      </Text>
      <Text style={styles.label}>
        File Type: <Text style={styles.value}>{item.type}</Text>
      </Text>
      <Text style={styles.label}>
        Status: <Text style={styles.value}>{item.status}</Text>
      </Text>
      <Text style={styles.label}>
        Date Submitted: <Text style={styles.value}>{item.date}</Text>
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: '/TrackingResult',
            params: {
              code: item.code,
              type: item.type,
              date: item.date,
            },
          })
        }>
        <Text style={styles.buttonText}>Track</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#003366" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Tracked Files</Text>
      <FlatList
        data={files}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>You haven’t tracked any files yet.</Text>
        }
      />
    </SafeAreaView>
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
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontWeight: '600',
    color: '#333',
  },
  value: {
    fontWeight: 'normal',
    color: '#000',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#003366',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
});
