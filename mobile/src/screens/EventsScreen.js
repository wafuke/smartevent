import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl
} from 'react-native';
import { fetchEvents } from '../services/api';

export default function EventsScreen({
  user,
  events: propEvents,
  onRefresh,
  onSelectEvent,
  onOpenAuth,
  registeredIds = [],
  savedIds = [],
  onToggleSave
}) {
  const [localEvents, setLocalEvents] = useState([]);
  const [loading, setLoading] = useState(!propEvents || propEvents.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    'All',
    'Academic',
    'Workshop',
    'Seminar',
    'Club Activity',
    'Sports',
    'Career Fair'
  ];

  const events = propEvents && propEvents.length > 0 ? propEvents : localEvents;

  useEffect(() => {
    if (!propEvents || propEvents.length === 0) {
      loadEvents();
    } else {
      setLoading(false);
    }
  }, [propEvents]);

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchEvents();
    setLocalEvents(data);
    if (onRefresh) onRefresh();
    setLoading(false);
  };

  const handlePullRefresh = async () => {
    setRefreshing(true);
    const data = await fetchEvents();
    setLocalEvents(data);
    if (onRefresh) await onRefresh();
    setRefreshing(false);
  };

  const filteredEvents = events.filter((e) => {
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (e.title || '').toLowerCase().includes(q) ||
      (e.venue || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q) ||
      (e.organizerName || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const renderHeader = () => (
    <View style={styles.headerWrap}>
      {/* Compact App Top Bar */}
      {!user ? (
        <View style={styles.publicBanner}>
          <View style={styles.publicBannerTop}>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoMarkText}>SE</Text>
              </View>
              <View>
                <Text style={styles.appBrand}>SmartEvent</Text>
                <Text style={styles.appSubBrand}>Strathmore University</Text>
              </View>
            </View>
            <View style={styles.publicActions}>
              <TouchableOpacity
                style={styles.ghostLoginBtn}
                onPress={() => onOpenAuth && onOpenAuth('login')}
              >
                <Text style={styles.ghostLoginText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goldSignupBtn}
                onPress={() => onOpenAuth && onOpenAuth('register')}
              >
                <Text style={styles.goldSignupText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.publicHeadline}>Campus Events & Turnout Forecast</Text>
        </View>
      ) : (
        <View style={styles.userBanner}>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{(user.name || 'S').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userGreeting} numberOfLines={1}>
                Hi, {user.name.split(' ')[0]}
              </Text>
              <Text style={styles.userStatsText}>
                {registeredIds.length} Passes • {savedIds.length} Saved
              </Text>
            </View>
            <TouchableOpacity style={styles.syncPill} onPress={handlePullRefresh}>
              <Text style={styles.syncPillText}>Sync</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Clean Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events, venues or clubs..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, active && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catChipText, active && styles.catChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.listSectionBar}>
        <Text style={styles.listSectionTitle}>
          {selectedCategory === 'All' ? 'Upcoming Events' : selectedCategory}
        </Text>
        <Text style={styles.listCountPill}>{filteredEvents.length} events</Text>
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
      <TouchableOpacity
        style={styles.card}
        onPress={() => onSelectEvent(item)}
        activeOpacity={0.85}
      >
        {/* Top Row: Category + Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{item.category}</Text>
          </View>

          <View style={styles.rightBadges}>
            {isRegistered && (
              <View style={styles.regBadge}>
                <Text style={styles.regBadgeText}>Going</Text>
              </View>
            )}
            {onToggleSave && (
              <TouchableOpacity
                style={[styles.bookmarkBtn, isSaved && styles.bookmarkBtnActive]}
                onPress={() => onToggleSave(item.id)}
              >
                <Text style={[styles.bookmarkText, isSaved && styles.bookmarkTextActive]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Event Title */}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Clean Date & Venue Meta */}
        <View style={styles.metaBlock}>
          <Text style={styles.metaPrimary} numberOfLines={1}>
            {item.date} • {item.time || item.timeSlot || '14:00'}
          </Text>
          <Text style={styles.metaSecondary} numberOfLines={1}>
            {item.venue}
          </Text>
        </View>

        {/* Compact Capacity Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${fillPct}%` },
                fillPct >= 85 ? { backgroundColor: '#ef4444' } : { backgroundColor: '#003366' }
              ]}
            />
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.seatsText}>
              {reg} / {cap} seats
            </Text>
            <Text style={styles.tapPrompt}>Details →</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <ActivityIndicator size="large" color="#003366" style={{ marginTop: 40 }} />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              tintColor="#003366"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No events match your filter</Text>
              <Text style={styles.emptySubtitle}>
                Try selecting &apos;All&apos; categories or clearing your search query.
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
  headerWrap: {
    paddingBottom: 6
  },
  publicBanner: {
    backgroundColor: '#003366',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16
  },
  publicBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoMarkText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 13
  },
  appBrand: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15
  },
  appSubBrand: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600'
  },
  publicActions: {
    flexDirection: 'row',
    gap: 8
  },
  ghostLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)'
  },
  ghostLoginText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },
  goldSignupBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f59e0b'
  },
  goldSignupText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 12
  },
  publicHeadline: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12
  },
  userBanner: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userAvatarText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '800'
  },
  userGreeting: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  userStatsText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600'
  },
  syncPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9'
  },
  syncPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003366'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500'
  },
  clearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearBtnText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700'
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8
  },
  catChipActive: {
    backgroundColor: '#003366',
    borderColor: '#003366'
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  catChipTextActive: {
    color: '#ffffff'
  },
  listSectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 4
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  listCountPill: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  listContent: {
    paddingBottom: 28
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  catBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  catBadgeText: {
    color: '#003366',
    fontSize: 11,
    fontWeight: '800'
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  regBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8
  },
  regBadgeText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800'
  },
  bookmarkBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  bookmarkBtnActive: {
    backgroundColor: '#fef3c7'
  },
  bookmarkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  bookmarkTextActive: {
    color: '#b45309'
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 21,
    marginBottom: 8
  },
  metaBlock: {
    gap: 3,
    marginBottom: 12
  },
  metaPrimary: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  metaSecondary: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b'
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  barTrack: {
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6
  },
  barFill: {
    height: 5,
    borderRadius: 3
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  seatsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  tapPrompt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003366'
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 28,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
  }
});
