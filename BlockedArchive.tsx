import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';

const blockedFilesMock = [
  {
    id: '1',
    trackingNumber: '1',
    citizenName: 'Ahmed Ben Salah',
    fileType: 'Demande de logement',
    reason: 'الوثيقة ناقصة: إثبات السكن',
    date: '2025-05-01',
  },
  {
    id: '2',
    trackingNumber: '2',
    citizenName: 'Sonia Merabet',
    fileType: 'Demande de bourse',
    reason: 'الملف غير موقع',
    date: '2025-05-03',
  },
];

export default function BlockedArchive() {
  const renderItem = ({ item }: { item: typeof blockedFilesMock[0] }) => (
    <View style={styles.card}>
      <Text style={styles.title}>📄 {item.fileType}</Text>
      <Text style={styles.detail}>
        <Text style={styles.label}>Citizen:</Text> {item.citizenName}
      </Text>
      <Text style={styles.detail}>
        <Text style={styles.label}>Tracking #:</Text> {item.trackingNumber}
      </Text>
      <Text style={styles.detail}>
        <Text style={styles.label}>Date:</Text> {item.date}
      </Text>
      <Text style={styles.detail}>
        <Text style={styles.label}>Reason:</Text> {item.reason}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push({
            pathname: '/FileDetails',
            params: { id: item.id },
          })
        }
      >
        <Text style={styles.buttonText}>🔍 View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>📁 Blocked Files Archive</Text>
      <FlatList
        data={blockedFilesMock}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No blocked files at the moment.</Text>
        }
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
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e06666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a10000',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    color: '#a10000',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#a10000',
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
