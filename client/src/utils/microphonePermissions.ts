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
  console.log('🎤 PERMISSION DEBUG: Starting permission request');
  console.log('🎤 PERMISSION DEBUG: Environment details', {
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
    hasMediaDevices: !!navigator.mediaDevices,
    hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia
  });

  try {
    // Mobile-specific permission request with fallback options
    let audioConstraints;
    
    // Check if it's a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    console.log('🎤 PERMISSION DEBUG: Device type', { isMobile });
    
    if (isMobile) {
      console.log('🎤 PERMISSION DEBUG: Using mobile-optimized audio constraints');
      // Simplified constraints for mobile compatibility
      audioConstraints = { 
        audio: true 
      };
    } else {
      console.log('🎤 PERMISSION DEBUG: Using desktop audio constraints');
      // Desktop constraints with enhanced audio processing enabled for better input detection
      audioConstraints = { 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      };
    }
    
    console.log('🎤 PERMISSION DEBUG: Calling getUserMedia with constraints:', audioConstraints);
    const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    console.log('🎤 PERMISSION DEBUG: getUserMedia successful', {
      streamId: stream.id,
      audioTracks: stream.getAudioTracks().length
    });
    
    // Permission granted
    saveMicrophonePermission(true);
    
    // Store stream for immediate use
    (window as any).currentMicrophoneStream = stream;
    
    console.log('🎤 PERMISSION DEBUG: Permission granted and saved successfully');
    return true;
    
  } catch (error: any) {
    console.error('🎤 PERMISSION DEBUG: getUserMedia failed:', error);
    console.error('🎤 PERMISSION DEBUG: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type: typeof error
    });
    
    // Enhanced error handling for mobile devices
    if (error.name === 'NotAllowedError') {
      console.error('🎤 PERMISSION DEBUG: User denied microphone permission');
    } else if (error.name === 'NotFoundError') {
      console.error('🎤 PERMISSION DEBUG: No microphone found on device');
    } else if (error.name === 'NotReadableError') {
      console.error('🎤 PERMISSION DEBUG: Microphone is already in use');
    } else if (error.name === 'OverconstrainedError') {
      console.error('🎤 PERMISSION DEBUG: Microphone constraints not supported');
      
      // Fallback: try with basic audio constraints on mobile
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        try {
          console.log('Retrying with basic audio constraints...');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          saveMicrophonePermission(true);
          (window as any).currentMicrophoneStream = fallbackStream;
          console.log('Microphone permission granted with fallback constraints');
          return true;
        } catch (fallbackError) {
          console.error('Fallback microphone request also failed:', fallbackError);
        }
      }
    }
    
    saveMicrophonePermission(false);
    return false;
  }
}

// Check if we should skip permission prompt based on saved permission
export function shouldSkipPermissionPrompt(): boolean {
  const savedPermission = getMicrophonePermission();
  return savedPermission?.granted === true;
}