import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="animate-fade-in">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold">Настройки</h1>
      </div>

      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Тема оформления</h2>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                theme === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: t.color }} />
              <div className="text-left">
                <p className="text-sm font-medium">{t.name}</p>
                {theme === t.id && <p className="text-[10px] text-primary">Активна</p>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {user && (
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium"
          >
            <Icon name="LogOut" size={18} />
            Выйти из аккаунта
          </button>
        </div>
      )}

      <div className="p-4 text-center text-muted-foreground">
        <p className="text-xs">Online v1.0</p>
      </div>
    </div>
  );
}
