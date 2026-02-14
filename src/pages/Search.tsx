import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import Icon from "@/components/ui/icon";

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_verified: boolean;
  is_admin: boolean;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [showVerifyBot, setShowVerifyBot] = useState(false);
  const [verifyReason, setVerifyReason] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [verifyMsg, setVerifyMsg] = useState("");

  const search = async () => {
    if (!query.trim()) return;
    try {
      const data = await api.searchUsers(query.trim());
      setResults(data.users);
      setSearched(true);
    } catch (e) {
      console.error(e);
    }
  };

  const submitVerification = async () => {
    if (!verifyReason.trim()) return;
    setVerifyStatus("loading");
    try {
      await api.requestVerification(verifyReason.trim());
      setVerifyStatus("success");
      setVerifyMsg("Заявка отправлена! Админ рассмотрит её в ближайшее время.");
    } catch (err: unknown) {
      setVerifyStatus("error");
      setVerifyMsg(err instanceof Error ? err.message : "Ошибка");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск пользователей по username..."
            className="flex-1 bg-secondary rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary text-foreground"
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button
            onClick={search}
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Icon name="Search" size={18} />
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowVerifyBot(!showVerifyBot)}
        className="w-full flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon name="BadgeCheck" size={20} className="text-primary" />
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">Verified Bot</span>
            <Icon name="BadgeCheck" size={14} className="text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">Подать заявку на верификацию</p>
        </div>
        <Icon name={showVerifyBot ? "ChevronUp" : "ChevronDown"} size={18} className="ml-auto text-muted-foreground" />
      </button>

      {showVerifyBot && (
        <div className="p-4 border-b border-border bg-secondary/30 animate-fade-in">
          <p className="text-sm mb-3 text-muted-foreground">
            Расскажите, почему вы хотите получить верификацию. Админ рассмотрит вашу заявку.
          </p>
          {verifyStatus === "success" ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary">
              {verifyMsg}
            </div>
          ) : (
            <>
              <textarea
                value={verifyReason}
                onChange={(e) => setVerifyReason(e.target.value)}
                placeholder="Причина верификации..."
                rows={3}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-1 ring-primary mb-2 text-foreground"
              />
              {verifyStatus === "error" && (
                <p className="text-sm text-destructive mb-2">{verifyMsg}</p>
              )}
              <button
                onClick={submitVerification}
                disabled={verifyStatus === "loading"}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {verifyStatus === "loading" ? "Отправка..." : "Отправить заявку"}
              </button>
            </>
          )}
        </div>
      )}

      <div>
        {searched && results.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Никого не найдено</p>
          </div>
        )}
        {results.map((u) => (
          <Link
            key={u.id}
            to={`/profile/${u.username}`}
            className="flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/50 transition-colors"
          >
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{u.display_name[0]?.toUpperCase()}</span>
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{u.display_name}</span>
                {u.is_verified && <Icon name="BadgeCheck" size={14} className="text-primary" />}
                {u.is_admin && <Icon name="Shield" size={14} className="text-yellow-500" />}
              </div>
              <p className="text-xs text-muted-foreground">@{u.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
