import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Clock, MapPin, Type, AlignLeft } from 'lucide-react';
import './DayCell.css';

const DayCell = ({ date, hasEvents, isLeave, activities = [], isHoliday, isToday, onClick, onRemoveActivity, onUpdateActivity }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const dayNumber = format(date, 'd');
    const hasActivities = activities.length > 0;

    const classNames = [
        'day-cell',
        isToday ? 'is-today' : '',
        isHoliday ? 'is-holiday' : '',
        hasEvents ? 'has-events' : '',
        hasActivities ? 'has-activities' : '',
        isLeave ? `is-leave type-${isLeave === true ? 'full' : isLeave}` : ''
    ].filter(Boolean).join(' ');

    const firstColor = hasActivities ? activities[0].color : null;

    const startEdit = (a) => {
        setEditingId(a.id);
        setEditTitle(a.title || '');
        setEditTime(a.time || '');
        setEditLocation(a.location || '');
        setEditDescription(a.description || '');
    };

    const saveEdit = (activityId) => {
        onUpdateActivity(activityId, { title: editTitle, time: editTime, location: editLocation, description: editDescription });
        setEditingId(null);
    };

    const handleKeyDown = (e, activityId) => {
        if (e.key === 'Enter' && !e.shiftKey) saveEdit(activityId);
        if (e.key === 'Escape') setEditingId(null);
    };

    const hasDetails = (a) => a.title || a.time || a.location || a.description;

    return (
        <div
            className="day-cell-wrapper"
            onMouseEnter={() => hasActivities && setShowTooltip(true)}
            onMouseLeave={() => { setShowTooltip(false); setEditingId(null); }}
        >
            <button
                className={classNames}
                onClick={onClick}
                aria-label={`Voir les événements pour le ${format(date, 'd MMMM yyyy', { locale: fr })}`}
                style={hasActivities ? { backgroundColor: `${firstColor}15` } : {}}
            >
                <span className="day-number" style={firstColor ? { color: firstColor, fontWeight: 'bold' } : {}}>{dayNumber}</span>
                {hasActivities && (
                    <div className="activity-bar">
                        {activities.map(a => (
                            <div
                                key={a.id}
                                className="activity-bar-segment"
                                style={{ backgroundColor: a.color, flex: 1 }}
                            />
                        ))}
                    </div>
                )}
                {hasEvents && <div className="event-dot" />}
            </button>
            {showTooltip && hasActivities && (
                <div className="activity-tooltip">
                    {activities.map(a => (
                        <div key={a.id} className="activity-tooltip-item">
                            <div className="activity-tooltip-header">
                                <span className="activity-tooltip-dot" style={{ backgroundColor: a.color }} />
                                <span className="activity-tooltip-name">{a.title || a.name}</span>
                                <button
                                    className="activity-tooltip-remove"
                                    onClick={(e) => { e.stopPropagation(); onRemoveActivity(a.id); }}
                                    title={`Retirer ${a.name}`}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            {editingId === a.id ? (
                                <div className="activity-tooltip-edit" onClick={(e) => e.stopPropagation()}>
                                    <div className="tooltip-edit-row">
                                        <Type size={12} />
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="tooltip-edit-input"
                                            placeholder={a.name}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="tooltip-edit-row">
                                        <Clock size={12} />
                                        <input
                                            type="time"
                                            value={editTime}
                                            onChange={(e) => setEditTime(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="tooltip-edit-input"
                                        />
                                    </div>
                                    <div className="tooltip-edit-row">
                                        <MapPin size={12} />
                                        <input
                                            type="text"
                                            value={editLocation}
                                            onChange={(e) => setEditLocation(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="tooltip-edit-input"
                                            placeholder="Lieu"
                                        />
                                    </div>
                                    <div className="tooltip-edit-row">
                                        <AlignLeft size={12} />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, a.id)}
                                            className="tooltip-edit-input tooltip-edit-textarea"
                                            placeholder="Description"
                                            rows={2}
                                        />
                                    </div>
                                    <button
                                        className="tooltip-edit-save"
                                        onClick={(e) => { e.stopPropagation(); saveEdit(a.id); }}
                                    >
                                        OK
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="activity-tooltip-details"
                                    onClick={(e) => { e.stopPropagation(); startEdit(a); }}
                                    title="Cliquer pour modifier"
                                >
                                    {hasDetails(a) ? (
                                        <>
                                            {a.title && <span className="tooltip-detail tooltip-detail-title">{a.title}</span>}
                                            {a.time && <span className="tooltip-detail"><Clock size={10} /> {a.time}</span>}
                                            {a.location && <span className="tooltip-detail"><MapPin size={10} /> {a.location}</span>}
                                            {a.description && <span className="tooltip-detail tooltip-detail-desc">{a.description}</span>}
                                        </>
                                    ) : (
                                        <span className="tooltip-detail-placeholder">+ Détails</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DayCell;
