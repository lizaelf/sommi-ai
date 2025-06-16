/**
 * Spacing System - Wine Exploration Platform
 * This file defines all spacing values used throughout the application
 * Organized by usage type for consistent layout and component spacing
 */

const spacing = {
  // Base spacing units (in pixels)
  unit: {
    xs: "2px",      // Extra small spacing
    sm: "4px",      // Small spacing
    md: "8px",      // Medium spacing
    lg: "12px",     // Large spacing
    xl: "16px",     // Extra large spacing
    xxl: "24px",    // Double extra large spacing
    xxxl: "32px",   // Triple extra large spacing
    xxxxl: "48px",  // Quad extra large spacing
    huge: "64px",   // Huge spacing
    massive: "96px", // Massive spacing
  },

  // Container and Layout Spacing
  container: {
    // Main content containers
    padding: "16px",              // Standard container padding
    paddingLarge: "24px",         // Large container padding
    margin: "16px",               // Standard container margin
    marginLarge: "24px",          // Large container margin
    
    // Page sections
    sectionGap: "32px",           // Distance between major page sections
    headerHeight: "75px",         // App header height
    maxWidth: "1200px",           // Maximum container width
  },

  // Message and Chat Spacing
  chat: {
    // Chat title and messages
    titleToMessages: "16px",      // Distance from chat title to first message
    betweenMessages: "16px",      // Distance between question and answer
    messageInternalPadding: "16px", // Padding inside message bubbles
    assistantBottomPadding: "16px", // Bottom padding for assistant messages
    
    // Chat interface margins
    conversationPadding: "16px",  // Left/right padding for conversation area
    inputAreaPadding: "16px",     // Padding around input area
    bottomSpace: "80px",          // Extra space at bottom of chat
    
    // Scroll and floating elements
    scrollButtonBottom: "100px",  // Distance from bottom for scroll button
    scrollButtonRight: "20px",    // Distance from right for scroll button
  },

  // Button and Interactive Element Spacing
  button: {
    // Button internal spacing
    smallPadding: "8px 16px",     // Small button padding (secondary)
    mediumPadding: "12px 20px",   // Medium button padding
    largePadding: "16px 24px",    // Large button padding
    
    // Button groups and arrays
    groupGap: "8px",              // Gap between buttons in a group
    pillGap: "6px",               // Gap between suggestion pills (1.5rem)
    
    // Button dimensions
    minHeight: "36px",            // Minimum button height
    iconSize: "48px",             // Icon button size
    borderRadius: "32px",         // Button border radius
    pillBorderRadius: "16px",     // Pill button border radius
  },

  // Form and Input Spacing
  form: {
    // Form field spacing
    fieldGap: "16px",             // Gap between form fields
    labelMargin: "8px",           // Margin below form labels
    inputPadding: "12px 16px",    // Internal input padding
    
    // Form layout
    sectionGap: "24px",           // Gap between form sections
    submitMargin: "24px",         // Margin above submit button
    
    // Form containers
    formPadding: "24px",          // Form container padding
    modalPadding: "24px 24px 28px 24px", // Modal form padding
  },

  // Rating and Data Display Spacing
  rating: {
    // Rating component gaps
    itemGap: "4px",               // Gap between rating items (default)
    compactGap: "2px",            // Gap between rating items (compact)
    valueToLabel: "4px",          // Gap between value and label
    
    // Rating container spacing
    containerMargin: "8px",       // Margin around rating containers
  },

  // Wine Card and Collection Spacing
  wine: {
    // Wine card internal spacing
    cardPadding: "16px",          // Wine card internal padding (p-4)
    cardGap: "12px",              // Gap between wine card elements
    
    // Wine image spacing
    imageMargin: "16px",          // Margin around wine images
    imageGlow: "240px",           // Wine image container height
    
    // Wine collection layout
    collectionPadding: "16px",    // Left/right padding for wine collection
    gridGap: "16px",              // Gap between wine cards in grid
  },

  // Navigation and Header Spacing
  navigation: {
    // Header elements
    headerPadding: "16px",        // Header internal padding
    logoMargin: "8px",            // Margin around logo
    
    // Navigation items
    navItemGap: "16px",           // Gap between navigation items
    dropdownGap: "8px",           // Gap in dropdown menus
    
    // Breadcrumb and tabs
    breadcrumbGap: "8px",         // Gap between breadcrumb items
    tabGap: "24px",               // Gap between tab items
  },

  // Modal and Overlay Spacing
  modal: {
    // Modal positioning
    modalPadding: "24px",         // Modal internal padding
    overlayPadding: "20px",       // Overlay padding from edges
    
    // Modal elements
    headerMargin: "24px",         // Margin below modal header
    contentGap: "16px",           // Gap between modal content sections
    
    // Close button positioning
    closeButtonTop: "16px",       // Top position for close button
    closeButtonRight: "16px",     // Right position for close button
  },

  // Loading and State Spacing
  loading: {
    // Loading indicators
    spinnerMargin: "16px",        // Margin around loading spinners
    messageGap: "8px",            // Gap between loading elements
    
    // Empty states
    emptyStateHeight: "200px",    // Minimum height for empty states
    emptyStatePadding: "32px",    // Padding around empty state content
  },

  // Voice Assistant Spacing
  voice: {
    // Voice interface elements
    circleMargin: "16px",         // Margin around voice circle
    statusPadding: "16px",        // Padding around status text
    
    // Voice modal spacing
    modalGap: "16px",             // Gap between voice modal elements
    controlsGap: "12px",          // Gap between voice controls
  },

  // Typography Related Spacing
  text: {
    // Text block spacing
    paragraphMargin: "16px",      // Margin between paragraphs
    listItemGap: "8px",           // Gap between list items
    
    // Content sections
    sectionTitleMargin: "24px",   // Margin below section titles
    contentMargin: "12px",        // Margin below content blocks
  },

  // Border Radius Values
  radius: {
    small: "8px",                 // Small border radius
    medium: "12px",               // Medium border radius
    large: "16px",                // Large border radius (message bubbles)
    xlarge: "24px",               // Extra large border radius
    pill: "32px",                 // Pill-shaped border radius
    circle: "50%",                // Circular border radius
  },

  // Responsive Breakpoint Adjustments
  responsive: {
    // Mobile adjustments
    mobilePadding: "12px",        // Reduced padding for mobile
    mobileGap: "8px",             // Reduced gap for mobile
    
    // Tablet adjustments
    tabletPadding: "16px",        // Standard padding for tablet
    tabletGap: "12px",            // Standard gap for tablet
    
    // Desktop adjustments
    desktopPadding: "24px",       // Increased padding for desktop
    desktopGap: "16px",           // Increased gap for desktop
  },
};

export default spacing;

// Helper functions for commonly used spacing combinations
export const getChatSpacing = () => ({
  titleMargin: spacing.chat.titleToMessages,
  messageGap: spacing.chat.betweenMessages,
  messagePadding: spacing.chat.messageInternalPadding,
  containerPadding: spacing.chat.conversationPadding,
});

export const getButtonSpacing = (size: 'small' | 'medium' | 'large' = 'medium') => {
  const paddingMap = {
    small: spacing.button.smallPadding,
    medium: spacing.button.mediumPadding,
    large: spacing.button.largePadding,
  };
  
  return {
    padding: paddingMap[size],
    gap: spacing.button.groupGap,
    borderRadius: spacing.button.borderRadius,
    minHeight: spacing.button.minHeight,
  };
};

export const getFormSpacing = () => ({
  fieldGap: spacing.form.fieldGap,
  labelMargin: spacing.form.labelMargin,
  inputPadding: spacing.form.inputPadding,
  sectionGap: spacing.form.sectionGap,
});

export const getContainerSpacing = (size: 'normal' | 'large' = 'normal') => ({
  padding: size === 'large' ? spacing.container.paddingLarge : spacing.container.padding,
  margin: size === 'large' ? spacing.container.marginLarge : spacing.container.margin,
  maxWidth: spacing.container.maxWidth,
});

export const getModalSpacing = () => ({
  padding: spacing.modal.modalPadding,
  headerMargin: spacing.modal.headerMargin,
  contentGap: spacing.modal.contentGap,
  closeButton: {
    top: spacing.modal.closeButtonTop,
    right: spacing.modal.closeButtonRight,
  },
});