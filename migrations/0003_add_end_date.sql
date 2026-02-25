-- Add end_date support for multi-day events and activities
ALTER TABLE events ADD COLUMN end_date TEXT;
ALTER TABLE placed_activities ADD COLUMN end_date TEXT;
