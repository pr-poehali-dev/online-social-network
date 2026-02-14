const API_URL = "https://functions.poehali.dev/b7718255-548b-407a-93b1-b45fbdaa3ab6";

function getToken(): string | null {
  return localStorage.getItem("online_token");
}

export function setToken(token: string) {
  localStorage.setItem("online_token", token);
}

export function clearToken() {
  localStorage.removeItem("online_token");
}

async function request(route: string, method = "GET", body?: unknown, extraParams?: Record<string, string>) {
  const params = new URLSearchParams({ route });
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}?${params}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request("/auth/register", "POST", { username, email, password }),
  login: (email: string, password: string) =>
    request("/auth/login", "POST", { email, password }),
  me: () => request("/auth/me"),
  getPosts: (page = 1) => request("/posts", "GET", undefined, { page: String(page) }),
  createPost: (content: string, image_url?: string) =>
    request("/posts", "POST", { content, image_url }),
  toggleLike: (post_id: string) => request("/likes", "POST", { post_id }),
  getComments: (post_id: string) =>
    request("/comments", "GET", undefined, { post_id }),
  addComment: (post_id: string, content: string, parent_id?: string) =>
    request("/comments", "POST", { post_id, content, parent_id }),
  getProfile: (username: string) =>
    request("/profile", "GET", undefined, { username }),
  updateProfile: (data: { display_name?: string; bio?: string; is_private?: boolean; avatar_url?: string }) =>
    request("/profile/update", "POST", data),
  searchUsers: (q: string) => request("/search", "GET", undefined, { q }),
  requestVerification: (reason: string) =>
    request("/verification/request", "POST", { reason }),
  getVerificationRequests: () => request("/verification/list"),
  reviewVerification: (request_id: string, action: "approve" | "reject") =>
    request("/verification/review", "POST", { request_id, action }),
  getNotifications: () => request("/notifications"),
  markNotificationsRead: () => request("/notifications/read", "POST"),
  uploadAvatar: (image: string) => request("/upload/avatar", "POST", { image }),
  uploadImage: (image: string) => request("/upload/image", "POST", { image }),
};

export default api;
