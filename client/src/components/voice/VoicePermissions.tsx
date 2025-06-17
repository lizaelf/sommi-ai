import { useState, useCallback } from "react";
import {
  getMicrophonePermission,
  requestMicrophonePermission,
  shouldSkipPermissionPrompt,
  syncMicrophonePermissionWithBrowser,
} from "@/utils/microphonePermissions";

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface VoicePermissionsHook {
  permissionState: PermissionState;
  checkPermission: () => Promise<PermissionState>;
  requestPermission: () => Promise<PermissionState>;
  syncWithBrowser: () => Promise<void>;
  shouldSkipPrompt: () => boolean;
}

export const useVoicePermissions = (): VoicePermissionsHook => {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');

  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    try {
      const permission = await getMicrophonePermission();
      const state = permission === 'granted' ? 'granted' : 
                   permission === 'denied' ? 'denied' : 
                   permission === 'prompt' ? 'prompt' : 'unknown';
      setPermissionState(state);
      return state;
    } catch (error) {
      console.error('Permission check failed:', error);
      setPermissionState('unknown');
      return 'unknown';
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    try {
      const permission = await requestMicrophonePermission();
      const state = permission ? 'granted' : 'denied';
      setPermissionState(state);
      return state;
    } catch (error) {
      console.error('Permission request failed:', error);
      setPermissionState('denied');
      return 'denied';
    }
  }, []);

  const syncWithBrowser = useCallback(async (): Promise<void> => {
    try {
      await syncMicrophonePermissionWithBrowser();
      await checkPermission();
    } catch (error) {
      console.error('Browser sync failed:', error);
    }
  }, [checkPermission]);

  const shouldSkipPrompt = useCallback((): boolean => {
    return shouldSkipPermissionPrompt();
  }, []);

  return {
    permissionState,
    checkPermission,
    requestPermission,
    syncWithBrowser,
    shouldSkipPrompt
  };
};