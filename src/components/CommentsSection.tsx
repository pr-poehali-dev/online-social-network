import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Icon from "@/components/ui/icon";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_verified: boolean;
}

export default function CommentsSection({
  postId,
  onCountChange,
}: {
  postId: string;
  onCountChange?: (c: number) => void;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await api.getComments(postId);
      setComments(data.comments);
      onCountChange?.(data.comments.length);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [postId]);

  const submit = async () => {
    if (!text.trim()) return;
    try {
      await api.addComment(postId, text.trim(), replyTo || undefined);
      setText("");
      setReplyTo(null);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = (id: string) => comments.filter((c) => c.parent_id === id);

  const renderComment = (c: Comment, depth = 0) => (
    <div key={c.id} className={`py-2 ${depth > 0 ? "ml-6 border-l border-border pl-3" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Link to={`/profile/${c.username}`} className="font-medium text-xs hover:underline">
          {c.display_name}
        </Link>
        {c.is_verified && <Icon name="BadgeCheck" size={12} className="text-primary" />}
        <span className="text-muted-foreground text-[10px]">@{c.username}</span>
      </div>
      <p className="text-sm leading-relaxed">{c.content}</p>
      {user && (
        <button
          onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
          className="text-[11px] text-muted-foreground hover:text-primary mt-1"
        >
          Ответить
        </button>
      )}
      {replyTo === c.id && (
        <div className="flex gap-2 mt-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ваш ответ..."
            className="flex-1 bg-secondary text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 ring-primary text-foreground"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button onClick={submit} className="text-primary">
            <Icon name="Send" size={16} />
          </button>
        </div>
      )}
      {replies(c.id).map((r) => renderComment(r, depth + 1))}
    </div>
  );

  if (loading) {
    return <div className="py-4 text-center text-muted-foreground text-sm">Загрузка...</div>;
  }

  return (
    <div>
      {topLevel.map((c) => renderComment(c))}
      {comments.length === 0 && (
        <p className="text-muted-foreground text-sm py-2">Нет комментариев</p>
      )}
      {user && !replyTo && (
        <div className="flex gap-2 mt-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать комментарий..."
            className="flex-1 bg-secondary text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 ring-primary text-foreground"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button onClick={submit} className="text-primary p-2 hover:bg-secondary rounded-lg transition-colors">
            <Icon name="Send" size={16} />
          </button>
        </div>
      )}
      {!user && (
        <p className="text-muted-foreground text-xs py-2">Войдите, чтобы комментировать</p>
      )}
    </div>
  );
}
