import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Icon from "@/components/ui/icon";
import CommentsSection from "./CommentsSection";

interface Post {
  id: string;
  content: string;
  image_url: string;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_verified: boolean;
  likes_count: number;
  comments_count: number;
  liked: boolean;
}

export default function PostCard({ post, onUpdate }: { post: Post; onUpdate?: () => void }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);

  const handleLike = async () => {
    if (!user) return;
    try {
      const data = await api.toggleLike(post.id);
      setLiked(data.liked);
      setLikesCount(data.count);
    } catch (e) { console.error(e); }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "только что";
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч`;
    const days = Math.floor(hours / 24);
    return `${days} д`;
  };

  return (
    <div className="border-b border-border p-4 animate-fade-in">
      <div className="flex gap-3">
        <Link to={`/profile/${post.username}`} className="shrink-0">
          {post.avatar_url ? (
            <img src={post.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {post.display_name[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Link to={`/profile/${post.username}`} className="font-semibold text-sm hover:underline truncate">
              {post.display_name}
            </Link>
            {post.is_verified && (
              <Icon name="BadgeCheck" size={16} className="text-primary shrink-0" />
            )}
            <span className="text-muted-foreground text-xs">@{post.username}</span>
            <span className="text-muted-foreground text-xs ml-auto shrink-0">{timeAgo(post.created_at)}</span>
          </div>
          {post.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-2">{post.content}</p>
          )}
          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="rounded-xl max-h-80 w-full object-cover mb-2"
            />
          )}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
              } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Icon name={liked ? "Heart" : "Heart"} size={18} className={liked ? "fill-current" : ""} />
              {likesCount > 0 && <span>{likesCount}</span>}
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Icon name="MessageCircle" size={18} />
              {commentsCount > 0 && <span>{commentsCount}</span>}
            </button>
          </div>
        </div>
      </div>
      {showComments && (
        <div className="mt-3 ml-13 pl-4 border-l border-border">
          <CommentsSection
            postId={post.id}
            onCountChange={(c) => setCommentsCount(c)}
          />
        </div>
      )}
    </div>
  );
}

export type { Post };