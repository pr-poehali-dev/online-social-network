import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Icon from "@/components/ui/icon";
import PostCard, { type Post } from "@/components/PostCard";

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  is_private: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  posts_count?: number;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [privateHidden, setPrivateHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isOwn = user && profile && user.id === profile.id;

  const load = async () => {
    if (!username) return;
    try {
      const data = await api.getProfile(username);
      setProfile(data.profile);
      setPosts(data.posts || []);
      setPrivateHidden(data.is_private_hidden || false);
      setEditName(data.profile.display_name);
      setEditBio(data.profile.bio);
      setEditPrivate(data.profile.is_private);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
  }, [username]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await api.uploadAvatar(reader.result as string);
        await api.updateProfile({ avatar_url: data.url });
        await refresh();
        load();
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    try {
      await api.updateProfile({
        display_name: editName,
        bio: editBio,
        is_private: editPrivate,
      });
      setEditing(false);
      await refresh();
      load();
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

  if (!profile) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Icon name="UserX" size={48} className="mx-auto mb-4 opacity-50" />
        <p>Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-4">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {profile.display_name[0]?.toUpperCase()}
                </span>
              </div>
            )}
            {isOwn && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5"
              >
                <Icon name={uploading ? "Loader2" : "Camera"} size={12} className={uploading ? "animate-spin" : ""} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold">{profile.display_name}</h1>
              {profile.is_verified && <Icon name="BadgeCheck" size={20} className="text-primary" />}
              {profile.is_admin && <Icon name="Shield" size={18} className="text-yellow-500" />}
            </div>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-sm mt-2 leading-relaxed">{profile.bio}</p>}
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span><strong className="text-foreground">{profile.posts_count || 0}</strong> постов</span>
            </div>
            {profile.is_private && !isOwn && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Icon name="Lock" size={14} />
                Приватный профиль
              </div>
            )}
          </div>
        </div>
        {isOwn && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="mt-4 w-full py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
          >
            Редактировать профиль
          </button>
        )}
        {isOwn && editing && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-primary text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Описание</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full bg-secondary rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-1 ring-primary text-foreground"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editPrivate}
                onChange={(e) => setEditPrivate(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-sm">Приватный профиль</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Сохранить
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>

      {privateHidden ? (
        <div className="py-20 text-center text-muted-foreground">
          <Icon name="Lock" size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Этот профиль приватный</p>
        </div>
      ) : (
        <>
          {posts.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-sm">Нет постов</p>
            </div>
          )}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </>
      )}
    </div>
  );
}
