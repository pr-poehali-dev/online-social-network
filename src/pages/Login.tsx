import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Icon from "@/components/ui/icon";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Online</h1>
          <p className="text-muted-foreground text-sm">Войдите в аккаунт</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 ring-primary text-foreground"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-secondary rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 ring-primary text-foreground"
              placeholder="Минимум 6 символов"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Нет аккаунта?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Зарегистрироваться
          </Link>
        </p>
        <Link to="/" className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-4 hover:text-foreground">
          <Icon name="ArrowLeft" size={14} />
          Вернуться к ленте
        </Link>
      </div>
    </div>
  );
}
