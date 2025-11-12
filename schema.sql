-- Table: builders (Individuals)
-- Every individual must register separately
CREATE TABLE IF NOT EXISTS builders (
  id TEXT PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT UNIQUE,
  telegram TEXT,
  twitter TEXT,
  university TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'builder', -- builder | project_lead | admin
  status TEXT DEFAULT 'pending', -- pending | verified | active
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: projects
-- Every project must register separately
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  twitter TEXT,
  discord TEXT,
  owner_wallet TEXT NOT NULL, -- Wallet of the project owner (must be a registered builder)
  status TEXT DEFAULT 'pending', -- pending | verified | active
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: builder_project_links
-- Links individuals to projects with relationship status
-- Used for both: existing members and join requests
CREATE TABLE IF NOT EXISTS builder_project_links (
  id TEXT PRIMARY KEY,
  builder_wallet TEXT NOT NULL, -- Individual's wallet
  project_id TEXT NOT NULL, -- Project ID
  role TEXT DEFAULT 'contributor', -- contributor, founder, co-founder, etc.
  status TEXT DEFAULT 'pending', -- pending (join request) | accepted (member) | rejected | owner
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- When the link was created/requested
  responded_at DATETIME, -- When owner accepted/rejected
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (builder_wallet) REFERENCES builders(wallet_address),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(builder_wallet, project_id) -- One link per builder-project pair
);

-- Table: privileges_log
CREATE TABLE IF NOT EXISTS privileges_log (
  id TEXT PRIMARY KEY,
  builder_wallet TEXT,
  privilege TEXT, -- e.g., "grant_priority", "event_access"
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_builders_wallet ON builders(wallet_address);
CREATE INDEX IF NOT EXISTS idx_builders_email ON builders(email);
CREATE INDEX IF NOT EXISTS idx_builders_status ON builders(status);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_links_builder ON builder_project_links(builder_wallet);
CREATE INDEX IF NOT EXISTS idx_links_project ON builder_project_links(project_id);
CREATE INDEX IF NOT EXISTS idx_links_status ON builder_project_links(status);
CREATE INDEX IF NOT EXISTS idx_links_builder_project ON builder_project_links(builder_wallet, project_id);
