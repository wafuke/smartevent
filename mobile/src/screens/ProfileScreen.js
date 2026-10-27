import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { getBackendUrl, updateUserProfileMobile } from '../services/api';

export default function ProfileScreen({
  user,
  registeredCount = 0,
  savedCount = 0,
  onUserUpdated,
  onSignOut
}) {
  const role = (user?.role || 'STUDENT').toUpperCase();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '+254712345678');
  const [department, setDepartment] = useState(
    user?.department || 'School of Computing & Engineering Sciences (SCES)'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateUserProfileMobile(
      user?.id,
      { name: name.trim(), phone: phone.trim(), department: department.trim() },
      user?.token
    );
    setSaving(false);
    if (res && res.success) {
      if (onUserUpdated) {
        onUserUpdated({
          ...user,
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim(),
          ...(res.data || {})
        });
      }
      setEditing(false);
      Alert.alert('Profile Saved', 'Your profile & SMS alert number have been updated.');
    } else {
      Alert.alert('Update Error', res?.error || 'Could not update profile.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'SmartEvent User'}</Text>
          <Text style={styles.idText}>
            {role === 'ADMIN'
              ? `Staff ID: ${user?.staffId || 'ADM-001'} • ${user?.clearanceLevel || 'Super Admin'}`
              : role === 'ORGANIZER'
              ? `${user?.organizationName || 'Campus Organizer'} • ${user?.department || 'SCES'}`
              : `Admission No: ${user?.studentId || '154210'}`}
          </Text>
          <View
            style={[
              styles.roleBadge,
              role === 'ADMIN' && { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
              role === 'ORGANIZER' && { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' }
            ]}
          >
            <Text
              style={[
                styles.roleText,
                role === 'ADMIN' && { color: '#b91c1c' },
                role === 'ORGANIZER' && { color: '#0369a1' }
              ]}
            >
              {role} PORTAL ACCOUNT
            </Text>
          </View>
        </View>

        {/* Activity Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{role === 'STUDENT' ? registeredCount : 'Active'}</Text>
            <Text style={styles.statLabel}>
              {role === 'STUDENT' ? 'Active RSVPs' : 'Portal Status'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{role === 'STUDENT' ? savedCount : 'JWT Active'}</Text>
            <Text style={styles.statLabel}>
              {role === 'STUDENT' ? 'Saved Events' : 'RBAC Auth'}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>AT SMS Active</Text>
            <Text style={styles.statLabel}>Priority Alerts</Text>
          </View>
        </View>

        {/* Details / Edit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeaderTitle}>Account & SMS Preferences</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={styles.editLink}>{editing ? 'Cancel' : 'Edit Profile'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <View style={{ gap: 10 }}>
              <View>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />
              </View>
              <View>
                <Text style={styles.label}>Kenyan Mobile Phone (+2547...)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <View>
                <Text style={styles.label}>Department / Degree Program</Text>
                <TextInput style={styles.input} value={department} onChangeText={setDepartment} />
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Account Role</Text>
                <Text style={styles.value}>{role}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Department / Faculty</Text>
                <Text style={styles.value}>
                  {user?.department || 'School of Computing & Engineering Sciences (SCES)'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Strathmore Email</Text>
                <Text style={styles.value}>{user?.email || 'student@strathmore.edu'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Africa&apos;s Talking SMS Phone</Text>
                <Text style={styles.value}>{user?.phone || '+254712345678'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Connected API Endpoint</Text>
                <Text style={styles.value}>{getBackendUrl()}</Text>
              </View>
            </>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out & Return to Public Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 14,
    paddingBottom: 28
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f59e0b'
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center'
  },
  idText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center'
  },
  roleBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fde68a'
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#b45309'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#003366'
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    marginBottom: 16
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  editLink: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7'
  },
  row: {
    flexDirection: 'column',
    gap: 2
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    marginTop: 3
  },
  saveButton: {
    backgroundColor: '#003366',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  signOutButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center'
  },
  signOutText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 12
  }
});
