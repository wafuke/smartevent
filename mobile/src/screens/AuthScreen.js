import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  loginUser,
  signupUser,
  googleSignInMobile,
  getDeviceGoogleAccounts,
  removeDeviceGoogleAccount,
  getBackendUrl,
  setBackendUrl
} from '../services/api';

export default function AuthScreen({
  initialMode = 'login',
  onAuthenticate,
  onBackToHome,
  onBackToPublic
}) {
  const handleBack = onBackToPublic || onBackToHome;
  const [isLogin, setIsLogin] = useState(
    initialMode !== 'signup' && initialMode !== 'register'
  );
  const [signupRole, setSignupRole] = useState('student'); // 'student' | 'organizer'
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('School of Computing & Engineering Sciences');
  const [phone, setPhone] = useState('+2547');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Device Google Account Chooser State (stores ONLY accounts used on THIS device)
  const [showGoogleFlow, setShowGoogleFlow] = useState(false);
  const [deviceAccounts, setDeviceAccounts] = useState([]);
  const [googleStep, setGoogleStep] = useState('chooser'); // 'chooser' | 'email' | 'password'
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePassword, setGooglePassword] = useState('');

  // Optional Advanced Server IP Config
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [apiUrl, setApiUrl] = useState(getBackendUrl());

  useEffect(() => {
    setIsLogin(initialMode !== 'signup' && initialMode !== 'register');
    setErrorMsg('');
    const saved = getDeviceGoogleAccounts();
    setDeviceAccounts(saved);
  }, [initialMode]);

  const openGoogleSignIn = () => {
    setErrorMsg('');
    const saved = getDeviceGoogleAccounts();
    setDeviceAccounts(saved);
    setGoogleEmail('');
    setGooglePassword('');
    setGoogleStep(saved.length > 0 ? 'chooser' : 'email');
    setShowGoogleFlow(true);
  };

  const handleSelectDeviceGoogleAccount = (acct) => {
    setErrorMsg('');
    setGoogleEmail(acct.email);
    setGooglePassword('');
    setGoogleStep('password');
  };

  const handleRemoveDeviceGoogleAccount = (emailToRemove) => {
    const updated = removeDeviceGoogleAccount(emailToRemove);
    setDeviceAccounts(updated);
    if (updated.length === 0) {
      setGoogleStep('email');
    }
  };

  const handleGoogleEmailNext = () => {
    setErrorMsg('');
    const trimmed = googleEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid @strathmore.edu or Gmail address.');
      return;
    }
    setGoogleEmail(trimmed);
    setGoogleStep('password');
  };

  const handleGooglePasswordSubmit = async () => {
    setErrorMsg('');
    if (!googlePassword) {
      setErrorMsg('Please enter your Google account password.');
      return;
    }
    setLoading(true);
    setBackendUrl(apiUrl);

    const res = await googleSignInMobile({
      email: googleEmail.trim().toLowerCase(),
      password: googlePassword,
      role: 'auto'
    });
    setLoading(false);

    if (res && res.success && res.user) {
      setDeviceAccounts(getDeviceGoogleAccounts());
      onAuthenticate(res.user);
    } else {
      setErrorMsg(res?.error || 'Google authentication failed.');
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    if (isLogin) {
      if (!email.trim() || !password) {
        setErrorMsg('Please enter both your email address and password.');
        return;
      }
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setErrorMsg('Full name, email address, and password are required.');
        return;
      }
      if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        setErrorMsg('Password must be at least 8 characters and include both letters and numbers.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (signupRole === 'student' && !/^\d{5,8}$/.test(studentId.trim())) {
        setErrorMsg('Student admission number must be 5 to 8 digits (e.g. 154210).');
        return;
      }
      const cleanedPhone = phone.replace(/[\s\-()]/g, '');
      if (!/^(\+?254|0)[17]\d{8}$/.test(cleanedPhone)) {
        setErrorMsg('Enter a valid Kenyan mobile number (e.g. +254712345678 or 0712345678).');
        return;
      }
    }

    setLoading(true);
    setBackendUrl(apiUrl);

    const res = isLogin
      ? await loginUser({
          email: email.trim(),
          password,
          role: 'auto'
        })
      : await signupUser({
          name: name.trim(),
          email: email.trim(),
          password,
          role: signupRole,
          studentId: studentId.trim(),
          phone: phone.trim(),
          department: department.trim()
        });

    setLoading(false);

    if (res && res.success && res.user) {
      onAuthenticate(res.user);
    } else {
      setErrorMsg(res?.error || 'Invalid email or password credentials.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        {handleBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
            <Text style={styles.backBtnText}>← Public Home</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={styles.configToggle}
          onPress={() => setShowServerConfig(!showServerConfig)}
        >
          <Text style={styles.configToggleText}>
            {showServerConfig ? 'Hide API Config' : '⚙️ Server'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Optional API URL Configuration */}
        {showServerConfig && (
          <View style={styles.serverConfigBox}>
            <Text style={styles.serverConfigTitle}>Backend API Endpoint</Text>
            <TextInput
              style={styles.serverInput}
              value={apiUrl}
              onChangeText={(val) => {
                setApiUrl(val);
                setBackendUrl(val);
              }}
              placeholder="http://192.168.1.100:5000/api"
              autoCapitalize="none"
            />
            <Text style={styles.serverHint}>
              On physical phone, enter your computer's LAN IP if running the local backend server.
            </Text>
          </View>
        )}

        {/* Brand Hero Card */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SE</Text>
          </View>
          <Text style={styles.brandTitle}>
            {showGoogleFlow
              ? 'Sign in with Google'
              : isLogin
              ? 'Welcome Back'
              : 'Create Account'}
          </Text>
          <Text style={styles.brandSub}>
            {showGoogleFlow
              ? 'Continue to Strathmore University SmartEvent'
              : isLogin
              ? 'Sign in with your Strathmore University credentials'
              : 'Join SmartEvent as a Student or Event Organizer'}
          </Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          {showGoogleFlow ? (
            /* ================= GOOGLE ACCOUNT CHOOSER FLOW ================= */
            <View>
              <View style={styles.googleBadgeHeader}>
                <View style={styles.googleGIcon}>
                  <Text style={styles.googleGText}>G</Text>
                </View>
                <Text style={styles.googleHeaderLabel}>Google Workspace Authentication</Text>
              </View>

              {googleStep === 'chooser' && (
                <View>
                  <Text style={styles.chooserPrompt}>
                    Choose an account signed in on this device:
                  </Text>

                  {deviceAccounts.map((acct) => (
                    <TouchableOpacity
                      key={acct.email}
                      style={styles.deviceAccountRow}
                      onPress={() => handleSelectDeviceGoogleAccount(acct)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.deviceAvatar}>
                        <Text style={styles.deviceAvatarText}>
                          {(acct.name || acct.email).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deviceAccountName} numberOfLines={1}>
                          {acct.name || acct.email.split('@')[0]}
                        </Text>
                        <Text style={styles.deviceAccountEmail} numberOfLines={1}>
                          {acct.email}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeAcctBtn}
                        onPress={() => handleRemoveDeviceGoogleAccount(acct.email)}
                      >
                        <Text style={styles.removeAcctText}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={styles.anotherAccountBtn}
                    onPress={() => {
                      setGoogleEmail('');
                      setGooglePassword('');
                      setErrorMsg('');
                      setGoogleStep('email');
                    }}
                  >
                    <Text style={styles.anotherAccountText}>+ Use another Google account</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => {
                      setShowGoogleFlow(false);
                      setErrorMsg('');
                    }}
                  >
                    <Text style={styles.secondaryBtnText}>← Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}

              {googleStep === 'email' && (
                <View>
                  <Text style={styles.fieldLabel}>Google / Strathmore Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@strathmore.edu"
                    placeholderTextColor="#94a3b8"
                    value={googleEmail}
                    onChangeText={setGoogleEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}
                      onPress={() => {
                        if (deviceAccounts.length > 0) {
                          setGoogleStep('chooser');
                        } else {
                          setShowGoogleFlow(false);
                        }
                        setErrorMsg('');
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                      onPress={handleGoogleEmailNext}
                    >
                      <Text style={styles.primaryBtnText}>Next →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {googleStep === 'password' && (
                <View>
                  <View style={styles.selectedEmailPill}>
                    <View style={styles.deviceAvatarSmall}>
                      <Text style={styles.deviceAvatarSmallText}>
                        {googleEmail.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.selectedEmailText} numberOfLines={1}>
                      {googleEmail}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setGoogleStep('email');
                        setErrorMsg('');
                      }}
                    >
                      <Text style={styles.changeEmailLink}>Change</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Enter Your Google Password</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter account password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      value={googlePassword}
                      onChangeText={setGooglePassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { flex: 1, marginTop: 0 }]}
                      onPress={() => {
                        setGoogleStep(deviceAccounts.length > 0 ? 'chooser' : 'email');
                        setErrorMsg('');
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>Back</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1, marginTop: 0 }]}
                      onPress={handleGooglePasswordSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Sign In</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            /* ================= STANDARD SIGN IN / SIGN UP FLOW ================= */
            <View>
              {/* Mode Switcher (Sign In vs Sign Up) */}
              <View style={styles.modeSwitchRow}>
                <TouchableOpacity
                  style={[styles.modeTab, isLogin && styles.modeTabActive]}
                  onPress={() => {
                    setIsLogin(true);
                    setErrorMsg('');
                  }}
                >
                  <Text style={[styles.modeTabText, isLogin && styles.modeTabTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeTab, !isLogin && styles.modeTabActive]}
                  onPress={() => {
                    setIsLogin(false);
                    setErrorMsg('');
                  }}
                >
                  <Text style={[styles.modeTabText, !isLogin && styles.modeTabTextActive]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Continue with Google Button */}
              <TouchableOpacity
                style={styles.googleOutlineBtn}
                onPress={openGoogleSignIn}
                activeOpacity={0.8}
              >
                <View style={styles.googleGIcon}>
                  <Text style={styles.googleGText}>G</Text>
                </View>
                <Text style={styles.googleOutlineBtnText}>
                  Continue with Google (@strathmore.edu)
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  OR {isLogin ? 'EMAIL LOGIN' : 'EMAIL SIGN UP'}
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Sign Up Role Selector (Student or Organizer only) */}
              {!isLogin && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.fieldLabel}>Select Account Type</Text>
                  <View style={styles.roleSelectorRow}>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        signupRole === 'student' && styles.roleOptionActive
                      ]}
                      onPress={() => setSignupRole('student')}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          signupRole === 'student' && styles.roleOptionTextActive
                        ]}
                      >
                        🎓 Student
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleOption,
                        signupRole === 'organizer' && styles.roleOptionActive
                      ]}
                      onPress={() => setSignupRole('organizer')}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          signupRole === 'organizer' && styles.roleOptionTextActive
                        ]}
                      >
                        🏛️ Organizer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!isLogin && (
                <View>
                  <Text style={styles.fieldLabel}>
                    {signupRole === 'organizer' ? 'Organizer / Department Name' : 'Full Name'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      signupRole === 'organizer'
                        ? 'e.g. Strathmore Robotics Society'
                        : 'e.g. Elvis Wanyama Wafuke'
                    }
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}

              <Text style={styles.fieldLabel}>Strathmore Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@strathmore.edu"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              {!isLogin && (
                <View style={styles.twoColRow}>
                  {signupRole === 'student' ? (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Admission No.</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 154210"
                        placeholderTextColor="#94a3b8"
                        value={studentId}
                        onChangeText={setStudentId}
                        keyboardType="numeric"
                      />
                    </View>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Faculty / Office</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. SCES"
                        placeholderTextColor="#94a3b8"
                        value={department}
                        onChangeText={setDepartment}
                      />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Phone (SMS)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="+254712345678"
                      placeholderTextColor="#94a3b8"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              )}

              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              {!isLogin && (
                <View>
                  <Text style={styles.fieldLabel}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {isLogin ? 'Sign In to Portal →' : 'Create SmartEvent Account →'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.securityFooter}>
                <Text style={styles.securityFooterText}>
                  🔒 Protected by Bcrypt Password Hashing & Signed JWT RBAC
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#003366'
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  configToggle: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  configToggleText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600'
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 28,
    justifyContent: 'center'
  },
  serverConfigBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  serverConfigTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  serverInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a'
  },
  serverHint: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 5
  },
  brandSection: {
    alignItems: 'center',
    marginVertical: 14
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a'
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center'
  },
  brandSub: {
    fontSize: 12,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 11,
    marginBottom: 12
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17
  },
  modeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center'
  },
  modeTabActive: {
    backgroundColor: '#003366'
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  modeTabTextActive: {
    color: '#ffffff'
  },
  googleOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 10
  },
  googleGIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  googleGText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12
  },
  googleOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b'
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8'
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 12
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    marginBottom: 12
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0f172a'
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  eyeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003366'
  },
  roleSelectorRow: {
    flexDirection: 'row',
    gap: 10
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  roleOptionActive: {
    borderColor: '#003366',
    backgroundColor: '#eff6ff'
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  roleOptionTextActive: {
    color: '#003366'
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10
  },
  primaryBtn: {
    backgroundColor: '#003366',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
  },
  securityFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center'
  },
  securityFooterText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center'
  },
  googleBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  googleHeaderLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  chooserPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10
  },
  deviceAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
    gap: 10
  },
  deviceAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deviceAvatarText: {
    color: '#f59e0b',
    fontWeight: '800',
    fontSize: 14
  },
  deviceAccountName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  deviceAccountEmail: {
    fontSize: 11,
    color: '#64748b'
  },
  removeAcctBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  removeAcctText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700'
  },
  anotherAccountBtn: {
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94a3b8',
    alignItems: 'center',
    marginTop: 4
  },
  anotherAccountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003366'
  },
  selectedEmailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8
  },
  deviceAvatarSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deviceAvatarSmallText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800'
  },
  selectedEmailText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b'
  },
  changeEmailLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb'
  }
});
