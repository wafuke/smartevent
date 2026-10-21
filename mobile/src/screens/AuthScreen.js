import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import {
  loginUser,
  signupUser,
  googleSignInMobile,
  getBackendUrl,
  setBackendUrl
} from '../services/api';

const GOOGLE_ACCOUNTS = [
  { name: 'Elvis Wanyama Wafuke', email: 'student@strathmore.edu', role: 'student', tag: 'Student • 154210' },
  { name: 'Amina Hassan', email: 'amina.hassan@strathmore.edu', role: 'student', tag: 'Student • 154382' },
  { name: "Dr. Joseph Orero (SCES)", email: 'organizer@strathmore.edu', role: 'organizer', tag: 'Organizer • ORG-001' },
  { name: '@iLabAfrica Centre', email: 'ilab@strathmore.edu', role: 'organizer', tag: 'Organizer • ORG-002' },
  { name: 'Elvis Wanyama Wafuke (Admin)', email: 'admin@strathmore.edu', role: 'admin', tag: 'Admin 1 • ADM-001' },
  { name: 'Mr. Allan Vikiru', email: 'allan.vikiru@strathmore.edu', role: 'admin', tag: 'Admin 2 • ADM-002' }
];

export default function AuthScreen({ initialMode = 'login', onAuthenticate, onBackToHome, onBackToPublic }) {
  const handleBack = onBackToPublic || onBackToHome;
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup' && initialMode !== 'register');
  const [role, setRole] = useState('student'); // 'student', 'organizer', 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('154210');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+254712345678');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(getBackendUrl());

  const roles = [
    { id: 'student', label: '🎓 Student' },
    { id: 'organizer', label: '📢 Organizer' },
    { id: 'admin', label: '👑 Admin' }
  ];

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setBackendUrl(apiUrl);

    const res = isLogin
      ? await loginUser({ email: email.trim(), password, role })
      : await signupUser({ name: name.trim(), email: email.trim(), password, role, studentId, phone });

    setLoading(false);

    if (res && res.success && res.user) {
      onAuthenticate(res.user);
    } else {
      setErrorMsg(res?.error || 'Invalid email or password credentials.');
    }
  };

  const handlePresetAccount = async (presetEmail, presetRole) => {
    setErrorMsg('');
    setRole(presetRole);
    setEmail(presetEmail);
    setPassword('password123');
    setLoading(true);
    setBackendUrl(apiUrl);

    const res = await loginUser({ email: presetEmail, password: 'password123', role: presetRole });
    setLoading(false);

    if (res && res.success && res.user) {
      onAuthenticate(res.user);
    } else {
      setErrorMsg(res?.error || 'Login failed.');
    }
  };

  const handleGoogleSelect = async (acct) => {
    setErrorMsg('');
    setLoading(true);
    setBackendUrl(apiUrl);
    const res = await googleSignInMobile({
      email: acct.email,
      name: acct.name,
      role: acct.role
    });
    setLoading(false);
    if (res && res.success && res.user) {
      onAuthenticate(res.user);
    } else {
      setErrorMsg(res?.error || 'Google Sign-In failed.');
    }
  };

  const handleCustomGoogle = async () => {
    if (!customGoogleEmail.trim()) {
      setErrorMsg('Enter your @strathmore.edu or Gmail address.');
      return;
    }
    await handleGoogleSelect({
      email: customGoogleEmail.trim(),
      name: customGoogleEmail.split('@')[0],
      role
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Back to Public Home */}
        {handleBack && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backBtnText}>← Back to Public Home</Text>
          </TouchableOpacity>
        )}

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>SE</Text>
          </View>
          <Text style={styles.title}>SmartEvent Strathmore</Text>
          <Text style={styles.subtitle}>
            {showGoogleModal
              ? 'Choose your @strathmore.edu Google Account'
              : 'University Event & Priority SMS Platform'}
          </Text>
        </View>

        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {showGoogleModal ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionLabel}>Select Verified Google Workspace Account</Text>
            {GOOGLE_ACCOUNTS.map((acct) => (
              <TouchableOpacity
                key={acct.email}
                style={styles.googleAcctRow}
                onPress={() => handleGoogleSelect(acct)}
                disabled={loading}
              >
                <View style={styles.googleAvatar}>
                  <Text style={styles.googleAvatarText}>{acct.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.googleAcctName}>{acct.name}</Text>
                  <Text style={styles.googleAcctEmail}>{acct.email}</Text>
                </View>
                <View style={styles.googleTagBadge}>
                  <Text style={styles.googleTagText}>{acct.tag}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.dividerRow}>
              <Text style={styles.dividerText}>OR ENTER CUSTOM GOOGLE EMAIL ({role.toUpperCase()})</Text>
            </View>

            <TextInput
              style={styles.input}
              value={customGoogleEmail}
              onChangeText={setCustomGoogleEmail}
              placeholder="your.name@strathmore.edu"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.rowBtns}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => { setShowGoogleModal(false); setErrorMsg(''); }}
              >
                <Text style={styles.secondaryBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                onPress={handleCustomGoogle}
                disabled={loading}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.formCard}>
            {/* Sign In / Sign Up Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => { setIsLogin(true); setErrorMsg(''); }}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => { setIsLogin(false); setErrorMsg(''); }}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => { setShowGoogleModal(true); setErrorMsg(''); }}
            >
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google (@strathmore.edu)</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <Text style={styles.dividerText}>OR SELECT ROLE & CREDENTIALS</Text>
            </View>

            {/* Role Selector */}
            <Text style={styles.label}>Select University Role</Text>
            <View style={styles.roleRow}>
              {roles.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.rolePill, role === r.id && styles.activeRolePill]}
                  onPress={() => { setRole(r.id); setErrorMsg(''); }}
                >
                  <Text style={[styles.rolePillText, role === r.id && styles.activeRolePillText]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Elvis Wanyama Wafuke"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Strathmore Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. student@strathmore.edu"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter password (e.g. password123)"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {!isLogin && role === 'student' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admission Number</Text>
                <TextInput
                  style={styles.input}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="154210"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number (Africa's Talking SMS)</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+254712345678"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isLogin ? `Sign In as ${role.toUpperCase()}` : `Create ${role.toUpperCase()} Account`}
                </Text>
              )}
            </TouchableOpacity>

            {/* Seeded Demo Accounts (Verified via Backend API) */}
            <View style={styles.presetSection}>
              <Text style={styles.presetTitle}>Quick Verified Strathmore Accounts (password123)</Text>
              <View style={styles.presetGrid}>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handlePresetAccount('student@strathmore.edu', 'student')}
                >
                  <Text style={styles.presetBtnText}>🎓 Elvis (154210)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handlePresetAccount('organizer@strathmore.edu', 'organizer')}
                >
                  <Text style={styles.presetBtnText}>📢 SCES Organizer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handlePresetAccount('admin@strathmore.edu', 'admin')}
                >
                  <Text style={styles.presetBtnText}>👑 Admin 1 (Elvis)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handlePresetAccount('allan.vikiru@strathmore.edu', 'admin')}
                >
                  <Text style={styles.presetBtnText}>👑 Admin 2 (Vikiru)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Optional API Server Endpoint Config for Physical Phone Testing */}
            <TouchableOpacity
              style={styles.configToggle}
              onPress={() => setShowServerConfig(!showServerConfig)}
            >
              <Text style={styles.configToggleText}>
                {showServerConfig ? '▲ Hide API Server URL' : '⚙️ Configure Backend API URL (Expo Go LAN)'}
              </Text>
            </TouchableOpacity>

            {showServerConfig && (
              <View style={styles.configBox}>
                <Text style={styles.configHint}>
                  On a physical phone, enter your computer's Wi-Fi IPv4 address (e.g. http://192.168.1.100:5000/api):
                </Text>
                <TextInput
                  style={styles.input}
                  value={apiUrl}
                  onChangeText={setApiUrl}
                  autoCapitalize="none"
                  placeholder="http://192.168.1.100:5000/api"
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#003366',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f59e0b',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#003366',
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  googleG: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2563eb',
  },
  googleBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  dividerRow: {
    marginVertical: 10,
    alignItems: 'center',
  },
  dividerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  activeRolePill: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  activeRolePillText: {
    color: '#003366',
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  primaryBtn: {
    backgroundColor: '#003366',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryBtnText: {
    color: '#334155',
    fontWeight: 'bold',
    fontSize: 13,
  },
  rowBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  googleAcctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  googleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleAvatarText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  googleAcctName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  googleAcctEmail: {
    fontSize: 10,
    color: '#64748b',
  },
  googleTagBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  googleTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  presetSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  presetTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetBtn: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  presetBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#003366',
  },
  configToggle: {
    marginTop: 12,
    alignItems: 'center',
  },
  configToggleText: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '600',
  },
  configBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  configHint: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
  }
});
