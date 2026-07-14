# Web-to-Mobile App Synchronization Testing Guide

## 📋 Overview

This document provides step-by-step instructions for testing the automatic synchronization between the **petro-pulse-portal** (web app) and **fuel-forward-drive** (mobile app).

---

## 🎯 Test Scenarios

### Test 1: Register a New Filling Station

**Objective**: Verify that a new station registered on the web app appears on the mobile app immediately.

#### Steps:

1. **Open Web App** (petro-pulse-portal)
   - Navigate to the station registration page
   - Fill in station details:
     - Station Name: "Test Station Alpha"
     - Location: [Your test location]
     - Products: [Select available fuel types]

2. **Register the Station**
   - Click "Save" or "Register" button
   - Data is saved to Supabase

3. **Monitor GitHub Actions**
   - Go to: https://github.com/Cadina247/petro-pulse-portal/actions
   - Verify workflow runs (should show "success")
   - Check the logs for:
     ```
     ✅ Web app build successful!
     📱 Mobile app sync has been triggered
     ```

4. **Verify Mobile App Trigger**
   - Go to: https://github.com/Cadina247/fuel-forward-drive/actions
   - Should see a new "Auto-Sync Mobile App with Web Updates" run
   - Status: Should complete within 2-3 minutes

5. **Check Mobile App**
   - Open mobile app
   - Look for "Test Station Alpha" in the stations list
   - ✅ **Expected Result**: New station appears immediately

---

### Test 2: Update Product Availability

**Objective**: Verify that product availability changes sync in real-time.

#### Steps:

1. **Open Web App** (petro-pulse-portal)
   - Navigate to a station's product management
   - Update a fuel product:
     - Change Price: $2.99 → $3.49
     - Change Availability: Available → Low Stock

2. **Save Changes**
   - Click "Update" or "Save"
   - Changes saved to Supabase

3. **Monitor GitHub Actions**
   - Workflows should trigger automatically
   - Check status: https://github.com/Cadina247/fuel-forward-drive/actions

4. **Check Mobile App**
   - Refresh or wait for auto-sync (max 5 minutes)
   - Verify updated price and stock status
   - ✅ **Expected Result**: Product data updates within 5 minutes

---

### Test 3: Background Sync (App in Sleep Mode)

**Objective**: Verify mobile app syncs data even when sleeping.

#### Steps:

1. **Open Mobile App**
   - Launch the app once (initializes sync service)
   - Note the "Last Sync" timestamp

2. **Update Web App**
   - Add a new station or update products
   - Wait for workflow to complete

3. **Leave Mobile App Running (Don't Close)**
   - Keep the app open but inactive
   - Mobile app performs periodic sync every 5 minutes

4. **Wait 5-10 Minutes**
   - Monitor sync status in app (if UI shows it)
   - Check local storage for updated data

5. **Bring App to Foreground**
   - Reactivate the app
   - ✅ **Expected Result**: New/updated data visible

---

### Test 4: Real-Time Updates via Supabase Listeners

**Objective**: Verify that real-time listeners detect changes immediately.

#### Steps:

1. **Set Up Monitoring**
   - Open browser console on mobile app
   - Look for logs like:
     ```
     🔔 Station change detected: INSERT
     🔄 Starting data sync...
     ```

2. **Trigger Change on Web App**
   - Register a new station or update product

3. **Monitor Console**
   - Should see:
     ```
     🔔 Station change detected
     ✅ Sync completed successfully
     ```

4. **Verify Mobile App**
   - ✅ **Expected Result**: Changes visible without refresh

---

## 🔍 Monitoring Dashboard

### Check Sync Status:

**Web App Workflow**:
```
URL: https://github.com/Cadina247/petro-pulse-portal/actions
Look for: "Deploy Web App & Notify Mobile"
Expected: ✅ SUCCESS
```

**Mobile App Workflow**:
```
URL: https://github.com/Cadina247/fuel-forward-drive/actions
Look for: "Auto-Sync Mobile App with Web Updates"
Expected: ✅ SUCCESS
```

### Supabase Status:

Check real-time data:
```
1. Go to Supabase Dashboard
2. Tables to monitor:
   - stations (new entries should appear immediately)
   - products (updates should reflect in seconds)
3. Check realtime subscriptions are active
```

---

## 📊 Expected Behavior

| Action | Web App | GitHub Actions | Mobile App | Time |
|--------|---------|-----------------|-----------|------|
| Register Station | Saved ✅ | Triggered ✅ | Appears ✅ | < 2 min |
| Update Product | Updated ✅ | Triggered ✅ | Synced ✅ | < 2 min |
| Real-time listener | — | — | Detects ✅ | < 30 sec |
| Background sync | — | — | Syncs ✅ | Every 5 min |

---

## 🐛 Troubleshooting

### Issue: Web App Workflow Fails

**Check**:
```bash
1. ESLint errors (should be non-blocking)
2. Build errors (run: npm run build locally)
3. GitHub token permissions (should have repo access)
```

**Fix**:
- Review build logs: https://github.com/Cadina247/petro-pulse-portal/actions
- Check error messages
- Fix local code issues

---

### Issue: Mobile App Workflow Doesn't Trigger

**Check**:
```bash
1. Web app workflow completed successfully?
2. Repository dispatch event was sent?
3. Mobile app workflow permissions correct?
```

**Fix**:
- Verify GITHUB_TOKEN has correct permissions
- Check workflow file syntax
- Review dispatch event payload

---

### Issue: Mobile App Doesn't Show Updated Data

**Check**:
```bash
1. Supabase tables have new data?
2. SyncService is initialized?
3. useSyncEffect hook is in main component?
4. Browser console shows sync logs?
```

**Fix**:
- Manually trigger sync: `syncService.syncNow()`
- Check browser console for errors
- Verify Supabase credentials in `.env`

---

### Issue: Real-Time Listeners Not Working

**Check**:
```bash
1. Supabase realtime enabled?
2. Tables have realtime subscriptions?
3. Network connection active?
```

**Fix**:
- Enable realtime in Supabase settings
- Check network tab for WebSocket connections
- Verify Supabase URL and key

---

## 📝 Test Log Template

```markdown
## Test Run: [Date]

### Test 1: Register Station
- [ ] Station registered on web app
- [ ] GitHub Actions triggered
- [ ] Mobile app workflow completed
- [ ] Station appears on mobile app
- **Result**: PASS / FAIL
- **Time**: __ minutes

### Test 2: Update Product
- [ ] Product updated on web app
- [ ] GitHub Actions triggered
- [ ] Mobile app synced
- [ ] Update visible on mobile app
- **Result**: PASS / FAIL
- **Time**: __ minutes

### Test 3: Background Sync
- [ ] Mobile app synced after 5 minutes
- [ ] New data visible without manual refresh
- **Result**: PASS / FAIL
- **Time**: __ minutes

### Test 4: Real-Time Updates
- [ ] Console shows change detected
- [ ] Sync triggered immediately
- [ ] Data updated in real-time
- **Result**: PASS / FAIL
- **Time**: < 30 seconds

### Overall Result: PASS / FAIL
### Notes: [Any issues encountered]
```

---

## ✅ Final Verification Checklist

- [ ] Web app builds successfully
- [ ] Mobile app workflow triggers automatically
- [ ] New stations appear on mobile app (< 2 min)
- [ ] Product updates sync (< 2 min)
- [ ] Background sync works (every 5 min)
- [ ] Real-time listeners detect changes (< 30 sec)
- [ ] No errors in browser console
- [ ] No errors in GitHub Actions logs
- [ ] Supabase tables populated correctly
- [ ] Both apps using same Supabase database

---

## 🚀 Production Deployment

Once all tests pass:

1. **Push to production**
2. **Monitor for 24 hours**
3. **Track sync success rate**
4. **Gather user feedback**

---

## 📞 Support

For issues or questions:
- Check GitHub Actions logs
- Review browser console errors
- Verify Supabase connectivity
- Test manual sync trigger
