import React from 'react';
import {
    format,
    getDaysInMonth,
    startOfMonth,
    getDay,
    isSameDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import DayCell from './DayCell';
import { toDateString } from '../utils/dateUtils';
import './MonthView.css';

const MonthView = ({ year, month, events, leaves, placedActivities, activities, holidayDates = [], onDayClick, datePickingRange, onDayMouseDown, onDayMouseEnter }) => {
    const date = new Date(year, month, 1);
    const monthName = format(date, 'MMMM', { locale: fr });
    const daysInMonth = getDaysInMonth(date);

    // We want Monday to be the start of the week.
    // getDay returns 0 for Sunday, 1 for Monday... 
    // Shift the indices so Monday is 0.
    const startDay = (getDay(startOfMonth(date)) + 6) % 7;

    // Create an array of days to render
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        return new Date(year, month, i + 1);
    });

    // Blank cells before the first day of the month
    const blanks = Array.from({ length: startDay }, (_, i) => i);

    const weekDays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

    return (
        <div className="month-card glass-panel">
            <div className="month-header">
                <h2 className="month-name">{monthName}</h2>
            </div>

            <div className="month-grid">
                {weekDays.map(day => (
                    <div key={day} className="weekday-label">
                        {day}
                    </div>
                ))}

                {blanks.map(blank => (
                    <div key={`blank-${blank}`} className="day-blank"></div>
                ))}

                {days.map(day => {
                    const dateString = toDateString(day);
                    const hasEvents = events[dateString] && events[dateString].length > 0;
                    const isLeave = leaves && leaves[dateString];
                    const placements = (placedActivities && placedActivities[dateString]) || [];
                    const dayActivities = placements
                        .map(placement => {
                            const def = activities.find(a => a.id === placement.id && !a.isHidden);
                            return def ? { ...def, title: placement.title, time: placement.time, location: placement.location, description: placement.description } : null;
                        })
                        .filter(Boolean);
                    const isHoliday = holidayDates.includes(dateString);

                    const dayEvents = (events[dateString] || []);

                    return (
                        <DayCell
                            key={day.toString()}
                            date={day}
                            hasEvents={hasEvents}
                            dayEvents={dayEvents}
                            isLeave={isLeave}
                            activities={dayActivities}
                            isHoliday={isHoliday}
                            isToday={isSameDay(day, new Date())}
                            onClick={() => onDayClick(day)}
                            isInPickingRange={datePickingRange && dateString >= datePickingRange.start && dateString <= datePickingRange.end}
                            isPickingStart={datePickingRange && dateString === datePickingRange.start}
                            isPickingEnd={datePickingRange && dateString === datePickingRange.end}
                            onMouseDown={() => onDayMouseDown(dateString)}
                            onMouseEnter={() => onDayMouseEnter(dateString)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default MonthView;
