import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/Firebase';

type FileItem = {
  id: string;
  citizenName: string;
  fileType: string;
  status: string;
  source?: 'new' | 'transferred';
};

export default function FilesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [administrationId, setAdministrationId] = useState('');

  useEffect(() => {
    getCurrentAdmin();
  }, []);

  useEffect(() => {
    if (administrationId) fetchFiles();
  }, [administrationId]);

  const getCurrentAdmin = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const adminId = snapshot.docs[0].data().administrationId;
      setAdministrationId(adminId);
    }
  };

  const fetchFiles = async () => {
    const q = query(
      collection(db, 'citizenFiles'),
      where('administrationId', '==', administrationId),
      
    );
    const snapshot = await getDocs(q);
    const data: FileItem[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as FileItem[];
    setFiles(data);
  };

  const filteredFiles = files.filter((file) =>
    file.citizenName.toLowerCase().includes(searchQuery.toLowerCase())
  );

 const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#f59e0b'; // برتقالي
    case 'approved':
      return '#10b981'; // أخضر
    case 'rejected':
      return '#6B7280'; // رمادي داكن
    case 'in review':
      return '#3b82f6'; // أزرق
    case 'in transit':
      return '#0ea5e9'; // سماوي فاتح
    case 'blocked':
      return '#ef4444'; // أحمر
    default:
      return '#6b7280'; // رمادي
  }
};


  const renderItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/FileDetails', params: { id: item.id } })}
    >
      <Text style={styles.name}>{item.citizenName}</Text>
      <Text style={styles.info}>Type: {item.fileType}</Text>
      <Text style={[styles.info, { color: getStatusColor(item.status) }]}>
        Status: {item.status}
      </Text>
      <Text style={styles.sourceLabel}>
        {item.source === 'transferred' ? '📦 From another department' : '📝 New file'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Files in This Department</Text>
      <TextInput
        style={styles.search}
        placeholder="Search by citizen name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredFiles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No files found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#003366',
    textAlign: 'center',
  },
  search: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  info: {
    fontSize: 14,
    marginTop: 4,
  },
  sourceLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#9CA3AF',
  },
});
