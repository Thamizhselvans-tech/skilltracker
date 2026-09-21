import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export const CustomDrawerContent = (props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, theme } = useAuth();

  const menuItems = [
    { name: 'Home', route: '/', icon: 'home-outline', activeIcon: 'home' },
    { name: 'My Skills', route: '/skills', icon: 'ribbon-outline', activeIcon: 'ribbon' },
    { name: 'Practice Sessions', route: '/practice', icon: 'timer-outline', activeIcon: 'timer' },
    { name: 'Weekly Planner', route: '/planner', icon: 'calendar-outline', activeIcon: 'calendar' },
    { name: 'College Timetable', route: '/timetable', icon: 'school-outline', activeIcon: 'school' },
    { name: 'Internal Exams', route: '/internal-exams', icon: 'document-text-outline', activeIcon: 'document-text' },
    { name: 'External Exams', route: '/external-exams', icon: 'newspaper-outline', activeIcon: 'newspaper' },
    { name: 'Calculator', route: '/calculator', icon: 'calculator-outline', activeIcon: 'calculator' },
    { name: 'Expenses / Purchases', route: '/expenses', icon: 'wallet-outline', activeIcon: 'wallet' },
    { name: 'Progress', route: '/progress', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
    { name: 'Achievements', route: '/achievements', icon: 'trophy-outline', activeIcon: 'trophy' },
    { name: 'Startup', route: '/startup', icon: 'rocket-outline', activeIcon: 'rocket' },
    { name: 'Settings', route: '/settings', icon: 'settings-outline', activeIcon: 'settings' },
    { name: 'Profile', route: '/profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  const handleNavigate = (route) => {
    props.navigation.closeDrawer();
    router.replace(route);
  };

  const handleLogout = async () => {
    props.navigation.closeDrawer();
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      {/* App Brand Header */}
      <View style={[styles.brandHeader, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={[styles.brandTitle, { color: theme.text }]}>SkillTracker</Text>
          <Text style={[styles.brandSubtitle, { color: theme.primary }]}>STUDENT + STARTUP</Text>
        </View>
      </View>

      {/* Top Profile Header */}
      <TouchableOpacity
        style={[styles.profileHeader, { borderBottomColor: theme.border, backgroundColor: theme.background }]}
        onPress={() => handleNavigate('/profile')}
      >
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {user?.name || 'Student Name'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]} numberOfLines={1}>
            {user?.email || 'student@college.edu'}
          </Text>
          {(user?.college || user?.year) && (
            <Text style={[styles.userMeta, { color: theme.primaryLight }]} numberOfLines={1}>
              {[user.year, user.department || user.college].filter(Boolean).join(' • ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* 15 Drawer Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuGroup}>
          <Text style={[styles.groupTitle, { color: theme.textSubtle }]}>MAIN NAVIGATION</Text>
          {menuItems.map((item, index) => {
            const isActive =
              item.route === '/'
                ? pathname === '/' || pathname === '/(drawer)'
                : pathname.startsWith(item.route);

            return (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.menuItem,
                  isActive && [styles.menuItemActive, { backgroundColor: `${theme.primary}18` }],
                ]}
                onPress={() => handleNavigate(item.route)}
              >
                <View style={[styles.iconContainer, isActive && { backgroundColor: theme.primary }]}>
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={20}
                    color={isActive ? '#FFFFFF' : theme.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.menuText,
                    { color: isActive ? theme.primary : theme.text },
                    isActive && styles.menuTextActive,
                  ]}
                >
                  {`${index + 1}. ${item.name}`}
                </Text>
                {isActive && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* 15. Logout at bottom */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.danger} />
          <Text style={[styles.logoutText, { color: theme.danger }]}>15. Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandHeader: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  profileHeader: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  userMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuGroup: {
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  menuItemActive: {
    borderRadius: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  menuTextActive: {
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
});

export default CustomDrawerContent;
