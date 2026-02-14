import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import PostCard, { type Post } from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async (p = 1) => {
    try {
      const data = await api.getPosts(p);
      if (p === 1) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    load(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {user && <CreatePost onCreated={() => load(1)} />}
      {!user && (
        <div className="p-4 border-b border-border bg-primary/5">
          <p className="text-sm text-muted-foreground text-center">
            Гостевой режим — вы видите ленту, но не можете лайкать и комментировать
          </p>
        </div>
      )}
      {posts.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg mb-1">Пока пусто</p>
          <p className="text-sm">Будьте первым, кто напишет пост!</p>
        </div>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdate={() => load(1)} />
      ))}
      {posts.length >= 20 && (
        <button
          onClick={loadMore}
          className="w-full py-3 text-sm text-primary hover:bg-primary/5 transition-colors"
        >
          Загрузить ещё
        </button>
      )}
    </div>
  );
}
