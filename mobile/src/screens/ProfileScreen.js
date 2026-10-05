import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ProfileScreen({ user, onSignOut }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'S').charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Elvis Wanyama Wafuke'}</Text>
          <Text style={styles.idText}>Admission No: {user?.studentId || '154210'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>STRATHMORE STUDENT</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>School / Faculty</Text>
            <Text style={styles.value}>School of Computing & Engineering Sciences</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Degree Program</Text>
            <Text style={styles.value}>BSc Informatics & Computer Science</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email Address</Text>
            <Text style={styles.value}>{user?.email || 'student@strathmore.edu'}</Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out of Mobile App</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  idText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b45309',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'column',
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  signOutButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 13,
  }
});
