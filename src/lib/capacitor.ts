/**
 * Capacitor utility — safe wrappers around native plugins with web fallbacks.
 * All functions gracefully handle being called from a browser (no crash).
 */

// ─── Platform detection ───────────────────────────────────────────────

export const isNative = (): boolean =>
  typeof window !== 'undefined' &&
  !!(window as any).Capacitor?.isNativePlatform;

export const isWeb = (): boolean => !isNative();

// ─── Biometric Auth (native) / stub (web) ─────────────────────────────

let biometricAvailable = false;

export async function initBiometricAuth(): Promise<void> {
  if (!isNative()) return;
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    biometricAvailable = result.isAvailable;
  } catch {
    biometricAvailable = false;
  }
}

export function isBiometricAvailable(): boolean {
  return biometricAvailable;
}

/**
 * Prompt the user for biometric authentication (fingerprint / face).
 * Resolves `true` if the user authenticated, `false` otherwise.
 */
export async function authenticateWithBiometrics(
  reason = 'Log in to your account',
): Promise<boolean> {
  if (!isNative()) {
    // Web fallback — simulate
    return new Promise(resolve => setTimeout(() => resolve(true), 500));
  }
  try {
    const { BiometricAuth, BiometryError, BiometryErrorType } =
      await import('@aparajita/capacitor-biometric-auth');

    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
      androidTitle: 'Biometric Login',
      androidSubtitle: 'Use your fingerprint or face to sign in',
      androidConfirmationRequired: false,
    });
    return true;
  } catch (error: any) {
    // User cancelled — not an error
    if (
      error?.code === 'userCancel' ||
      error?.code === 'systemCancel' ||
      error?.code === 'appCancel'
    ) {
      return false;
    }
    console.warn('Biometric auth failed:', error?.message ?? error);
    return false;
  }
}

// ─── Haptics (native) / no-op (web) ──────────────────────────────────

const impactStyleMap: Record<string, any> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

export async function hapticsImpact(
  style: 'light' | 'medium' | 'heavy' = 'medium',
): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const key = impactStyleMap[style] as keyof typeof ImpactStyle;
    await Haptics.impact({ style: ImpactStyle[key] });
  } catch {
    // silently fail
  }
}

const notificationTypeMap: Record<string, any> = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
};

export async function hapticsSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    const key = notificationTypeMap.success as keyof typeof NotificationType;
    await Haptics.notification({ type: NotificationType[key] });
  } catch {}
}

export async function hapticsError(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    const key = notificationTypeMap.error as keyof typeof NotificationType;
    await Haptics.notification({ type: NotificationType[key] });
  } catch {}
}

// ─── Status Bar (native) / no-op (web) ───────────────────────────────

export async function setStatusBarStyle(style: 'dark' | 'light'): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: style === 'dark' ? '#0a0a0f' : '#ffffff' });
  } catch {}
}

// ─── Preferences (native) / localStorage fallback (web) ──────────────

export async function setPreference(key: string, value: string): Promise<void> {
  if (isNative()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value });
      return;
    } catch {}
  }
  // Web fallback
  localStorage.setItem(key, value);
}

export async function getPreference(key: string): Promise<string | null> {
  if (isNative()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value ?? null;
    } catch {}
  }
  return localStorage.getItem(key);
}

export async function removePreference(key: string): Promise<void> {
  if (isNative()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key });
      return;
    } catch {}
  }
  localStorage.removeItem(key);
}

// ─── Network (native) / browser fallback (web) ───────────────────────

export async function getNetworkStatus(): Promise<{ connected: boolean; connectionType?: string }> {
  if (isNative()) {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return { connected: status.connected, connectionType: status.connectionType };
    } catch {}
  }
  return { connected: navigator.onLine, connectionType: 'unknown' };
}

export function addNetworkListener(
  callback: (connected: boolean) => void,
): () => void {
  if (isNative()) {
    let remove: (() => void) | undefined;
    (async () => {
      try {
        const { Network } = await import('@capacitor/network');
        const handler = await Network.addListener('networkStatusChange', (status) => {
          callback(status.connected);
        });
        remove = () => handler.remove();
      } catch {}
    })();
    return () => remove?.();
  }
  // Web fallback
  const online = () => callback(true);
  const offline = () => callback(false);
  window.addEventListener('online', online);
  window.addEventListener('offline', offline);
  return () => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
  };
}

// ─── Share Sheet (native) / Web Share API fallback ───────────────────

export async function nativeShare(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share(data);
      return true;
    } catch {
      return false;
    }
  }
  // Web Share API fallback
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }
  // Fallback: copy URL to clipboard
  if (data.url) {
    try {
      await navigator.clipboard.writeText(data.url);
      return true;
    } catch {}
  }
  return false;
}

// ─── Filesystem (native) / Blob download fallback (web) ──────────────

export async function downloadFile(
  filename: string,
  data: string,
  mimeType = 'text/plain',
): Promise<string | null> {
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const result = await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Documents,
      });
      return result.uri;
    } catch (err) {
      console.warn('Filesystem write failed:', err);
      return null;
    }
  }
  // Web fallback: trigger download
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return url;
}

// ─── Push Notifications (native) / no-op (web) ───────────────────────

export type PushTokenCallback = (token: string) => void;

export async function requestPushPermissions(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.requestPermissions();
    return perm.receive === 'granted';
  } catch {
    return false;
  }
}

export async function registerForPushNotifications(
  onToken: PushTokenCallback,
): Promise<void> {
  if (!isNative()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.register();
    await PushNotifications.addListener('registration', (token: any) => {
      onToken(token.value);
    });
    await PushNotifications.addListener('registrationError', (err: any) => {
      console.warn('Push registration error:', err.error);
    });
  } catch {}
}

// ─── Splash Screen (native) / no-op (web) ────────────────────────────

export async function hideSplashScreen(): Promise<void> {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {}
}

// ─── Browser (native) / window.open fallback (web) ───────────────────

export async function openInAppBrowser(url: string): Promise<void> {
  if (isNative()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    } catch {}
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ─── App Lifecycle (native) / no-op (web) ────────────────────────────

export type AppStateCallback = (isActive: boolean) => void;

export async function addAppStateListener(callback: AppStateCallback): Promise<() => void> {
  if (isNative()) {
    try {
      const { App } = await import('@capacitor/app');
      const handler = await App.addListener('appStateChange', (state) => {
        callback(state.isActive);
      });
      return () => handler.remove();
    } catch {}
  }
  // Web fallback: visibility change
  const handler = () => callback(document.visibilityState === 'visible');
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

export async function handleBackButton(callback: () => void): Promise<() => void> {
  if (isNative()) {
    try {
      const { App } = await import('@capacitor/app');
      const handler = await App.addListener('backButton', () => {
        callback();
      });
      return () => { handler.remove(); };
    } catch {}
  }
  return () => {}; // no-op on web
}

// ─── Google Sign-In (native) / no-op (web) ───────────────────────────

export interface GoogleSignInResult {
  email: string;
  displayName: string;
  idToken: string;
  serverAuthCode?: string;
}

export async function signInWithGoogleNative(): Promise<GoogleSignInResult | null> {
  if (!isNative()) return null;
  try {
    const { GoogleSignIn } = await import('@capawesome/capacitor-google-sign-in');
    // Initialize with a webClientId — configure via NEXT_PUBLIC_GOOGLE_CLIENT_ID env var
    // See: https://capawesome.io/docs/sdks/capacitor/google-sign-in/
    const clientId = (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID) || '';
    if (clientId) {
      await GoogleSignIn.initialize({ clientId });
    }
    const result = await GoogleSignIn.signIn();
    return {
      email: result.email ?? '',
      displayName: result.displayName ?? '',
      idToken: result.idToken ?? '',
      serverAuthCode: result.serverAuthCode ?? undefined,
    };
  } catch (err) {
    console.warn('Google Sign-In failed:', err);
    return null;
  }
}

export async function signOutGoogleNative(): Promise<void> {
  if (!isNative()) return;
  try {
    const { GoogleSignIn } = await import('@capawesome/capacitor-google-sign-in');
    await GoogleSignIn.signOut();
  } catch {}
}

// ─── Camera (native) / file input fallback (web) ─────────────────────────

export async function pickFromGallery(): Promise<string | null> {
  if (isNative()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.pickImages({ quality: 90, limit: 1 });
      return image.photos?.[0]?.path ?? image.photos?.[0]?.webPath ?? null;
    } catch (err) {
      console.warn('Camera pick gallery failed:', err);
      return null;
    }
  }
  // Web fallback: hidden file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) resolve(URL.createObjectURL(file));
      else resolve(null);
    };
    input.click();
  });
}

export async function takePhoto(): Promise<string | null> {
  if (isNative()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: true,
      });
      return image.path ?? image.webPath ?? null;
    } catch (err) {
      console.warn('Camera take photo failed:', err);
      return null;
    }
  }
  return pickFromGallery(); // fallback to gallery on web
}

// ─── Clipboard (native) / navigator.clipboard fallback (web) ─────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  if (isNative()) {
    try {
      const { Clipboard } = await import('@capacitor/clipboard');
      await Clipboard.write({ string: text });
      return true;
    } catch {
      return false;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
