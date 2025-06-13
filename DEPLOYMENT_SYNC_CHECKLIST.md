# Deployment Synchronization Checklist

## Pre-Deployment Steps

### 1. Sync Wine Data Version
- Current data version: 2.0.1
- All wine data structures are synchronized
- Asset paths use correct prefixes for deployment environment

### 2. Component Verification
- ✅ WineDetails.tsx has flash prevention loading states
- ✅ WineScan.tsx (scanned page) matches Replit version
- ✅ CSS includes wine-details-loading/ready classes
- ✅ Asset imports use correct paths

### 3. Asset Path Configuration
- Development: Uses @assets/ alias
- Production: Uses absolute paths with base URL
- Images are properly copied to public directory

## Deployment Commands

```bash
# 1. Run synchronization
node deploy-sync.js

# 2. Copy assets for deployment
node copy-assets.js

# 3. Build for production
npm run build

# 4. Deploy to hosting platform
```

## Post-Deployment Verification

### Pages to Test
1. **Wine Details Page** (`/wine-details/1`, `/wine-details/2`)
   - No UI flash during navigation
   - Proper loading states
   - All wine images display correctly
   - Chat interface functions identically to Replit

2. **Scanned Page** (`/scanned?wine=1`, `/scanned?wine=2`)
   - QR code scanning flow matches Replit
   - Wine data displays correctly
   - Navigation between wines works smoothly

### Key Features to Verify
- Suggestion buttons work (text-only responses)
- Voice assistant functionality (if enabled)
- Wine recommendations scroll horizontally
- All PNG images maintain quality
- Loading spinners prevent content flash

## Environment Variables
Ensure these are set in deployment environment:
- `OPENAI_API_KEY`
- `DATABASE_URL` (if using database)

## Troubleshooting

### Common Issues
1. **Asset path errors**: Verify base URL configuration
2. **Flash on page load**: Check loading state implementation
3. **Image not loading**: Confirm assets were copied correctly
4. **API errors**: Verify environment variables are set

### Quick Fixes
- Clear browser cache
- Check browser console for errors
- Verify all assets are accessible via direct URL