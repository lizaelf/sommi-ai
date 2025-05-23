// Typography system
// This file defines the typography styles used throughout the application

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
  }
};

export default typography;