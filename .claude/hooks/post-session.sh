#!/usr/bin/env bash
if [ -f ".beads/.status.json" ]; then
  AGENT_ID="${CLAUDE_AGENT_ID:-unknown}"
  node -e "const fs=require('fs');const s=JSON.parse(fs.readFileSync('.beads/.status.json','utf8'));for(const[k,r]of Object.entries(s.reservations||{})){if(r.agent==='$AGENT_ID')delete s.reservations[k];}delete(s.agents||{})['$AGENT_ID'];s.lastUpdated=new Date().toISOString();fs.writeFileSync('.beads/.status.json',JSON.stringify(s,null,2));" 2>/dev/null || true
fi
mkdir -p .claude/sessions
echo "Session $(date +%Y%m%d-%H%M%S) completed" >> .claude/sessions/history.log
