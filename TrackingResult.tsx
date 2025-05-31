import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/Firebase';

export default function TrackingResult() {
  const { code } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState<any>(null);
  const [routeDetails, setRouteDetails] = useState<
    { id: string; name: string; status: string; isCurrent: boolean }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'citizenFiles'), where('trackingNumber', '==', code));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setFileData(null);
          setLoading(false);
          return;
        }

        const fileDoc = snapshot.docs[0];
        const file = fileDoc.data();

        const routeSnap = await getDocs(
          query(collection(db, 'fileRoutes'), where('fileTypeId', '==', file.fileTypeId))
        );
        if (routeSnap.empty) throw new Error('Route not found for this file type.');

        const routeData = routeSnap.docs[0].data();
        const routeIds: string[] = routeData.route;

        const adminSnap = await getDocs(collection(db, 'approvedAdministrations'));
        const adminMap: Record<string, string> = {};
        adminSnap.docs.forEach((doc) => {
          const data = doc.data();
          adminMap[doc.id] = data.adminName || 'Unknown Admin';
        });

        const statusPerAdmin = file.statusPerAdmin || {};
        const currentAdminId = file.administrationId;
        const currentIndex = routeIds.indexOf(currentAdminId);

        const path = routeIds.map((adminId, idx) => {
  const currentStatus = statusPerAdmin[adminId]?.toLowerCase() || 'pending';
  const nextAdminId = routeIds[idx + 1];
  const nextStatus = nextAdminId ? statusPerAdmin[nextAdminId]?.toLowerCase() : null;
  
  let displayStatus = currentStatus;
  let isCurrent = adminId === currentAdminId;

  // الحالة الخاصة للمحطات السابقة على الحالية
  if (idx < currentIndex) {
    if (nextStatus === 'approved') {
      displayStatus = 'completed';
    } else if (nextStatus === 'blocked') {
      displayStatus = 'blocked';
    } else {
      // لا نغير الحالة اذا لم تكن approved أو blocked في الإدارة التالية
      displayStatus = currentStatus;
    }
    isCurrent = false; // الإدارات السابقة ليست الحالية
  }

  // حالة الإدارة الحالية تتبع الحالة الحقيقية
  if (idx === currentIndex) {
    displayStatus = currentStatus;
    isCurrent = true;
  }

  // الإدارات التي لم تصل لها الملفات بعد (المستقبلية)
  if (idx > currentIndex) {
    displayStatus = 'pending';
    isCurrent = false;
  }

  // الحالة الخاصة للإدارة الأخيرة (وهي نفسها الأولى)
  if (idx === routeIds.length - 1 && routeIds[0] === adminId) {
    const beforeLastIndex = idx - 1;
    const beforeLastAdmin = routeIds[beforeLastIndex];
    const beforeLastStatus = statusPerAdmin[beforeLastAdmin]?.toLowerCase();

    if (beforeLastStatus === 'in transit' && currentStatus === 'approved') {
      // اجعل الأخيرة وقبل الأخيرة completed
      if (idx === currentIndex || beforeLastIndex === currentIndex) {
        if (adminId === currentAdminId) {
          displayStatus = 'completed';
          isCurrent = true;
        } else if (beforeLastAdmin === currentAdminId) {
          displayStatus = 'completed';
          isCurrent = true;
        }
      } else {
        // في حال لم تكن الحالية، عرض الحالة completed بدون التمييز كالحالية
        displayStatus = 'completed';
        isCurrent = false;
      }
    }
  }

  return {
    id: adminId,
    name: adminMap[adminId] || 'Unknown Admin',
    status: displayStatus,
    isCurrent,
  };
});


        setFileData({
          trackingNumber: code,
          citizenName: file.citizenName,
          fileType: file.fileType,
          createdAt: file.createdAt?.toDate?.() || null,
          status: file.status,
          currentStation: adminMap[currentAdminId] || 'Unknown Admin',
        });
        setRouteDetails(path);
      } catch (error: any) {
        console.error('Error loading tracking data:', error);
        setFileData(null);
      } finally {
        setLoading(false);
      }
    };

    if (code) fetchData();
  }, [code]);

  const handleRecours = () => {
    router.push({
  pathname: '/Recours',
  params: {
    code: fileData.trackingNumber,
    fileTypeId: fileData.fileTypeId, // تأكد أن هذه معلومة موجودة في fileData
    date: fileData.createdAt ? fileData.createdAt.toDateString() : '',
    currentAdminId: fileData.currentAdminId, // معرف الإدارة الحالية
  },
});

  };

  const getStatusColor = (status: string, isCurrent: boolean) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#999'; // رمادي
      case 'in progress':
      case 'in review':
        return isCurrent ? '#003366' : '#3b82f6'; // أزرق داكن أو فاتح
      case 'completed':
      case 'approved':
        return 'green';
      case 'in transit':
        return isCurrent ? '#003366' : '#0ea5e9'; // سماوي
      case 'blocked':
        return '#C62828'; // أحمر
      case 'rejected':
        return '#6B7280'; // رمادي غامق
      default:
        return '#999';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#003366" />
      </View>
    );
  }

  if (!fileData) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 40, fontSize: 18, color: '#999' }}>
          No file found with this tracking number.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tracking Number: {fileData.trackingNumber}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Citizen Name:</Text>
        <Text style={styles.value}>{fileData.citizenName}</Text>

        <Text style={styles.label}>File Type:</Text>
        <Text style={styles.value}>{fileData.fileType}</Text>

        <Text style={styles.label}>Date Submitted:</Text>
        <Text style={styles.value}>
          {fileData.createdAt ? fileData.createdAt.toLocaleDateString() : 'Unknown'}
        </Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{fileData.status}</Text>

        <Text style={styles.label}>Current Station:</Text>
        <Text style={styles.value}>{fileData.currentStation}</Text>
      </View>

      <Text style={styles.subTitle}>File Progress</Text>

      {routeDetails.map((step, index) => {
        const statusColor = getStatusColor(step.status, step.isCurrent);
        const isBlocked = step.status.toLowerCase() === 'blocked' && step.isCurrent;

        return (
          <View key={step.id} style={styles.step}>
            <View style={styles.stepContent}>
              <View style={styles.stepTextContainer}>
                <Text style={{ color: statusColor, fontWeight: step.isCurrent ? 'bold' : 'normal' }}>
                  {index + 1}. {step.name}
                </Text>
                <Text style={{ fontSize: 12, color: isBlocked ? '#C62828' : statusColor }}>
                  {isBlocked ? 'Blocked' : step.status}
                </Text>
              </View>
              <Ionicons
                name="arrow-down"
                size={18}
                color={isBlocked ? '#C62828' : step.isCurrent ? '#003366' : statusColor}
              />
            </View>
          </View>
        );
      })}

      {fileData.status.toLowerCase() === 'blocked' && (
        <TouchableOpacity style={styles.button} onPress={handleRecours}>
          <Text style={styles.buttonText}>Submit a Complaint</Text>
        </TouchableOpacity>
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
  infoBox: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  label: {
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    marginBottom: 10,
    fontSize: 16,
    color: '#000',
  },
  subTitle: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
    color: '#003366',
  },
  step: {
    backgroundColor: '#eee',
    padding: 12,
    marginBottom: 10,
    borderRadius: 6,
  },
  stepContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTextContainer: {
    flex: 1,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#C62828',
    padding: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
