import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import Icon from "@/components/ui/icon";

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  post_id: string | null;
  from_username: string;
  from_display_name: string;
  from_avatar_url: string;
  from_is_verified: boolean;
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getNotifications();
        setNotifs(data.notifications);
        await api.markNotificationsRead();
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const iconForType = (type: string) => {
    switch (type) {
      case "like": return "Heart";
      case "comment": return "MessageCircle";
      case "verification": return "BadgeCheck";
      default: return "Bell";
    }
  };

  const colorForType = (type: string) => {
    switch (type) {
      case "like": return "text-red-500";
      case "comment": return "text-blue-500";
      case "verification": return "text-primary";
      default: return "text-muted-foreground";
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
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold">Уведомления</h1>
      </div>
      {notifs.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <Icon name="BellOff" size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Нет уведомлений</p>
        </div>
      )}
      {notifs.map((n) => (
        <div
          key={n.id}
          className={`flex items-start gap-3 p-4 border-b border-border ${!n.is_read ? "bg-primary/5" : ""}`}
        >
          <div className={`mt-0.5 ${colorForType(n.type)}`}>
            <Icon name={iconForType(n.type)} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {n.from_username && (
                <Link to={`/profile/${n.from_username}`} className="font-semibold text-sm hover:underline">
                  {n.from_display_name}
                </Link>
              )}
              {n.from_is_verified && <Icon name="BadgeCheck" size={12} className="text-primary" />}
            </div>
            <p className="text-sm text-muted-foreground">{n.message}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(n.created_at).toLocaleString("ru")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
