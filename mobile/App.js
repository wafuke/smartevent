import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  StatusBar as RNStatusBar
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from './src/screens/AuthScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import {
  fetchEvents,
  fetchAdminOverview,
  createEventMobile,
  deleteEventMobile,
  sendPrioritySmsMobile,
  fetchPriorityNotifications,
  fetchMyRegistrations,
  fetchFavoriteIds,
  toggleFavoriteEvent,
  googleSignInMobile,
  deleteUserMobile,
  updateUserProfileMobile
} from './src/services/api';

const VALID_CATEGORIES = [
  'Academic',
  'Workshop',
  'Seminar',
  'Club Activity',
  'Sports',
  'Career Fair'
];

const CAMPUS_VENUES = [
  { name: 'Main Auditorium', capacity: 500 },
  { name: 'iLab Africa Innovation Room 302', capacity: 120 },
  { name: 'SCES Lecture Theatre 4 (LT4)', capacity: 180 },
  { name: 'Strathmore Business School (SBS) Auditorium', capacity: 300 },
  { name: 'Student Center Graduation Square', capacity: 600 },
  { name: 'SLS Moot Court Chambers', capacity: 150 }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authScreenVisible, setAuthScreenVisible] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [adminOverview, setAdminOverview] = useState(null);
  const [smsLogs, setSmsLogs] = useState([]);

  // Organizer Scope ('mine' vs 'all') & Admin User Role Filter
  const [organizerScope, setOrganizerScope] = useState('mine');
  const [adminRoleFilter, setAdminRoleFilter] = useState('ALL');

  // Organizer / Admin Event Creation Form
  const [newEvt, setNewEvt] = useState({
    title: '',
    category: 'Workshop',
    date: '2026-11-28',
    time: '14:00 - 16:30',
    venue: 'iLab Africa Innovation Room 302',
    venueCapacity: '120',
    description: ''
  });

  // Africa's Talking Live Priority SMS Dispatch Form
  const [smsForm, setSmsForm] = useState({
    eventId: '',
    kind: 'REMINDER',
    phoneNumbers: '+254712345678',
    broadcastToEventRoster: true,
    message: 'Reminder: Please arrive 15 minutes early with your Strathmore student ID pass.'
  });
  const [smsStatusMsg, setSmsStatusMsg] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const createScrollRef = useRef(null);
  const smsScrollRef = useRef(null);

  const scrollFormTo = (ref, y = 120) => {
    setTimeout(() => {
      if (ref?.current && ref.current.scrollTo) {
        ref.current.scrollTo({ y, animated: true });
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

  const loadData = useCallback(async () => {
    const evts = await fetchEvents();
    setAllEvents(evts);
    setSelectedEvent((prev) => (prev ? evts.find((e) => e.id === prev.id) || prev : null));

    const logs = await fetchPriorityNotifications();
    setSmsLogs(logs);

    if (user && (user.role || '').toUpperCase() === 'STUDENT') {
      const myRegs = await fetchMyRegistrations(user.token);
      if (Array.isArray(myRegs)) {
        setRegisteredIds(myRegs.map((r) => r.eventId));
      }
      const favIds = await fetchFavoriteIds(user.token);
      if (Array.isArray(favIds)) {
        setSavedIds(favIds);
      }
    }
    if (user && (user.role || '').toUpperCase() === 'ADMIN') {
      const ov = await fetchAdminOverview(user.token);
      setAdminOverview(ov);
    }
  }, [user]);

  // Initial load + automatic 6-second sync with Web App
  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 6000);
    return () => clearInterval(timer);
  }, [loadData, activeTab]);

  // Handle Google OAuth redirect callback (#access_token=...) on Expo Web
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.location.hash) {
      return;
    }
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    if (!accessToken) return;

    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    googleSignInMobile({ accessToken, role: 'student' }).then((res) => {
      if (res && res.success && res.user) {
        setUser({ ...res.user, token: res.token || res.user?.token });
        setAuthScreenVisible(false);
        setSelectedEvent(null);
        setActiveTab('home');
      }
    });
  }, []);

  // Default SMS form eventId to the logged-in organizer's first owned event
  useEffect(() => {
    if (!allEvents.length) return;
    if (user && (user.role || '').toUpperCase() === 'ORGANIZER') {
      const mine = allEvents.filter(
        (e) =>
          e.organizerId === user.id ||
          (user.name && (e.organizerName === user.name || e.organizer === user.name))
      );
      if (mine.length && (!smsForm.eventId || !mine.some((m) => m.id === smsForm.eventId))) {
        const preferred = mine.find((m) => m.id === 'evt-ilab-demo') || mine[0];
        setSmsForm((prev) => ({ ...prev, eventId: preferred.id }));
      }
    } else if (!smsForm.eventId) {
      const preferred = allEvents.find((e) => e.id === 'evt-ilab-demo') || allEvents[0];
      setSmsForm((prev) => ({ ...prev, eventId: preferred.id }));
    }
  }, [user, allEvents, smsForm.eventId]);

  const handleOpenAuth = (mode = 'login') => {
    setAuthInitialMode(mode);
    setAuthScreenVisible(true);
  };

  const handleAuthenticate = (userData) => {
    setUser(userData);
    setAuthScreenVisible(false);
    setSelectedEvent(null);
    setActiveTab('home');
  };

  const handleSignOut = () => {
    setUser(null);
    setRegisteredIds([]);
    setSavedIds([]);
    setAuthScreenVisible(false);
    setSelectedEvent(null);
    setActiveTab('home');
  };

  const handleRegisterSuccess = async (eventId) => {
    if (!registeredIds.includes(eventId)) {
      setRegisteredIds((prev) => [...prev, eventId]);
    }
    await loadData();
  };

  const handleCancelRegistration = async (eventId) => {
    setRegisteredIds((prev) => prev.filter((id) => id !== eventId));
    await loadData();
  };

  const handleToggleSave = async (eventId) => {
    if (!user) {
      handleOpenAuth('login');
      return;
    }
    if (savedIds.includes(eventId)) {
      setSavedIds(savedIds.filter((id) => id !== eventId));
    } else {
      setSavedIds([...savedIds, eventId]);
    }
    await toggleFavoriteEvent(eventId, user.token);
    await loadData();
  };

  const handleCreateEvent = async () => {
    if (!newEvt.title || newEvt.title.trim().length < 3) {
      Alert.alert('Missing Title', 'Please enter an event title (at least 3 characters).');
      return;
    }
    const res = await createEventMobile(
      {
        title: newEvt.title.trim(),
        category: VALID_CATEGORIES.includes(newEvt.category) ? newEvt.category : 'Workshop',
        date: newEvt.date.trim(),
        time: newEvt.time.trim() || '14:00 - 16:00',
        venue: newEvt.venue.trim() || 'Main Auditorium',
        venueCapacity: Number(newEvt.venueCapacity) || 120,
        description: newEvt.description.trim()
      },
      user?.token
    );
    if (res.success && res.data) {
      await loadData();
      setNewEvt({
        title: '',
        category: 'Workshop',
        date: '2026-11-28',
        time: '14:00 - 16:30',
        venue: 'iLab Africa Innovation Room 302',
        venueCapacity: '120',
        description: ''
      });
      Alert.alert(
        'Event Published',
        `"${res.data.title}" is now live on both the Mobile App and Web App.`
      );
      setOrganizerScope('mine');
      setActiveTab('home');
    } else {
      Alert.alert('Could Not Create Event', res.error || 'Please check your event fields.');
    }
  };

  const handleDeleteEvent = async (evt) => {
    const res = await deleteEventMobile(evt.id, user?.token);
    if (res && res.success === false) {
      Alert.alert('Cannot Delete', res.error || 'You can only delete events you organize.');
      return;
    }
    await loadData();
  };

  const handleDeleteUser = async (targetUser) => {
    const res = await deleteUserMobile(targetUser.id, user?.token);
    if (res && res.success === false) {
      Alert.alert('Cannot Delete User', res.error || 'Could not delete account.');
      return;
    }
    await loadData();
  };

  const handleToggleSuspendUser = async (targetUser) => {
    const nextStatus = (targetUser.status || 'Active') === 'Active' ? 'Suspended' : 'Active';
    const res = await updateUserProfileMobile(targetUser.id, { status: nextStatus }, user?.token);
    if (res && res.success === false) {
      Alert.alert('Update Failed', res.error || 'Could not update user status.');
      return;
    }
    await loadData();
  };

  const handleToggleVerifyOrganizer = async (targetUser) => {
    const nextVerified = !targetUser.verified;
    const res = await updateUserProfileMobile(targetUser.id, { verified: nextVerified }, user?.token);
    if (res && res.success === false) {
      Alert.alert('Update Failed', res.error || 'Could not update organizer verification.');
      return;
    }
    await loadData();
  };

  const handleSendSms = async () => {
    if (!smsForm.message.trim()) {
      Alert.alert('Missing Message', 'Please enter an SMS message.');
      return;
    }
    setSendingSms(true);
    setSmsStatusMsg("Dispatching via Africa's Talking Priority SMS Gateway...");
    const targetEvt = allEvents.find((e) => e.id === smsForm.eventId) || allEvents[0];
    const phones = smsForm.phoneNumbers
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const res = await sendPrioritySmsMobile(
      {
        eventId: targetEvt?.id,
        eventTitle: targetEvt?.title || 'Strathmore Campus Event',
        kind: smsForm.kind || 'REMINDER',
        phoneNumbers: phones,
        broadcastToEventRoster: smsForm.broadcastToEventRoster,
        message: smsForm.message.trim()
      },
      user?.token
    );
    setSendingSms(false);

    if (res.success) {
      const count = res.dispatchedCount ?? res.data?.recipientCount ?? phones.length;
      setSmsStatusMsg(
        `Sent via Africa's Talking (${res.mode || 'LIVE'}) to ${count} recipient(s).`
      );
      await loadData();
    } else {
      setSmsStatusMsg(`Notice: ${res.error || 'Could not dispatch SMS'}`);
    }
  };

  // 1. Auth Screen Modal
  if (authScreenVisible && !user) {
    return (
      <View style={[styles.rootScreen, { backgroundColor: '#003366' }]}>
        <StatusBar style="light" />
        <View style={styles.mobileContainer}>
          <AuthScreen
            initialMode={authInitialMode}
            onAuthenticate={handleAuthenticate}
            onBackToPublic={() => setAuthScreenVisible(false)}
          />
        </View>
      </View>
    );
  }

  const role = user ? (user.role || 'STUDENT').toUpperCase() : 'PUBLIC';
  const registeredEvents = allEvents.filter((e) => registeredIds.includes(e.id));
  const savedEvents = allEvents.filter((e) => savedIds.includes(e.id));

  const organizerOwnEvents = allEvents.filter(
    (e) =>
      (user?.id && e.organizerId === user.id) ||
      (user?.name && (e.organizerName === user.name || e.organizer === user.name))
  );
  const displayedOrganizerEvents =
    organizerScope === 'mine' ? organizerOwnEvents : allEvents;

  const renderSmsStudio = () => {
    const selectableEvents =
      role === 'ORGANIZER' && organizerOwnEvents.length > 0 ? organizerOwnEvents : allEvents;

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={smsScrollRef}
          contentContainerStyle={[
            styles.scrollPad,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + 160 }
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>1. Select Target Event</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {selectableEvents.map((ev) => {
                const active = smsForm.eventId === ev.id;
                return (
                  <TouchableOpacity
                    key={ev.id}
                    style={[styles.choiceChip, active && styles.choiceChipActive]}
                    onPress={() => setSmsForm({ ...smsForm, eventId: ev.id })}
                  >
                    <Text
                      style={[styles.choiceChipText, active && styles.choiceChipTextActive]}
                      numberOfLines={1}
                    >
                      {ev.title.length > 26 ? `${ev.title.slice(0, 26)}...` : ev.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>
              2. Message Type (Filtered by Student&apos;s Priority)
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {[
                { key: 'URGENT', label: 'Urgent' },
                { key: 'REMINDER', label: 'Reminder' },
                { key: 'ANNOUNCEMENT', label: 'Update' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.prioBtn, smsForm.kind === item.key && styles.prioBtnActive]}
                  onPress={() => setSmsForm({ ...smsForm, kind: item.key })}
                >
                  <Text
                    style={[
                      styles.prioBtnText,
                      smsForm.kind === item.key && styles.prioBtnTextActive
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.rosterToggleRow}
              onPress={() =>
                setSmsForm({
                  ...smsForm,
                  broadcastToEventRoster: !smsForm.broadcastToEventRoster
                })
              }
            >
              <View
                style={[
                  styles.checkbox,
                  smsForm.broadcastToEventRoster && styles.checkboxChecked
                ]}
              >
                {smsForm.broadcastToEventRoster && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rosterToggleText}>
                Include all students registered for this event
              </Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>
              Additional Phone Numbers (+2547... or 07...)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="+254712345678, 0722112233"
              value={smsForm.phoneNumbers}
              onChangeText={(t) => setSmsForm({ ...smsForm, phoneNumbers: t })}
              onFocus={() => scrollFormTo(smsScrollRef, 100)}
            />

            <Text style={styles.inputLabel}>SMS Message Content</Text>
            <TextInput
              style={[styles.input, { height: 74, textAlignVertical: 'top' }]}
              multiline
              value={smsForm.message}
              onChangeText={(t) => setSmsForm({ ...smsForm, message: t })}
              onFocus={() => scrollFormTo(smsScrollRef, 180)}
            />

            {smsStatusMsg ? (
              <View style={styles.smsFeedbackBox}>
                <Text style={styles.smsFeedbackText}>{smsStatusMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, sendingSms && { opacity: 0.65 }]}
              onPress={handleSendSms}
              disabled={sendingSms}
            >
              <Text style={styles.primaryBtnText}>
                {sendingSms ? 'Sending via Live Gateway...' : 'Send Live Priority SMS'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 18, marginBottom: 8 }]}>
            Recent SMS Dispatches ({smsLogs.length})
          </Text>
          {smsLogs.slice(0, 15).map((log, i) => (
            <View key={log.id || i} style={styles.mobileListCard}>
              <View style={styles.mobileCardTop}>
                <View
                  style={[
                    styles.miniBadge,
                    log.priority === 'HIGH' && { backgroundColor: '#fee2e2' }
                  ]}
                >
                  <Text
                    style={[
                      styles.miniBadgeText,
                      log.priority === 'HIGH' && { color: '#dc2626' }
                    ]}
                  >
                    {log.priority || 'HIGH'} PRIORITY
                  </Text>
                </View>
                <Text style={styles.statusTagText}>{log.status || 'SENT'}</Text>
              </View>
              <Text style={styles.mobileCardTitle} numberOfLines={1}>
                {log.eventTitle || 'Campus Alert'}
              </Text>
              <Text style={styles.mobileCardSub} numberOfLines={2}>
                {log.message}
              </Text>
              <Text style={styles.mobileCardFoot}>
                To: {log.recipient || log.recipientName || 'Event Roster'}
              </Text>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderRoleContent = () => {
    if (selectedEvent) {
      return (
        <EventDetailScreen
          event={selectedEvent}
          user={user}
          isRegistered={registeredIds.includes(selectedEvent.id)}
          isSaved={savedIds.includes(selectedEvent.id)}
          onRegisterSuccess={handleRegisterSuccess}
          onCancelRegistration={handleCancelRegistration}
          onToggleSave={handleToggleSave}
          onRequireAuth={handleOpenAuth}
          onBack={() => setSelectedEvent(null)}
        />
      );
    }

    // PUBLIC HOME (Not logged in)
    if (!user) {
      if (activeTab === 'notifications') {
        return <NotificationsScreen logs={smsLogs} onRefresh={loadData} />;
      }
      return (
        <EventsScreen
          user={null}
          events={allEvents}
          onRefresh={loadData}
          onSelectEvent={(evt) => setSelectedEvent(evt)}
          onOpenAuth={handleOpenAuth}
          registeredIds={[]}
          savedIds={[]}
        />
      );
    }

    // STUDENT ROLE PORTAL
    if (role === 'STUDENT') {
      if (activeTab === 'home') {
        return (
          <EventsScreen
            user={user}
            events={allEvents}
            onRefresh={loadData}
            onSelectEvent={(evt) => setSelectedEvent(evt)}
            registeredIds={registeredIds}
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
          />
        );
      }
      if (activeTab === 'tickets') {
        return (
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>
              My Event Passes ({registeredEvents.length})
            </Text>
            <Text style={styles.sectionSub}>
              Tap any pass to view details or change your SMS priority
            </Text>

            {registeredEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  You haven&apos;t registered for any upcoming events yet.
                </Text>
              </View>
            ) : (
              registeredEvents.map((evt) => (
                <TouchableOpacity
                  key={evt.id}
                  style={styles.passCard}
                  onPress={() => setSelectedEvent(evt)}
                >
                  <View style={styles.passTop}>
                    <Text style={styles.passTag}>
                      DIGITAL PASS • {user.studentId || '154210'}
                    </Text>
                    <Text style={styles.passCode}>#{evt.id.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.passTitle}>{evt.title}</Text>
                  <Text style={styles.passMeta}>
                    {evt.date} • {evt.time || evt.timeSlot}
                  </Text>
                  <Text style={styles.passMeta}>{evt.venue}</Text>
                </TouchableOpacity>
              ))
            )}

            <Text style={[styles.sectionHeader, { marginTop: 20 }]}>
              Saved Bookmarks ({savedEvents.length})
            </Text>
            {savedEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Tap Save on any event card to bookmark it for later.
                </Text>
              </View>
            ) : (
              savedEvents.map((evt) => (
                <TouchableOpacity
                  key={evt.id}
                  style={styles.savedCard}
                  onPress={() => setSelectedEvent(evt)}
                >
                  <Text style={styles.savedTitle}>{evt.title}</Text>
                  <Text style={styles.savedMeta}>
                    {evt.date} • {evt.venue}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        );
      }
      if (activeTab === 'notifications') {
        return <NotificationsScreen logs={smsLogs} onRefresh={loadData} />;
      }
      return (
        <ProfileScreen
          user={user}
          registeredCount={registeredIds.length}
          savedCount={savedIds.length}
          onUserUpdated={(u) => {
            setUser(u);
            loadData();
          }}
          onSignOut={handleSignOut}
        />
      );
    }

    // ORGANIZER ROLE PORTAL
    if (role === 'ORGANIZER') {
      if (activeTab === 'home') {
        return (
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={styles.roleHeroCard}>
              <View style={styles.heroHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleHeroTag}>
                    ORGANIZER • {user.organizerCode || 'ORG'}
                  </Text>
                  <Text style={styles.roleHeroTitle} numberOfLines={1}>
                    {user.name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.heroActionPill}
                  onPress={() => setActiveTab('create')}
                >
                  <Text style={styles.heroActionText}>+ New Event</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.heroStatsStrip}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>{organizerOwnEvents.length}</Text>
                  <Text style={styles.heroStatLbl}>My Events</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>
                    {displayedOrganizerEvents.reduce(
                      (s, e) => s + (Number(e.registrationCount) || 0),
                      0
                    )}
                  </Text>
                  <Text style={styles.heroStatLbl}>Total RSVPs</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>LIVE</Text>
                  <Text style={styles.heroStatLbl}>AT SMS</Text>
                </View>
              </View>
            </View>

            {/* Toggle between My Events & All Campus Events */}
            <View style={styles.scopeSwitchRow}>
              <TouchableOpacity
                style={[styles.scopeBtn, organizerScope === 'mine' && styles.scopeBtnActive]}
                onPress={() => setOrganizerScope('mine')}
              >
                <Text
                  style={[
                    styles.scopeBtnText,
                    organizerScope === 'mine' && styles.scopeBtnTextActive
                  ]}
                >
                  My Events ({organizerOwnEvents.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scopeBtn, organizerScope === 'all' && styles.scopeBtnActive]}
                onPress={() => setOrganizerScope('all')}
              >
                <Text
                  style={[
                    styles.scopeBtnText,
                    organizerScope === 'all' && styles.scopeBtnTextActive
                  ]}
                >
                  All Campus ({allEvents.length})
                </Text>
              </TouchableOpacity>
            </View>

            {displayedOrganizerEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  You haven&apos;t published any events yet. Tap &quot;+ New Event&quot; to list one.
                </Text>
              </View>
            ) : (
              displayedOrganizerEvents.map((evt) => {
                const isMine =
                  evt.organizerId === user.id ||
                  evt.organizerName === user.name ||
                  evt.organizer === user.name;
                return (
                  <TouchableOpacity
                    key={evt.id}
                    style={styles.mobileListCard}
                    onPress={() => setSelectedEvent(evt)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.mobileCardTop}>
                      <View style={styles.miniBadge}>
                        <Text style={styles.miniBadgeText}>{evt.category}</Text>
                      </View>
                      <Text style={styles.seatsPillText}>
                        {evt.registrationCount || 0} / {evt.venueCapacity || 150} RSVPs
                      </Text>
                    </View>

                    <Text style={styles.mobileCardTitle}>{evt.title}</Text>
                    <Text style={styles.mobileCardSub}>
                      {evt.date} • {evt.time || evt.timeSlot} • {evt.venue}
                    </Text>

                    <View style={styles.cardActionRow}>
                      <TouchableOpacity
                        style={styles.cardSecondaryBtn}
                        onPress={() => setSelectedEvent(evt)}
                      >
                        <Text style={styles.cardSecondaryBtnText}>View Forecast</Text>
                      </TouchableOpacity>
                      {isMine && (
                        <TouchableOpacity
                          style={styles.cardDangerBtn}
                          onPress={() => handleDeleteEvent(evt)}
                        >
                          <Text style={styles.cardDangerBtnText}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        );
      }

      if (activeTab === 'create') {
        return (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              ref={createScrollRef}
              contentContainerStyle={[
                styles.scrollPad,
                keyboardHeight > 0 && { paddingBottom: keyboardHeight + 160 }
              ]}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionHeader}>Publish Campus Event</Text>
              <Text style={styles.sectionSub}>
                Syncs immediately to both the Mobile App and Web App
              </Text>

              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Event Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., AI & Cloud Security Workshop"
                  value={newEvt.title}
                  onChangeText={(t) => setNewEvt({ ...newEvt, title: t })}
                  onFocus={() => scrollFormTo(createScrollRef, 20)}
                />

                <Text style={styles.inputLabel}>Category (Tap to select)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 12 }}
                >
                  {VALID_CATEGORIES.map((cat) => {
                    const active = newEvt.category === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.choiceChip, active && styles.choiceChipActive]}
                        onPress={() => setNewEvt({ ...newEvt, category: cat })}
                      >
                        <Text
                          style={[styles.choiceChipText, active && styles.choiceChipTextActive]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.inputLabel}>Campus Venue (Tap to auto-fill capacity)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 10 }}
                >
                  {CAMPUS_VENUES.map((v) => {
                    const active = newEvt.venue === v.name;
                    return (
                      <TouchableOpacity
                        key={v.name}
                        style={[styles.choiceChip, active && styles.choiceChipActive]}
                        onPress={() =>
                          setNewEvt({
                            ...newEvt,
                            venue: v.name,
                            venueCapacity: String(v.capacity)
                          })
                        }
                      >
                        <Text
                          style={[styles.choiceChipText, active && styles.choiceChipTextActive]}
                        >
                          {v.name} ({v.capacity})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.inputLabel}>Venue Name</Text>
                    <TextInput
                      style={styles.input}
                      value={newEvt.venue}
                      onChangeText={(t) => setNewEvt({ ...newEvt, venue: t })}
                      onFocus={() => scrollFormTo(createScrollRef, 120)}
                    />
                  </View>
                  <View style={{ flex: 0.9 }}>
                    <Text style={styles.inputLabel}>Capacity</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(newEvt.venueCapacity)}
                      onChangeText={(t) => setNewEvt({ ...newEvt, venueCapacity: t })}
                      onFocus={() => scrollFormTo(createScrollRef, 120)}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      value={newEvt.date}
                      onChangeText={(t) => setNewEvt({ ...newEvt, date: t })}
                      onFocus={() => scrollFormTo(createScrollRef, 180)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Time</Text>
                    <TextInput
                      style={styles.input}
                      value={newEvt.time}
                      onChangeText={(t) => setNewEvt({ ...newEvt, time: t })}
                      onFocus={() => scrollFormTo(createScrollRef, 180)}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="Describe speakers, agenda, and who should attend..."
                  value={newEvt.description}
                  onChangeText={(t) => setNewEvt({ ...newEvt, description: t })}
                  onFocus={() => scrollFormTo(createScrollRef, 240)}
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateEvent}>
                  <Text style={styles.primaryBtnText}>Publish Event</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );
      }

      if (activeTab === 'sms') {
        return renderSmsStudio();
      }

      return (
        <ProfileScreen
          user={user}
          onUserUpdated={(u) => {
            setUser(u);
            loadData();
          }}
          onSignOut={handleSignOut}
        />
      );
    }

    // ADMIN ROLE PORTAL
    if (role === 'ADMIN') {
      if (activeTab === 'home') {
        const usersList = adminOverview?.users || [];
        const filteredUsers =
          adminRoleFilter === 'ALL'
            ? usersList
            : usersList.filter((u) => String(u.role || '').toUpperCase() === adminRoleFilter);

        return (
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={[styles.roleHeroCard, { backgroundColor: '#0f172a' }]}>
              <Text style={styles.roleHeroTag}>
                SYSTEM ADMIN • {user.staffId || 'ADM-001'}
              </Text>
              <Text style={styles.roleHeroTitle}>{user.name}</Text>

              <View style={styles.heroStatsStrip}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>{usersList.length || 22}</Text>
                  <Text style={styles.heroStatLbl}>Users</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>{allEvents.length}</Text>
                  <Text style={styles.heroStatLbl}>Events</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>{smsLogs.length}</Text>
                  <Text style={styles.heroStatLbl}>SMS Logs</Text>
                </View>
              </View>
            </View>

            {/* Role Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {['ALL', 'ADMIN', 'ORGANIZER', 'STUDENT'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.filterPill,
                    adminRoleFilter === r && styles.filterPillActive
                  ]}
                  onPress={() => setAdminRoleFilter(r)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      adminRoleFilter === r && styles.filterPillTextActive
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionHeader, { marginBottom: 8 }]}>
              Directory ({filteredUsers.length} Accounts)
            </Text>
            {filteredUsers.map((u) => (
              <View key={u.id} style={styles.mobileListCard}>
                <View style={styles.mobileCardTop}>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <View style={styles.miniBadge}>
                      <Text style={styles.miniBadgeText}>
                        {String(u.role || 'student').toUpperCase()}
                      </Text>
                    </View>
                    {String(u.status || 'Active') === 'Suspended' && (
                      <View style={[styles.miniBadge, { backgroundColor: '#fee2e2' }]}>
                        <Text style={[styles.miniBadgeText, { color: '#b91c1c' }]}>SUSPENDED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.seatsPillText}>{u.phone || '+2547...'}</Text>
                </View>
                <Text style={styles.mobileCardTitle}>{u.name}</Text>
                <Text style={styles.mobileCardSub}>{u.email}</Text>
                {u.id !== user.id && (
                  <View style={styles.cardActionRow}>
                    {String(u.role || '').toLowerCase() === 'organizer' && (
                      <TouchableOpacity
                        style={styles.cardSecondaryBtn}
                        onPress={() => handleToggleVerifyOrganizer(u)}
                      >
                        <Text style={styles.cardSecondaryBtnText}>
                          {u.verified ? 'Verified' : 'Verify'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.cardSecondaryBtn}
                      onPress={() => handleToggleSuspendUser(u)}
                    >
                      <Text style={styles.cardSecondaryBtnText}>
                        {(u.status || 'Active') === 'Active' ? 'Suspend' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardDangerBtn}
                      onPress={() => handleDeleteUser(u)}
                    >
                      <Text style={styles.cardDangerBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        );
      }

      if (activeTab === 'events_table') {
        return (
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>
              All Campus Events ({allEvents.length})
            </Text>
            <Text style={styles.sectionSub}>
              Tap any event to inspect or manage
            </Text>

            {allEvents.map((evt) => (
              <TouchableOpacity
                key={evt.id}
                style={styles.mobileListCard}
                onPress={() => setSelectedEvent(evt)}
              >
                <View style={styles.mobileCardTop}>
                  <View style={styles.miniBadge}>
                    <Text style={styles.miniBadgeText}>{evt.category}</Text>
                  </View>
                  <Text style={styles.seatsPillText}>
                    {evt.registrationCount || 0}/{evt.venueCapacity} RSVPs
                  </Text>
                </View>
                <Text style={styles.mobileCardTitle}>{evt.title}</Text>
                <Text style={styles.mobileCardSub}>
                  {evt.organizerName || evt.organizer} • {evt.date}
                </Text>
                <View style={styles.cardActionRow}>
                  <TouchableOpacity
                    style={styles.cardSecondaryBtn}
                    onPress={() => setSelectedEvent(evt)}
                  >
                    <Text style={styles.cardSecondaryBtnText}>Inspect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cardDangerBtn}
                    onPress={() => handleDeleteEvent(evt)}
                  >
                    <Text style={styles.cardDangerBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      }

      if (activeTab === 'sms') {
        return renderSmsStudio();
      }

      return (
        <ProfileScreen
          user={user}
          onUserUpdated={(u) => {
            setUser(u);
            loadData();
          }}
          onSignOut={handleSignOut}
        />
      );
    }
  };

  const renderBottomTabs = () => {
    if (selectedEvent) return null;

    const tabs = !user
      ? [
          { id: 'home', label: 'Explore', action: () => setActiveTab('home') },
          { id: 'notifications', label: 'SMS Feed', action: () => setActiveTab('notifications') },
          { id: 'login', label: 'Sign In', action: () => handleOpenAuth('login') },
          { id: 'register', label: 'Join', action: () => handleOpenAuth('register') }
        ]
      : role === 'STUDENT'
      ? [
          { id: 'home', label: 'Explore', action: () => setActiveTab('home') },
          {
            id: 'tickets',
            label: `Passes (${registeredIds.length})`,
            action: () => setActiveTab('tickets')
          },
          { id: 'notifications', label: 'Alerts', action: () => setActiveTab('notifications') },
          { id: 'profile', label: 'Profile', action: () => setActiveTab('profile') }
        ]
      : role === 'ORGANIZER'
      ? [
          { id: 'home', label: 'My Events', action: () => setActiveTab('home') },
          { id: 'create', label: 'Create', action: () => setActiveTab('create') },
          { id: 'sms', label: 'Live SMS', action: () => setActiveTab('sms') },
          { id: 'profile', label: 'Profile', action: () => setActiveTab('profile') }
        ]
      : [
          { id: 'home', label: 'Users', action: () => setActiveTab('home') },
          { id: 'events_table', label: 'Events', action: () => setActiveTab('events_table') },
          { id: 'sms', label: 'Live SMS', action: () => setActiveTab('sms') },
          { id: 'profile', label: 'Profile', action: () => setActiveTab('profile') }
        ];

    return (
      <View style={styles.tabBar}>
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.tabItem}
              onPress={t.action}
              activeOpacity={0.75}
            >
              <View style={[styles.tabPill, isActive && styles.tabPillActive]}>
                <View style={[styles.tabDot, isActive && styles.tabDotActive]} />
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {t.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.rootScreen}>
      <StatusBar style="dark" />
      <View style={styles.mobileContainer}>
        {user && !selectedEvent && (
          <View style={styles.topSessionBar}>
            <View style={styles.topSessionLeft}>
              <View style={styles.topAvatar}>
                <Text style={styles.topAvatarText}>
                  {(user.name || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topUserName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.topUserRole}>{role} PORTAL</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.topLogoutBtn}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Text style={styles.topLogoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.screenContainer}>{renderRoleContent()}</View>
        {renderBottomTabs()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootScreen: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#0f172a' : '#f8fafc',
    paddingTop:
      Platform.OS === 'android'
        ? RNStatusBar.currentHeight || 28
        : Platform.OS === 'ios'
        ? 44
        : 0,
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-start'
  },
  mobileContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : '100%',
    maxHeight: Platform.OS === 'web' ? 880 : '100%',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? 24 : 0
  },
  screenContainer: {
    flex: 1
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 28
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12
  },
  roleHeroCard: {
    backgroundColor: '#003366',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  roleHeroTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.6
  },
  roleHeroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2
  },
  heroActionPill: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  heroActionText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800'
  },
  heroStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 14
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center'
  },
  heroStatNum: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  heroStatLbl: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1
  },
  heroStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.18)'
  },
  scopeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center'
  },
  scopeBtnActive: {
    backgroundColor: '#003366'
  },
  scopeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  scopeBtnTextActive: {
    color: '#ffffff'
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 8
  },
  filterPillActive: {
    backgroundColor: '#003366',
    borderColor: '#003366'
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569'
  },
  filterPillTextActive: {
    color: '#ffffff'
  },
  mobileListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  mobileCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  miniBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7
  },
  miniBadgeText: {
    color: '#003366',
    fontSize: 10,
    fontWeight: '800'
  },
  seatsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669'
  },
  mobileCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3
  },
  mobileCardSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17
  },
  mobileCardFoot: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 6
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  cardSecondaryBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center'
  },
  cardSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003366'
  },
  cardDangerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center'
  },
  cardDangerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626'
  },
  liveGatewayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981'
  },
  liveGatewayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46'
  },
  liveGatewaySub: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
    marginTop: 1
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 12
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8
  },
  choiceChipActive: {
    backgroundColor: '#003366',
    borderColor: '#003366'
  },
  choiceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  choiceChipTextActive: {
    color: '#ffffff'
  },
  rosterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingVertical: 4
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  checkboxChecked: {
    backgroundColor: '#003366',
    borderColor: '#003366'
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900'
  },
  rosterToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  primaryBtn: {
    backgroundColor: '#003366',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  prioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  prioBtnActive: {
    backgroundColor: '#003366',
    borderColor: '#003366'
  },
  prioBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569'
  },
  prioBtnTextActive: {
    color: '#ffffff'
  },
  smsFeedbackBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10
  },
  smsFeedbackText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b'
  },
  passCard: {
    backgroundColor: '#003366',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12
  },
  passTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  passTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24'
  },
  passCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#bae6fd'
  },
  passTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6
  },
  passMeta: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2
  },
  savedCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3
  },
  savedMeta: {
    fontSize: 12,
    color: '#64748b'
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16
  },
  tabPillActive: {
    backgroundColor: '#eff6ff'
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1'
  },
  tabDotActive: {
    backgroundColor: '#003366'
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  activeTabLabel: {
    color: '#003366',
    fontWeight: '800'
  },
  topSessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  topSessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10
  },
  topAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topAvatarText: {
    color: '#fbbf24',
    fontWeight: '800',
    fontSize: 13
  },
  topUserName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  topUserRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
    letterSpacing: 0.4
  },
  topLogoutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10
  },
  topLogoutText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '800'
  }
});
