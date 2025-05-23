/**
 * Typography system
 * This file defines typography styles based on the provided design system:
 * 
 * H1: font-size 24px, line-height 32px, font-family: 'Lora'
 * Button+1: font-size 16px, line-height: auto, font-family: 'Inter'
 * Body+1: font-size 16px, line-height: 32px, font-family: 'Inter'
 * Body: font-size 16px, line-height: 24px, font-family: 'Inter'
 * Button: font-size 14px, line-height: auto, font-family: 'Inter'
 * Body-1M: font-size 12px, line-height: 32px, font-family: 'Inter'
 * Body-1R: font-size 12px, line-height: 32px, font-family: 'Inter'
 * Num: font-size 12px, line-height: 32px, font-family: 'Inter'
 */

const typography = {
  // Heading styles using Lora font
  h1: {
    fontSize: '24px',
    lineHeight: '32px',
    fontFamily: 'Lora, serif',
    fontWeight: '400'
  },
  
  // Button styles using Inter font
  buttonPlus1: {
    fontSize: '16px',
    lineHeight: 'normal',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '500'
  },
  
  button: {
    fontSize: '14px',
    lineHeight: 'normal',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '500'
  },
  
  // Body text styles using Inter font
  bodyPlus1: {
    fontSize: '16px',
    lineHeight: '32px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400'
  },
  
  body: {
    fontSize: '16px',
    lineHeight: '24px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400'
  },
  
  // Special body styles with modifiers for medium and regular weights
  body1M: {
    fontSize: '12px',
    lineHeight: '32px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '500' // Medium weight
  },
  
  body1R: {
    fontSize: '12px',
    lineHeight: '32px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400' // Regular weight
  },
  
  // Numeric text style
  num: {
    fontSize: '12px',
    lineHeight: '32px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: '400'
  },
  
  // Section header (for larger headers that need to be bigger than h1)
  sectionHeader: {
    fontSize: '32px',
    lineHeight: '40px',
    fontFamily: 'Lora, serif',
    fontWeight: '400'
  }
};

export default typography;