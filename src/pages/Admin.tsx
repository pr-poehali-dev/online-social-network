import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Icon from "@/components/ui/icon";

interface VerifyRequest {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<VerifyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/");
      return;
    }
    loadRequests();
  }, [user]);

  const loadRequests = async () => {
    try {
      const data = await api.getVerificationRequests();
      setRequests(data.requests);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const review = async (requestId: string, action: "approve" | "reject") => {
    try {
      await api.reviewVerification(requestId, action);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Icon name="Shield" size={20} className="text-primary" />
        <h1 className="text-lg font-bold">Админ-панель</h1>
      </div>

      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wider">
          Заявки на верификацию
        </h2>
        <p className="text-xs text-muted-foreground mb-3">{requests.length} ожидающих</p>
      </div>

      {requests.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <Icon name="CheckCircle" size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Все заявки рассмотрены</p>
        </div>
      )}

      {requests.map((r) => (
        <div key={r.id} className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Link to={`/profile/${r.username}`}>
              {r.avatar_url ? (
                <img src={r.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">{r.display_name[0]?.toUpperCase()}</span>
                </div>
              )}
            </Link>
            <div>
              <Link to={`/profile/${r.username}`} className="font-semibold text-sm hover:underline">
                {r.display_name}
              </Link>
              <p className="text-xs text-muted-foreground">@{r.username}</p>
            </div>
            <p className="text-[10px] text-muted-foreground ml-auto">
              {new Date(r.created_at).toLocaleDateString("ru")}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 mb-3">
            <p className="text-sm">{r.reason}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => review(r.id, "approve")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              <Icon name="Check" size={16} />
              Одобрить
            </button>
            <button
              onClick={() => review(r.id, "reject")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-destructive text-destructive rounded-lg text-sm font-medium hover:bg-destructive/10"
            >
              <Icon name="X" size={16} />
              Отклонить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
