import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/Firebase'; // عدل المسار حسب موقع ملفك

export default function Logout() {
  useFocusEffect(
    useCallback(() => {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            onPress: () => {
              router.back();
            },
            style: 'cancel',
          },
          {
            text: 'Logout',
            onPress: async () => {
              try {
                await signOut(auth);
                router.replace('/Login');
              } catch (error) {
                Alert.alert('Logout Error', error.message);
              }
            },
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    }, [])
  );

  return null;
}
