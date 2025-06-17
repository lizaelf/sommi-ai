// Microphone permission utilities

export const getMicrophonePermission = async (): Promise<boolean> => {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state === 'granted';
  } catch (error) {
    // Fallback for browsers that don't support permissions API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
};

export const shouldSkipPermissionPrompt = (): boolean => {
  // Skip permission prompts in certain environments or based on user preferences
  return localStorage.getItem('skipMicrophonePrompt') === 'true';
};

export const setSkipPermissionPrompt = (skip: boolean): void => {
  localStorage.setItem('skipMicrophonePrompt', skip.toString());
};