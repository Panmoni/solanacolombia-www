-- Migration v2: Update schema to separate individual and project registration
-- Run this after the initial schema to update existing databases

-- Step 1: Update projects table - rename lead_wallet to owner_wallet and add status
-- Note: SQLite doesn't support ALTER COLUMN, so we need to recreate the table
BEGIN TRANSACTION;

-- Create new projects table with updated schema
CREATE TABLE IF NOT EXISTS projects_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  twitter TEXT,
  discord TEXT,
  owner_wallet TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table (mapping lead_wallet to owner_wallet)
INSERT INTO projects_new (id, name, description, website, twitter, discord, owner_wallet, status, created_at, updated_at)
SELECT id, name, description, website, twitter, discord, 
       COALESCE(lead_wallet, '') as owner_wallet,
       'pending' as status,
       created_at, updated_at
FROM projects;

-- Drop old table
DROP TABLE IF EXISTS projects;

-- Rename new table
ALTER TABLE projects_new RENAME TO projects;

-- Step 2: Update builder_project_links table - add id, status, and timestamps
CREATE TABLE IF NOT EXISTS builder_project_links_new (
  id TEXT PRIMARY KEY,
  builder_wallet TEXT NOT NULL,
  project_id TEXT NOT NULL,
  role TEXT DEFAULT 'contributor',
  status TEXT DEFAULT 'accepted', -- Existing links are accepted
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (builder_wallet) REFERENCES builders(wallet_address),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(builder_wallet, project_id)
);

-- Copy existing data (generate IDs for existing links)
-- Using a simple hash-like approach: builder_wallet + project_id (will be unique due to UNIQUE constraint)
-- Note: New links created by the app will use proper UUIDs
INSERT INTO builder_project_links_new (id, builder_wallet, project_id, role, status, requested_at, created_at, updated_at)
SELECT 
  lower(hex(randomblob(16))) as id,
  builder_wallet,
  project_id,
  role,
  'accepted' as status, -- Mark existing links as accepted
  CURRENT_TIMESTAMP as requested_at,
  CURRENT_TIMESTAMP as created_at,
  CURRENT_TIMESTAMP as updated_at
FROM builder_project_links;

-- Drop old table
DROP TABLE IF EXISTS builder_project_links;

-- Rename new table
ALTER TABLE builder_project_links_new RENAME TO builder_project_links;

-- Step 3: Create new indexes
CREATE INDEX IF NOT EXISTS idx_builders_status ON builders(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_links_status ON builder_project_links(status);
CREATE INDEX IF NOT EXISTS idx_links_builder_project ON builder_project_links(builder_wallet, project_id);

COMMIT;

