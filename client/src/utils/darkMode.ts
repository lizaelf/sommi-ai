// Helper to set dark mode across the application
export function enableDarkMode() {
  // Add dark class to the html element
  document.documentElement.classList.add('dark');
  
  // Store the preference
  localStorage.setItem('theme', 'dark');
}

// Helper to set light mode across the application
export function disableDarkMode() {
  // Remove dark class from the html element
  document.documentElement.classList.remove('dark');
  
  // Store the preference
  localStorage.setItem('theme', 'light');
}

// Helper to initialize mode based on stored preference or system preference
export function initializeTheme() {
  // First check localStorage
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    enableDarkMode();
    return true;
  } else if (savedTheme === 'light') {
    disableDarkMode();
    return false;
  } else {
    // If no saved preference, check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (prefersDark) {
      enableDarkMode();
      return true;
    } else {
      disableDarkMode();
      return false;
    }
  }
}