import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AuthScreen from './src/screens/AuthScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [user, setUser] = useState({
    name: 'Elvis Wanyama Wafuke',
    studentId: '154210',
    email: 'student@strathmore.edu',
    role: 'student'
  });

  const [activeTab, setActiveTab] = useState('events'); // 'events', 'notifications', 'profile'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registeredIds, setRegisteredIds] = useState(['evt-101']);

  const handleAuthenticate = (userData) => {
    setUser(userData);
    setActiveTab('events');
  };

  const handleRegisterSuccess = (eventId) => {
    if (!registeredIds.includes(eventId)) {
      setRegisteredIds([...registeredIds, eventId]);
    }
  };

  if (!user) {
    return <AuthScreen onAuthenticate={handleAuthenticate} />;
  }

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
            onRegisterSuccess={handleRegisterSuccess}
            onBack={() => setSelectedEvent(null)}
          />
        ) : (
          <>
            {activeTab === 'events' && (
              <EventsScreen
                onSelectEvent={(evt) => setSelectedEvent(evt)}
                registeredIds={registeredIds}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsScreen />
            )}
            {activeTab === 'profile' && (
              <ProfileScreen
                user={user}
                onSignOut={() => setUser(null)}
              />
            )}
          </>
        )}
      </View>

      {/* Bottom Mobile Tab Bar */}
      {!selectedEvent && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabIcon, activeTab === 'events' && styles.activeTabIcon]}>📅</Text>
            <Text style={[styles.tabLabel, activeTab === 'events' && styles.activeTabLabel]}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={[styles.tabIcon, activeTab === 'notifications' && styles.activeTabIcon]}>🔔</Text>
            <Text style={[styles.tabLabel, activeTab === 'notifications' && styles.activeTabLabel]}>Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('profile')}
          >
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
  tabBar: {
    flexDirection: 'row',
    height: 60,
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
    opacity: 0.5,
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
