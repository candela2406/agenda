import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './DayCell.css';

const DayCell = ({ date, hasEvents, dayEvents = [], isLeave, activities = [], isHoliday, isToday, onClick, isInPickingRange, isPickingStart, isPickingEnd, onMouseDown, onMouseEnter }) => {
    const dayNumber = format(date, 'd');
    const hasActivities = activities.length > 0;
    const hasTooltip = hasActivities || dayEvents.length > 0;

    const classNames = [
        'day-cell',
        isToday ? 'is-today' : '',
        isHoliday ? 'is-holiday' : '',
        hasEvents ? 'has-events' : '',
        hasActivities ? 'has-activities' : '',
        isLeave ? `is-leave type-${isLeave === true ? 'full' : isLeave}` : '',
        isInPickingRange ? 'is-in-picking-range' : '',
        isPickingStart ? 'is-picking-start' : '',
        isPickingEnd ? 'is-picking-end' : ''
    ].filter(Boolean).join(' ');

    const firstColor = hasActivities && !isInPickingRange ? activities[0].color : null;

    const handleMouseDown = (e) => {
        e.preventDefault(); // prevent text selection during drag
        onMouseDown?.();
    };

    return (
        <button
            className={classNames}
            onClick={onClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={onMouseEnter}
            aria-label={`Voir les événements pour le ${format(date, 'd MMMM yyyy', { locale: fr })}`}
            style={hasActivities && !isInPickingRange ? { backgroundColor: `${firstColor}15` } : {}}
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
            {hasTooltip && (
                <div className="day-tooltip">
                    {activities.map(a => (
                        <div key={a.id} className="day-tooltip-item">
                            <span className="day-tooltip-dot" style={{ backgroundColor: a.color }} />
                            <span>{a.title || a.name}</span>
                        </div>
                    ))}
                    {dayEvents.map(ev => (
                        <div key={ev.id} className="day-tooltip-item day-tooltip-event">
                            <span className="day-tooltip-dot day-tooltip-dot-event" />
                            <span>{ev.title}</span>
                        </div>
                    ))}
                </div>
            )}
        </button>
    );
};

export default DayCell;
