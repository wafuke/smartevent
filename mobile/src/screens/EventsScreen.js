import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { fetchEvents } from '../services/api';

export default function EventsScreen({ onSelectEvent, registeredIds = [] }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Academic', 'Workshop', 'Sports'];

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
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const renderEventCard = ({ item }) => {
    const isRegistered = registeredIds.includes(item.id);

    return (
      <TouchableOpacity style={styles.card} onPress={() => onSelectEvent(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          {isRegistered && (
            <View style={styles.registeredBadge}>
              <Text style={styles.registeredText}>RSVP'D ✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

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
        <Text style={styles.headerTitle}>Available Campus Events</Text>
        <Text style={styles.headerSubtitle}>Strathmore Student Portal</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search workshops, talks, sports..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, selectedCategory === cat && styles.activePill]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.pillText, selectedCategory === cat && styles.activePillText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
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
    paddingBottom: 8,
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
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
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
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  }
});
