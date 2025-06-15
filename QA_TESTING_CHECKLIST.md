# QA Testing Checklist - Wine Platform

## Core Features Testing

### 1. Wine-Specific Suggestion Pills System
- [ ] Load wine details page - pills should appear below chat input
- [ ] Click a suggestion pill - should send message and pill disappears permanently for this wine
- [ ] Navigate to different wine - same suggestion should be available again
- [ ] Refresh page on same wine - used pills should remain hidden
- [ ] Test all 10 suggestion types from JSON configuration
- [ ] Verify database tracking with unique wine keys (name_year format)
- [ ] Check error handling when API fails
- [ ] Test with wines that have no year specified

### 2. Voice Assistant & TTS System
- [ ] Click microphone button - should show text/voice bottom sheet (first time only)
- [ ] Test session tracking - bottom sheet should only appear once per session
- [ ] Verify TTS speed is 40% slower (0.79 instead of 1.1)
- [ ] Test welcome message playback with slower speed
- [ ] Voice lock verification for male voice consistency
- [ ] OpenAI TTS integration working properly
- [ ] Voice circle animation responds to actual microphone input
- [ ] Stop/close functionality prevents future interactions until page refresh

### 3. Delete Account Dialog
- [ ] Click profile menu → Delete account
- [ ] Should show "Delete account?" dialog instead of chat history sheet
- [ ] "Don't delete" button closes dialog
- [ ] "Delete" button (dark red #8B0000) confirms deletion
- [ ] Account deletion clears chat history and reloads page
- [ ] Hover effects work on delete button

### 4. Chat Interface Improvements
- [ ] Empty state: Chat input fills full screen width
- [ ] With messages: Chat input uses centered max-width layout
- [ ] No emoji text visible in any suggestion labels or buttons
- [ ] Chat messages display properly with wine recommendations
- [ ] Voice button integration in chat input works

### 5. Navigation & Wine Management
- [ ] Wine cards click navigation to details pages
- [ ] Logo click returns to home page
- [ ] Wine recommendations scroll horizontally
- [ ] QR code scanning functionality
- [ ] Admin panel wine management (add/edit/delete)
- [ ] Image upload preservation (PNG format maintained)

## Technical Debugging Needed

### Database & API Issues
- [ ] Check PostgreSQL connection status
- [ ] Verify suggestion pills API endpoints (/api/suggestion-pills/:wineKey)
- [ ] Test database schema for used_suggestion_pills table
- [ ] Validate wine key generation format consistency
- [ ] Check conversation history persistence
- [ ] Verify tenant data management

### Performance & Loading
- [ ] Page load times and flash prevention system
- [ ] Image loading optimization
- [ ] Asset path resolution in production
- [ ] Component initialization timing
- [ ] Memory leaks in voice system
- [ ] Event listener cleanup

### Cross-Browser Compatibility
- [ ] Chrome voice lock verification
- [ ] Safari TTS functionality
- [ ] Firefox microphone permissions
- [ ] Mobile device responsiveness
- [ ] Touch interactions on suggestion pills

### Error Handling
- [ ] Network failure scenarios
- [ ] Invalid wine data handling
- [ ] Missing API keys graceful degradation
- [ ] Voice permission denied scenarios
- [ ] Database connection failures

## Issues Fixed During QA

### TypeScript Errors (server/openai.ts) - RESOLVED ✅
- Fixed `finalResponse` typing by adding proper type annotation
- Fixed missing `cleanText` variable reference in fallback TTS function
- Fixed TTS speed consistency by using VoiceConfig.SPEED instead of hardcoded 1.2

### Core Systems Verified ✅
- Database connection and schema working properly
- Wine-specific suggestion pills API fully functional
- TTS system operational with correct 40% speed reduction (0.79)

### Potential Issues to Check
- [ ] Session storage persistence across page reloads
- [ ] Voice system initialization timing
- [ ] Circle animation component (under code freeze - verify no unwanted changes)
- [ ] Wine data synchronization between development and production
- [ ] Asset path optimization for deployment

## Test Scenarios

### Happy Path
1. Load home page → Select wine → View details → Use suggestion pills → Start voice conversation
2. Navigate between wines → Verify suggestion pills work independently per wine
3. Delete account → Confirm proper dialog and data clearing

### Edge Cases
1. Wine with missing data (no year, no image, no ratings)
2. Network interruption during TTS playback
3. Rapid clicking on suggestion pills
4. Voice permission denied by user
5. Page refresh during active voice session

### Stress Testing
1. Multiple rapid wine navigation
2. Large number of conversation messages
3. Extended voice sessions
4. Multiple suggestion pill usage in sequence

## Priority Issues to Fix

**HIGH PRIORITY:**
- TypeScript errors in server/openai.ts
- Session tracking persistence
- Wine-specific suggestion pill database operations

**MEDIUM PRIORITY:**
- Voice system initialization timing
- Cross-browser TTS compatibility
- Error handling improvements

**LOW PRIORITY:**
- Performance optimizations
- Additional test coverage
- Documentation updates

## Test Environment Setup

1. Ensure DATABASE_URL and OPENAI_API_KEY are configured
2. Clear browser cache and localStorage
3. Test in incognito/private browsing mode
4. Verify PostgreSQL database is accessible
5. Check console logs for any errors during testing

---
**Testing Notes:**
- Test each feature individually before integration testing
- Document any issues found with steps to reproduce
- Verify fixes don't break existing functionality
- Test on both development and production environments