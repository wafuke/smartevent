import React from 'react';
import EventFormModal from './EventFormModal';

// Thin wrapper kept for existing imports; the real implementation is EventFormModal.
export default function EventEditModal({ isOpen, onClose, event, onSaveEvent, isAdmin }) {
  if (!event) return null;
  return <EventFormModal isOpen={isOpen} onClose={onClose} event={event} onSubmit={(payload) => onSaveEvent({ id: event.id, ...payload })} isAdmin={isAdmin} />;
}
