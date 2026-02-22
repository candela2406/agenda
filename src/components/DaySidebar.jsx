import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Clock, MapPin, Type, AlignLeft, ChevronRight } from 'lucide-react';
import './DaySidebar.css';

const DaySidebar = ({ isOpen, dateString, placedActivities, activities, onClose, onRemoveActivity, onUpdateActivity }) => {
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editDescription, setEditDescription] = useState('');

    if (!dateString) return null;

    const placements = (placedActivities && placedActivities[dateString]) || [];
    const dayActivities = placements
        .map(placement => {
            const def = activities.find(a => a.id === placement.id && !a.isHidden);
            return def ? { ...def, title: placement.title, time: placement.time, location: placement.location, description: placement.description } : null;
        })
        .filter(Boolean);

    const dateObj = new Date(dateString + 'T00:00:00');
    const formattedDate = format(dateObj, 'EEEE d MMMM yyyy', { locale: fr });

    const startEdit = (a) => {
        setEditingId(a.id);
        setEditTitle(a.title || '');
        setEditTime(a.time || '');
        setEditLocation(a.location || '');
        setEditDescription(a.description || '');
    };

    const saveEdit = (activityId) => {
        onUpdateActivity(dateString, activityId, { title: editTitle, time: editTime, location: editLocation, description: editDescription });
        setEditingId(null);
    };

    const handleKeyDown = (e, activityId) => {
        if (e.key === 'Enter' && !e.shiftKey) saveEdit(activityId);
        if (e.key === 'Escape') setEditingId(null);
    };

    const hasDetails = (a) => a.title || a.time || a.location || a.description;

    return (
        <aside className={`day-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="day-sidebar-content">
                <div className="day-sidebar-header">
                    <div className="day-sidebar-date">{formattedDate}</div>
                    <button className="day-sidebar-close" onClick={onClose} title="Fermer">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="day-sidebar-activities">
                    {dayActivities.length === 0 && (
                        <div className="day-sidebar-empty">Aucune activité</div>
                    )}
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

                            {editingId === a.id ? (
                                <div className="day-sidebar-edit">
                                    <div className="day-sidebar-edit-row">
                                        <Type size={14} />
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="day-sidebar-input"
                                            placeholder={a.name}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="day-sidebar-edit-row">
                                        <Clock size={14} />
                                        <input
                                            type="time"
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="day-sidebar-input"
                                        />
                                    </div>
                                    <div className="day-sidebar-edit-row">
                                        <MapPin size={14} />
                                        <input
                                            type="text"
                                            value={editLocation}
                                            onChange={(e) => setEditLocation(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="day-sidebar-input"
                                            placeholder="Lieu"
                                        />
                                    </div>
                                    <div className="day-sidebar-edit-row">
                                        <AlignLeft size={14} />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="day-sidebar-input day-sidebar-textarea"
                                            placeholder="Description"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="day-sidebar-edit-actions">
                                        <button className="day-sidebar-save" onClick={() => saveEdit(a.id)}>Enregistrer</button>
                                        <button className="day-sidebar-cancel" onClick={() => setEditingId(null)}>Annuler</button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="day-sidebar-details"
                                    onClick={() => startEdit(a)}
                                    title="Cliquer pour modifier"
                                >
                                    {hasDetails(a) ? (
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
        </aside>
    );
};

export default DaySidebar;
