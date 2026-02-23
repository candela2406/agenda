import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plane, Edit2, PanelLeftClose, PanelLeftOpen, Plus, Settings, EyeOff, Eye } from 'lucide-react';
import YearView from './components/YearView';
import DaySidebar from './components/DaySidebar';
import ActivityModal from './components/ActivityModal';
import { getEvents, saveEvents, getLeaves, saveLeaves, getSettings, saveSettings, getActivities, saveActivities, getPlacedActivities, savePlacedActivities } from './utils/storage';
import { fetchAllData, pushData } from './utils/api';
import { getZoneADates } from './utils/holidaysZoneA';
import './App.css';

function App() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState({});
  const [leaves, setLeaves] = useState({});
  const [settings, setSettings] = useState({ totalLeaves: 25 });
  const [leaveMode, setLeaveMode] = useState(false);
  const [leaveSelectionType, setLeaveSelectionType] = useState('full');

  const [activities, setActivities] = useState([]);
  const [placedActivities, setPlacedActivities] = useState({});
  const [activeActivityId, setActiveActivityId] = useState(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotalLeaves, setTempTotalLeaves] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [rightSidebarDate, setRightSidebarDate] = useState(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  useEffect(() => {
    const loadedEvents = getEvents();
    const loadedLeaves = getLeaves();
    const loadedSettings = getSettings();
    let loadedActivities = getActivities();

    const ZONE_A_ID = 'system-vacances-zone-a';
    if (!loadedActivities.find(a => a.id === ZONE_A_ID)) {
      const zoneAActivity = { id: ZONE_A_ID, name: 'Vacances Zone A', color: '#ec4899', isHidden: false };
      loadedActivities = [...loadedActivities, zoneAActivity];
      saveActivities(loadedActivities);
    }

    const loadedPlacedActivities = getPlacedActivities();
    setEvents(loadedEvents);
    setLeaves(loadedLeaves);
    setSettings(loadedSettings);
    setActivities(loadedActivities);
    setPlacedActivities(loadedPlacedActivities);

    // Background sync from API
    fetchAllData().then(data => {
      if (!data) return; // API unavailable, keep localStorage data

      const hasApiData = Object.keys(data).length > 0;

      if (hasApiData) {
        // API has data — overwrite local with server truth
        if (data.events !== undefined) { setEvents(data.events); saveEvents(data.events, true); }
        if (data.leaves !== undefined) { setLeaves(data.leaves); saveLeaves(data.leaves, true); }
        if (data.settings !== undefined) { setSettings(data.settings); saveSettings(data.settings, true); }
        if (data.activities !== undefined) { setActivities(data.activities); saveActivities(data.activities, true); }
        if (data.placed_activities !== undefined) { setPlacedActivities(data.placed_activities); savePlacedActivities(data.placed_activities, true); }
      } else {
        // API is empty — seed it with current localStorage data
        pushData('events', loadedEvents);
        pushData('leaves', loadedLeaves);
        pushData('settings', loadedSettings);
        pushData('activities', loadedActivities);
        pushData('placed_activities', loadedPlacedActivities);
      }
    });
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }, []);

  const handlePrevYear = () => setCurrentYear(prev => prev - 1);
  const handleNextYear = () => setCurrentYear(prev => prev + 1);

  const handleDayClick = (date) => {
    const dateString = date.toISOString().split('T')[0];

    if (leaveMode) {
      const updatedLeaves = { ...leaves };
      if (updatedLeaves[dateString] === leaveSelectionType || (updatedLeaves[dateString] === true && leaveSelectionType === 'full')) {
        delete updatedLeaves[dateString];
      } else {
        updatedLeaves[dateString] = leaveSelectionType;
      }
      setLeaves(updatedLeaves);
      saveLeaves(updatedLeaves);
    } else if (activeActivityId) {
      const updatedPlaced = { ...placedActivities };
      const current = updatedPlaced[dateString] || [];
      const exists = current.some(item => item.id === activeActivityId);
      if (exists) {
        const filtered = current.filter(item => item.id !== activeActivityId);
        if (filtered.length === 0) {
          delete updatedPlaced[dateString];
        } else {
          updatedPlaced[dateString] = filtered;
        }
      } else {
        updatedPlaced[dateString] = [...current, { id: activeActivityId }];
      }
      setPlacedActivities(updatedPlaced);
      savePlacedActivities(updatedPlaced);
    } else {
      setRightSidebarDate(dateString);
      setRightSidebarOpen(true);
    }
  };

  const handleAddEvent = (dateString, eventData) => {
    const updatedEvents = { ...events };
    if (!updatedEvents[dateString]) {
      updatedEvents[dateString] = [];
    }
    updatedEvents[dateString].push({ id: Date.now().toString(), ...eventData });
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
  };

  const handleUpdateEvent = (dateString, eventId, eventData) => {
    if (!events[dateString]) return;
    const updatedEvents = { ...events };
    updatedEvents[dateString] = updatedEvents[dateString].map(ev =>
      ev.id === eventId ? { ...ev, ...eventData } : ev
    );
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
  };

  const handleDeleteEvent = (dateString, eventId) => {
    if (!events[dateString]) return;
    const updatedEvents = { ...events };
    updatedEvents[dateString] = updatedEvents[dateString].filter(ev => ev.id !== eventId);
    if (updatedEvents[dateString].length === 0) {
      delete updatedEvents[dateString];
    }
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
  };

  const handleStartEditTotal = () => {
    setTempTotalLeaves(settings.totalLeaves.toString());
    setIsEditingTotal(true);
  };

  const handleSaveTotalLeaves = () => {
    const newTotal = parseInt(tempTotalLeaves, 10);
    if (!isNaN(newTotal) && newTotal > 0) {
      const newSettings = { ...settings, totalLeaves: newTotal };
      setSettings(newSettings);
      saveSettings(newSettings);
    }
    setIsEditingTotal(false);
  };

  const handleTotalLeavesKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveTotalLeaves();
    else if (e.key === 'Escape') setIsEditingTotal(false);
  };

  const handleAddActivity = (activityData) => {
    const newActivities = [...activities, { id: Date.now().toString(), ...activityData }];
    setActivities(newActivities);
    saveActivities(newActivities);
  };

  const handleToggleHideActivity = (activityId) => {
    const newActivities = activities.map(a =>
      a.id === activityId ? { ...a, isHidden: !a.isHidden } : a
    );
    setActivities(newActivities);
    saveActivities(newActivities);
    const toggledActivity = newActivities.find(a => a.id === activityId);
    if (toggledActivity?.isHidden && activeActivityId === activityId) {
      setActiveActivityId(null);
    }
  };

  const handleDeleteActivity = (activityId) => {
    const newActivities = activities.filter(a => a.id !== activityId);
    setActivities(newActivities);
    saveActivities(newActivities);
    if (activeActivityId === activityId) {
      setActiveActivityId(null);
    }
  };

  const handleRemovePlacedActivity = (dateString, activityId) => {
    const updatedPlaced = { ...placedActivities };
    const current = updatedPlaced[dateString] || [];
    const filtered = current.filter(item => item.id !== activityId);
    if (filtered.length === 0) {
      delete updatedPlaced[dateString];
    } else {
      updatedPlaced[dateString] = filtered;
    }
    setPlacedActivities(updatedPlaced);
    savePlacedActivities(updatedPlaced);
  };

  const handleUpdatePlacedActivity = (dateString, activityId, details) => {
    const updatedPlaced = { ...placedActivities };
    const current = updatedPlaced[dateString] || [];
    updatedPlaced[dateString] = current.map(item =>
      item.id === activityId ? { ...item, ...details } : item
    );
    setPlacedActivities(updatedPlaced);
    savePlacedActivities(updatedPlaced);
  };

  const currentYearLeavesCount = Object.entries(leaves)
    .filter(([dateString]) => dateString.startsWith(currentYear.toString()))
    .reduce((total, [_, type]) => {
      if (type === 'full' || type === true) return total + 1;
      if (type === 'morning' || type === 'afternoon') return total + 0.5;
      return total;
    }, 0);

  const holidayDates = getZoneADates();

  return (
    <div className={`app-container ${leaveMode ? 'leave-mode-active' : ''}`}>
      <header className="app-header">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Fermer le panneau' : 'Ouvrir le panneau'}
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          <div className="app-title">
            <CalendarIcon className="title-icon" size={28} strokeWidth={2.5} />
            <h1>Mon Agenda</h1>
          </div>
        </div>

        <div className="year-nav">
          <button onClick={handlePrevYear} aria-label="Previous Year">
            <ChevronLeft size={24} />
          </button>
          <span className="current-year">{currentYear}</span>
          <button onClick={handleNextYear} aria-label="Next Year">
            <ChevronRight size={24} />
          </button>
        </div>
      </header>

      <div className="app-body">
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-content">
            {/* Activities section */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <h3 className="sidebar-section-title">Activités</h3>
                <button
                  className="sidebar-icon-btn"
                  onClick={() => setIsActivityModalOpen(true)}
                  title="Gérer les activités"
                >
                  <Settings size={14} />
                </button>
              </div>
              <div className="sidebar-activities">
                {activities.map(activity => (
                  <div key={activity.id} className={`sidebar-activity-row ${activity.isHidden ? 'hidden-activity' : ''}`}>
                    <button
                      className={`sidebar-activity-btn ${activeActivityId === activity.id ? 'active' : ''} ${leaveMode || activity.isHidden ? 'disabled' : ''}`}
                      onClick={() => { if (!leaveMode && !activity.isHidden) { setActiveActivityId(activeActivityId === activity.id ? null : activity.id); closeSidebarOnMobile(); } }}
                      style={activity.isHidden
                        ? { borderColor: `${activity.color}30`, color: `${activity.color}60` }
                        : activeActivityId === activity.id
                          ? { backgroundColor: activity.color, borderColor: activity.color, color: '#fff' }
                          : { borderColor: `${activity.color}60`, color: activity.color }
                      }
                    >
                      <span className="sidebar-activity-dot" style={{ backgroundColor: activity.isHidden ? `${activity.color}40` : activeActivityId === activity.id ? '#fff' : activity.color }} />
                      <span className="sidebar-activity-name">{activity.name}</span>
                    </button>
                    <button
                      className="sidebar-activity-toggle-visibility"
                      onClick={() => handleToggleHideActivity(activity.id)}
                      title={activity.isHidden ? `Afficher ${activity.name}` : `Masquer ${activity.name}`}
                    >
                      {activity.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                ))}
                <button
                  className="sidebar-add-btn"
                  onClick={() => setIsActivityModalOpen(true)}
                  title="Ajouter une activité"
                >
                  <Plus size={14} />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Leave section */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <h3 className="sidebar-section-title">Congés</h3>
              </div>

              <button
                className={`sidebar-leave-toggle ${leaveMode ? 'active' : ''}`}
                onClick={() => {
                  setLeaveMode(!leaveMode);
                  setActiveActivityId(null);
                  closeSidebarOnMobile();
                }}
              >
                <Plane size={16} />
                <span>{leaveMode ? 'Mode congés actif' : 'Activer mode congés'}</span>
              </button>

              {leaveMode && (
                <div className="sidebar-leave-types animation-fade-in">
                  <button
                    className={`sidebar-type-btn ${leaveSelectionType === 'full' ? 'active' : ''}`}
                    onClick={() => setLeaveSelectionType('full')}
                  >Journée</button>
                  <button
                    className={`sidebar-type-btn ${leaveSelectionType === 'morning' ? 'active' : ''}`}
                    onClick={() => setLeaveSelectionType('morning')}
                  >Matin</button>
                  <button
                    className={`sidebar-type-btn ${leaveSelectionType === 'afternoon' ? 'active' : ''}`}
                    onClick={() => setLeaveSelectionType('afternoon')}
                  >Après-midi</button>
                </div>
              )}

              <div className="sidebar-leave-stats">
                <span className="stats-label">Congés {currentYear}</span>
                {isEditingTotal ? (
                  <div className="total-leaves-edit">
                    <span className="stats-value">{currentYearLeavesCount} / </span>
                    <input
                      type="number"
                      className="total-leaves-input"
                      value={tempTotalLeaves}
                      onChange={(e) => setTempTotalLeaves(e.target.value)}
                      onKeyDown={handleTotalLeavesKeyDown}
                      onBlur={handleSaveTotalLeaves}
                      autoFocus
                      min="1"
                      max="365"
                    />
                  </div>
                ) : (
                  <span className="stats-value">
                    {currentYearLeavesCount} / {settings.totalLeaves} posés
                    <button className="edit-total-btn" onClick={handleStartEditTotal} title="Modifier le total">
                      <Edit2 size={12} />
                    </button>
                  </span>
                )}
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min(100, (currentYearLeavesCount / settings.totalLeaves) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <YearView
            year={currentYear}
            events={events}
            leaves={leaves}
            placedActivities={placedActivities}
            activities={activities}
            holidayDates={holidayDates}
            onDayClick={handleDayClick}
          />
        </main>

        {rightSidebarOpen && <div className="sidebar-backdrop" onClick={() => setRightSidebarOpen(false)} />}
        <DaySidebar
          isOpen={rightSidebarOpen}
          dateString={rightSidebarDate}
          placedActivities={placedActivities}
          activities={activities}
          events={events}
          onClose={() => setRightSidebarOpen(false)}
          onRemoveActivity={handleRemovePlacedActivity}
          onUpdateActivity={handleUpdatePlacedActivity}
          onAddEvent={handleAddEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
        />
      </div>

      {isActivityModalOpen && (
        <ActivityModal
          activities={activities}
          onClose={() => setIsActivityModalOpen(false)}
          onAddActivity={handleAddActivity}
          onToggleHideActivity={handleToggleHideActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      )}
    </div>
  );
}

export default App;
