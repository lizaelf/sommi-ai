/**
 * Typography system
 * This file defines typography styles based on the provided design system:
 *
 * H1: font-size 24px, line-height 32px, font-family: 'Lora', font-weight: 500
 * Button+1: font-size 16px, line-height: 16px, font-family: 'Inter', font-weight: 500, vertical trim
 * Body+1: font-size 16px, line-height: 24px, font-family: 'Inter', font-weight: 400
 * Body: font-size 16px, line-height: 24px, font-family: 'Inter', font-weight: 400
 * Button: font-size 14px, line-height: 16px, font-family: 'Inter', font-weight: 400, vertical trim
 * Body-1M: font-size 13px, line-height: 16px, font-family: 'Inter', font-weight: 500
 * Body-1R: font-size 13px, line-height: 16px, font-family: 'Inter', font-weight: 400
 * Num: font-size 13px, line-height: 16px, font-family: 'Inter', font-weight: 600
 */

const typography = {
  // H1 Heading styles using Lora font (section header standard)
  h1: {
    fontSize: "32px",
    lineHeight: "40px",
    fontFamily: "Lora, serif",
    fontWeight: "700", // Bold weight
  },
  
  // H1 Alternative (smaller heading)
  h1Small: {
    fontSize: "24px",
    lineHeight: "32px",
    fontFamily: "Lora, serif",
    fontWeight: "500", // Medium weight
  },

  // H2 heading style using Inter font
  h2: {
    fontSize: "20px",
    lineHeight: "28px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "500", // Medium weight
  },

  // Button styles using Inter font
  buttonPlus1: {
    fontSize: "16px",
    lineHeight: "16px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "500", // Medium weight
    verticalAlign: "middle",
  },

  button: {
    fontSize: "14px",
    lineHeight: "16px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "500", // Medium weight
    verticalAlign: "middle",
  },

  // Body text styles using Inter font
  body: {
    fontSize: "16px",
    lineHeight: "24px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "400", // Regular weight
  },

  // Special body styles with modifiers for medium and regular weights
  body1M: {
    fontSize: "13px",
    lineHeight: "16px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "500", // Medium weight
  },

  body1R: {
    fontSize: "13px",
    lineHeight: "16px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "400", // Regular weight
  },

  // Numeric text style
  num: {
    fontSize: "13px",
    lineHeight: "16px",
    fontFamily: "Inter, sans-serif",
    fontWeight: "600", // Semi-bold weight
  },
};

export default typography;
