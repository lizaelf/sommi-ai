# Wine Management System - Information Architecture

## Application Structure Overview

This single-page application (SPA) provides wine collection management with multi-tenant support for wineries.

## Navigation Hierarchy

```
Wine Management System (Root)
│
├── 📱 Main Application Routes
│   ├── / (Root) → Scanned Wine Page
│   ├── /scanned → Wine Scanning Interface
│   ├── /cellar → Wine Collection Viewer
│   ├── /home-global → Global Home Page
│   └── /wine/conversation → Wine Chat Interface
│
├── 🍷 Wine-Specific Routes
│   ├── /wine-details/:id → Individual Wine Details
│   ├── /wine-edit/:id → Wine Editing Interface
│   └── /scan-wine/:id → Wine QR Scanning
│
├── 🏢 Admin & Management Routes
│   ├── /admin-crm → Legacy Admin Interface
│   │   └── "Manage Wineries" button → /tenants
│   │
│   └── /tenants → Multi-Tenant Management Hub
│       ├── Winery Cards Display
│       ├── Create New Winery Modal
│       ├── Edit Winery Modal
│       ├── Delete Confirmation Modal
│       └── /tenants/:slug/admin → Tenant-Specific Admin
│           ├── Wine Collection Management
│           ├── CRUD Operations for Wines
│           ├── Export/Import Wine Data
│           └── Tenant-Isolated Storage
│
└── 🚫 Error Handling
    └── /404 → Not Found Page
```

## Page Relationships & Data Flow

### 1. Entry Points
- **/** (Root/Scanned) - Primary landing page for wine scanning
- **/admin-crm** - Administrative interface with "Manage Wineries" access
- **/tenants** - Multi-tenant management hub

### 2. Wine Data Flow
```
Individual Wine Data:
/wine-details/:id ←→ /wine-edit/:id ←→ /scan-wine/:id

Tenant-Specific Wine Collections:
/tenants → /tenants/:slug/admin → Wine CRUD Operations
```

### 3. Multi-Tenant Architecture
```
Global Level:
/tenants (Winery Management)
├── Create Winery
├── Edit Winery
├── Delete Winery
└── View All Wineries

Tenant Level:
/tenants/:slug/admin (Isolated Wine Management)
├── Wine Collection Dashboard
├── Add/Edit/Delete Wines
├── Export Wine Data
├── Import Wine Data
└── Tenant-Specific Storage (wine-data-tenant-{id})
```

## Data Storage Strategy

### Global Storage
- **tenants** → localStorage key for winery information
- **conversations** → IndexedDB for chat history
- **wine-data** → Legacy global wine data

### Tenant-Specific Storage
- **wine-data-tenant-{id}** → Isolated wine collections per winery
- Each tenant maintains completely separate wine inventories
- No cross-tenant data sharing or visibility

## Navigation Patterns

### Primary Navigation
1. **Admin-CRM** → **Tenants** (via "Manage Wineries" button)
2. **Tenants** → **Tenant Admin** (via "Manage Wines" cards)
3. **Tenant Admin** → **Tenants** (via "Back" button)

### Wine Management Flow
1. **Create Winery** → Set name, slug, logo, description, AI tone
2. **Access Winery** → Manage tenant-specific wine collection
3. **Wine CRUD** → Add, edit, delete wines within tenant scope
4. **Data Management** → Export/import tenant wine data

### User Journey Examples

#### Creating a New Winery
```
/admin-crm → Click "Manage Wineries" → /tenants → Click "Add Winery" 
→ Fill form → Submit → New winery card appears
```

#### Managing Winery Wines
```
/tenants → Click winery card "Manage Wines" → /tenants/{slug}/admin 
→ Add/Edit wines → Isolated storage updates
```

#### Editing Winery Information
```
/tenants → Click winery "⋮" menu → Edit → Update form → Save
```

## Key Features Per Page

### /tenants (Winery Management Hub)
- Card-based winery display
- Create new winery with branding
- Edit winery details (name, logo, description, AI tone)
- Delete winery with confirmation
- Navigate to tenant-specific admin

### /tenants/:slug/admin (Tenant Wine Management)
- Tenant-branded header with logo/name
- Wine collection statistics
- CRUD operations for wines
- Export/import functionality
- Completely isolated from other tenants
- Back navigation to tenant hub

### /admin-crm (Legacy Admin)
- Original wine management interface
- "Manage Wineries" navigation button
- Existing wine data management
- Data sync capabilities

## Technical Implementation Notes

### Routing Structure
- Uses Wouter for client-side routing
- Dynamic routes support tenant slugs
- 404 handling for invalid routes

### State Management
- React Query for data fetching and caching
- localStorage for persistent winery data
- IndexedDB for chat conversations
- Tenant-scoped storage keys for isolation

### Component Architecture
- Reusable UI components
- Tenant-aware data providers
- Isolated mutation operations
- Form validation and error handling

This architecture ensures complete separation of tenant data while providing a unified management interface for multiple wineries within the same application instance.