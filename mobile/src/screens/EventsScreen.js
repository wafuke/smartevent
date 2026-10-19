import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { fetchEvents } from '../services/api';

export default function EventsScreen({
  onSelectEvent,
  registeredIds = [],
  savedIds = [],
  onToggleSave
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Academic', 'Workshop', 'Seminar', 'Career Fair', 'Sports'];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchEvents();
    setEvents(data);
    setLoading(false);
  };

  const filteredEvents = events.filter(e => {
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      (e.title || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const renderEventCard = ({ item }) => {
    const isRegistered = registeredIds.includes(item.id);
    const isSaved = savedIds.includes(item.id);
    const cap = Number(item.venueCapacity) || 150;
    const reg = Number(item.registrationCount) || 0;
    const fillPct = Math.min(100, Math.round((reg / cap) * 100));

    return (
      <TouchableOpacity style={styles.card} onPress={() => onSelectEvent(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            {item.smsPriority === 3 && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>⚡ HIGH SMS</Text>
              </View>
            )}
          </View>

          <View style={styles.badgeRow}>
            {isRegistered && (
              <View style={styles.registeredBadge}>
                <Text style={styles.registeredText}>RSVP'D ✓</Text>
              </View>
            )}
            {onToggleSave && (
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => onToggleSave(item.id)}
              >
                <Text style={styles.saveIcon}>{isSaved ? '★' : '☆'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        {/* Capacity Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>👥 {reg} / {cap} Registered</Text>
            <Text style={[
              styles.progressPct,
              fillPct >= 85 ? { color: '#dc2626' } : { color: '#0284c7' }
            ]}>
              {fillPct}% Full
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${fillPct}%` },
                fillPct >= 85 ? { backgroundColor: '#ef4444' } : { backgroundColor: '#003366' }
              ]}
            />
          </View>
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>📅 {item.date} • {item.time || item.timeSlot}</Text>
          <Text style={styles.metaText}>📍 {item.venue}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Campus Events</Text>
          <Text style={styles.headerSubtitle}>Strathmore University • SmartEvent ML</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadEvents}>
          <Text style={styles.refreshText}>↻ Sync</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search workshops, seminars, venues..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Horizontal Category Pills */}
      <View style={styles.categoryWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, selectedCategory === cat && styles.activePill]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.pillText, selectedCategory === cat && styles.activePillText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      {loading ? (
        <ActivityIndicator size="large" color="#003366" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={item => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No matching campus events</Text>
              <Text style={styles.emptySubtitle}>Try clearing your search or selecting 'All' categories.</Text>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  refreshBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#003366',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  categoryWrapper: {
    marginBottom: 12,
  },
  categoryRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  activePill: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  pillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  activePillText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  priorityBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  registeredBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  registeredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
  },
  saveBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saveIcon: {
    fontSize: 18,
    color: '#f59e0b',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 18,
  },
  progressSection: {
    marginBottom: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  progressPct: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  cardMeta: {
    flexDirection: 'column',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  }
});
