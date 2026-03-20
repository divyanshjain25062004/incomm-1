// Global in-memory store — persists across requests within the same serverless instance
// Perfect for demos. Resets only on cold starts (rare during active sessions).

if (!global.__incomm_store) {
  global.__incomm_store = {
    workers: {},      // keyed by Employee ID
    last_sync: null,
  };
}

export const store = global.__incomm_store;
