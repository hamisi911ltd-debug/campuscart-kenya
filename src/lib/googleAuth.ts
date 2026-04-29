// Google OAuth Configuration for Production
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

export interface GoogleAuthResponse {
  credential: string;
  select_by: string;
}

// Load Google Identity Services script
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Auth can only be initialized in browser'));
      return;
    }

    // Check if already loaded
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    // Check if script already exists
    const existingScript = document.getElementById('google-identity-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve();
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

// Initialize Google Identity Services
export const initializeGoogleAuth = async (): Promise<void> => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env.local file');
  }

  await loadGoogleScript();
  
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services not available');
  }
};

// Decode JWT token from Google
export const decodeGoogleJWT = (credential: string): GoogleUser | null => {
  try {
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as GoogleUser;
  } catch (error) {
    console.error('Failed to decode Google JWT:', error);
    return null;
  }
};

// Render Google Sign-In Button
export const renderGoogleButton = (
  element: HTMLElement,
  callback: (user: GoogleUser) => void,
  onError: (error: Error) => void
): void => {
  if (!window.google?.accounts?.id) {
    onError(new Error('Google Identity Services not loaded'));
    return;
  }

  if (!GOOGLE_CLIENT_ID) {
    onError(new Error('Google Client ID not configured'));
    return;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response: GoogleAuthResponse) => {
        const user = decodeGoogleJWT(response.credential);
        if (user) {
          callback(user);
        } else {
          onError(new Error('Failed to decode user data'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: element.offsetWidth,
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });
  } catch (error) {
    onError(error as Error);
  }
};

// Declare global types for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
          cancel: () => void;
        };
        oauth2?: {
          initTokenClient: (config: any) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}
