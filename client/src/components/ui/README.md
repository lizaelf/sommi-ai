# UI Component Library

A streamlined collection of reusable components for the wine application, designed to maintain consistency and eliminate code duplication. All duplicate components have been consolidated into single, comprehensive implementations.

## Core Components

### BottomSheet
Modal component that slides up from the bottom of the screen.
```tsx
<BottomSheet isOpen={true} onClose={() => {}} title="Sheet Title">
  Content goes here
</BottomSheet>
```

### Button
Comprehensive button component with gradient backgrounds, multiple variants, and hover effects.
```tsx
<Button onClick={() => {}} variant="default" size="md">
  Click me
</Button>
<Button onClick={() => {}} variant="secondary" size="lg">
  Secondary Button
</Button>
<Button onClick={() => {}} variant="danger" size="sm">
  Delete
</Button>
```

### FormInput
Styled input field with validation, icons, and error states.
```tsx
<FormInput
  value={value}
  onChange={setValue}
  placeholder="Enter text"
  label="Field Label"
  error={error}
  leftIcon={<SearchIcon />}
/>
```

### LoadingSpinner
Animated loading indicator with customizable size and color.
```tsx
<LoadingSpinner size="md" color="white" />
```

### DropdownMenu
Searchable dropdown with icons and hover states.
```tsx
<DropdownMenu
  options={[{value: "1", label: "Option 1"}]}
  value={selected}
  onChange={setSelected}
  searchable={true}
/>
```

## Specialized Components

### WineCard
Card component specifically for displaying wine information.
```tsx
<WineCard
  id={1}
  name="Wine Name"
  year={2021}
  image="/wine.jpg"
  bottles={12}
  ratings={{vn: 95, jd: 93}}
  onClick={handleClick}
/>
```

### SearchInterface
Full-screen search overlay with results area.
```tsx
<SearchInterface
  isOpen={showSearch}
  onClose={() => setShowSearch(false)}
  searchQuery={query}
  onSearchChange={setQuery}
  placeholder="Search wines..."
  results={<SearchResults />}
/>
```

### NotificationSettings
Pre-built notification preferences interface.
```tsx
<NotificationSettings
  isOpen={showSettings}
  onClose={() => setShowSettings(false)}
  preferences={prefs}
  onPreferencesChange={setPrefs}
/>
```

### ProfileIcon
User profile menu with dropdown functionality.
```tsx
<ProfileIcon
  onEditContact={() => {}}
  onManageNotifications={() => {}}
  onDeleteAccount={() => {}}
/>
```

## Usage Examples

### Replacing Custom Modals
Replace existing bottom sheet implementations:
```tsx
// Before
<div style={{position: "fixed", ...}}>
  Custom modal content
</div>

// After
<BottomSheet isOpen={isOpen} onClose={onClose} title="Modal Title">
  Content
</BottomSheet>
```

### Replacing Custom Buttons
Replace styled button implementations:
```tsx
// Before
<div style={{background: "gradient", ...}} onClick={onClick}>
  Button Text
</div>

// After
<Button onClick={onClick} variant="default">
  Button Text
</Button>
```

### Replacing Form Inputs
Replace custom input styling:
```tsx
// Before
<input style={{border: "1px solid", ...}} />

// After
<FormInput value={value} onChange={onChange} label="Label" />
```

## Design System

All components follow the established design patterns:
- Dark theme with transparent overlays
- Consistent spacing and typography
- Smooth animations and transitions
- Responsive design principles
- Accessibility considerations

## Import Pattern

```tsx
import { 
  BottomSheet, 
  Button, 
  FormInput,
  WineCard,
} from '@/components/ui';
```