import React from 'react';
import EventFormModal from './EventFormModal';

// Thin wrapper kept for existing imports; the real implementation is EventFormModal.
export default function EventCreationModal({ isOpen, onClose, onCreateEvent, isAdmin, organizers }) {
  return <EventFormModal isOpen={isOpen} onClose={onClose} onSubmit={(payload) => onCreateEvent(payload)} isAdmin={isAdmin} organizers={organizers} />;
}
