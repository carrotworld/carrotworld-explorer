// Thin wrapper around fetch() for the /api/* endpoints in
// functions/api/[[path]].js. Every write is "fire and forget" from the
// UI's point of view — the app updates its own local state immediately
// (so it feels instant) and this just makes sure the change lands in D1
// too, so it's there next time anyone (or any device) loads /api/state.

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${options.method || "GET"} ${path} failed (${res.status}): ${body}`);
  }
  return res.json();
}

export const api = {
  fetchState: () => request("/state"),

  createStudent: (student) => request("/students", { method: "POST", body: JSON.stringify(student) }),
  updateStudent: (id, patch) => request(`/students/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteStudent: (id) => request(`/students/${id}`, { method: "DELETE" }),

  createProgram: (program) => request("/programs", { method: "POST", body: JSON.stringify(program) }),
  updateProgram: (id, patch) => request(`/programs/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProgram: (id) => request(`/programs/${id}`, { method: "DELETE" }),

  createAdventure: (adventure) => request("/adventures", { method: "POST", body: JSON.stringify(adventure) }),
  updateAdventure: (studentId, programId, patch) =>
    request(`/adventures/${studentId}/${programId}`, { method: "PATCH", body: JSON.stringify(patch) }),

  createSuggestion: (suggestion) => request("/suggestions", { method: "POST", body: JSON.stringify(suggestion) }),
  updateSuggestion: (id, patch) => request(`/suggestions/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
};

// Never let a background sync call crash the UI — log it and move on.
// The change already applied locally; it just may not have persisted to
// the server yet. Real retry/offline handling is a good next step once
// this is live.
export function sync(promise) {
  promise.catch((err) => console.warn("[sync]", err.message || err));
}
