import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { registerStudentForEvent } from '../services/api';

export default function EventDetailScreen({ event, user, isRegistered, onRegisterSuccess, onBack }) {
  const [submitting, setSubmitting] = useState(false);

  if (!event) return null;

  const handleRSVP = async () => {
    setSubmitting(true);
    const result = await registerStudentForEvent(event.id, user || {});
    setSubmitting(false);

    if (result.success) {
      onRegisterSuccess(event.id);
      Alert.alert("Success 🎉", "You have registered for " + event.title);
    } else {
      Alert.alert("Registration Error", result.error || "Unable to register.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back to Events</Text>
        </TouchableOpacity>

        {/* Category */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{event.category}</Text>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>

        {/* Event Meta Details Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Date & Time</Text>
            <Text style={styles.infoValue}>{event.date} • {event.time || event.timeSlot}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Venue Location</Text>
            <Text style={styles.infoValue}>{event.venue}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👥 Venue Capacity</Text>
            <Text style={styles.infoValue}>{event.registrationCount || 0} / {event.venueCapacity} seats registered</Text>
          </View>
        </View>

        {/* Priority SMS Notification Alert Notice */}
        <View style={styles.smsNotice}>
          <Text style={styles.smsNoticeTitle}>📱 Priority SMS Enabled</Text>
          <Text style={styles.smsNoticeText}>
            You will receive high-priority SMS notifications via Africa's Talking API for urgent venue changes and reminders.
          </Text>
        </View>

        {/* RSVP Button */}
        <TouchableOpacity
          style={[styles.rsvpButton, isRegistered && styles.rsvpSuccessButton]}
          onPress={handleRSVP}
          disabled={isRegistered || submitting}
        >
          <Text style={[styles.rsvpButtonText, isRegistered && styles.rsvpSuccessText]}>
            {isRegistered ? "✓ Registered / RSVP Confirmed" : submitting ? "Submitting..." : "Register / Confirm RSVP"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#003366',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 10,
    lineHeight: 26,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'column',
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  smsNotice: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 20,
  },
  smsNoticeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 2,
  },
  smsNoticeText: {
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
  },
  rsvpButton: {
    backgroundColor: '#003366',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rsvpSuccessButton: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  rsvpButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rsvpSuccessText: {
    color: '#047857',
  }
});
