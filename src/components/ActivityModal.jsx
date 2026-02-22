import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import './ActivityModal.css';

const PREDEFINED_COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
];

const ActivityModal = ({ activities, onClose, onAddActivity, onToggleHideActivity, onDeleteActivity }) => {
    const [newActivityName, setNewActivityName] = useState('');
    const [newActivityColor, setNewActivityColor] = useState(PREDEFINED_COLORS[0]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newActivityName.trim()) return;

        onAddActivity({
            name: newActivityName.trim(),
            color: newActivityColor,
            isHidden: false
        });

        setNewActivityName('');
    };

    return (
        <div className="modal-mask" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-container glass-panel activity-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Gérer les activités</h2>
                    <button className="close-button" onClick={onClose} aria-label="Fermer">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="activities-list">
                        {activities.length === 0 ? (
                            <p className="empty-state-text">Aucune activité configurée.</p>
                        ) : (
                            activities.map(activity => (
                                <div key={activity.id} className={`activity-list-item ${activity.isHidden ? 'is-hidden' : ''}`}>
                                    <div className="activity-info">
                                        <div className="activity-color-swatch" style={{ backgroundColor: activity.color }}></div>
                                        <span className="activity-name">{activity.name}</span>
                                    </div>
                                    <div className="activity-actions">
                                        <button
                                            className="action-btn toggle-hide-btn"
                                            onClick={() => onToggleHideActivity(activity.id)}
                                            title={activity.isHidden ? "Afficher l'activité" : "Masquer l'activité"}
                                        >
                                            {activity.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => onDeleteActivity(activity.id)}
                                            title="Supprimer l'activité"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="divider"></div>

                    <form className="add-activity-form" onSubmit={handleAdd}>
                        <h3 className="form-subtitle">Nouvelle activité</h3>
                        <div className="form-group">
                            <label className="form-label">Nom</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newActivityName}
                                onChange={(e) => setNewActivityName(e.target.value)}
                                placeholder="ex. Formation"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Couleur</label>
                            <div className="color-picker">
                                {PREDEFINED_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-btn ${newActivityColor === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setNewActivityColor(color)}
                                        aria-label={`Choisir la couleur ${color}`}
                                    ></button>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="btn-primary w-full" disabled={!newActivityName.trim()}>
                            <Plus size={18} /> Ajouter
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ActivityModal;
