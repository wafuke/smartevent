import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from './src/screens/AuthScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { fetchEvents } from './src/services/api';

export default function App() {
  const [user, setUser] = useState({
    name: 'Elvis Wanyama Wafuke',
    studentId: '154210',
    email: 'student@strathmore.edu',
    phone: '+254712345678',
    role: 'student'
  });

  const [activeTab, setActiveTab] = useState('events'); // 'events', 'tickets', 'notifications', 'profile'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(['evt-101']);
  const [savedIds, setSavedIds] = useState(['evt-102']);
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    fetchEvents().then(setAllEvents);
  }, [activeTab]);

  const handleAuthenticate = (userData) => {
    setUser(userData);
    setActiveTab('events');
  };

  const handleRegisterSuccess = (eventId) => {
    if (!registeredIds.includes(eventId)) {
      setRegisteredIds([...registeredIds, eventId]);
    }
  };

  const handleCancelRegistration = (eventId) => {
    setRegisteredIds(registeredIds.filter((id) => id !== eventId));
  };

  const handleToggleSave = (eventId) => {
    if (savedIds.includes(eventId)) {
      setSavedIds(savedIds.filter((id) => id !== eventId));
    } else {
      setSavedIds([...savedIds, eventId]);
    }
  };

  if (!user) {
    return <AuthScreen onAuthenticate={handleAuthenticate} />;
  }

  const registeredEvents = allEvents.filter((e) => registeredIds.includes(e.id));
  const savedEvents = allEvents.filter((e) => savedIds.includes(e.id));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Screen Router */}
      <View style={styles.screenContainer}>
        {selectedEvent ? (
          <EventDetailScreen
            event={selectedEvent}
            user={user}
            isRegistered={registeredIds.includes(selectedEvent.id)}
            isSaved={savedIds.includes(selectedEvent.id)}
            onRegisterSuccess={handleRegisterSuccess}
            onCancelRegistration={handleCancelRegistration}
            onToggleSave={handleToggleSave}
            onBack={() => setSelectedEvent(null)}
          />
        ) : (
          <>
            {activeTab === 'events' && (
              <EventsScreen
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                registeredIds={registeredIds}
                savedIds={savedIds}
                onToggleSave={handleToggleSave}
              />
            )}

            {activeTab === 'tickets' && (
              <ScrollView contentContainerStyle={styles.ticketsContainer}>
                <Text style={styles.sectionHeader}>🎟️ My Digital Event Passes ({registeredEvents.length})</Text>
                <Text style={styles.sectionSub}>Present your admission pass at the venue entrance</Text>

                {registeredEvents.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>You haven't registered for any upcoming events yet.</Text>
                  </View>
                ) : (
                  registeredEvents.map((evt) => (
                    <TouchableOpacity
                      key={evt.id}
                      style={styles.passCard}
                      onPress={() => setSelectedEvent(evt)}
                    >
                      <View style={styles.passTop}>
                        <Text style={styles.passTag}>CONFIRMED PASS • {user.studentId}</Text>
                        <Text style={styles.passCode}>#{evt.id.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.passTitle}>{evt.title}</Text>
                      <Text style={styles.passMeta}>📅 {evt.date} • {evt.time || evt.timeSlot}</Text>
                      <Text style={styles.passMeta}>📍 {evt.venue}</Text>
                    </TouchableOpacity>
                  ))
                )}

                <Text style={[styles.sectionHeader, { marginTop: 22 }]}>
                  ★ Saved / Bookmarked Events ({savedEvents.length})
                </Text>
                {savedEvents.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>Tap ☆ on any event card to bookmark it for later.</Text>
                  </View>
                ) : (
                  savedEvents.map((evt) => (
                    <TouchableOpacity
                      key={evt.id}
                      style={styles.savedCard}
                      onPress={() => setSelectedEvent(evt)}
                    >
                      <Text style={styles.savedTitle}>{evt.title}</Text>
                      <Text style={styles.passMeta}>📅 {evt.date} • 📍 {evt.venue}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            )}

            {activeTab === 'notifications' && <NotificationsScreen />}

            {activeTab === 'profile' && (
              <ProfileScreen
                user={user}
                registeredCount={registeredIds.length}
                savedCount={savedIds.length}
                onSignOut={() => setUser(null)}
              />
            )}
          </>
        )}
      </View>

      {/* Bottom Mobile Tab Bar */}
      {!selectedEvent && (
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('events')}>
            <Text style={[styles.tabIcon, activeTab === 'events' && styles.activeTabIcon]}>📅</Text>
            <Text style={[styles.tabLabel, activeTab === 'events' && styles.activeTabLabel]}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('tickets')}>
            <Text style={[styles.tabIcon, activeTab === 'tickets' && styles.activeTabIcon]}>🎟️</Text>
            <Text style={[styles.tabLabel, activeTab === 'tickets' && styles.activeTabLabel]}>
              My RSVPs ({registeredIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('notifications')}>
            <Text style={[styles.tabIcon, activeTab === 'notifications' && styles.activeTabIcon]}>🔔</Text>
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.activeTabLabel]}>SMS Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profile')}>
            <Text style={[styles.tabIcon, activeTab === 'profile' && styles.activeTabIcon]}>👤</Text>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screenContainer: {
    flex: 1,
  },
  ticketsContainer: {
    padding: 20,
    backgroundColor: '#f8fafc',
    flexGrow: 1,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
  },
  passCard: {
    backgroundColor: '#003366',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  passTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  passTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  passCode: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#bae6fd',
  },
  passTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  passMeta: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },
  savedCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  savedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  tabBar: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.45,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#003366',
  }
});
