export const API = "http://localhost:8080";

export async function parseApiBody(res) {
  const raw = await res.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function extractApiErrorMessage(payload, fallback = "Erreur") {
  if (!payload) return fallback;

  if (typeof payload === "string") {
    return payload.trim() || fallback;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (first && typeof first.defaultMessage === "string" && first.defaultMessage.trim()) return first.defaultMessage.trim();
    if (first && typeof first.message === "string" && first.message.trim()) return first.message.trim();
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail.trim();
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return fallback;
}

export async function apiGet(path, token) {
  const res = await fetch(API + path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseApiBody(res);
  if (!res.ok) throw new Error(extractApiErrorMessage(data));
  return data;
}

export async function apiPut(path, token, body) {
  const res = await fetch(API + path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseApiBody(res);
  if (!res.ok) throw new Error(extractApiErrorMessage(data));
  return data;
}

export async function apiPost(path, token, body) {
  const res = await fetch(API + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await parseApiBody(res);
  if (!res.ok) throw new Error(extractApiErrorMessage(data));
  return data;
}
