import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ScrollView, Alert
} from 'react-native';
import {
  collection, getDocs, doc, setDoc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../config/Firebase';

export default function ManageRoutes() {
  const [fileTypes, setFileTypes] = useState<{ id: string, name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);
  const [adminMap, setAdminMap] = useState<{ [key: string]: string }>({});
  const [selectedFileType, setSelectedFileType] = useState<{ id: string, name: string } | null>(null);
  const [fileTypeSearch, setFileTypeSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userUid = auth.currentUser?.uid;
        if (!userUid) return;

        const userSnap = await getDocs(collection(db, 'users'));
        const currentUserDoc = userSnap.docs.find(doc => doc.data().uid === userUid);

        if (!currentUserDoc) {
          console.warn("User not found in 'users' collection");
          return;
        }

        const adminId = currentUserDoc.data().administrationId;
        setCurrentAdminId(adminId);

        const fileSnap = await getDocs(collection(db, 'fileTypes'));

        const fileTypeList = fileSnap.docs
          .map(doc => ({
            id: doc.id,
            name: doc.data().name || '',
            administrationId: doc.data().administrationId || ''
          }))
          .filter(file => file.administrationId === adminId);

        const adminSnap = await getDocs(collection(db, 'approvedAdministrations'));
        const deptList = adminSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().adminName
        })).filter(dep => dep.name && dep.name.trim() !== '');

        const map: { [key: string]: string } = {};
        deptList.forEach(dep => {
          map[dep.id] = dep.name;
        });

        setFileTypes(fileTypeList);
        setDepartments(deptList);
        setAdminMap(map);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    fetchData();
  }, []);

  const handleSelectDepartment = (id: string) => {
    if (!selectedDepartments.includes(id)) {
      setSelectedDepartments([...selectedDepartments, id]);
    }
  };

  const handleRemoveDepartment = (id: string) => {
    setSelectedDepartments(selectedDepartments.filter(d => d !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...selectedDepartments];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    setSelectedDepartments(newList);
  };

  const moveDown = (index: number) => {
    if (index === selectedDepartments.length - 1) return;
    const newList = [...selectedDepartments];
    [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
    setSelectedDepartments(newList);
  };

  const handleSave = async () => {
    if (!selectedFileType || selectedDepartments.length === 0) {
      Alert.alert("Warning", "Please select a file type and at least one department.");
      return;
    }

    try {
      const routeWithReturn = [...selectedDepartments];
      const firstDepartment = selectedDepartments[0];
      if (firstDepartment) {
        routeWithReturn.push(firstDepartment);
      }

      const ref = doc(db, 'fileRoutes', selectedFileType.id);
      await setDoc(ref, {
        fileTypeId: selectedFileType.id,
        fileTypeName: selectedFileType.name,
        route: routeWithReturn,
        createdBy: auth.currentUser?.email || 'unknown',
        createdAt: serverTimestamp()
      });

      Alert.alert("Success", "Route saved successfully");

      setSelectedFileType(null);
      setFileTypeSearch('');
      setSelectedDepartments([]);
    } catch (error) {
      console.error("Error saving route:", error);
      Alert.alert("Error", "Failed to save the route.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Manage File Routes</Text>

      <TextInput
        style={styles.input}
        placeholder="Search or select file type"
        value={fileTypeSearch}
        onFocus={() => setShowDropdown(true)}
        onChangeText={(text) => {
          setFileTypeSearch(text);
          setShowDropdown(true);
        }}
      />

      {showDropdown && (
        <View style={styles.dropdown}>
          {fileTypes
            .filter((type) =>
              type.name.toLowerCase().includes(fileTypeSearch.toLowerCase())
            )
            .map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dropdownItem}
                onPress={async () => {
                  setSelectedFileType(item);
                  setFileTypeSearch(item.name);
                  setShowDropdown(false);

                  const existing = await getDoc(doc(db, 'fileRoutes', item.id));
                  if (existing.exists()) {
                    const data = existing.data();
                    setSelectedDepartments(data.route || []);
                  } else {
                    setSelectedDepartments([]);
                  }
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
      )}

      {selectedFileType && (
        <>
          <Text style={styles.subtitle}>Available Departments</Text>
          <View style={styles.departmentsContainer}>
            {departments
              .filter(dep => !selectedDepartments.includes(dep.id))
              .map((dep, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.departmentButton}
                  onPress={() => handleSelectDepartment(dep.id)}
                >
                  <Text style={styles.departmentText}>{dep.name}</Text>
                </TouchableOpacity>
              ))}
          </View>

          <Text style={styles.subtitle}>Route for "{selectedFileType.name}"</Text>
          <FlatList
  data={
    selectedDepartments.length > 1 &&
    selectedDepartments[selectedDepartments.length - 1] === selectedDepartments[0]
      ? selectedDepartments.slice(0, -1)
      : selectedDepartments
  }
  keyExtractor={(item, index) => `${item}-${index}`}
  renderItem={({ item, index }) => (
    <View style={styles.selectedItem}>
      <Text style={styles.stepLabel}>
        {index + 1}. {adminMap[item] || item}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => moveUp(index)}>
          <Text style={styles.actionText}>⬆</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => moveDown(index)}>
          <Text style={styles.actionText}>⬇</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleRemoveDepartment(item)}>
          <Text style={styles.actionText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
  ListEmptyComponent={<Text style={styles.emptyText}>No departments selected yet.</Text>}
/>


          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>💾 Save Route</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
    marginBottom: 16,
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
    color: '#003366',
  },
  departmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  departmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#e1e7f5',
    borderRadius: 8,
    margin: 4,
  },
  departmentText: {
    fontSize: 14,
    color: '#003366',
    fontWeight: '500',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 16,
    color: '#003366',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionText: {
    fontSize: 18,
    color: '#003366',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
