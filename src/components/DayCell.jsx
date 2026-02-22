import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './DayCell.css';

const DayCell = ({ date, hasEvents, isLeave, activities = [], isHoliday, isToday, onClick }) => {
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

    return (
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
    );
};

export default DayCell;
