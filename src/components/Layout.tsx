import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Icon from "@/components/ui/icon";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: "Home", label: "Лента" },
    { path: "/search", icon: "Search", label: "Поиск", locked: !user },
    { path: "/notifications", icon: "Bell", label: "Уведомления", locked: !user },
    { path: user ? `/profile/${user.username}` : "/login", icon: "User", label: "Профиль", locked: !user },
    { path: "/settings", icon: "Settings", label: "Настройки" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <Link to="/" className="text-xl font-bold text-primary tracking-tight">
            Online
          </Link>
          {!user && (
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Войти
            </button>
          )}
          {user && (
            <div className="flex items-center gap-2">
              {user.is_admin && (
                <Link to="/admin" className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <Icon name="Shield" size={20} className="text-primary" />
                </Link>
              )}
              <Link to={`/profile/${user.username}`} className="flex items-center gap-2">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.display_name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.locked ? "/login" : item.path}
              className={`flex-1 flex flex-col items-center py-2 gap-1 transition-colors ${
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } ${item.locked ? "opacity-50" : ""}`}
            >
              <Icon name={item.icon} size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.locked && (
                <Icon name="Lock" size={10} className="absolute -mt-1 ml-4 text-muted-foreground" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
