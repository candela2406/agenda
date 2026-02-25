import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { toDateString } from './utils/dateUtils';
import './App.css';

// Transform API flat arrays into the dict shapes components expect
function groupEventsByDate(events) {
  const dict = {};
  for (const ev of events) {
    if (ev.endDate && ev.endDate > ev.date) {
      // Multi-day event: add to each day in the range
      const start = new Date(ev.date + 'T00:00:00');
      const end = new Date(ev.endDate + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = toDateString(d);
        if (!dict[key]) dict[key] = [];
        // Avoid duplicates if event already listed for this day
        if (!dict[key].some(e => e.id === ev.id)) {
          dict[key].push(ev);
        }
      }
    } else {
      if (!dict[ev.date]) dict[ev.date] = [];
      dict[ev.date].push(ev);
    }
  }
  return dict;
}

function groupPlacedByDate(placedActivities) {
  const dict = {};
  for (const p of placedActivities) {
    const item = { id: p.activityId, rowId: p.id, title: p.title, time: p.time, location: p.location, description: p.description, date: p.date, endDate: p.endDate };
    if (p.endDate && p.endDate > p.date) {
      const start = new Date(p.date + 'T00:00:00');
      const end = new Date(p.endDate + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = toDateString(d);
        if (!dict[key]) dict[key] = [];
        if (!dict[key].some(i => i.rowId === p.id)) {
          dict[key].push(item);
        }
      }
    } else {
      if (!dict[p.date]) dict[p.date] = [];
      dict[p.date].push(item);
    }
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

  // Calendar drag state: always tracks mousedown→drag→mouseup on calendar
  const [calendarDrag, setCalendarDrag] = useState(null); // null | { startDate, hoverDate }
  const calendarDragRef = useRef(null);
  const wasDraggingRef = useRef(false);
  const dragContextRef = useRef({});

  // For sidebar-triggered date picking (editing existing items)
  const [sidebarPickingActive, setSidebarPickingActive] = useState(false);
  const [pickedDateRange, setPickedDateRange] = useState(null); // null | { startDate, endDate }

  // For opening sidebar with pre-filled event range from calendar drag
  const [rightSidebarInitialRange, setRightSidebarInitialRange] = useState(null);

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

  // Keep refs in sync for use in global event listeners
  useEffect(() => {
    calendarDragRef.current = calendarDrag;
  }, [calendarDrag]);

  dragContextRef.current = { sidebarPickingActive, activeActivityId, leaveMode };

  const handleStartDatePicking = useCallback(() => {
    setSidebarPickingActive(true);
    setPickedDateRange(null);
  }, []);

  const handleCancelDatePicking = useCallback(() => {
    setSidebarPickingActive(false);
    setCalendarDrag(null);
  }, []);

  // Finalize a calendar drag — dispatches based on current mode
  const finalizeDrag = useCallback(() => {
    const drag = calendarDragRef.current;
    if (!drag) return;
    calendarDragRef.current = null; // prevent double execution
    setCalendarDrag(null);

    const s = drag.startDate;
    const e = drag.hoverDate || s;
    const [start, end] = s <= e ? [s, e] : [e, s];
    const isDrag = start !== end;
    const ctx = dragContextRef.current;

    if (ctx.sidebarPickingActive) {
      // Sidebar form date picking (always handle, even single click)
      wasDraggingRef.current = true;
      setPickedDateRange({ startDate: start, endDate: isDrag ? end : null });
      setSidebarPickingActive(false);
    } else if (isDrag) {
      // Real drag (different days) — suppress the click event
      wasDraggingRef.current = true;

      if (ctx.activeActivityId) {
        // Create multi-day activity placement
        createPlacedActivity({ date: start, endDate: end, activityId: ctx.activeActivityId })
          .then(result => {
            setPlacedActivities(prev => {
              const all = Object.values(prev).flat();
              const unique = all.filter((item, i, arr) => arr.findIndex(x => x.rowId === item.rowId) === i);
              const newItem = { id: result.activityId, rowId: result.id, title: result.title, time: result.time, location: result.location, description: result.description, date: result.date, endDate: result.endDate };
              return groupPlacedByDate([...unique, newItem].map(i => ({ id: i.rowId, activityId: i.id, date: i.date, endDate: i.endDate, title: i.title, time: i.time, location: i.location, description: i.description })));
            });
          });
      } else if (!ctx.leaveMode) {
        // Normal mode: open sidebar with event form pre-filled
        setRightSidebarDate(start);
        setRightSidebarOpen(true);
        setRightSidebarInitialRange({ startDate: start, endDate: end });
      }
    }
    // else: single click, not in picking mode — let onClick handle it
  }, []);

  // Global mouseup to finalize drag even if released outside a day cell
  useEffect(() => {
    if (!calendarDrag) return;
    const handler = () => finalizeDrag();
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, [!!calendarDrag, finalizeDrag]);

  // Calendar mouse handlers — always active
  const handleDayMouseDown = useCallback((dateString) => {
    setCalendarDrag({ startDate: dateString, hoverDate: dateString });
  }, []);

  const handleDayMouseEnter = useCallback((dateString) => {
    setCalendarDrag(prev => prev ? { ...prev, hoverDate: dateString } : null);
  }, []);

  // Compute the sorted range for visual highlighting during drag
  const dragRange = useMemo(() => {
    if (!calendarDrag?.startDate) return null;
    const a = calendarDrag.startDate;
    const b = calendarDrag.hoverDate || a;
    return a <= b ? { start: a, end: b } : { start: b, end: a };
  }, [calendarDrag]);

  const handleDayClick = async (date) => {
    const dateString = toDateString(date);

    // Skip click if it was a drag or sidebar picking
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }

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
          // Rebuild from flat list excluding the deleted placement (handles multi-day)
          const all = Object.values(prev).flat().filter(i => i.rowId !== existing.rowId);
          const unique = all.filter((item, i, arr) => arr.findIndex(x => x.rowId === item.rowId) === i);
          return groupPlacedByDate(unique.map(i => ({ id: i.rowId, activityId: i.id, date: i.date, endDate: i.endDate, title: i.title, time: i.time, location: i.location, description: i.description })));
        });
      } else {
        const result = await createPlacedActivity({ date: dateString, activityId: activeActivityId });
        setPlacedActivities(prev => {
          const all = Object.values(prev).flat();
          const unique = all.filter((item, i, arr) => arr.findIndex(x => x.rowId === item.rowId) === i);
          const newItem = { id: result.activityId, rowId: result.id, title: result.title, time: result.time, location: result.location, description: result.description, date: result.date, endDate: result.endDate };
          return groupPlacedByDate([...unique, newItem].map(i => ({ id: i.rowId, activityId: i.id, date: i.date, endDate: i.endDate, title: i.title, time: i.time, location: i.location, description: i.description })));
        });
      }
    } else {
      setRightSidebarDate(dateString);
      setRightSidebarOpen(true);
    }
  };

  const handleAddEvent = async (dateString, eventData) => {
    const { startDate, endDate, ...rest } = eventData;
    const result = await createEvent({ date: startDate || dateString, endDate: endDate || null, ...rest });
    setEvents(prev => groupEventsByDate([
      ...Object.values(prev).flat().filter(ev => ev.id !== result.id),
      result,
    ]));
  };

  const handleUpdateEvent = async (dateString, eventId, eventData) => {
    const result = await apiUpdateEvent(eventId, eventData);
    setEvents(prev => groupEventsByDate([
      ...Object.values(prev).flat().filter(ev => ev.id !== eventId),
      result,
    ]));
  };

  const handleDeleteEvent = async (dateString, eventId) => {
    await apiDeleteEvent(eventId);
    setEvents(prev => {
      const allEvents = Object.values(prev).flat().filter(ev => ev.id !== eventId);
      // Deduplicate (multi-day events appear in multiple date slots)
      const unique = allEvents.filter((ev, i, arr) => arr.findIndex(e => e.id === ev.id) === i);
      return groupEventsByDate(unique);
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
      const all = Object.values(prev).flat().filter(i => i.rowId !== item?.rowId);
      const unique = all.filter((x, i, arr) => arr.findIndex(y => y.rowId === x.rowId) === i);
      return groupPlacedByDate(unique.map(i => ({ id: i.rowId, activityId: i.id, date: i.date, endDate: i.endDate, title: i.title, time: i.time, location: i.location, description: i.description })));
    });
  };

  const handleUpdatePlacedActivity = async (dateString, activityId, details) => {
    const current = placedActivities[dateString] || [];
    const item = current.find(i => i.id === activityId);
    if (item) {
      await updatePlacedActivity(item.rowId, details);
    }
    setPlacedActivities(prev => {
      const all = Object.values(prev).flat();
      const unique = all.filter((x, i, arr) => arr.findIndex(y => y.rowId === x.rowId) === i);
      const updated = unique.map(i => {
        if (i.rowId !== item?.rowId) return i;
        return {
          ...i,
          ...details,
          date: details.startDate || i.date,
          endDate: details.endDate !== undefined ? details.endDate : i.endDate,
        };
      });
      return groupPlacedByDate(updated.map(i => ({ id: i.rowId, activityId: i.id, date: i.date, endDate: i.endDate, title: i.title, time: i.time, location: i.location, description: i.description })));
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
          {sidebarPickingActive && !calendarDrag && (
            <div className="date-picking-banner">
              Glissez sur le calendrier pour sélectionner les dates
              <button className="date-picking-cancel" onClick={handleCancelDatePicking}>Annuler</button>
            </div>
          )}
          <YearView
            year={currentYear}
            events={events}
            leaves={leaves}
            placedActivities={placedActivities}
            activities={activities}
            holidayDates={holidayDates}
            onDayClick={handleDayClick}
            datePickingRange={dragRange}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
          />
        </main>

        {rightSidebarOpen && <div className="sidebar-backdrop" onClick={() => setRightSidebarOpen(false)} />}
        <DaySidebar
          isOpen={rightSidebarOpen}
          dateString={rightSidebarDate}
          placedActivities={placedActivities}
          activities={activities}
          events={events}
          onClose={() => { setRightSidebarOpen(false); setRightSidebarInitialRange(null); }}
          onRemoveActivity={handleRemovePlacedActivity}
          onUpdateActivity={handleUpdatePlacedActivity}
          onAddEvent={handleAddEvent}
          onUpdateEvent={handleUpdateEvent}
          onDeleteEvent={handleDeleteEvent}
          sidebarPickingActive={sidebarPickingActive}
          pickedDateRange={pickedDateRange}
          onStartDatePicking={handleStartDatePicking}
          onCancelDatePicking={handleCancelDatePicking}
          initialEventRange={rightSidebarInitialRange}
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
