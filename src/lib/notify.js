/**
 * Sends an email notification to the owner via the /api/notify serverless function.
 * Non-critical — silently fails if the endpoint is unavailable.
 */
export async function sendNotification(type, data) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data }),
    });
  } catch {
    /* notifications are non-critical */
  }
}