export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading';

export interface ToastOptions {
  title?: string;
  description?: string;
  status?: ToastType;
  duration?: number;
  isClosable?: boolean;
}

// Overloads to support both string and options calls
// eslint-disable-next-line no-unused-vars
export function toast(message: string, type?: ToastType): void;
// eslint-disable-next-line no-unused-vars
export function toast(options: ToastOptions): void;

// Implementation
export function toast(arg1: string | ToastOptions, arg2?: ToastType): void {
  // Minimal, non-blocking toast stand-in. Replace with your UI toast lib.
  if (typeof window === 'undefined') return;

  if (typeof arg1 === 'string') {
    const type = (arg2 || 'info').toUpperCase();
    console.log(`[${type}]`, arg1);
    return;
  }

  const { title, description, status } = arg1;
  const prefix = status ? `[${status}] ` : '';
  const msg = [title, description].filter(Boolean).join(' - ');
  console.log(`${prefix}${msg || 'Notification'}`);
}

export default toast;
