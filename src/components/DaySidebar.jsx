import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Clock, MapPin, AlignLeft, Type, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import './DaySidebar.css';

const DaySidebar = ({
    isOpen, dateString, placedActivities, activities, events,
    onClose, onRemoveActivity, onUpdateActivity,
    onAddEvent, onUpdateEvent, onDeleteEvent
}) => {
    // Activity inline edit state
    const [editingActivityId, setEditingActivityId] = useState(null);
    const [activityEditData, setActivityEditData] = useState({ title: '', time: '', location: '', description: '' });

    // Event form state
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [eventFormData, setEventFormData] = useState({ title: '', time: '', location: '', description: '' });

    if (!dateString) return null;

    const placements = (placedActivities && placedActivities[dateString]) || [];
    const dayActivities = placements
        .map(placement => {
            const def = activities.find(a => a.id === placement.id && !a.isHidden);
            return def ? { ...def, title: placement.title, time: placement.time, location: placement.location, description: placement.description } : null;
        })
        .filter(Boolean);

    const dayEvents = (events && events[dateString]) || [];

    const dateObj = new Date(dateString + 'T00:00:00');
    const formattedDate = format(dateObj, 'EEEE d MMMM yyyy', { locale: fr });

    // Activity edit handlers
    const startActivityEdit = (a) => {
        setEditingActivityId(a.id);
        setActivityEditData({ title: a.title || '', time: a.time || '', location: a.location || '', description: a.description || '' });
    };

    const saveActivityEdit = (activityId) => {
        onUpdateActivity(dateString, activityId, activityEditData);
        setEditingActivityId(null);
    };

    const handleActivityKeyDown = (e, activityId) => {
        if (e.key === 'Enter' && !e.shiftKey) saveActivityEdit(activityId);
        if (e.key === 'Escape') setEditingActivityId(null);
    };

    const hasActivityDetails = (a) => a.title || a.time || a.location || a.description;

    // Event form handlers
    const handleStartAddEvent = () => {
        setEventFormData({ title: '', time: '12:00', location: '', description: '' });
        setIsAddingEvent(true);
        setEditingEventId(null);
    };

    const handleStartEditEvent = (event) => {
        setEventFormData({
            title: event.title,
            time: event.time || '',
            location: event.location || '',
            description: event.description || ''
        });
        setEditingEventId(event.id);
        setIsAddingEvent(true);
    };

    const handleCancelEventForm = () => {
        setIsAddingEvent(false);
        setEditingEventId(null);
    };

    const handleSubmitEvent = (e) => {
        e.preventDefault();
        if (!eventFormData.title.trim()) return;

        if (editingEventId) {
            onUpdateEvent(dateString, editingEventId, eventFormData);
        } else {
            onAddEvent(dateString, eventFormData);
        }

        setIsAddingEvent(false);
        setEditingEventId(null);
    };

    return (
        <aside className={`day-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="day-sidebar-content">
                <div className="day-sidebar-header">
                    <div className="day-sidebar-date">{formattedDate}</div>
                    <button className="day-sidebar-close" onClick={onClose} title="Fermer">
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Activities section */}
                {dayActivities.length > 0 && (
                    <div className="day-sidebar-section">
                        <h3 className="day-sidebar-section-title">Activités</h3>
                        <div className="day-sidebar-activities">
                            {dayActivities.map(a => (
                                <div key={a.id} className="day-sidebar-activity">
                                    <div className="day-sidebar-activity-header">
                                        <span className="day-sidebar-dot" style={{ backgroundColor: a.color }} />
                                        <span className="day-sidebar-activity-name">{a.title || a.name}</span>
                                        <button
                                            className="day-sidebar-remove"
                                            onClick={() => onRemoveActivity(dateString, a.id)}
                                            title={`Retirer ${a.name}`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>

                                    {editingActivityId === a.id ? (
                                        <div className="day-sidebar-edit">
                                            <div className="day-sidebar-edit-row">
                                                <Type size={14} />
                                                <input
                                                    type="text"
                                                    value={activityEditData.title}
                                                    onChange={(e) => setActivityEditData({ ...activityEditData, title: e.target.value })}
                                                    onKeyDown={(e) => handleActivityKeyDown(e, a.id)}
                                                    className="day-sidebar-input"
                                                    placeholder={a.name}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="day-sidebar-edit-row">
                                                <Clock size={14} />
                                                <input
                                                    type="time"
                                                    value={activityEditData.time}
                                                    onChange={(e) => setActivityEditData({ ...activityEditData, time: e.target.value })}
                                                    onKeyDown={(e) => handleActivityKeyDown(e, a.id)}
                                                    className="day-sidebar-input"
                                                />
                                            </div>
                                            <div className="day-sidebar-edit-row">
                                                <MapPin size={14} />
                                                <input
                                                    type="text"
                                                    value={activityEditData.location}
                                                    onChange={(e) => setActivityEditData({ ...activityEditData, location: e.target.value })}
                                                    onKeyDown={(e) => handleActivityKeyDown(e, a.id)}
                                                    className="day-sidebar-input"
                                                    placeholder="Lieu"
                                                />
                                            </div>
                                            <div className="day-sidebar-edit-row">
                                                <AlignLeft size={14} />
                                                <textarea
                                                    value={activityEditData.description}
                                                    onChange={(e) => setActivityEditData({ ...activityEditData, description: e.target.value })}
                                                    onKeyDown={(e) => handleActivityKeyDown(e, a.id)}
                                                    className="day-sidebar-input day-sidebar-textarea"
                                                    placeholder="Description"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="day-sidebar-edit-actions">
                                                <button className="day-sidebar-save" onClick={() => saveActivityEdit(a.id)}>Enregistrer</button>
                                                <button className="day-sidebar-cancel" onClick={() => setEditingActivityId(null)}>Annuler</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="day-sidebar-details"
                                            onClick={() => startActivityEdit(a)}
                                            title="Cliquer pour modifier"
                                        >
                                            {hasActivityDetails(a) ? (
                                                <>
                                                    {a.title && <span className="day-sidebar-detail day-sidebar-detail-title">{a.title}</span>}
                                                    {a.time && <span className="day-sidebar-detail"><Clock size={12} /> {a.time}</span>}
                                                    {a.location && <span className="day-sidebar-detail"><MapPin size={12} /> {a.location}</span>}
                                                    {a.description && <span className="day-sidebar-detail day-sidebar-detail-desc">{a.description}</span>}
                                                </>
                                            ) : (
                                                <span className="day-sidebar-placeholder">+ Ajouter des détails</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Events section */}
                <div className="day-sidebar-section">
                    <div className="day-sidebar-section-header">
                        <h3 className="day-sidebar-section-title">Événements</h3>
                        {!isAddingEvent && (
                            <button className="day-sidebar-add-event" onClick={handleStartAddEvent} title="Ajouter un événement">
                                <Plus size={14} />
                            </button>
                        )}
                    </div>

                    {!isAddingEvent ? (
                        <div className="day-sidebar-events">
                            {dayEvents.length === 0 ? (
                                <div className="day-sidebar-empty">Aucun événement</div>
                            ) : (
                                dayEvents.map(event => (
                                    <div key={event.id} className="day-sidebar-event">
                                        <div className="day-sidebar-event-header">
                                            <span className="day-sidebar-event-title">{event.title}</span>
                                            <div className="day-sidebar-event-actions">
                                                <button
                                                    className="day-sidebar-event-btn"
                                                    onClick={() => handleStartEditEvent(event)}
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    className="day-sidebar-event-btn day-sidebar-event-btn-danger"
                                                    onClick={() => onDeleteEvent(dateString, event.id)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="day-sidebar-event-details">
                                            {event.time && <span className="day-sidebar-detail"><Clock size={12} /> {event.time}</span>}
                                            {event.location && <span className="day-sidebar-detail"><MapPin size={12} /> {event.location}</span>}
                                            {event.description && <span className="day-sidebar-detail day-sidebar-detail-desc">{event.description}</span>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmitEvent} className="day-sidebar-event-form">
                            <div className="day-sidebar-edit-row">
                                <Type size={14} />
                                <input
                                    type="text"
                                    value={eventFormData.title}
                                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                    className="day-sidebar-input"
                                    placeholder="Titre *"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="day-sidebar-edit-row">
                                <Clock size={14} />
                                <input
                                    type="time"
                                    value={eventFormData.time}
                                    onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                                    className="day-sidebar-input"
                                />
                            </div>
                            <div className="day-sidebar-edit-row">
                                <MapPin size={14} />
                                <input
                                    type="text"
                                    value={eventFormData.location}
                                    onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                                    className="day-sidebar-input"
                                    placeholder="Lieu"
                                />
                            </div>
                            <div className="day-sidebar-edit-row">
                                <AlignLeft size={14} />
                                <textarea
                                    value={eventFormData.description}
                                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                                    className="day-sidebar-input day-sidebar-textarea"
                                    placeholder="Description"
                                    rows={2}
                                />
                            </div>
                            <div className="day-sidebar-edit-actions">
                                <button type="submit" className="day-sidebar-save">
                                    {editingEventId ? 'Enregistrer' : 'Créer'}
                                </button>
                                <button type="button" className="day-sidebar-cancel" onClick={handleCancelEventForm}>
                                    Annuler
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default DaySidebar;
