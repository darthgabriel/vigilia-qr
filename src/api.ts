import type { AppState, Topic } from "../shared/types";

async function request<T>(path: string, init?: RequestInit & { pin?: string }): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (init?.pin) headers["x-admin-pin"] = init.pin;
  const res = await fetch(`/api${path}`, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error(String(data.error ?? `http_${res.status}`)) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export type RegisterResponse = AppState & { existing: boolean };

export const api = {
  state: () => request<AppState>("/sorteo"),
  register: (name: string) =>
    request<RegisterResponse>("/register", { method: "POST", body: JSON.stringify({ name }) }),
  manage: (action: "status" | "reset", pin: string) =>
    request<{ ok?: boolean }>("/manage/sorteo", { method: "POST", pin, body: JSON.stringify({ action }) }),
  topics: () => request<{ topics: Topic[] }>("/topics"),
  addTopic: (title: string, pin: string) =>
    request<Topic>("/topics", { method: "POST", pin, body: JSON.stringify({ title }) }),
  renameTopic: (id: string, title: string, pin: string) =>
    request<Topic>(`/topics/${id}`, { method: "PUT", pin, body: JSON.stringify({ title }) }),
  deleteTopic: (id: string, pin: string) =>
    request<{ id: string }>(`/topics/${id}`, { method: "DELETE", pin }),
  reorderTopics: (order: string[], pin: string) =>
    request<{ ok: boolean }>("/topics/order", { method: "PUT", pin, body: JSON.stringify({ order }) }),
};
