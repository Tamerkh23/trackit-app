import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

export default function AdminDashboard() {
  const [blockedCount, setBlockedCount] = useState(3); 

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
          onPress: () => router.push('/Login'),
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.buttonContainer}>
        <DashboardButton text="📊 Statistics" onPress={() => router.push('/AdminStats')} />

        <View style={styles.notificationWrapper}>
          <DashboardButton text="🗂️ Blocked Files Archive" onPress={() => router.push('/BlockedArchive')} />
          {blockedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{blockedCount}</Text>
            </View>
          )}
        </View>

        <DashboardButton text="🚪 Logout" onPress={handleLogout} />
      </View>
    </View>
  );
}

function DashboardButton({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 20,
  },
  button: {
    backgroundColor: '#003366',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  notificationWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -10,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
