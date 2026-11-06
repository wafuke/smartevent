import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
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
  toggleFavoriteEvent
} from './src/services/api';

export default function App() {
  // Start on Public Home Screen (user = null, authScreenVisible = false)
  const [user, setUser] = useState(null);
  const [authScreenVisible, setAuthScreenVisible] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  const [activeTab, setActiveTab] = useState('home');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(['evt-101']);
  const [savedIds, setSavedIds] = useState(['evt-103']);
  const [allEvents, setAllEvents] = useState([]);
  const [adminOverview, setAdminOverview] = useState(null);
  const [smsLogs, setSmsLogs] = useState([]);

  // Organizer Scope ('mine' vs 'all') & Admin User Role Filter
  const [organizerScope, setOrganizerScope] = useState('mine');
  const [adminRoleFilter, setAdminRoleFilter] = useState('ALL');

  // Organizer / Admin Event Creation Form (SMS priority is set by students on RSVP, not organizers)
  const [newEvt, setNewEvt] = useState({
    title: '',
    category: 'Workshop',
    date: '2026-11-28',
    time: '14:00 - 16:30',
    venue: 'iLab Africa Innovation Room 302',
    venueCapacity: '120',
    description: ''
  });

  // Africa's Talking SMS Dispatch Form (Message Type: URGENT / REMINDER / ANNOUNCEMENT)
  const [smsForm, setSmsForm] = useState({
    eventId: 'evt-101',
    kind: 'REMINDER',
    phoneNumbers: '+254712345678, +254711223344',
    broadcastToEventRoster: true,
    message: '[Strathmore SmartEvent] Reminder: Please arrive 15 mins early with your student ID pass.'
  });
  const [smsStatusMsg, setSmsStatusMsg] = useState('');

  const loadData = async () => {
    const evts = await fetchEvents();
    setAllEvents(evts);
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
  };

  useEffect(() => {
    loadData();
  }, [user, activeTab]);

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
    setAuthScreenVisible(false);
    setSelectedEvent(null);
    setActiveTab('home');
  };

  const handleRegisterSuccess = (eventId) => {
    if (!registeredIds.includes(eventId)) {
      setRegisteredIds([...registeredIds, eventId]);
    }
  };

  const handleCancelRegistration = (eventId) => {
    setRegisteredIds(registeredIds.filter((id) => id !== eventId));
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
  };

  const handleCreateEvent = async () => {
    if (!newEvt.title.trim()) {
      Alert.alert('Missing Title', 'Please enter an event title.');
      return;
    }
    const res = await createEventMobile(
      {
        ...newEvt,
        organizerId: user?.id,
        organizerName: user?.name,
        organizer: user?.name,
        venueCapacity: Number(newEvt.venueCapacity) || 120
      },
      user?.token
    );
    if (res.success) {
      setAllEvents([res.data, ...allEvents]);
      setNewEvt({
        title: '',
        category: 'Workshop',
        date: '2026-11-28',
        time: '14:00 - 16:30',
        venue: 'iLab Africa Innovation Room 302',
        venueCapacity: '120',
        smsPriority: 3,
        description: ''
      });
      Alert.alert('Event Published', `"${res.data.title}" is now live under your organizer profile.`);
      setOrganizerScope('mine');
      setActiveTab('home');
    } else {
      Alert.alert('Error', res.error || 'Could not create event');
    }
  };

  const handleDeleteEvent = async (evt) => {
    await deleteEventMobile(evt.id, user?.token);
    setAllEvents(allEvents.filter((e) => e.id !== evt.id));
  };

  const handleSendSms = async () => {
    if (!smsForm.message.trim()) {
      Alert.alert('Missing Message', 'Please enter an SMS message.');
      return;
    }
    setSmsStatusMsg("Dispatching via Africa's Talking Gateway...");
    const targetEvt = allEvents.find((e) => e.id === smsForm.eventId) || allEvents[0];
    const phones = smsForm.phoneNumbers
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const res = await sendPrioritySmsMobile(
      {
        eventId: targetEvt?.id || 'evt-101',
        eventTitle: targetEvt?.title || 'Strathmore Campus Event',
        kind: smsForm.kind || 'REMINDER',
        phoneNumbers: phones,
        broadcastToEventRoster: smsForm.broadcastToEventRoster,
        message: smsForm.message
      },
      user?.token
    );

    if (res.success) {
      setSmsStatusMsg(
        `Dispatched (${res.data?.provider || "Africa's Talking"}) to ${
          res.data?.recipientCount || phones.length
        } recipient(s) [${res.data?.status || 'SENT'}]`
      );
      loadData();
    } else {
      setSmsStatusMsg(`Error: ${res.error}`);
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

  // Filter events belonging to the logged-in Organizer
  const organizerOwnEvents = allEvents.filter(
    (e) =>
      (user?.id && e.organizerId === user.id) ||
      (user?.name && (e.organizerName === user.name || e.organizer === user.name))
  );
  const displayedOrganizerEvents =
    organizerScope === 'mine' && organizerOwnEvents.length > 0
      ? organizerOwnEvents
      : allEvents;

  // Render Role-Specific Content
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
        return <NotificationsScreen />;
      }
      return (
        <EventsScreen
          user={null}
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
              My Digital Event Passes ({registeredEvents.length})
            </Text>
            <Text style={styles.sectionSub}>
              Present your admission pass at the Strathmore venue entrance
            </Text>

            {registeredEvents.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  You haven't registered for any upcoming events yet.
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
                      CONFIRMED PASS • {user.studentId || '154210'}
                    </Text>
                    <Text style={styles.passCode}>#{evt.id.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.passTitle}>{evt.title}</Text>
                  <Text style={styles.passMeta}>
                    Date: {evt.date} • {evt.time || evt.timeSlot}
                  </Text>
                  <Text style={styles.passMeta}>Venue: {evt.venue}</Text>
                </TouchableOpacity>
              ))
            )}

            <Text style={[styles.sectionHeader, { marginTop: 18 }]}>
              Saved / Bookmarked Events ({savedEvents.length})
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
                    Date: {evt.date} • Venue: {evt.venue}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        );
      }
      if (activeTab === 'notifications') {
        return <NotificationsScreen />;
      }
      return (
        <ProfileScreen
          user={user}
          registeredCount={registeredIds.length}
          savedCount={savedIds.length}
          onUserUpdated={(u) => setUser(u)}
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
              <Text style={styles.roleHeroTag}>
                ORGANIZER PORTAL • {user.organizerCode || 'ORG'}
              </Text>
              <Text style={styles.roleHeroTitle}>{user.name}</Text>
              <Text style={styles.roleHeroSub}>
                {user.department || 'Strathmore University'} • {organizerOwnEvents.length} Listed Event(s)
              </Text>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{organizerOwnEvents.length}</Text>
                <Text style={styles.kpiLbl}>My Listed</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>
                  {displayedOrganizerEvents.reduce(
                    (s, e) => s + (Number(e.registrationCount) || 0),
                    0
                  )}
                </Text>
                <Text style={styles.kpiLbl}>RSVPs</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>87%</Text>
                <Text style={styles.kpiLbl}>ML Turnout</Text>
              </View>
            </View>

            {/* Toggle between My Listed Events & All Campus Events */}
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
                  My Listed Events ({organizerOwnEvents.length})
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
                  All Campus Events ({allEvents.length})
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>
              {organizerScope === 'mine' ? 'My Listed Events Table' : 'All Campus Events Table'}
            </Text>
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2.2 }]}>Event</Text>
                <Text style={[styles.th, { flex: 1.1 }]}>Date</Text>
                <Text style={[styles.th, { flex: 1 }]}>RSVPs</Text>
                <Text style={[styles.th, { flex: 0.8, textAlign: 'right' }]}>Action</Text>
              </View>
              {displayedOrganizerEvents.map((evt) => (
                <View key={evt.id} style={styles.tableDataRow}>
                  <TouchableOpacity
                    style={{ flex: 2.2 }}
                    onPress={() => setSelectedEvent(evt)}
                  >
                    <Text style={styles.tdBold} numberOfLines={1}>
                      {evt.title}
                    </Text>
                    <Text style={styles.tdSub} numberOfLines={1}>
                      {evt.category} • {evt.venue}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.td, { flex: 1.1 }]}>{evt.date}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {evt.registrationCount || 0}/{evt.venueCapacity || 150}
                  </Text>
                  <TouchableOpacity
                    style={{ flex: 0.8, alignItems: 'flex-end' }}
                    onPress={() => handleDeleteEvent(evt)}
                  >
                    <Text style={styles.delLink}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        );
      }

      if (activeTab === 'create') {
        return (
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>Create New Campus Event</Text>
            <Text style={styles.sectionSub}>
              Listing as: {user.name} ({user.organizerCode || 'Organizer'})
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., AI & Cybersecurity Workshop"
                value={newEvt.title}
                onChangeText={(t) => setNewEvt({ ...newEvt, title: t })}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <TextInput
                    style={styles.input}
                    value={newEvt.category}
                    onChangeText={(t) => setNewEvt({ ...newEvt, category: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Capacity</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={String(newEvt.venueCapacity)}
                    onChangeText={(t) => setNewEvt({ ...newEvt, venueCapacity: t })}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={newEvt.date}
                    onChangeText={(t) => setNewEvt({ ...newEvt, date: t })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Time Slot</Text>
                  <TextInput
                    style={styles.input}
                    value={newEvt.time}
                    onChangeText={(t) => setNewEvt({ ...newEvt, time: t })}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Venue Location</Text>
              <TextInput
                style={styles.input}
                value={newEvt.venue}
                onChangeText={(t) => setNewEvt({ ...newEvt, venue: t })}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, { height: 68, textAlignVertical: 'top' }]}
                multiline
                placeholder="Describe event agenda, speakers, and requirements..."
                value={newEvt.description}
                onChangeText={(t) => setNewEvt({ ...newEvt, description: t })}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateEvent}>
                <Text style={styles.primaryBtnText}>Publish Campus Event</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
      }

      if (activeTab === 'sms') {
        return renderSmsStudio();
      }

      return <ProfileScreen user={user} onSignOut={handleSignOut} />;
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
                ADMIN SYSTEM CONSOLE • {user.staffId || 'ADM-001'}
              </Text>
              <Text style={styles.roleHeroTitle}>{user.name}</Text>
              <Text style={styles.roleHeroSub}>
                22 Seeded Users (2 Admins • 10 Organizers • 10 Students) • {allEvents.length} Events
              </Text>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{usersList.length || 22}</Text>
                <Text style={styles.kpiLbl}>Users</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{allEvents.length}</Text>
                <Text style={styles.kpiLbl}>Events</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiVal}>{smsLogs.length}</Text>
                <Text style={styles.kpiLbl}>SMS Logs</Text>
              </View>
            </View>

            {/* Role Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 8 }}
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

            <Text style={styles.sectionHeader}>
              Users & Role Profiles Table ({filteredUsers.length})
            </Text>
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.8 }]}>Name / Email</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>Role</Text>
                <Text style={[styles.th, { flex: 1.1 }]}>Phone</Text>
              </View>
              {filteredUsers.map((u) => (
                <View key={u.id} style={styles.tableDataRow}>
                  <View style={{ flex: 1.8 }}>
                    <Text style={styles.tdBold} numberOfLines={1}>
                      {u.name}
                    </Text>
                    <Text style={styles.tdSub} numberOfLines={1}>
                      {u.email}
                    </Text>
                  </View>
                  <View style={{ flex: 0.9 }}>
                    <Text style={styles.roleMiniTag}>
                      {String(u.role || 'student').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.td, { flex: 1.1 }]} numberOfLines={1}>
                    {u.phone || '+2547...'}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        );
      }

      if (activeTab === 'events_table') {
        return (
          <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>
              Master Events Database Table ({allEvents.length})
            </Text>
            <Text style={styles.sectionSub}>
              16 Events listed across all 10 Strathmore Organizers
            </Text>

            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2.2 }]}>Event & Organizer</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>Category</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>RSVPs</Text>
                <Text style={[styles.th, { flex: 0.5, textAlign: 'right' }]}>Del</Text>
              </View>
              {allEvents.map((evt) => (
                <View key={evt.id} style={styles.tableDataRow}>
                  <TouchableOpacity
                    style={{ flex: 2.2 }}
                    onPress={() => setSelectedEvent(evt)}
                  >
                    <Text style={styles.tdBold} numberOfLines={1}>
                      {evt.title}
                    </Text>
                    <Text style={styles.tdSub} numberOfLines={1}>
                      {evt.organizerName || evt.organizer} • {evt.date}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.td, { flex: 0.9 }]} numberOfLines={1}>
                    {evt.category}
                  </Text>
                  <Text style={[styles.td, { flex: 0.9 }]}>
                    {evt.registrationCount}/{evt.venueCapacity}
                  </Text>
                  <TouchableOpacity
                    style={{ flex: 0.5, alignItems: 'flex-end' }}
                    onPress={() => handleDeleteEvent(evt)}
                  >
                    <Text style={styles.delLink}>Del</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        );
      }

      if (activeTab === 'sms') {
        return renderSmsStudio();
      }

      return <ProfileScreen user={user} onSignOut={handleSignOut} />;
    }
  };

  const renderSmsStudio = () => (
    <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>Africa's Talking Priority SMS Gateway</Text>
      <Text style={styles.sectionSub}>
        Broadcast HIGH / MEDIUM / LOW priority alerts to Kenyan E.164 (+254) numbers
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Message Type (Filtered by Each Student's Chosen SMS Priority)</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          {['URGENT', 'REMINDER', 'ANNOUNCEMENT'].map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.prioBtn, smsForm.kind === k && styles.prioBtnActive]}
              onPress={() => setSmsForm({ ...smsForm, kind: k })}
            >
              <Text
                style={[
                  styles.prioBtnText,
                  smsForm.kind === k && styles.prioBtnTextActive
                ]}
              >
                {k}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.inputLabel}>Recipient Phone Numbers (+254...)</Text>
        <TextInput
          style={styles.input}
          value={smsForm.phoneNumbers}
          onChangeText={(t) => setSmsForm({ ...smsForm, phoneNumbers: t })}
        />

        <Text style={styles.inputLabel}>SMS Broadcast Content</Text>
        <TextInput
          style={[styles.input, { height: 64, textAlignVertical: 'top' }]}
          multiline
          value={smsForm.message}
          onChangeText={(t) => setSmsForm({ ...smsForm, message: t })}
        />

        {smsStatusMsg ? (
          <View style={styles.smsFeedbackBox}>
            <Text style={styles.smsFeedbackText}>{smsStatusMsg}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSendSms}>
          <Text style={styles.primaryBtnText}>Send Priority SMS Broadcast</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionHeader, { marginTop: 14 }]}>
        SMS Delivery Logs Table ({smsLogs.length})
      </Text>
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { flex: 0.9 }]}>Priority</Text>
          <Text style={[styles.th, { flex: 2.2 }]}>Event & Message</Text>
          <Text style={[styles.th, { flex: 1 }]}>Status</Text>
        </View>
        {smsLogs.map((log, i) => (
          <View key={log.id || i} style={styles.tableDataRow}>
            <Text
              style={[
                styles.tdBold,
                {
                  flex: 0.9,
                  color: log.priority === 'HIGH' ? '#dc2626' : '#0284c7'
                }
              ]}
            >
              {log.priority || 'HIGH'}
            </Text>
            <View style={{ flex: 2.2 }}>
              <Text style={styles.tdBold} numberOfLines={1}>
                {log.eventTitle || 'Campus Alert'}
              </Text>
              <Text style={styles.tdSub} numberOfLines={2}>
                {log.message}
              </Text>
            </View>
            <Text style={[styles.td, { flex: 1, color: '#059669', fontWeight: 'bold' }]}>
              {log.status || 'SENT'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderBottomTabs = () => {
    if (selectedEvent) return null;

    if (!user) {
      return (
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>HOME</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}>
            <Text style={[styles.tabIcon, activeTab === 'notifications' && styles.activeTabIcon]}>
              SMS
            </Text>
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.activeTabLabel]}>
              SMS Feed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => handleOpenAuth('login')}>
            <Text style={styles.tabIcon}>IN</Text>
            <Text style={styles.tabLabel}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => handleOpenAuth('register')}>
            <Text style={styles.tabIcon}>NEW</Text>
            <Text style={styles.tabLabel}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (role === 'STUDENT') {
      return (
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>EVENTS</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
              Student Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('tickets')}>
            <Text style={[styles.tabIcon, activeTab === 'tickets' && styles.activeTabIcon]}>PASS</Text>
            <Text style={[styles.tabLabel, activeTab === 'tickets' && styles.activeTabLabel]}>
              Passes ({registeredIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}>
            <Text style={[styles.tabIcon, activeTab === 'notifications' && styles.activeTabIcon]}>
              SMS
            </Text>
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.activeTabLabel]}>
              SMS Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <Text style={[styles.tabIcon, activeTab === 'profile' && styles.activeTabIcon]}>ME</Text>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (role === 'ORGANIZER') {
      return (
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>LIST</Text>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
              My Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('create')}>
            <Text style={[styles.tabIcon, activeTab === 'create' && styles.activeTabIcon]}>ADD</Text>
            <Text style={[styles.tabLabel, activeTab === 'create' && styles.activeTabLabel]}>
              Create
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('sms')}>
            <Text style={[styles.tabIcon, activeTab === 'sms' && styles.activeTabIcon]}>SMS</Text>
            <Text style={[styles.tabLabel, activeTab === 'sms' && styles.activeTabLabel]}>
              AT SMS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <Text style={[styles.tabIcon, activeTab === 'profile' && styles.activeTabIcon]}>ME</Text>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>USERS</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>
            Users Table
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('events_table')}>
          <Text style={[styles.tabIcon, activeTab === 'events_table' && styles.activeTabIcon]}>
            EVENTS
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'events_table' && styles.activeTabLabel]}>
            Events Table
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('sms')}>
          <Text style={[styles.tabIcon, activeTab === 'sms' && styles.activeTabIcon]}>SMS</Text>
          <Text style={[styles.tabLabel, activeTab === 'sms' && styles.activeTabLabel]}>
            SMS Gateway
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.activeTabIcon]}>ME</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.rootScreen}>
      <StatusBar style="dark" />
      <View style={styles.mobileContainer}>
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
    padding: 14,
    paddingBottom: 26
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 10
  },
  roleHeroCard: {
    backgroundColor: '#003366',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  roleHeroTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fbbf24',
    letterSpacing: 0.6
  },
  roleHeroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2
  },
  roleHeroSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  kpiVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#003366'
  },
  kpiLbl: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600'
  },
  scopeSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center'
  },
  scopeBtnActive: {
    backgroundColor: '#003366'
  },
  scopeBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569'
  },
  scopeBtnTextActive: {
    color: '#ffffff'
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6
  },
  filterPillActive: {
    backgroundColor: '#003366',
    borderColor: '#003366'
  },
  filterPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569'
  },
  filterPillTextActive: {
    color: '#ffffff'
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginTop: 6
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  th: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase'
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  td: {
    fontSize: 10,
    color: '#334155'
  },
  tdBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  tdSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1
  },
  roleMiniTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#003366',
    backgroundColor: '#e0f2fe',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  delLink: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 10
  },
  primaryBtn: {
    backgroundColor: '#003366',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  prioBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569'
  },
  prioBtnTextActive: {
    color: '#ffffff'
  },
  smsFeedbackBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8
  },
  smsFeedbackText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600'
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6
  },
  emptyText: {
    fontSize: 11,
    color: '#64748b'
  },
  passCard: {
    backgroundColor: '#003366',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10
  },
  passTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  passTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#f59e0b'
  },
  passCode: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#bae6fd'
  },
  passTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  passMeta: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 2
  },
  savedCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6
  },
  savedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2
  },
  savedMeta: {
    fontSize: 10,
    color: '#64748b'
  },
  tabBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  tabIcon: {
    fontSize: 9,
    fontWeight: '900',
    color: '#003366',
    opacity: 0.45
  },
  activeTabIcon: {
    opacity: 1
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginTop: 2
  },
  activeTabLabel: {
    color: '#003366'
  }
});
