import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { useAuth } from '../../hooks/useAuth';

export default function DrawerLayout() {
  const { theme } = useAuth();
  const { width } = useWindowDimensions();
  const responsiveDrawerWidth = Math.min(320, Math.max(260, Math.round(width * 0.82)));

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: theme.surface,
          width: responsiveDrawerWidth,
        },
        swipeEdgeWidth: 80,
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Home' }} />
      <Drawer.Screen name="skills" options={{ title: 'My Skills' }} />
      <Drawer.Screen name="practice" options={{ title: 'Practice Sessions' }} />
      <Drawer.Screen name="planner" options={{ title: 'Weekly Planner' }} />
      <Drawer.Screen name="timetable" options={{ title: 'College Timetable' }} />
      <Drawer.Screen name="internal-exams" options={{ title: 'Internal Exams' }} />
      <Drawer.Screen name="external-exams" options={{ title: 'External Exams' }} />
      <Drawer.Screen name="calculator" options={{ title: 'Calculator' }} />
      <Drawer.Screen name="expenses" options={{ title: 'Expenses / Purchases' }} />
      <Drawer.Screen name="progress" options={{ title: 'Progress' }} />
      <Drawer.Screen name="achievements" options={{ title: 'Achievements' }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
    </Drawer>
  );
}
