import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { registerStudentForEvent, fetchEventPrediction } from '../services/api';

export default function EventDetailScreen({
  event,
  user,
  isRegistered,
  isSaved,
  onRegisterSuccess,
  onCancelRegistration,
  onToggleSave,
  onBack
}) {
  const [submitting, setSubmitting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [loadingPred, setLoadingPred] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (event) {
      setLoadingPred(true);
      fetchEventPrediction(event).then((res) => {
        if (mounted) {
          setPrediction(res);
          setLoadingPred(false);
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, [event]);

  if (!event) return null;

  const handleRSVP = async () => {
    setSubmitting(true);
    const result = await registerStudentForEvent(event.id, user || {});
    setSubmitting(false);

    if (result.success) {
      onRegisterSuccess(event.id);
      Alert.alert(
        "RSVP Confirmed 🎉",
        `You are registered for "${event.title}". High-priority SMS alerts will be sent to ${user?.phone || '+254712345678'}.`
      );
    } else {
      Alert.alert("Registration Notice", result.error || "Unable to register.");
    }
  };

  const handleCancel = () => {
    if (onCancelRegistration) {
      onCancelRegistration(event.id);
      Alert.alert("RSVP Cancelled", `Your registration for "${event.title}" has been removed.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Bar: Back + Save */}
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backText}>← Back to Events</Text>
          </TouchableOpacity>

          {onToggleSave && (
            <TouchableOpacity style={styles.savePill} onPress={() => onToggleSave(event.id)}>
              <Text style={styles.savePillText}>
                {isSaved ? '★ Saved' : '☆ Save Event'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
            <Text style={styles.infoLabel}>📅 Date & Time Slot</Text>
            <Text style={styles.infoValue}>{event.date} • {event.time || event.timeSlot}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Venue Location</Text>
            <Text style={styles.infoValue}>{event.venue}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>🏛️ Organizer</Text>
            <Text style={styles.infoValue}>{event.organizer || 'Strathmore University SCES'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👥 Current Registrations</Text>
            <Text style={styles.infoValue}>
              {(event.registrationCount || 0) + (isRegistered ? 1 : 0)} / {event.venueCapacity} seats reserved
            </Text>
          </View>
        </View>

        {/* ML Attendance Prediction Card */}
        <View style={styles.mlCard}>
          <View style={styles.mlHeaderRow}>
            <Text style={styles.mlTitle}>🤖 AI Turnout & Crowd Forecast</Text>
            <View style={styles.mlAlgoBadge}>
              <Text style={styles.mlAlgoText}>{prediction?.algorithm || 'LogisticRegression'}</Text>
            </View>
          </View>

          {loadingPred ? (
            <ActivityIndicator size="small" color="#003366" style={{ marginVertical: 10 }} />
          ) : prediction ? (
            <>
              <View style={styles.mlMetricsRow}>
                <View style={styles.mlMetricBox}>
                  <Text style={styles.mlMetricVal}>{prediction.predictedAttendance}</Text>
                  <Text style={styles.mlMetricLabel}>Expected Turnout</Text>
                </View>
                <View style={styles.mlMetricBox}>
                  <Text style={styles.mlMetricVal}>{Math.round((prediction.predictedTurnoutRate || 0.72) * 100)}%</Text>
                  <Text style={styles.mlMetricLabel}>Show-Up Prob</Text>
                </View>
                <View style={styles.mlMetricBox}>
                  <Text style={styles.mlMetricVal}>{prediction.capacityUtilization}%</Text>
                  <Text style={styles.mlMetricLabel}>Room Fill</Text>
                </View>
              </View>
              <Text style={styles.mlFootnote}>
                {prediction.capacityUtilization >= 85
                  ? '⚠️ High crowd density expected. Arrive 15 minutes early to secure seating.'
                  : '✅ Comfortable seating capacity forecasted by SmartEvent ML model.'}
              </Text>
            </>
          ) : null}
        </View>

        {/* Priority SMS Notification Alert Notice */}
        <View style={styles.smsNotice}>
          <Text style={styles.smsNoticeTitle}>📱 Africa's Talking Priority SMS Enabled</Text>
          <Text style={styles.smsNoticeText}>
            Registered students automatically receive real-time SMS alerts for urgent venue changes and schedule reminders.
          </Text>
        </View>

        {/* RSVP Action Buttons */}
        <TouchableOpacity
          style={[styles.rsvpButton, isRegistered && styles.rsvpSuccessButton]}
          onPress={handleRSVP}
          disabled={isRegistered || submitting}
        >
          <Text style={[styles.rsvpButtonText, isRegistered && styles.rsvpSuccessText]}>
            {isRegistered
              ? "✓ Registered / Digital Pass Active"
              : submitting
              ? "Confirming RSVP..."
              : "Register / Confirm RSVP"}
          </Text>
        </TouchableOpacity>

        {isRegistered && onCancelRegistration && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel My RSVP</Text>
          </TouchableOpacity>
        )}
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
    paddingBottom: 36,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#003366',
  },
  savePill: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  savePillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b45309',
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
    marginBottom: 18,
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
  mlCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 16,
  },
  mlHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mlTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#003366',
  },
  mlAlgoBadge: {
    backgroundColor: '#003366',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mlAlgoText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  mlMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mlMetricBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  mlMetricVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003366',
  },
  mlMetricLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  mlFootnote: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
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
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  cancelButtonText: {
    color: '#dc2626',
    fontWeight: 'bold',
    fontSize: 13,
  }
});
