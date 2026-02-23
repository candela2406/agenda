import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plane, Edit2, PanelLeftClose, PanelLeftOpen, Plus, Settings, EyeOff, Eye } from 'lucide-react';
import YearView from './components/YearView';
import DaySidebar from './components/DaySidebar';
import ActivityModal from './components/ActivityModal';
import {
  fetchInit,
  createEvent, updateEvent as apiUpdateEvent, deleteEvent as apiDeleteEvent,
  createActivity, updateActivity, deleteActivity as apiDeleteActivity,
  createPlacedActivity, updatePlacedActivity, deletePlacedActivity,
  upsertLeave, deleteLeave,
  updateSettings,
} from './utils/api';
import { getZoneADates } from './utils/holidaysZoneA';
import './App.css';

// Transform API flat arrays into the dict shapes components expect
function groupEventsByDate(events) {
  const dict = {};
  for (const ev of events) {
    if (!dict[ev.date]) dict[ev.date] = [];
    dict[ev.date].push(ev);
  }
  return dict;
}

function groupPlacedByDate(placedActivities) {
  const dict = {};
  for (const p of placedActivities) {
    if (!dict[p.date]) dict[p.date] = [];
    dict[p.date].push({ id: p.activityId, rowId: p.id, title: p.title, time: p.time, location: p.location, description: p.description });
  }
  return dict;
}

function groupLeavesByDate(leaves) {
  const dict = {};
  for (const l of leaves) {
    dict[l.date] = l.type;
  }
  return dict;
}

function App() {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState({});
  const [leaves, setLeaves] = useState({});
  const [settings, setSettings] = useState({ totalLeaves: 25 });
  const [leaveMode, setLeaveMode] = useState(false);
  const [leaveSelectionType, setLeaveSelectionType] = useState('full');
  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState([]);
  const [placedActivities, setPlacedActivities] = useState({});
  const [activeActivityId, setActiveActivityId] = useState(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [tempTotalLeaves, setTempTotalLeaves] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [rightSidebarDate, setRightSidebarDate] = useState(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const loadYear = useCallback(async (year) => {
    setLoading(true);
    try {
      const data = await fetchInit(year);
      setEvents(groupEventsByDate(data.events));
      setLeaves(groupLeavesByDate(data.leaves));
      setSettings({ totalLeaves: parseInt(data.settings.totalLeaves) || 25 });
      setPlacedActivities(groupPlacedByDate(data.placedActivities));

      // Ensure system Zone A activity exists
      const ZONE_A_ID = 'system-vacances-zone-a';
      let loadedActivities = data.activities;
      if (!loadedActivities.find(a => a.id === ZONE_A_ID)) {
        const zoneA = { id: ZONE_A_ID, name: 'Vacances Zone A', color: '#ec4899', isHidden: false };
        await createActivity(zoneA);
        loadedActivities = [...loadedActivities, zoneA];
      }
      setActivities(loadedActivities);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadYear(currentYear);
  }, [currentYear, loadYear]);

  const closeSidebarOnMobile = useCallback(() => {
    if (window.innerWidth <= 768) setSidebarOpen(false);
  }, []);

  const handlePrevYear = () => setCurrentYear(prev => prev - 1);
  const handleNextYear = () => setCurrentYear(prev => prev + 1);

  const handleDayClick = async (date) => {
    const dateString = date.toISOString().split('T')[0];

    if (leaveMode) {
      const current = leaves[dateString];
      if (current === leaveSelectionType) {
        await deleteLeave(dateString);
        setLeaves(prev => {
          const updated = { ...prev };
          delete updated[dateString];
          return updated;
        });
      } else {
        await upsertLeave(dateString, leaveSelectionType);
        setLeaves(prev => ({ ...prev, [dateString]: leaveSelectionType }));
      }
    } else if (activeActivityId) {
      const current = placedActivities[dateString] || [];
      const existing = current.find(item => item.id === activeActivityId);
      if (existing) {
        await deletePlacedActivity(existing.rowId);
        setPlacedActivities(prev => {
          const updated = { ...prev };
          const filtered = (updated[dateString] || []).filter(item => item.id !== activeActivityId);
          if (filtered.length === 0) {
            delete updated[dateString];
          } else {
            updated[dateString] = filtered;
          }
          return updated;
        });
      } else {
        const result = await createPlacedActivity({ date: dateString, activityId: activeActivityId });
        setPlacedActivities(prev => {
          const updated = { ...prev };
          const items = updated[dateString] || [];
          updated[dateString] = [...items, { id: result.activityId, rowId: result.id, title: result.title, time: result.time, location: result.location, description: result.description }];
          return updated;
        });
      }
    } else {
      setRightSidebarDate(dateString);
      setRightSidebarOpen(true);
    }
  };

  const handleAddEvent = async (dateString, eventData) => {
    const result = await createEvent({ date: dateString, ...eventData });
    setEvents(prev => {
      const updated = { ...prev };
      if (!updated[dateString]) updated[dateString] = [];
      updated[dateString] = [...updated[dateString], result];
      return updated;
    });
  };

  const handleUpdateEvent = async (dateString, eventId, eventData) => {
    const result = await apiUpdateEvent(eventId, eventData);
    setEvents(prev => {
      const updated = { ...prev };
      updated[dateString] = (updated[dateString] || []).map(ev =>
        ev.id === eventId ? result : ev
      );
      return updated;
    });
  };

  const handleDeleteEvent = async (dateString, eventId) => {
    await apiDeleteEvent(eventId);
    setEvents(prev => {
      const updated = { ...prev };
      updated[dateString] = (updated[dateString] || []).filter(ev => ev.id !== eventId);
      if (updated[dateString].length === 0) delete updated[dateString];
      return updated;
    });
  };

  const handleStartEditTotal = () => {
    setTempTotalLeaves(settings.totalLeaves.toString());
    setIsEditingTotal(true);
  };

  const handleSaveTotalLeaves = async () => {
    const newTotal = parseInt(tempTotalLeaves, 10);
    if (!isNaN(newTotal) && newTotal > 0) {
      const newSettings = { ...settings, totalLeaves: newTotal };
      setSettings(newSettings);
      await updateSettings({ totalLeaves: newTotal });
    }
    setIsEditingTotal(false);
  };

  const handleTotalLeavesKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveTotalLeaves();
    else if (e.key === 'Escape') setIsEditingTotal(false);
  };

  const handleAddActivity = async (activityData) => {
    const result = await createActivity(activityData);
    setActivities(prev => [...prev, result]);
  };

  const handleUpdateActivityDef = async (activityId, data) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    const updated = { ...activity, ...data };
    await updateActivity(activityId, updated);
    setActivities(prev => prev.map(a => a.id === activityId ? updated : a));
  };

  const handleToggleHideActivity = async (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    const updated = { ...activity, isHidden: !activity.isHidden };
    await updateActivity(activityId, updated);
    setActivities(prev => prev.map(a => a.id === activityId ? updated : a));
    if (updated.isHidden && activeActivityId === activityId) {
      setActiveActivityId(null);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    await apiDeleteActivity(activityId);
    setActivities(prev => prev.filter(a => a.id !== activityId));
    // Cascade: remove placed activities referencing this activity from local state
    setPlacedActivities(prev => {
      const updated = {};
      for (const [date, items] of Object.entries(prev)) {
        const filtered = items.filter(item => item.id !== activityId);
        if (filtered.length > 0) updated[date] = filtered;
      }
      return updated;
    });
    if (activeActivityId === activityId) {
      setActiveActivityId(null);
    }
  };

  const handleRemovePlacedActivity = async (dateString, activityId) => {
    const current = placedActivities[dateString] || [];
    const item = current.find(i => i.id === activityId);
    if (item) {
      await deletePlacedActivity(item.rowId);
    }
    setPlacedActivities(prev => {
      const updated = { ...prev };
      const filtered = (updated[dateString] || []).filter(i => i.id !== activityId);
      if (filtered.length === 0) {
        delete updated[dateString];
      } else {
        updated[dateString] = filtered;
      }
      return updated;
    });
  };

  const handleUpdatePlacedActivity = async (dateString, activityId, details) => {
    const current = placedActivities[dateString] || [];
    const item = current.find(i => i.id === activityId);
    if (item) {
      await updatePlacedActivity(item.rowId, details);
    }
    setPlacedActivities(prev => {
      const updated = { ...prev };
      updated[dateString] = (updated[dateString] || []).map(i =>
        i.id === activityId ? { ...i, ...details } : i
      );
      return updated;
    });
  };

  const currentYearLeavesCount = Object.entries(leaves)
    .filter(([dateString]) => dateString.startsWith(currentYear.toString()))
    .reduce((total, [_, type]) => {
      if (type === 'full') return total + 1;
      if (type === 'morning' || type === 'afternoon') return total + 0.5;
      return total;
    }, 0);

  const holidayDates = getZoneADates();

  if (loading) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <div className="app-title">
              <CalendarIcon className="title-icon" size={28} strokeWidth={2.5} />
              <h1>Mon Agenda</h1>
            </div>
          </div>
        </header>
      </div>
    );
  }

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
          onUpdateActivity={handleUpdateActivityDef}
          onToggleHideActivity={handleToggleHideActivity}
          onDeleteActivity={handleDeleteActivity}
        />
      )}
    </div>
  );
}

export default App;
