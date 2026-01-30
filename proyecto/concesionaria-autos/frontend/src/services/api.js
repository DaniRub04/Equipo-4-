const API_URL = import.meta.env.VITE_API_URL;

function getToken() {
    return localStorage.getItem("token");
}

function setToken(token) {
    localStorage.setItem("token", token);
}

function clearToken() {
    localStorage.removeItem("token");
}

async function request(path, options = {}) {
    const token = getToken();

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        const msg = data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
    }

    return data;
}

export const api = {
    // salud
    health: () => request("/health"),

    // auth
    register: (payload) =>
        request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

    login: async (payload) => {
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        // AJUSTE: si tu backend devuelve { token } o { access_token }
        const token = data.token || data.access_token;
        if (!token) throw new Error("Login OK pero no llegó token");

        setToken(token);
        return data;
    },

    logout: () => clearToken(),

    // ruta protegida
    me: () => request("/profile/me"),
};
