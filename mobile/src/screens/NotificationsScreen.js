import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { fetchPriorityNotifications } from '../services/api';

export default function NotificationsScreen({ logs: propLogs, onRefresh }) {
  const [localLogs, setLocalLogs] = useState([]);
  const [loading, setLoading] = useState(!propLogs || propLogs.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  const notifications = propLogs && propLogs.length > 0 ? propLogs : localLogs;

  useEffect(() => {
    if (!propLogs || propLogs.length === 0) {
      loadNotifications();
    } else {
      setLoading(false);
    }
  }, [propLogs]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await fetchPriorityNotifications();
    setLocalLogs(data);
    setLoading(false);
  };

  const handlePull = async () => {
    setRefreshing(true);
    const data = await fetchPriorityNotifications();
    setLocalLogs(data);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  };

  const formatTime = (val) => {
    if (!val) return 'Just now';
    if (String(val).includes('T')) {
      try {
        const d = new Date(val);
        return d.toLocaleString('en-KE', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return val;
      }
    }
    return val;
  };

  const renderNotificationCard = ({ item }) => {
    const priority = (item.priority || 'MEDIUM').toUpperCase();

    return (
      <View
        style={[
          styles.card,
          priority === 'HIGH' && styles.highCard,
          priority === 'MEDIUM' && styles.mediumCard
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.badge,
              priority === 'HIGH' && styles.highBadge,
              priority === 'MEDIUM' && styles.mediumBadge,
              priority === 'LOW' && styles.lowBadge
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                priority === 'HIGH' && styles.highBadgeText,
                priority === 'MEDIUM' && styles.mediumBadgeText,
                priority === 'LOW' && styles.lowBadgeText
              ]}
            >
              {priority} PRIORITY
            </Text>
          </View>
          <Text style={styles.timeText}>{formatTime(item.sentAt)}</Text>
        </View>

        <Text style={styles.eventTitle}>{item.eventTitle || 'Campus Alert'}</Text>
        <Text style={styles.message}>{item.message}</Text>

        <View style={styles.metaFooter}>
          <Text style={styles.metaText}>
            To: {item.recipient || item.recipientName || 'Event Roster'}
          </Text>
          <Text style={styles.statusPill}>{item.status || 'SENT'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Priority SMS Alerts</Text>
          <Text style={styles.headerSubtitle}>
            Africa&apos;s Talking Live Gateway (smartevent)
          </Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={handlePull}>
          <Text style={styles.syncBtnText}>Sync</Text>
        </TouchableOpacity>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handlePull} tintColor="#003366" />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No SMS dispatches yet</Text>
              <Text style={styles.emptySub}>
                Priority alerts sent via Africa&apos;s Talking will appear here in real time.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2
  },
  syncBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003366'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  highCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca'
  },
  mediumCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8
  },
  highBadge: {
    backgroundColor: '#fee2e2'
  },
  highBadgeText: {
    color: '#dc2626'
  },
  mediumBadge: {
    backgroundColor: '#fef3c7'
  },
  mediumBadgeText: {
    color: '#b45309'
  },
  lowBadge: {
    backgroundColor: '#e0f2fe'
  },
  lowBadgeText: {
    color: '#0369a1'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  message: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19
  },
  metaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.06)'
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  statusPill: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669'
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  }
});
