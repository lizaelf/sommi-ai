/**
 * Color System - Wine Exploration Platform
 * This file defines all colors used throughout the application
 * Organized by category for easy maintenance and consistency
 */

const colors = {
  // Primary Application Colors
  background: {
    primary: "#0A0A0A",        // Main app background (black)
    secondary: "#1C1C1C",      // Secondary backgrounds, input areas
    card: "transparent",       // Card backgrounds
  },

  // Text Colors
  text: {
    primary: "#FFFFFF",        // Primary text (white)
    secondary: "#DBDBDB",      // Assistant messages, secondary text
    tertiary: "#999999",         // Rating labels, subtle text
    muted: "rgba(255, 255, 255, 0.6)",  // Placeholder text, muted content
    disabled: "rgba(255, 255, 255, 0.8)", // Disabled states
    error: "#FF4444",          // Error messages
  },

  // User Interface Elements
  user: {
    messageBg: "#DBDBDB",      // User message bubbles
    messageText: "#000000",    // User message text (black on light bg)
  },

  // Interactive Elements
  interactive: {
    primary: "#6A53E7",        // Primary accent color (purple)
    hover: "rgba(255, 255, 255, 0.12)", // Hover states
    focus: "rgba(255, 255, 255, 0.16)",  // Focus/active states
    border: "rgba(255, 255, 255, 0.2)",  // Borders, dividers
    borderSubtle: "rgba(255, 255, 255, 0.1)", // Subtle borders
  },

  // Button Colors
  button: {
    // Secondary filled buttons
    secondaryBg: "rgba(255, 255, 255, 0.08)",
    secondaryBorder: "rgba(255, 255, 255, 0.2)",
    secondaryHover: "rgba(255, 255, 255, 0.12)",
    secondaryActive: "rgba(255, 255, 255, 0.16)",
    
    // Text colors
    primaryText: "#FFFFFF",
    secondaryText: "#FFFFFF",
    disabledText: "rgba(255, 255, 255, 0.5)",
  },

  // Form Elements
  form: {
    inputBg: "#1C1C1C",
    inputBorder: "rgba(255, 255, 255, 0.2)",
    inputText: "#FFFFFF",
    inputPlaceholder: "rgba(255, 255, 255, 0.6)",
    inputFocus: "rgba(255, 255, 255, 0.3)",
  },

  // Status Colors
  status: {
    success: "#22C55E",        // Success states
    warning: "#F59E0B",        // Warning states
    error: "#EF4444",          // Error states
    info: "#3B82F6",           // Info states
  },

  // Wine Rating Colors
  rating: {
    label: "#999999",          // Rating labels (VN, JD, WS, ABV)
    value: "#FFFFFF",          // Rating values
    valueMuted: "rgba(255, 255, 255, 0.7)", // Compact rating values
  },

  // Contact Form Colors
  contact: {
    headerText: "#FFFFFF",
    bodyText: "#CECECE",
    formBg: "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
    overlayBg: "rgba(0, 0, 0, 0.5)",
  },

  // Voice Assistant Colors
  voice: {
    processingText: "#6A53E7",  // Voice processing indicators
    statusText: "#FFFFFF",      // Voice status text
  },

  // Loading States
  loading: {
    spinner: "#FFFFFF",        // Loading spinner color
    text: "#999999",           // Loading text
    shimmer: "rgba(255, 255, 255, 0.1)", // Shimmer effects
  },

  // Shadows and Effects
  effects: {
    shadow: "rgba(0, 0, 0, 0.2)",      // Box shadows
    shadowStrong: "rgba(0, 0, 0, 0.3)", // Strong shadows
    blur: "blur(8px)",                  // Backdrop blur effects
    blurStrong: "blur(20px)",           // Strong blur effects
  },

  // Gradients
  gradients: {
    contactSheet: "linear-gradient(174deg, rgba(28, 28, 28, 0.85) 4.05%, #1C1C1C 96.33%)",
    wineGlow: "radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)",
  },

  // Transparency Levels
  alpha: {
    low: "0.1",               // 10% opacity
    medium: "0.2",            // 20% opacity
    high: "0.5",              // 50% opacity
    veryHigh: "0.8",          // 80% opacity
  },
};

export default colors;

// Helper functions for commonly used color combinations
export const getTextOnBackground = (isDark = true) => 
  isDark ? colors.text.primary : colors.user.messageText;

export const getButtonColors = (variant: 'primary' | 'secondary' = 'secondary') => ({
  backgroundColor: variant === 'primary' ? colors.interactive.primary : colors.button.secondaryBg,
  borderColor: variant === 'primary' ? colors.interactive.primary : colors.button.secondaryBorder,
  color: variant === 'primary' ? colors.button.primaryText : colors.button.secondaryText,
});

export const getInteractiveStates = () => ({
  hover: colors.interactive.hover,
  focus: colors.interactive.focus,
  active: colors.interactive.focus,
});

export const getFormColors = () => ({
  background: colors.form.inputBg,
  border: colors.form.inputBorder,
  text: colors.form.inputText,
  placeholder: colors.form.inputPlaceholder,
  focus: colors.form.inputFocus,
});