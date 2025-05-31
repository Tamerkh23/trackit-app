import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Checkbox,
  Button,
  Title,
  Divider,
  SegmentedButtons,
  Menu,
} from 'react-native-paper';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/Firebase';

interface Citizen {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
}

interface FileType {
  id: string;
  name: string;
  requiredDocs: string[];
}

const ReceiveBordereau = () => {
  const [mode, setMode] = useState<'receive' | 'add'>('add');
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [fileTypes, setFileTypes] = useState<FileType[]>([]);
  const [citizenName, setCitizenName] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [checkedDocs, setCheckedDocs] = useState<{ [key: string]: boolean }>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCitizens, setFilteredCitizens] = useState<Citizen[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [administrationId, setAdministrationId] = useState('');
  const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const uid = auth.currentUser?.uid;

  const selectedFile = fileTypes.find((f) => f.name === selectedFileType);
  const docsToCheck = selectedFile?.requiredDocs || [];
  const isAllDocsChecked = docsToCheck.every((doc) => checkedDocs[doc]);

  useEffect(() => {
    if (uid) {
      fetchEmployeeInfo();
      fetchCitizens();
    }
  }, [uid]);

  useEffect(() => {
    if (administrationId) {
      fetchFileTypes();
      fetchReceivedFiles();
    }
  }, [administrationId]);

  const fetchEmployeeInfo = async () => {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      setEmployeeData(data);
      setAdministrationId(data.administrationId);
    }
  };

  const fetchFileTypes = async () => {
    if (!administrationId) return;
    const q = query(collection(db, 'fileTypes'), where('administrationId', '==', administrationId));
    const snapshot = await getDocs(q);
    const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileType));
    setFileTypes(types);
  };

  const fetchReceivedFiles = async () => {
    setLoadingFiles(true);
    try {
      const q = query(
        collection(db, 'citizenFiles'),
        where('status', '==', 'In Transit'),
        where('nextAdministrationId', '==', administrationId)
      );
      const snapshot = await getDocs(q);
      const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReceivedFiles(files);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch received files.');
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchCitizens = async () => {
    const snapshot = await getDocs(collection(db, 'citizens'));
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Citizen));
    setCitizens(users);
  };

  const handleCitizenNameChange = (text: string) => {
    setCitizenName(text);
    if (text.trim().length === 0) {
      setFilteredCitizens([]);
      setShowSuggestions(false);
      return;
    }
    const matches = citizens.filter((citizen) =>
      citizen.fullName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCitizens(matches);
    setShowSuggestions(true);
  };

  const handleSelectCitizen = (citizen: Citizen) => {
    setCitizenName(citizen.fullName);
    setCitizenId(citizen.nationalId);
    setPhone(citizen.phone);
    setShowSuggestions(false);
  };

  const handleCreateFile = async () => {
  if (!citizenName || !citizenId || !selectedFileType || !isAllDocsChecked || !uid) {
    Alert.alert('Validation', 'Please complete all required fields.');
    return;
  }

  try {
    const selectedFile = fileTypes.find((f) => f.name === selectedFileType);
    if (!selectedFile) throw new Error("Invalid file type selected.");

    const routeQuery = query(
      collection(db, 'fileRoutes'),
      where('fileTypeId', '==', selectedFile.id)
    );
    const routeSnap = await getDocs(routeQuery);
    if (routeSnap.empty) throw new Error("Route not found for this file type");

    const route = routeSnap.docs[0].data().route as string[];
    const administrationFirstId = route[0];
    const administrationNextId = route[1] || null;


    const statusPerAdmin: { [key: string]: string } = {};
    route.forEach(adminId => {
      statusPerAdmin[adminId] = 'Pending';
    });

    const trackingNumber = `TRK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await addDoc(collection(db, 'citizenFiles'), {
      citizenName: citizenName.trim(),
      citizenId: citizenId.trim(),
      phone: phone.trim(),
      fileType: selectedFile.name,
      fileTypeId: selectedFile.id,
      documents: docsToCheck,
      trackingNumber,
      createdBy: uid,
      administrationId: administrationFirstId,
      nextAdministrationId: administrationNextId,
      status: 'Pending',
      statusPerAdmin,  
      source: 'new',
      notes: '',
      createdAt: Timestamp.now(),
    });

    Alert.alert('✅ File Created', `Tracking Number: ${trackingNumber}`);
    resetForm();
  } catch (error) {
    Alert.alert('❌ Error', error.message || 'Failed to create file.');
  }
};


  const resetForm = () => {
    setCitizenName('');
    setCitizenId('');
    setPhone('');
    setSelectedFileType('');
    setCheckedDocs({});
    setShowSuggestions(false);
  };

  const toggleCheckbox = (doc: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [doc]: !prev[doc],
    }));
  };

  const handleConfirmReception = async (fileId: string) => {
  try {
    const fileRef = doc(db, 'citizenFiles', fileId);
    const fileSnap = await getDoc(fileRef);
    if (!fileSnap.exists()) throw new Error("File not found");

    const fileData = fileSnap.data();

    if (fileData.nextAdministrationId !== administrationId) {
      Alert.alert("❌ Unauthorized", "You are not authorized to receive this file.");
      return;
    }

    const routeQuery = query(
      collection(db, 'fileRoutes'),
      where('fileTypeId', '==', fileData.fileTypeId)
    );
    const routeSnap = await getDocs(routeQuery);
    if (routeSnap.empty) throw new Error("Route not found for this file type");

    const routeData = routeSnap.docs[0].data().route as string[];

    const currentAdminIndex = routeData.indexOf(administrationId);
    const newNextAdmin = routeData[currentAdminIndex + 1] || null;

    const updatedStatusPerAdmin = { ...fileData.statusPerAdmin };


    updatedStatusPerAdmin[administrationId] = 'In Review';

    await updateDoc(fileRef, {
      status: 'In Review',
      administrationId: administrationId,
      nextAdministrationId: newNextAdmin,
      source: 'transferred',
      statusPerAdmin: updatedStatusPerAdmin,
    });

    Alert.alert('✅ Reception Confirmed', `File ID ${fileId} is now in review.`);
    fetchReceivedFiles();
  } catch (error) {
    Alert.alert('❌ Error', error.message);
  }
};




  const handleRejectFile = async (fileId: string) => {
    try {
      const fileRef = doc(db, 'citizenFiles', fileId);
      await updateDoc(fileRef, { status: 'Blocked' });
      Alert.alert('⚠️ File Blocked', `File ID ${fileId} has been marked as blocked.`);
      fetchReceivedFiles();
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to block the file.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.header}>📂 File Processing</Title>

      <SegmentedButtons
        value={mode}
        onValueChange={(val) => {
          setMode(val as 'add' | 'receive');
          setCheckedDocs({});
        }}
        buttons={[
          { value: 'receive', label: 'Confirm Reception' },
          { value: 'add', label: 'Add New File' },
        ]}
        style={{ marginBottom: 20 }}
      />

      {/* واجهة الإضافة */}
      {mode === 'add' && (
        <Card style={styles.card}>
          <Card.Title title="🆕 New Citizen File" />
          <Card.Content>
            <TextInput
              style={styles.input}
              placeholder="Citizen Full Name"
              value={citizenName}
              onChangeText={handleCitizenNameChange}
            />
            {showSuggestions && (
              <FlatList
                data={filteredCitizens}
                keyExtractor={(item) => item.id}
                style={styles.suggestionList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSelectCitizen(item)}
                  >
                    <Text>{item.fullName}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TextInput
              style={styles.input}
              placeholder="National ID"
              value={citizenId}
              onChangeText={setCitizenId}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.sectionTitle}>File Type:</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TextInput
                  style={styles.input}
                  placeholder="Search or select file type"
                  value={selectedFileType || searchQuery}
                  onFocus={() => {
                    setMenuVisible(true);
                    setSearchQuery('');
                  }}
                  onChangeText={setSearchQuery}
                />
              }
            >
              {fileTypes
                .filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((file) => (
                  <Menu.Item
                    key={file.id}
                    onPress={() => {
                      setSelectedFileType(file.name);
                      setMenuVisible(false);
                      setCheckedDocs({});
                    }}
                    title={file.name}
                  />
                ))}
            </Menu>
            {selectedFileType && (
              <>
                <Divider style={{ marginVertical: 10 }} />
                <Text style={styles.sectionTitle}>Required Documents:</Text>
                {docsToCheck.map((doc) => (
                  <View key={doc} style={styles.checkboxContainer}>
                    <Checkbox
                      status={checkedDocs[doc] ? 'checked' : 'unchecked'}
                      onPress={() => toggleCheckbox(doc)}
                    />
                    <Text style={styles.checkboxLabel}>{doc}</Text>
                  </View>
                ))}
              </>
            )}
            <Divider style={{ marginVertical: 10 }} />
            <Button
              mode="contained"
              disabled={!citizenName || !citizenId || !selectedFileType || !isAllDocsChecked}
              onPress={handleCreateFile}
            >
              Create File
            </Button>
            {!isAllDocsChecked && (
              <Button mode="outlined" onPress={resetForm} style={{ marginTop: 10 }}>
                Cancel
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

      {}
      {mode === 'receive' && (
        loadingFiles ? (
          <Text>⏳ Loading files...</Text>
        ) : receivedFiles.length === 0 ? (
          <Text>No files to receive.</Text>
        ) : (
          receivedFiles.map((file) => (
            <Card key={file.id} style={styles.card}>
              <Card.Title title={file.citizenName} subtitle={`Type: ${file.fileType}`} />
              <Card.Content>
                <Text>Required Documents:</Text>
                {file.documents.map((doc: string) => (
                  <View key={doc} style={styles.checkboxContainer}>
                    <Checkbox
                      status={checkedDocs[`${file.id}-${doc}`] ? 'checked' : 'unchecked'}
                      onPress={() =>
                        setCheckedDocs((prev) => ({
                          ...prev,
                          [`${file.id}-${doc}`]: !prev[`${file.id}-${doc}`],
                        }))
                      }
                    />
                    <Text style={styles.checkboxLabel}>{doc}</Text>
                  </View>
                ))}
                <Divider style={{ marginVertical: 10 }} />
                <Button
                  mode="contained"
                  onPress={() => handleConfirmReception(file.id)}
                  disabled={!file.documents.every((doc: string) => checkedDocs[`${file.id}-${doc}`])}
                >
                  Confirm Reception
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => handleRejectFile(file.id)}
                  style={{ marginTop: 8 }}
                >
                  File not complete
                </Button>
              </Card.Content>
            </Card>
          ))
        )
      )}
    </ScrollView>
  );
};

export default ReceiveBordereau;

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { marginBottom: 16, textAlign: 'center' },
  card: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  suggestionList: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    maxHeight: 150,
    marginBottom: 10,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
