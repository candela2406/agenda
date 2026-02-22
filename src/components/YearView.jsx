import React from 'react';
import MonthView from './MonthView';
import './YearView.css';

const YearView = ({ year, events, leaves, placedActivities, activities, holidayDates, onDayClick, onRemoveActivity, onUpdateActivity }) => {
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
        <div className="year-container">
            {months.map((month) => (
                <MonthView
                    key={month}
                    year={year}
                    month={month}
                    events={events}
                    leaves={leaves}
                    placedActivities={placedActivities}
                    activities={activities}
                    holidayDates={holidayDates}
                    onDayClick={onDayClick}
                    onRemoveActivity={onRemoveActivity}
                    onUpdateActivity={onUpdateActivity}
                />
            ))}
        </div>
    );
};

export default YearView;
