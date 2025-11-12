# Database Migrations

## Migration v2: Separate Individual and Project Registration

This migration updates the schema to support:
- Separate registration flows for individuals and projects
- Project owners can manage team members
- Join request system with accept/reject functionality

### To Apply Migration:

**For Local Database:**
```bash
npx wrangler d1 execute solana_builders --local --file=./migrations/v2_update_schema.sql
```

**For Production Database:**
```bash
npx wrangler d1 execute solana_builders --remote --file=./migrations/v2_update_schema.sql
```

### What This Migration Does:

1. **Updates `projects` table:**
   - Renames `lead_wallet` → `owner_wallet`
   - Makes `owner_wallet` NOT NULL
   - Adds `status` field

2. **Updates `builder_project_links` table:**
   - Adds `id` as primary key
   - Adds `status` field (pending/accepted/rejected/owner)
   - Adds `requested_at` and `responded_at` timestamps
   - Existing links are marked as 'accepted'

3. **Adds new indexes** for better query performance

### Rollback:

If you need to rollback, you'll need to manually restore from a backup or recreate the old schema structure.

