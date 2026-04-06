#!/usr/bin/env bash
# audit-deps.sh — Safe dependency vulnerability audit and fix workflow
# Usage: bash scripts/security/audit-deps.sh [--fix] [--report]
#
# Flags:
#   --fix     Apply safe (non-breaking) fixes automatically
#   --report  Generate a detailed report to stdout (machine-friendly)
#   (none)    Interactive mode — shows findings and recommendations

set -euo pipefail

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

MODE="interactive"
for arg in "$@"; do
  case "$arg" in
    --fix) MODE="fix" ;;
    --report) MODE="report" ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

divider() {
  echo -e "${CYAN}────────────────────────────────────────────────────${NC}"
}

header() {
  echo ""
  divider
  echo -e "${BOLD}$1${NC}"
  divider
}

# ─── Step 1: Run npm audit and capture results ───────────────────────

header "Step 1: Running npm audit"

AUDIT_JSON=$(npm audit --json 2>/dev/null || true)
AUDIT_TEXT=$(npm audit 2>/dev/null || true)

TOTAL_VULNS=$(echo "$AUDIT_JSON" | node -e "
  const d = require('fs').readFileSync('/dev/stdin','utf8');
  try {
    const j = JSON.parse(d);
    const v = j.metadata?.vulnerabilities || {};
    console.log((v.low||0)+(v.moderate||0)+(v.high||0)+(v.critical||0));
  } catch { console.log('unknown'); }
")

CRITICAL=$(echo "$AUDIT_JSON" | node -e "
  const d = require('fs').readFileSync('/dev/stdin','utf8');
  try { const j = JSON.parse(d); console.log(j.metadata?.vulnerabilities?.critical||0); } catch { console.log(0); }
")
HIGH=$(echo "$AUDIT_JSON" | node -e "
  const d = require('fs').readFileSync('/dev/stdin','utf8');
  try { const j = JSON.parse(d); console.log(j.metadata?.vulnerabilities?.high||0); } catch { console.log(0); }
")
MODERATE=$(echo "$AUDIT_JSON" | node -e "
  const d = require('fs').readFileSync('/dev/stdin','utf8');
  try { const j = JSON.parse(d); console.log(j.metadata?.vulnerabilities?.moderate||0); } catch { console.log(0); }
")
LOW=$(echo "$AUDIT_JSON" | node -e "
  const d = require('fs').readFileSync('/dev/stdin','utf8');
  try { const j = JSON.parse(d); console.log(j.metadata?.vulnerabilities?.low||0); } catch { console.log(0); }
")

if [ "$TOTAL_VULNS" = "0" ]; then
  echo -e "${GREEN}No vulnerabilities found. You're all clear!${NC}"
  exit 0
fi

echo -e "Found ${RED}${TOTAL_VULNS} vulnerabilities${NC}:"
echo -e "  Critical: ${RED}${CRITICAL}${NC}  High: ${RED}${HIGH}${NC}  Moderate: ${YELLOW}${MODERATE}${NC}  Low: ${LOW}"

# ─── Step 2: Determine what's safe to fix ─────────────────────────────

header "Step 2: Checking for safe (non-breaking) fixes"

# Run audit fix in dry-run mode to see what would change
FIX_DRY=$(npm audit fix --dry-run 2>&1 || true)

SAFE_FIXES=$(echo "$FIX_DRY" | grep -c "fixed" 2>/dev/null || echo "0")

if echo "$FIX_DRY" | grep -q "up to date\|0 vulnerabilities"; then
  echo -e "${YELLOW}No safe fixes available (all remaining vulns require --force).${NC}"
  SAFE_FIXES=0
elif echo "$FIX_DRY" | grep -q "fixed"; then
  echo -e "${GREEN}Safe fixes are available!${NC}"
  echo "$FIX_DRY" | grep -E "(added|removed|changed|fixed)" || true
fi

# ─── Step 3: Apply safe fixes if --fix mode ───────────────────────────

if [ "$MODE" = "fix" ] && [ "$SAFE_FIXES" != "0" ]; then
  header "Step 3: Applying safe fixes"
  npm audit fix
  echo -e "${GREEN}Safe fixes applied.${NC}"

  # Re-run audit to show remaining
  header "Remaining vulnerabilities after safe fix"
  npm audit 2>/dev/null || true
elif [ "$MODE" = "fix" ]; then
  echo -e "\n${YELLOW}No safe fixes to apply.${NC}"
fi

# ─── Step 4: Analyze remaining (force-only) vulnerabilities ──────────

header "Step 4: Analyzing remaining vulnerabilities (force-only)"

echo "$AUDIT_TEXT"

# ─── Step 5: Show dependency chains ──────────────────────────────────

header "Step 5: Dependency chains for vulnerable packages"

# Extract vulnerable package names from audit JSON
VULN_PACKAGES=$(echo "$AUDIT_JSON" | node -e "
  const d = require('fs').readFileSync('/dev/stdin','utf8');
  try {
    const j = JSON.parse(d);
    const vulns = j.vulnerabilities || {};
    const names = new Set();
    for (const [name, info] of Object.entries(vulns)) {
      if (info.isDirect === false) {
        // transitive dep — find the root
        names.add(name);
      } else {
        names.add(name);
      }
    }
    console.log([...names].join('\n'));
  } catch { }
" 2>/dev/null || true)

if [ -n "$VULN_PACKAGES" ]; then
  while IFS= read -r pkg; do
    if [ -n "$pkg" ]; then
      echo -e "\n${BOLD}npm ls ${pkg}:${NC}"
      npm ls "$pkg" 2>/dev/null || true
    fi
  done <<< "$VULN_PACKAGES"
fi

# ─── Step 6: Check for available upstream updates ────────────────────

header "Step 6: Checking for upstream package updates"

npm outdated 2>/dev/null || true

# ─── Step 7: Recommendations ────────────────────────────────────────

header "Step 7: Recommendations"

echo -e "${BOLD}Safe actions:${NC}"
echo "  1. Run: npm audit fix                 (non-breaking fixes only)"
echo "  2. Run: npm outdated                  (check for newer parent packages)"
echo ""
echo -e "${BOLD}For force-only vulnerabilities:${NC}"
echo "  3. Check if parent packages have newer versions that drop the vuln dep"
echo "  4. Try 'overrides' in package.json to pin a safe transitive dep version"
echo "  5. Evaluate actual exploitability before forcing breaking changes"
echo "  6. Document accepted risks for vulns you've evaluated as low-risk"
echo ""
echo -e "${YELLOW}NEVER run 'npm audit fix --force' without:${NC}"
echo "  - Understanding what breaking changes will occur"
echo "  - Testing the app thoroughly afterward"
echo "  - Having a way to rollback (clean git state)"
echo ""

if [ "$MODE" = "report" ]; then
  # Machine-friendly summary
  echo "---REPORT---"
  echo "date=$(date -I)"
  echo "total_vulns=${TOTAL_VULNS}"
  echo "critical=${CRITICAL}"
  echo "high=${HIGH}"
  echo "moderate=${MODERATE}"
  echo "low=${LOW}"
  echo "safe_fixes_available=${SAFE_FIXES}"
fi
