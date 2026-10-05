import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { fetchPriorityNotifications } from '../services/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchPriorityNotifications();
    setNotifications(data);
    setLoading(false);
  };

  const renderNotificationCard = ({ item }) => {
    const priority = (item.priority || 'MEDIUM').toUpperCase();
    
    return (
      <View style={[
        styles.card,
        priority === 'HIGH' && styles.highCard,
        priority === 'MEDIUM' && styles.mediumCard
      ]}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.badge,
            priority === 'HIGH' && styles.highBadge,
            priority === 'MEDIUM' && styles.mediumBadge,
            priority === 'LOW' && styles.lowBadge
          ]}>
            <Text style={[
              styles.badgeText,
              priority === 'HIGH' && styles.highBadgeText,
              priority === 'MEDIUM' && styles.mediumBadgeText,
              priority === 'LOW' && styles.lowBadgeText
            ]}>{priority} PRIORITY</Text>
          </View>
          <Text style={styles.timeText}>{item.sentAt || 'Recently'}</Text>
        </View>

        <Text style={styles.eventTitle}>{item.eventTitle || 'Campus Alert'}</Text>
        <Text style={styles.message}>{item.message}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Priority SMS & Notifications</Text>
        <Text style={styles.headerSubtitle}>Africa's Talking Gateway Feed</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#003366" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={renderNotificationCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  highCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  mediumCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  highBadge: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
  },
  highBadgeText: {
    color: '#dc2626',
  },
  mediumBadge: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  mediumBadgeText: {
    color: '#d97706',
  },
  lowBadge: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  lowBadgeText: {
    color: '#0284c7',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 10,
    color: '#64748b',
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  message: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  }
});
