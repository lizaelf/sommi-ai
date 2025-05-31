// Utility functions for managing microphone permissions via cookies

const MICROPHONE_PERMISSION_COOKIE = 'mic_permission_granted';
const COOKIE_EXPIRY_DAYS = 30;

export interface MicrophonePermissionState {
  granted: boolean;
  timestamp: number;
}

// Set cookie with expiration
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Get cookie value
function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Save microphone permission to cookie
export function saveMicrophonePermission(granted: boolean): void {
  const permissionState: MicrophonePermissionState = {
    granted,
    timestamp: Date.now()
  };
  
  setCookie(MICROPHONE_PERMISSION_COOKIE, JSON.stringify(permissionState), COOKIE_EXPIRY_DAYS);
  console.log(`Microphone permission ${granted ? 'granted' : 'denied'} saved to cookie`);
}

// Check if microphone permission was previously granted
export function getMicrophonePermission(): MicrophonePermissionState | null {
  const cookieValue = getCookie(MICROPHONE_PERMISSION_COOKIE);
  
  if (!cookieValue) {
    return null;
  }
  
  try {
    const permissionState: MicrophonePermissionState = JSON.parse(cookieValue);
    
    // Check if permission is still valid (within 30 days)
    const daysSinceGranted = (Date.now() - permissionState.timestamp) / (1000 * 60 * 60 * 24);
    
    if (daysSinceGranted > COOKIE_EXPIRY_DAYS) {
      console.log('Microphone permission cookie expired, removing');
      clearMicrophonePermission();
      return null;
    }
    
    return permissionState;
  } catch (error) {
    console.error('Error parsing microphone permission cookie:', error);
    clearMicrophonePermission();
    return null;
  }
}

// Clear microphone permission cookie
export function clearMicrophonePermission(): void {
  document.cookie = `${MICROPHONE_PERMISSION_COOKIE}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
  console.log('Microphone permission cookie cleared');
}

// Check browser permission status and update cookie accordingly
export async function syncMicrophonePermissionWithBrowser(): Promise<boolean> {
  try {
    if ('permissions' in navigator) {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permission.state === 'granted') {
        saveMicrophonePermission(true);
        return true;
      } else if (permission.state === 'denied') {
        saveMicrophonePermission(false);
        return false;
      }
    }
    
    // Fallback: try to access microphone to check permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Immediately stop
      saveMicrophonePermission(true);
      return true;
    } catch (error) {
      saveMicrophonePermission(false);
      return false;
    }
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return false;
  }
}

// Request microphone permission and save to cookie
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      } 
    });
    
    // Permission granted
    saveMicrophonePermission(true);
    
    // Return the stream for immediate use
    (window as any).currentMicrophoneStream = stream;
    
    console.log('Microphone permission granted and saved');
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    saveMicrophonePermission(false);
    return false;
  }
}

// Check if we should skip permission prompt based on saved permission
export function shouldSkipPermissionPrompt(): boolean {
  const savedPermission = getMicrophonePermission();
  return savedPermission?.granted === true;
}