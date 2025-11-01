# 🔐 Authentication Cleanup - TODO

## Remember to Fix Authentication System After Other Improvements

### Current State
- Multiple auth systems (auth.js, better-auth.js)
- Several emergency backdoors for access recovery
- Password inconsistency (AutoAudit2025! vs Admin123!)
- Direct access endpoints bypassing security
- Works but is messy and insecure

### What Needs to Be Done
1. **Consolidate Authentication**
   - Choose ONE auth middleware
   - Remove duplicate systems
   - Clean up emergency backdoors (keep only one)

2. **Fix Password Management**
   - Decide on single source of truth (env vars OR users.json)
   - Update all references to use consistent password
   - Document the correct credentials

3. **Secure Admin Routes**
   - Remove `/admin-settings-direct` and similar bypasses
   - Ensure all admin routes use auth middleware
   - Keep ONE emergency recovery route (well-documented)

4. **Clean Up Workarounds**
   - Remove multiple fix-admin endpoints
   - Consolidate to single recovery mechanism
   - Document the recovery process

5. **Test Thoroughly**
   - Test normal login flow
   - Test session persistence (7-day rolling sessions)
   - Test recovery mechanism
   - Ensure no 403 loops

### Why We're Waiting
- Current system works (don't break it now)
- Other improvements provide better foundation
- Database migration might help with user management
- Rate limiting protects the system first

### When to Revisit
After completing:
- ✅ Development file cleanup
- ⏳ Rate limiting
- ⏳ Database migration
- ⏳ Monitoring/logging
- ⏳ Request validation

**Then** circle back to properly secure authentication.

---
*Don't forget: The current auth system has security vulnerabilities that need fixing!*