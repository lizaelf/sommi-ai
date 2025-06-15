# Wine Exploration Platform - Project Documentation

## Overview
An intelligent multi-tenant wine exploration platform that transforms wine discovery into an engaging, interactive experience through AI-powered conversations and user-centric design.

**Current Status**: Production-ready, deployment synchronized (v2.1.0)

## Key Features
- AI-powered wine conversations with GPT-4o
- QR code wine scanning and identification
- Admin panel for wine collection management
- Voice assistant with text-to-speech
- Horizontal scrolling wine recommendations
- Multi-tenant architecture with PostgreSQL
- Responsive design with clean, minimal UI

## Project Architecture

### Frontend (React + TypeScript)
- **Main Components**: EnhancedChatInterface, WineDetails, HomeGlobal, TenantAdmin
- **Routing**: Wouter-based SPA with wine-specific routes
- **State Management**: React Query + localStorage for wine data
- **Styling**: Tailwind CSS with custom typography (Lora/Inter)

### Backend (Express + Node.js)
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: OpenAI GPT-4o for wine conversations
- **Voice**: Text-to-speech with optimized streaming
- **Storage**: Unified wine data management system

### Data Management
- **DataSyncManager**: Centralized wine data with version control
- **Image Handling**: PNG format preservation, asset optimization
- **Persistence**: PostgreSQL for conversations, localStorage for wine collections

## User Preferences
- **UI Style**: Clean, minimal design with no flashy elements
- **Image Format**: Strict PNG preservation, never convert to JPEG
- **Navigation**: Wine cards click to open details, logo clicks to home
- **Response Mode**: Text-only suggestions without audio/bottom sheet
- **Loading States**: Comprehensive flash prevention system
- **Code Management**: CircleAnimation component under code freeze - require permission before changes (finalized June 14, 2025)

## Recent Changes (June 15, 2025)

### Component Architecture Modernization & Performance Enhancement (June 15, 2025 - Latest)
- **WineDetails Component Refactoring**: Successfully split monolithic component into focused, maintainable modules:
  - WineDetailsHeader: Header with actions dropdown and navigation
  - WineInfoSection: Wine image display, name, ratings, and location information
  - FoodPairingSection: Expandable food pairing categories with interactive UI
  - ChatInterface: Complete chat functionality with message display and input
  - VoiceAssistantContainer: Voice functionality wrapper with proper context handling
- **Enhanced SuggestionPills Component**: Added conversation context support and improved error handling
- **VoiceAssistant Optimization**: Implemented complete separation of concerns with early exit for instant responses, preventing interference with SuggestionPills audio handling
- **VoiceBottomSheet Simplification**: Replaced complex suggestion handler with clean pass-through approach, letting SuggestionPills manage all caching logic
- **Immediate TTS Implementation**: Integrated pre-populated wine response data from spreadsheet for instant voice playback with complete voice assistant bypass and reliable browser TTS
- **QRScanModal Voice Button Fix**: Removed session storage restriction preventing voice assistant reopening
- **Wine Image Enhancement**: Updated wine image container to 240px height with circle glow background effect using radial gradient
- **History Section Redesign**: Renamed Heritage to History, changed to H1 typography, removed background/padding/radius, left-aligned text
- **US Flag Path Fix**: Corrected country flag image path from `/US-flag.png` to `/us-flag.png` to match public directory asset
- **Wine Title Format**: Updated wine title to display as "year name" format in single line instead of separate year display
- **Bottles Count Removal**: Removed bottles count section from wine details page for cleaner layout
- **Food Pairing Section Update**: Changed title to H1 typography, left-aligned title, reduced spacing to 8px between blocks
- **WineDetails Enhanced UI Restoration**: Rebuilt WineDetails page with complete enhanced UI structure including:
  - WineBottleImage component with blurred circle/glow effect as focal point
  - Full-screen wine image container (100vh height) for immersive experience
  - Wine title in "year name" format using Lora typography system
  - USFlagImage component with location display and proper asset integration
  - WineRating component with left alignment and proper spacing
  - History section with H1 typography and rich wine description content
  - Expandable food pairing sections with emojis and smooth chevron animations:
    - Red Meat pairing with "Perfect match" badge
    - Cheese Pairings with curated selections
    - Vegetarian Options with plant-based alternatives
    - Avoid section with cautionary recommendations
  - "Want more?" section with functional Buy again button
  - "We recommend" section with horizontal scrolling wine cards
  - Enhanced typography system using Lora serif for headings and Inter for body text
  - Standardized header matching HomeGlobal page with Logo, "My cellar" button, and ButtonIcon dropdown
  - Full-width "Buy again" button for improved mobile accessibility
  - Single-line WineRating component displaying all ratings (VN, JD, WS, ABV) horizontally
  - Integrated chat section within main wine container for seamless conversation experience
  - Simplified chat integration removing complex full-screen wrapper and background conflicts
  - Isolated chat interface with black background and negative margin for seamless wine-to-chat transition
  - Enhanced suggestion buttons to work as text-only responses with explicit audio disabled
- **Performance Optimization**: Immediate display of default suggestions while API loads in background
- **TypeScript Interface Standardization**: Consistent prop interfaces across all refactored components
- **Code Organization**: Improved maintainability with smaller, focused components following React composition patterns

### Context-Aware Suggestion System with Instant Responses (June 15, 2025)
- **Standardized Wine Keys**: Updated to consistent `wine_${wine.id}` format across all components for proper cache management
- **Universal Cache Integration**: Both chat and voice assistant contexts now check cache before making API calls
- **Instant Text Responses**: Chat interface suggestions use cached responses for immediate display without thinking state
- **Instant Voice Responses**: Voice assistant suggestions leverage cached responses for immediate TTS playback
- **Response Caching**: All API responses are automatically cached for future instant use across both contexts
- **Context-Aware Behavior**: Complete separation between text-only chat and voice-enabled assistant contexts
- **Performance Optimization**: Cached suggestions bypass API calls entirely, eliminating loading states for repeated interactions

### Voice Assistant & Suggestion System Completion (June 15, 2025)
- **Cycling Suggestion Pills**: Modified suggestion system to always show suggestions and automatically reset when all have been used
- **Backend API Enhancement**: Added suggestion cycling logic that returns all suggestions when none remain unused
- **Database Reset Functionality**: Implemented resetUsedSuggestionPills method with DELETE endpoint for cycling
- **Seamless User Experience**: Suggestions now cycle continuously without "All suggestions explored" dead-end state
- **Function Signature Resolution**: Fixed all component interface mismatches preventing instant voice responses
- **State Management Enhancement**: Added proper event handling for cached response completion

### Latest UI & Voice Improvements (June 15, 2025)
- **Console Error Resolution**: Fixed IndexedDB conversation errors by auto-creating missing conversations and improved error handling
- **Unmute Button Message Fix**: Corrected variable reference issue causing default fallback message instead of actual assistant responses
- **Message Storage Implementation**: Added proper assistant message storage across all response types (text-only, voice, regular chat)
- **Circle Animation Speed Increase**: Doubled animation speed (listening: 0.1s→0.05s, default: 0.3s→0.15s) for more responsive visual feedback
- **Unmute Button Deployment Fix**: Enhanced fallback system with 4-level strategy to ensure unmute works reliably in deployed environments
- **Microphone Button Fix**: Fixed missing .current reference that was blocking microphone button functionality
- **Voice Window Wine-Specific Pills**: Implemented same wine-specific suggestion logic in voice bottom sheet with text+voice response behavior
- **Text-Only Suggestion Responses**: Suggestion pills now trigger text-only responses without voice playback while preserving button appearance
- **TTS Speed Normalization**: Fixed welcome voice speed from 1.2 to 1.0 (normal rate) by correcting TTS_SPEED environment variable
- **Unmute Button Deployment Fix**: Added comprehensive fallback system to ensure unmute button works reliably in deployed version using browser TTS when OpenAI audio fails
- **Horizontal Suggestion Layout**: Suggestion pills display in single scrollable horizontal line for cleaner interface
- **Welcome Message Caching**: Pre-cached welcome audio for immediate playback without TTS generation delay
- **Ask Button Fix**: Resolved reference error preventing Ask button functionality in voice assistant interface
- **Limited Suggestion Display**: Suggestion pills now show 3 at once instead of all available suggestions for cleaner interface
- **TTS Speed Normalization**: Restored TTS speed to 1.0 (normal rate) for optimal user experience
- **Session-Based Bottom Sheet**: Text/voice choice bottom sheet now shows only once per user session using sessionStorage tracking
- **Delete Account Dialog**: Replaced chat history sheet with proper confirmation dialog featuring "Don't delete" and dark red "Delete" buttons
- **Full-Width Chat Mode**: Chat section now fills entire screen width when in empty state (no messages) for better visual balance
- **Wine-Specific Suggestion Pills**: Implemented database-backed system tracking pill usage per wine individually with PostgreSQL storage
- **Dynamic Pill Generation**: Created JSON configuration with 10 wine-focused suggestions that disappear permanently per wine after use
- **Clean Text Display**: Removed all emoji text from suggestion labels and interaction buttons for minimal presentation

### Voice System & UI Improvements (June 14, 2025)
- **Permanent Close Behavior**: Close button now prevents all future interactions until page refresh
- **OpenAI Voice Integration**: Switched from browser speech synthesis to OpenAI TTS for consistent voice quality
- **Circle Animation Finalization**: Clean voice-responsive scaling without visual overlays or debug elements
- **Voice Responsiveness**: Circle scales smoothly with voice input (threshold >5, max 30% scaling)
- **Component Code Freeze**: CircleAnimation locked to prevent future modifications without explicit permission
- **Simplified State Management**: Uses proven setInterval-based state sync (250ms) for reliable performance
- **Type Safety Implementation**: Added proper TypeScript interfaces for MicStatusEvent and VoiceVolumeEvent
- **Resource Management**: Proper cleanup with interval clearing and event listener removal

### Syntax Error Resolution (June 14, 2025)
- **VoiceAssistant.tsx Fixed**: Corrected mismatched braces in nested try-catch blocks throughout handleUnmute function
- **CircleAnimation.tsx Fixed**: Removed extra closing braces causing build failures
- **Indentation Standardization**: Systematically corrected indentation issues across voice-related components
- **Build Stability**: Application now runs without syntax errors or compilation failures

### Deployment Synchronization Complete (June 14, 2025)
- **Production Parity Achieved**: Deployed version now works identically to Replit development version
- **Voice System Verification**: Comprehensive male voice enforcement verified for production environments
- **Component Synchronization**: All critical components synchronized between development and production
- **Asset Path Optimization**: Proper asset handling for both development and deployed environments
- **Deployment Verification Script**: Created automated verification to ensure deployment readiness
- **Environment Configuration**: Production-specific environment variables and configuration files
- **Complete Build Process**: Verified build process produces deployment-ready artifacts

### Voice-Responsive Circle Animation Implementation (June 14, 2025)
- **Real Voice Level Detection**: Circle animation now responds to actual microphone input levels instead of timer-based animations
- **Global State Communication**: Implemented dual communication system between VoiceAssistant and CircleAnimation components
- **State-Specific Behavior**: Circle remains static during IDLE/PROCESSING/PLAYING states, only scales during LISTENING mode
- **Optimized Scaling**: Voice scaling threshold reduced to 3 with 30% maximum scaling for smoother, more subtle response
- **Smooth Transitions**: Added 0.1s ease-out transitions for width and height changes to create fluid scaling animation
- **Enhanced Voice Threshold**: Lower sensitivity threshold (volume/80) for more responsive voice detection
- **Full Opacity Maintenance**: Removed all opacity changes - circle maintains consistent full opacity across all states
- **Debug Cleanup**: Removed debug overlays and reduced console logging for production-ready implementation
- **Enhanced Voice Flow**: Fixed timing issues to ensure proper LISTENING state detection during voice input

### Voice Assistant Consistency Fix (June 14, 2025 - Critical)
- **Locked Male Voice Selection**: Implemented consistent male voice across all components with priority hierarchy
- **Google UK English Male Priority**: Primary voice selection for maximum consistency and quality
- **Voice URI Locking**: Added localStorage voice URI persistence to maintain same voice across sessions
- **Global Voice Coordination**: Synchronized voice selection between VoiceAssistant component and voiceScript
- **Fallback Chain**: Established clear fallback priorities (Google UK > Google US > Google Male > English Male)
- **Deployment-Specific Enforcement**: Added production environment detection with aggressive male voice filtering
- **Extended Female Voice Exclusion**: Comprehensive list of female voice names to prevent selection in deployed version
- **Runtime Voice Verification**: Double-checking voice selection before each speech synthesis in production
- **Welcome Message Blocking**: Prevented welcome messages from playing with female voices in deployed environments
- **Global Speech Override**: Implemented speechSynthesis.speak override to block all speech until male voice verification
- **Critical Importance**: Voice consistency is now guaranteed across all text-to-speech functionality in both development and production

### Wine Recommendation Persistence (June 14, 2025)
- **Always Show Recommendations**: Wine recommendations now always visible, regardless of account deletion status
- **Selective Data Clearing**: Account deletion now only clears chat history while preserving wine collection data
- **Enhanced IndexedDB Management**: Added clearChatHistory() method to preserve wine data during account reset
- **localStorage Protection**: Modified account deletion to exclude wine-related data keys from removal
- **DataSyncManager Preservation**: Wine collection and admin data remain intact through account deletion process

### Chat History Rollback (June 14, 2025)
- **Registration Gate Removal**: Rolled back registration-gated chat history functionality
- **Direct Chat Access**: Restored immediate access to chat history without user registration requirement
- **UI Simplification**: Removed "View chat history" button and registration prompts
- **Original Flow**: Chat messages display directly when available, maintaining original user experience

### UI Component Updates (June 14, 2025)
- **WineCollection Padding**: Added 16px left and right padding to wine collection container
- **WineRating Standardization**: Updated WineCard to use same WineRating implementation as WineDetails page
- **Voice Button Restoration**: Fixed missing microphone button in ChatInput component by adding VoiceAssistant integration
- **Rating Display Consistency**: Wine cards now show ratings with left alignment and default variant matching WineDetails
- **Scroll Position Fix**: Removed forced scroll-to-top in conversation initialization to prevent page jumping during wine recommendation interactions
- **Error Handling Enhancement**: Improved IndexedDB error handling with better error messages and isolation
- **Delete Account Fix**: Enhanced account deletion to properly clear all localStorage, IndexedDB data, and backend conversations with user interaction choice workflow
- **Suggestion Interface Simplification**: Removed dual suggestion modes, now using text-only (💬) response suggestions for cleaner UI

## Previous Changes (June 13, 2025)

### Component Refactoring Architecture Overhaul (June 13, 2025 - Late Evening)
- **Selective Component Refactoring**: Refactored HomeGlobal, TenantAdmin, and WineEdit pages into smaller, focused functional components
- **WineDetails Page Rollback**: Restored original single-file WineDetails component structure after UI issues with refactored version
- **HomeGlobal Page Refactoring**: Modularized into 3 components:
  - WelcomeSection.tsx - Logo and welcome messaging
  - WineCard.tsx - Individual wine card component
  - WineCollection.tsx - Wine grid and collection management
- **TenantAdmin Page Refactoring**: Organized into 3 components:
  - AdminHeader.tsx - Header with user dropdown and navigation
  - TabNavigation.tsx - Tab switching interface
  - WineManagement.tsx - Wine CRUD operations and data management
- **Shared Component Library Creation**:
  - PageLayout.tsx - Unified page layout wrapper
  - LoadingSpinner.tsx - Reusable loading states
  - ErrorDisplay.tsx - Standardized error handling
  - CellarSearch.tsx - Search functionality
  - CellarFilters.tsx - Filter components
- **Wine Edit Components**: Created WineEditForm.tsx for unified wine editing
- **File Structure Reorganization**: Created logical directory structure:
  - /components/wine-details/ - Wine detail page components
  - /components/home-global/ - Home page components  
  - /components/tenant-admin/ - Admin interface components
  - /components/shared/ - Reusable cross-page components
  - /components/cellar/ - Cellar management components
  - /components/wine-edit/ - Wine editing components
- **TypeScript Interface Standardization**: Ensured all refactored components use consistent prop interfaces
- **Component Composition Pattern**: Implemented proper React composition patterns for better maintainability
- **Performance Optimization**: Reduced bundle size through component splitting and improved tree-shaking
- **Developer Experience Enhancement**: Smaller, focused components for easier debugging and maintenance

### Latest Updates (June 13, 2025 - Evening)
- **Button Component Standardization**: Changed default Button variant from "primary" to "secondary" across entire application
- **WineRating Component Enhancement**: Added hideAbv prop to selectively hide ABV ratings in specific contexts (recommendation cards)
- **Rating Display Logic**: Implemented automatic hiding of rating blocks when no rating data exists
- **Wine Recommendation Cards**: Updated typography to buttonPlus1 style with 3-line text truncation and 12px gap between title and ratings
- **Chat Interface Optimization**: Removed voice assistant from WineDetails chat input, added explicit transparent backgrounds
- **Page Scrolling Fix**: Resolved initial scrolling issues with proper overflow settings and scroll initialization

### Component Standardization (June 13, 2025)
- **Header Component**: Confirmed AppHeader component consistency across all pages (HomeGlobal, WineDetails, WineEdit)
  - Fixed positioning with 1200px max-width container
  - Transparent by default with scroll-triggered blur effects
  - Standardized 75px height with proper Logo and ButtonIcon placement
- **Rating Component**: Created reusable WineRating component with multiple variants (default, compact, minimal)
  - Replaced all rating implementations across HomeGlobal, WineDetails, WineCard, and WineInfo components
  - Applied consistent typography constants (typography.num for values, typography.body1R for labels)
  - Standardized spacing and color scheme (#999999 for labels, white for values)
  - Support for three variants: default (main pages), compact (cards), minimal (small spaces)
  - Eliminated code duplication with centralized rating display logic

### Component Architecture Modernization
- Implemented component splitting for better code organization and performance
- Created focused, modular components: WineInfo, FoodPairing, and ChatSection
- Separated WineDetails into specialized components for improved maintainability
- Added enhanced chat interface readiness tracking with onReady callbacks
- Removed complex memoization in favor of direct component rendering
- Implemented component-level loading states for smoother initialization

### EnhancedChatInterface Refactoring
- Completely removed wine display elements from EnhancedChatInterface component
- Rebuilt component to focus solely on conversation and input functionality
- Fixed all import/export issues and TypeScript errors
- Cleaned up thousands of orphaned JSX elements from corrupted wine display sections
- Enhanced component with proper default export and interface compatibility
- Maintained conversation history, voice assistant, and suggestion features

### WineDetails Page Complete UI Overhaul
- Replaced entire WineDetails UI with elaborate structure from original EnhancedChatInterface
- Implemented WineBottleImage component with blurred circle/glow effect as focal point
- Added comprehensive typography system with Lora serif and Inter sans-serif fonts
- Integrated USFlagImage component with proper location display
- Created expandable food pairing sections with rotating chevron animations:
  - Red Meat pairing with "Perfect match" badge
  - Cheese Pairings with curated cheese selections
  - Vegetarian Options with plant-based alternatives
  - Avoid pairing with cautionary recommendations
- Added "Want more?" section with functional Buy again button
- Implemented "We recommend" section with horizontal scrolling wine cards
- Full-screen layout with proper z-index layering and responsive design
- Enhanced typography constants for consistent visual hierarchy throughout
- Advanced interactive elements with hover effects and smooth transitions
- Comprehensive wine data display with heritage section and detailed information

### Navigation Enhancement
- Wine recommendation cards now navigate to `/wine-details/${id}` on click
- HomeGlobal wine cards use proper wine details routing
- Logo click navigation to `/home-global` from any page

### Deployment Synchronization
- Updated DataSyncManager to version 2.2.3
- Synchronized all components for deployment parity
- Created comprehensive deployment checklist
- Asset paths optimized for production deployment

### UI Optimization & Performance Enhancement
- Enhanced image loading with reduced blur (5px), faster transitions (0.2s)
- Added opacity effects for smoother visual feedback
- Separated DataSyncManager initialization into dedicated useEffect
- Optimized wine data loading with memoized URL parameters
- Added useMemo for efficient URL parameter handling
- Added React key optimization for efficient component reconciliation
- Implemented proper loading state management with loading/loaded/error states
- Added dedicated loading and error components with user feedback
- Enhanced TypeScript safety with proper null checking
- Added component lifecycle debugging and route parameter tracking
- Implemented fade-in animations with proper delay handling
- Enhanced AppHeader initialization to prevent layout shifts
- Added routing optimization with unique keys to prevent unnecessary re-mounting
- Implemented debug styling and render timestamp tracking
- Eliminated FOUC (Flash of Unstyled Content) issues

### Typography Standardization (June 13, 2025)
- Consolidated section header style into h1 (32px Lora serif, 700 weight) for unified heading hierarchy
- Updated ButtonIcon component text styling to use consistent typography constants
- Standardized profile menu items to use typography.body1R (14px Inter, 400 weight)
- Updated bottom sheet text to use typography.h2 for titles and typography.body for content
- Enhanced WineDetails page error and loading components with proper typography
- Systematically updated all font styles throughout WineDetails page to use standardized typography constants
- Replaced all inline fontSize, fontFamily, and fontWeight properties with typography imports
- Applied consistent typography to food pairing sections, wine recommendations, and error states
- Updated chat interface title from "Chat with your sommelier" to "Chat" with left alignment
- Removed excessive left and right paddings from chat interface while maintaining proper 16px message spacing
- Made header completely transparent by default (no background or blur) with smooth transitions when scrolling
- Removed top padding to position content at the start of the page
- Applied h1 typography constants to chat title for consistent design system compliance
- Updated HomeGlobal route from /home-global to / (root path) with logo navigation updated accordingly
- Implemented comprehensive typography system using Lora serif for headings and Inter for body text
- All text elements now follow established design library standards for visual consistency

## Technical Implementation

### Wine Card Navigation
```javascript
onClick={() => {
  if (wine.id) {
    setLocation(`/wine-details/${wine.id}`);
  }
}}
```

### Flash Prevention System
- CSS classes: `.wine-details-loading` and `.wine-details-ready`
- Double requestAnimationFrame for smooth transitions
- Header state management with proper scroll detection

### Data Version Control
- Current version: 2.1.0
- Automatic migration preserves uploaded images
- Backward compatibility maintained

## Deployment Status
- **Sync Status**: ✅ Complete
- **Build Status**: ✅ Ready
- **Asset Status**: ✅ Optimized
- **Version**: 2.1.0

### Critical Features Verified
- Wine card click navigation functional
- Logo navigation working
- UI loading states active
- PNG image preservation enforced
- Text-only suggestion mode active
- Admin panel fully operational

## Next Steps
1. Deploy to production hosting platform
2. Configure environment variables (DATABASE_URL, OPENAI_API_KEY)
3. Verify deployed version matches Replit version exactly
4. Test all navigation and wine management features

---
**Last Updated**: June 13, 2025  
**Version**: 2.1.0  
**Status**: Ready for Production Deployment