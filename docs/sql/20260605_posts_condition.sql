-- Migration: Add condition column to posts table
-- Date: 2026-06-05
-- Values: 'new' | 'used' — nullable for backwards compatibility

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS condition text
  CHECK (condition IN ('new', 'used'));
