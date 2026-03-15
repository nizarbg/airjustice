export const API = "http://localhost:8080";

export async function apiGet(path, token) {
  const res = await fetch(API + path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur");
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur");
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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Erreur");
  return data;
}
