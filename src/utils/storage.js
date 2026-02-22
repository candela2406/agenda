const STORAGE_KEY = 'vite_agenda_events';
const LEAVES_STORAGE_KEY = 'vite_agenda_leaves';
const SETTINGS_STORAGE_KEY = 'vite_agenda_settings';

// Events
export const getEvents = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Failed to load events from storage:', error);
        return {};
    }
};

export const saveEvents = (events) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
        console.error('Failed to save events to storage:', error);
    }
};

// Leaves
export const getLeaves = () => {
    try {
        const data = localStorage.getItem(LEAVES_STORAGE_KEY);
        // Return dict of { 'YYYY-MM-DD': 'full' | 'morning' | 'afternoon' }
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Failed to load leaves from storage:', error);
        return {};
    }
};

export const saveLeaves = (leaves) => {
    try {
        localStorage.setItem(LEAVES_STORAGE_KEY, JSON.stringify(leaves));
    } catch (error) {
        console.error('Failed to save leaves to storage:', error);
    }
};

// Settings (Total Leaves)
export const getSettings = () => {
    try {
        const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
        return data ? JSON.parse(data) : { totalLeaves: 25 };
    } catch (error) {
        console.error('Failed to load settings from storage:', error);
        return { totalLeaves: 25 };
    }
};

export const saveSettings = (settings) => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings to storage:', error);
    }
};

// Configurable Activities
const ACTIVITIES_STORAGE_KEY = 'vite_agenda_activities';
const PLACED_ACTIVITIES_STORAGE_KEY = 'vite_agenda_placed_activities';

export const getActivities = () => {
    try {
        const data = localStorage.getItem(ACTIVITIES_STORAGE_KEY);
        return data ? JSON.parse(data) : [
            { id: '1', name: 'Télétravail', color: '#3b82f6' },
            { id: '2', name: 'Déplacement', color: '#f59e0b' }
        ];
    } catch (error) {
        console.error('Failed to load activities:', error);
        return [];
    }
};

export const saveActivities = (activities) => {
    try {
        localStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
    } catch (error) {
        console.error('Failed to save activities:', error);
    }
};

export const getPlacedActivities = () => {
    try {
        const data = localStorage.getItem(PLACED_ACTIVITIES_STORAGE_KEY);
        if (!data) return {};
        const parsed = JSON.parse(data);
        // Migrate legacy formats:
        // v1: { date: 'activityId' }
        // v2: { date: ['id1', 'id2'] }
        // v3 (current): { date: [{ id: 'id1', time: '', location: '' }, ...] }
        const migrated = {};
        for (const [date, value] of Object.entries(parsed)) {
            if (typeof value === 'string') {
                migrated[date] = [{ id: value }];
            } else if (Array.isArray(value)) {
                migrated[date] = value.map(item =>
                    typeof item === 'string' ? { id: item } : item
                );
            } else {
                migrated[date] = [value];
            }
        }
        return migrated;
    } catch (error) {
        console.error('Failed to load placed activities:', error);
        return {};
    }
};

export const savePlacedActivities = (placedActivities) => {
    try {
        localStorage.setItem(PLACED_ACTIVITIES_STORAGE_KEY, JSON.stringify(placedActivities));
    } catch (error) {
        console.error('Failed to save placed activities:', error);
    }
};
