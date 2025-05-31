import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

const pendingFilesCount = 3; 

export default function EmployeeDashboard() {
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            router.push('/Login');
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Employee Dashboard</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Operations</Text>

        <View style={styles.buttonContainer}>
          <DashboardButton
            icon="📥"
            label="Receive Bordereau"
            onPress={() => router.push('/ReceiveBordereau')}
            count={pendingFilesCount}
          />
          <DashboardButton
            icon="📋"
            label="Files List"
            onPress={() => router.push('/FilesList')}
          />
          <DashboardButton
            icon="🧾"
            label="Manage File Types"
            onPress={() => router.push('/ManageFileTypes')}
          />
          <DashboardButton
            icon="🧭"
            label="Manage File Routes"
            onPress={() => router.push('/ManageRoutes')}
          />
          <DashboardButton
            icon="📨"
            label="Handle Recours"
            onPress={() => router.push('/RecoursManagement')}
          />
          <DashboardButton
            icon="🚪"
            label="Logout"
            onPress={handleLogout}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function DashboardButton({
  icon,
  label,
  onPress,
  count,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  count?: number;
}) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.centered}>
        <Text style={styles.buttonText}>{`${icon} ${label}`}</Text>
        {count && count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 16,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: '#003366',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -20,
    backgroundColor: 'red',
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
