import requests
import json

print('\n🔍 CHECKING BACKEND STATUS')
print('='*80)

# Test if backend is responsive
try:
    response = requests.get('http://localhost:8000/docs', timeout=5)
    if response.status_code == 200:
        print('✅ Backend is running on http://localhost:8000')
    else:
        print(f'⚠️ Backend responded with status: {response.status_code}')
except Exception as e:
    print(f'❌ Backend not accessible: {e}')

print('\n📋 WHAT TO CHECK IN BACKEND TERMINAL LOGS:')
print('='*80)
print('\nLook for these messages when backend started:')
print()
print('1. ✅ SCHEDULER ENABLED (Good):')
print('   "[SCHEDULER] Market Snapshot Scheduler initialized successfully (1-hour interval)"')
print('   OR')
print('   "✅ Market Snapshot Scheduler initialized successfully (1-hour interval)"')
print()
print('2. ⚠️ SCHEDULER FAILED (Problem):')
print('   "❌ Failed to initialize Market Snapshot Scheduler: <error>"')
print()
print('3. ⚠️ APSCHEDULER NOT INSTALLED:')
print('   "⚠️ Market Snapshot Scheduler initialization skipped (APScheduler not installed)"')
print()
print('4. ✅ INTERVAL CONFIRMATION:')
print('   "⏱️ [SCHEDULER] Snapshot sync scheduled: every 3600s"')
print('   "⏱️ [SCHEDULER] Reconciliation scheduled: every 3600s"')
print()

print('\n📊 EXPECTED STARTUP SEQUENCE:')
print('='*80)
print('1. "Starting Enhanced Pest & Disease Monitoring AI Agent..."')
print('2. "Database tables initialized successfully"')
print('3. "✅ Market Snapshot Scheduler initialized..." ← LOOK FOR THIS')
print('4. "Weather service initialized"')
print('5. "Application startup complete."')
print('6. "Uvicorn running on http://0.0.0.0:8000"')

print('\n\n🔧 IF SCHEDULER DIDN\'T START:')
print('='*80)
print('Check if APScheduler is installed:')
print('   pip list | findstr apscheduler')
print()
print('If not installed:')
print('   pip install apscheduler')
print('   Then restart backend')

print('\n\n📝 TO SEE SCHEDULER IN ACTION:')
print('='*80)
print('Wait 1 hour, then look for:')
print('   "🔄 [SCHEDULER] Checking for ready snapshots..."')
print('   "🔄 [SCHEDULER] Reconciling published snapshots with latest data..."')
print('   "✅ [SCHEDULER] Reconciliation complete: X/Y updated"')

print('\n' + '='*80)
print('Please check your backend terminal and share what you see!')
print('='*80)
