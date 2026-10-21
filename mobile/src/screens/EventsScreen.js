import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { fetchEvents } from '../services/api';

export default function EventsScreen({
  user,
  onSelectEvent,
  onOpenAuth,
  registeredIds = [],
  savedIds = [],
  onToggleSave
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Academic', 'Workshop', 'Seminar', 'Career Fair', 'Sports', 'Cultural'];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchEvents();
    setEvents(data);
    setLoading(false);
  };

  const filteredEvents = events.filter((e) => {
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      (e.title || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.organizerName || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const renderHeader = () => (
    <View>
      {/* Public Home Hero OR Student Welcome Banner */}
      {!user ? (
        <View style={styles.publicHero}>
          <View style={styles.heroTopRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>🎓 STRATHMORE SMARTEVENT</Text>
            </View>
            <TouchableOpacity style={styles.syncMiniBtn} onPress={loadEvents}>
              <Text style={styles.syncMiniText}>↻ Sync</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroTitle}>Discover & RSVP to Campus Events</Text>
          <Text style={styles.heroSub}>
            Browse public lectures, workshops, career fairs & sports. Sign in as a Student, Organizer, or Admin to unlock your dashboard.
          </Text>
          <View style={styles.heroAuthRow}>
            <TouchableOpacity
              style={styles.heroLoginBtn}
              onPress={() => onOpenAuth && onOpenAuth('login')}
            >
              <Text style={styles.heroLoginText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroSignupBtn}
              onPress={() => onOpenAuth && onOpenAuth('register')}
            >
              <Text style={styles.heroSignupText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.studentBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeLabel}>STUDENT HOME • {user.studentId || 'SCES'}</Text>
            <Text style={styles.welcomeName} numberOfLines={1}>
              Welcome, {user.name}
            </Text>
            <Text style={styles.welcomeSub}>
              {registeredIds.length} Registered • {savedIds.length} Saved • SMS Priority Active
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadEvents}>
            <Text style={styles.refreshText}>↻ Sync</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, venues, organizers..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Horizontal Category Pills */}
      <View style={styles.categoryWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.pill, selectedCategory === cat && styles.activePill]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.pillText, selectedCategory === cat && styles.activePillText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'All' ? 'Upcoming Campus Events' : `${selectedCategory} Events`} ({filteredEvents.length})
        </Text>
      </View>
    </View>
  );

  const renderEventCard = ({ item }) => {
    const isRegistered = registeredIds.includes(item.id);
    const isSaved = savedIds.includes(item.id);
    const cap = Number(item.venueCapacity) || 150;
    const reg = Number(item.registrationCount) || 0;
    const fillPct = Math.min(100, Math.round((reg / cap) * 100));

    return (
      <TouchableOpacity style={styles.card} onPress={() => onSelectEvent(item)} activeOpacity={0.85}>
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
              <TouchableOpacity style={styles.saveBtn} onPress={() => onToggleSave(item.id)}>
                <Text style={styles.saveIcon}>{isSaved ? '★' : '☆'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Capacity Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              👥 {reg} / {cap} Registered
            </Text>
            <Text
              style={[
                styles.progressPct,
                fillPct >= 85 ? { color: '#dc2626' } : { color: '#0284c7' }
              ]}
            >
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
          <Text style={styles.metaText} numberOfLines={1}>
            📅 {item.date} • {item.time || item.timeSlot}
          </Text>
          <Text style={styles.metaText} numberOfLines={1}>
            📍 {item.venue} {item.organizerName ? `• 🏛️ ${item.organizerName}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <ActivityIndicator size="large" color="#003366" style={{ marginTop: 32 }} />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No matching campus events</Text>
              <Text style={styles.emptySubtitle}>
                Try clearing your search or selecting 'All' categories.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  publicHero: {
    backgroundColor: '#003366',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 18,
    padding: 16
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  brandBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b'
  },
  brandBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold'
  },
  syncMiniBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  syncMiniText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  heroSub: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    marginBottom: 12
  },
  heroAuthRow: {
    flexDirection: 'row',
    gap: 10
  },
  heroLoginBtn: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  heroLoginText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 12
  },
  heroSignupBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  heroSignupText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12
  },
  studentBanner: {
    backgroundColor: '#003366',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  welcomeLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fbbf24',
    letterSpacing: 0.6
  },
  welcomeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 2
  },
  welcomeSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2
  },
  refreshBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8
  },
  refreshText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  searchContainer: {
    paddingHorizontal: 14,
    marginVertical: 6
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0f172a'
  },
  categoryWrapper: {
    marginBottom: 8
  },
  categoryRow: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6
  },
  activePill: {
    backgroundColor: '#003366',
    borderColor: '#003366'
  },
  pillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b'
  },
  activePillText: {
    color: '#ffffff'
  },
  sectionTitleRow: {
    paddingHorizontal: 14,
    marginBottom: 6
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155'
  },
  listContent: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  categoryBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd'
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0284c7'
  },
  priorityBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  priorityText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#dc2626'
  },
  registeredBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  registeredText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669'
  },
  saveBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  saveIcon: {
    fontSize: 17,
    color: '#f59e0b'
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 3
  },
  cardDesc: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 10,
    lineHeight: 16
  },
  progressSection: {
    marginBottom: 8
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  progressText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  progressPct: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: 5,
    borderRadius: 3
  },
  cardMeta: {
    flexDirection: 'column',
    gap: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b'
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155'
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center'
  }
});
