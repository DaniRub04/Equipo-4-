import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("daniel@test.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      await api.login({ email, password });
      nav("/dashboard");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: 20 }}>
      <h1>Concesionaria Autos</h1>
      <p>API: {import.meta.env.VITE_API_URL}</p>

      <h2>Login</h2>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {msg && <p style={{ color: "tomato" }}>❌ {msg}</p>}
      </form>
    </div>
  );
}
