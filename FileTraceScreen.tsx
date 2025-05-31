import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList } from 'react-native';

export default function FileTraceScreen() {
  const [fileId, setFileId] = useState('');
  const [traceData, setTraceData] = useState<
    { dept: string; handler: string; dateIn: string; dateOut: string }[] | null
  >(null);

 
  const dummyTrace: {
    [key: string]: { dept: string; handler: string; dateIn: string; dateOut: string }[];
  } = {
    '001': [
      { dept: 'Reception', handler: 'Ali', dateIn: '2024-01-01', dateOut: '2024-01-02' },
      { dept: 'Office A', handler: 'Sarah', dateIn: '2024-01-02', dateOut: '2024-01-04' },
      { dept: 'Archive', handler: 'John', dateIn: '2024-01-04', dateOut: '2024-01-05' },
    ],
    '002': [
      { dept: 'Reception', handler: 'Nora', dateIn: '2024-02-10', dateOut: '2024-02-11' },
      { dept: 'Office B', handler: 'Omar', dateIn: '2024-02-11', dateOut: '2024-02-13' },
    ],
  };

  const handleSearch = (id: string) => {
    setTraceData(dummyTrace[id] || null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trace File Details</Text>

      <TextInput
        placeholder="Enter File ID"
        style={styles.input}
        value={fileId}
        onChangeText={(text) => {
          setFileId(text);
          handleSearch(text);
        }}
      />

      {traceData ? (
        <FlatList
          data={traceData}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.traceItem}>
              <Text style={styles.stepTitle}>Step {index + 1}</Text>
              <Text>Department: {item.dept}</Text>
              <Text>Handled By: {item.handler}</Text>
              <Text>Entry Date: {item.dateIn}</Text>
              <Text>Exit Date: {item.dateOut}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noData}>No data found for this file.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#003366',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  traceItem: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#003366',
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
});
