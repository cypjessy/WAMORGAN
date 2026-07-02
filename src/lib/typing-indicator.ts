// ─── Typing Indicator Utility ────────────────────────────────────────────────
// Manages WhatsApp typing indicators via the Evolution API.

import { sendTypingIndicator } from './evolution';

const activeIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
const activeTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
const failureCounts: Map<string, number> = new Map();

const TYPING_INTERVAL_MS = 5000;
const MAX_DURATION_MS = 25000;
const MAX_FAILURES = 5;
const BACKOFF_BASE_MS = 2000;

/**
 * Start a continuous typing indicator for a user.
 * Refreshes every 5 seconds and auto-stops after 25 seconds.
 */
export async function startTypingIndicator(
  instanceName: string,
  phoneNumber: string
): Promise<void> {
  const key = `${instanceName}:${phoneNumber}`;

  // Don't start if already active
  if (activeIntervals.has(key)) return;

  const doSend = async (attempt: number = 0) => {
    try {
      await sendTypingIndicator(instanceName, phoneNumber, 'composing');
      // Reset failure count on success
      failureCounts.set(key, 0);
    } catch (err) {
      const failures = (failureCounts.get(key) || 0) + 1;
      failureCounts.set(key, failures);

      if (failures >= MAX_FAILURES) {
        stopTypingIndicator(instanceName, phoneNumber);
        return;
      }

      // Exponential backoff for retry
      const backoff = BACKOFF_BASE_MS * Math.pow(2, failures - 1);
      setTimeout(() => doSend(attempt + 1), backoff);
    }
  };

  // Send first typing indicator immediately
  doSend(0);

  // Refresh periodically
  const interval = setInterval(() => doSend(0), TYPING_INTERVAL_MS);
  activeIntervals.set(key, interval);

  // Auto-stop after max duration
  const timeout = setTimeout(() => {
    stopTypingIndicator(instanceName, phoneNumber);
  }, MAX_DURATION_MS);
  activeTimeouts.set(key, timeout);
}

/**
 * Stop a running typing indicator.
 */
export function stopTypingIndicator(
  instanceName: string,
  phoneNumber: string
): void {
  const key = `${instanceName}:${phoneNumber}`;

  const interval = activeIntervals.get(key);
  if (interval) {
    clearInterval(interval);
    activeIntervals.delete(key);
  }

  const timeout = activeTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    activeTimeouts.delete(key);
  }

  failureCounts.delete(key);

  // Send paused indicator
  sendTypingIndicator(instanceName, phoneNumber, 'paused').catch(() => {});
}

/**
 * Wrap an async operation with a typing indicator.
 * Automatically starts before the operation and stops after completion.
 */
export async function withTypingIndicator<T>(
  instanceName: string,
  phoneNumber: string,
  operation: () => Promise<T>
): Promise<T> {
  startTypingIndicator(instanceName, phoneNumber);
  try {
    return await operation();
  } finally {
    stopTypingIndicator(instanceName, phoneNumber);
  }
}
