-- Add end_date support for multi-day placed activities
ALTER TABLE placed_activities ADD COLUMN end_date TEXT;
