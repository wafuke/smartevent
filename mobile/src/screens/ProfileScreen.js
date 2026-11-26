import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { getBackendUrl, updateUserProfileMobile } from '../services/api';

const PRIORITY_TIERS = [
  { value: 'HIGH', label: 'High', desc: 'All alerts (urgent, reminders & announcements)' },
  { value: 'MEDIUM', label: 'Medium', desc: 'Urgent changes & event reminders' },
  { value: 'LOW', label: 'Low', desc: 'Urgent changes only' },
  { value: 'NONE', label: 'Off', desc: 'In-app alerts only (no SMS)' }
];

const FREQUENCY_OPTIONS = [
  { value: null, label: 'Auto' },
  { value: 30, label: 'Every 30m' },
  { value: 60, label: 'Every 1h' },
  { value: 180, label: 'Every 3h' },
  { value: 1440, label: 'Once/24h' }
];

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
  const [smsPriority, setSmsPriority] = useState(
    String(user?.smsPriority || 'MEDIUM').toUpperCase()
  );
  const [smsFrequencyMinutes, setSmsFrequencyMinutes] = useState(
    user?.smsFrequencyMinutes ?? null
  );
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    setName(user?.name || '');
    setPhone(user?.phone || '+254712345678');
    setDepartment(user?.department || 'School of Computing & Engineering Sciences (SCES)');
    setSmsPriority(String(user?.smsPriority || 'MEDIUM').toUpperCase());
    setSmsFrequencyMinutes(user?.smsFrequencyMinutes ?? null);
  }, [user]);

  const scrollToInput = (y = 200) => {
    setTimeout(() => {
      if (scrollRef.current && scrollRef.current.scrollTo) {
        scrollRef.current.scrollTo({ y, animated: true });
      }
    }, 120);
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e?.endCoordinates?.height || 280)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateUserProfileMobile(
      user?.id,
      {
        name: name.trim(),
        phone: phone.trim(),
        department: department.trim(),
        smsPriority,
        applyToRegistrations: true
      },
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
          smsPriority,
          ...(res.data || {})
        });
      }
      setEditing(false);
      Alert.alert('Profile Saved', 'Your profile & SMS alert preferences have been synced.');
    } else {
      Alert.alert('Update Error', res?.error || 'Could not update profile.');
    }
  };

  const handleQuickTierChange = async (tierValue) => {
    setSmsPriority(tierValue);
    const res = await updateUserProfileMobile(
      user?.id,
      { smsPriority: tierValue, applyToRegistrations: true },
      user?.token
    );
    if (res && res.success) {
      if (onUserUpdated) {
        onUserUpdated({
          ...user,
          smsPriority: tierValue,
          ...(res.data || {})
        });
      }
    } else {
      Alert.alert('Update Error', res?.error || 'Could not update SMS priority.');
    }
  };

  const handleQuickFrequencyChange = async (freqValue) => {
    setSmsFrequencyMinutes(freqValue);
    const res = await updateUserProfileMobile(
      user?.id,
      { smsFrequencyMinutes: freqValue, applyToRegistrations: true },
      user?.token
    );
    if (res && res.success) {
      if (onUserUpdated) {
        onUserUpdated({
          ...user,
          smsFrequencyMinutes: freqValue,
          ...(res.data || {})
        });
      }
    } else {
      Alert.alert('Update Error', res?.error || 'Could not update SMS frequency.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          keyboardHeight > 0 && { paddingBottom: keyboardHeight + 160 }
        ]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
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
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  onFocus={() => scrollToInput(180)}
                />
              </View>
              <View>
                <Text style={styles.label}>Kenyan Mobile Phone (+2547...)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => scrollToInput(240)}
                  keyboardType="phone-pad"
                />
              </View>
              <View>
                <Text style={styles.label}>Department / Degree Program</Text>
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  onFocus={() => scrollToInput(300)}
                />
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

        {/* Student SMS Priority Tier Card (Synced with Web App) */}
        {role === 'STUDENT' && (
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>SMS Alert Priority Tier</Text>
            <Text style={styles.tierSubtitle}>
              Choose which Africa&apos;s Talking SMS alerts you receive. Changes sync with the Web App immediately.
            </Text>
            <View style={styles.tierGrid}>
              {PRIORITY_TIERS.map((tier) => {
                const selected = smsPriority === tier.value;
                return (
                  <TouchableOpacity
                    key={tier.value}
                    style={[styles.tierChip, selected && styles.tierChipSelected]}
                    onPress={() => handleQuickTierChange(tier.value)}
                  >
                    <Text style={[styles.tierChipTitle, selected && styles.tierChipTitleSelected]}>
                      {tier.label}
                    </Text>
                    <Text style={[styles.tierChipDesc, selected && styles.tierChipDescSelected]}>
                      {tier.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.cardHeaderTitle, { marginTop: 14, fontSize: 13 }]}>
              Auto SMS Reminder Frequency
            </Text>
            <Text style={styles.tierSubtitle}>
              Auto sends every 1h for High Priority (within 24h) or every 3h for Medium. Tap to override:
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FREQUENCY_OPTIONS.map((opt) => {
                const selected = (smsFrequencyMinutes ?? null) === opt.value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[
                      styles.tierChip,
                      { width: 'auto', minWidth: 68, paddingVertical: 8, paddingHorizontal: 12 },
                      selected && styles.tierChipSelected
                    ]}
                    onPress={() => handleQuickFrequencyChange(opt.value)}
                  >
                    <Text style={[styles.tierChipTitle, { fontSize: 12, marginBottom: 0 }, selected && styles.tierChipTitleSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out & Return to Public Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  tierSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 10
  },
  tierGrid: {
    gap: 8
  },
  tierChip: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc'
  },
  tierChipSelected: {
    borderColor: '#003366',
    backgroundColor: '#eff6ff'
  },
  tierChipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  tierChipTitleSelected: {
    color: '#003366'
  },
  tierChipDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  tierChipDescSelected: {
    color: '#1e40af'
  }
});
