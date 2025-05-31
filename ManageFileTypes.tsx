import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList,
  StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, getDoc
} from 'firebase/firestore';
import { db, auth } from '../config/Firebase';

interface FileType {
  id: string;
  name: string;
  requiredDocs: string[];
  createdBy: string;
  administrationId: string;
}

export default function ManageFileTypes() {
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [fileTypeName, setFileTypeName] = useState('');
  const [newDoc, setNewDoc] = useState('');
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [administrationId, setAdministrationId] = useState<string | null>(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (uid) {
      fetchUserAdministrationId();
    }
  }, [uid]);

  useEffect(() => {
    if (uid && administrationId) {
      fetchFileTypes();
    }
  }, [uid, administrationId]);

  const fetchUserAdministrationId = async () => {
    if (!uid) return;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.administrationId) {
        setAdministrationId(userData.administrationId);
      }
    }
  };

  const fetchFileTypes = async () => {
    try {
      const q = query(collection(db, 'fileTypes'), where('administrationId', '==', administrationId));
      const snapshot = await getDocs(q);
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileType));
      setFileTypes(types);
    } catch (error) {
      console.error('Error fetching file types:', error);
    }
  };

  const addDocField = () => {
    if (!newDoc.trim()) return;
    setRequiredDocs([...requiredDocs, newDoc.trim()]);
    setNewDoc('');
  };

  const removeDoc = (index: number) => {
    const updated = [...requiredDocs];
    updated.splice(index, 1);
    setRequiredDocs(updated);
  };

  const createOrUpdateFileType = async () => {
    if (!fileTypeName.trim()) {
      Alert.alert("Validation", "Please enter a file type name.");
      return;
    }

    if (!administrationId || !uid) {
      Alert.alert("Error", "Missing administration ID or user ID.");
      return;
    }

    try {
      if (editingId) {
        const docRef = doc(db, 'fileTypes', editingId);
        await updateDoc(docRef, {
          name: fileTypeName.trim(),
          requiredDocs,
        });
      } else {
        await addDoc(collection(db, 'fileTypes'), {
          name: fileTypeName.trim(),
          requiredDocs,
          createdBy: uid,
          administrationId,
          createdAt: new Date()
        });
      }

      resetForm();
      fetchFileTypes();
    } catch (error) {
      console.error('Error saving file type:', error);
    }
  };

  const confirmDeleteFileType = (id: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this file type?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteFileType(id),
        }
      ]
    );
  };

  const deleteFileType = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'fileTypes', id));
      fetchFileTypes();
    } catch (error) {
      console.error('Error deleting file type:', error);
    }
  };

  const startEditFileType = (file: FileType) => {
    setEditingId(file.id);
    setFileTypeName(file.name);
    setRequiredDocs(file.requiredDocs);
  };

  const resetForm = () => {
    setFileTypeName('');
    setRequiredDocs([]);
    setEditingId(null);
  };

  const renderFileType = ({ item: file }: { item: FileType }) => (
    <View key={file.id} style={styles.card}>
      <Text style={styles.cardTitle}>{file.name}</Text>
      {file.requiredDocs.map((doc, i) => (
        <Text key={i} style={styles.cardDoc}>- {doc}</Text>
      ))}
      <View style={styles.cardButtons}>
        <TouchableOpacity style={styles.editButton} onPress={() => startEditFileType(file)}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDeleteFileType(file.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={fileTypes}
      keyExtractor={(file) => file.id}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Manage File Types</Text>

          <TextInput
            placeholder="Enter file type name"
            style={styles.input}
            value={fileTypeName}
            onChangeText={setFileTypeName}
          />

          <View style={styles.docRow}>
            <TextInput
              placeholder="Add required document"
              style={[styles.input, { flex: 1 }]}
              value={newDoc}
              onChangeText={setNewDoc}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDocField}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {requiredDocs.length > 0 ? (
            requiredDocs.map((doc, index) => (
              <View key={index} style={styles.docItem}>
                <Text style={styles.docText}>• {doc}</Text>
                <TouchableOpacity onPress={() => removeDoc(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No documents added yet</Text>
          )}

          <TouchableOpacity style={styles.createButton} onPress={createOrUpdateFileType}>
            <Text style={styles.createButtonText}>
              {editingId ? 'Update File Type' : 'Create File Type'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>Existing File Types</Text>
        </>
      }
      renderItem={renderFileType}
      ListEmptyComponent={<Text style={styles.emptyText}>No file types found.</Text>}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 20, fontWeight: '600', marginVertical: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  addButton: {
    marginLeft: 10, backgroundColor: '#007bff',
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  createButton: {
    backgroundColor: '#28a745', padding: 14,
    alignItems: 'center', borderRadius: 10, marginTop: 10,
  },
  createButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  docItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  docText: { fontSize: 16 },
  removeText: { color: 'red' },
  emptyText: { color: '#666', fontStyle: 'italic' },
  card: {
    backgroundColor: '#f5f5f5', borderRadius: 10,
    padding: 16, marginBottom: 15,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  cardDoc: { marginLeft: 10, fontSize: 16 },
  cardButtons: {
    flexDirection: 'row', justifyContent: 'flex-end',
    gap: 10, marginTop: 10,
  },
  editButton: {
    backgroundColor: '#ffc107', padding: 10,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545', padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
