import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Clock, MapPin, AlignLeft, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import './EventModal.css';

const EventModal = ({ date, dayEvents, onClose, onAdd, onUpdate, onDelete }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        time: '',
        location: '',
        description: ''
    });

    const dateString = date.toISOString().split('T')[0];

    useEffect(() => {
        // Add escape key listener to close modal
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleMaskClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleStartAdd = () => {
        setFormData({ title: '', time: '12:00', location: '', description: '' });
        setIsAdding(true);
        setEditingId(null);
    };

    const handleStartEdit = (event) => {
        setFormData({
            title: event.title,
            time: event.time || '',
            location: event.location || '',
            description: event.description || ''
        });
        setEditingId(event.id);
        setIsAdding(true);
    };

    const handleCancelForm = () => {
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        if (editingId) {
            onUpdate(dateString, editingId, formData);
        } else {
            onAdd(dateString, formData);
        }

        setIsAdding(false);
        setEditingId(null);
    };

    return (
        <div className="modal-mask" onClick={handleMaskClick}>
            <div className="modal-container glass-panel">
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">
                            {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                        </h2>
                        <p className="modal-subtitle">
                            {dayEvents.length} événement{dayEvents.length !== 1 ? 's' : ''} prévu{dayEvents.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close modal">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {!isAdding ? (
                        <>
                            {dayEvents.length > 0 ? (
                                <div className="events-list">
                                    {dayEvents.map(event => (
                                        <div key={event.id} className="event-item">
                                            <div className="event-content">
                                                <h3 className="event-title">{event.title}</h3>

                                                <div className="event-details">
                                                    {event.time && (
                                                        <div className="detail-row">
                                                            <Clock size={16} />
                                                            <span>{event.time}</span>
                                                        </div>
                                                    )}
                                                    {event.location && (
                                                        <div className="detail-row">
                                                            <MapPin size={16} />
                                                            <span>{event.location}</span>
                                                        </div>
                                                    )}
                                                    {event.description && (
                                                        <div className="detail-row description">
                                                            <AlignLeft size={16} />
                                                            <p>{event.description}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="event-actions">
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleStartEdit(event)}
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => onDelete(dateString, event.id)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <CalendarIcon size={48} className="empty-icon" />
                                    <p>Aucun événement prévu pour ce jour.</p>
                                </div>
                            )}

                            <div className="modal-footer">
                                <button className="btn-primary w-full" onClick={handleStartAdd}>
                                    Ajouter un événement
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="event-form animation-fade-in">
                            <h3 className="form-title">
                                {editingId ? 'Modifier l\'événement' : 'Ajouter un événement'}
                            </h3>

                            <div className="form-group">
                                <label className="form-label" htmlFor="title">Titre de l'événement *</label>
                                <input
                                    id="title"
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="ex: Réunion d'équipe"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label className="form-label" htmlFor="time">Heure</label>
                                    <input
                                        id="time"
                                        type="time"
                                        className="form-input"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>

                                <div className="form-group half">
                                    <label className="form-label" htmlFor="location">Lieu</label>
                                    <input
                                        id="location"
                                        type="text"
                                        className="form-input"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="ex: Salle 402"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="description">Description (Optionnel)</label>
                                <textarea
                                    id="description"
                                    className="form-input textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ajoutez vos notes ici..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={handleCancelForm}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary">
                                    {editingId ? 'Enregistrer' : 'Créer l\'événement'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventModal;
