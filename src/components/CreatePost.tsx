import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Icon from "@/components/ui/icon";

export default function CreatePost({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await api.uploadImage(reader.result as string);
        setImageUrl(data.url);
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!content.trim() && !imageUrl) return;
    setSending(true);
    try {
      await api.createPost(content.trim(), imageUrl || undefined);
      setContent("");
      setImageUrl("");
      onCreated?.();
    } catch (err) {
      console.error(err);
    }
    setSending(false);
  };

  return (
    <div className="border-b border-border p-4">
      <div className="flex gap-3">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">{user.display_name[0]?.toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Что нового?"
            rows={3}
            className="w-full bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground"
          />
          {imageUrl && (
            <div className="relative mb-2">
              <img src={imageUrl} alt="" className="rounded-xl max-h-48 w-full object-cover" />
              <button
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Icon name={uploading ? "Loader2" : "Image"} size={20} className={uploading ? "animate-spin" : ""} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            <button
              onClick={submit}
              disabled={sending || (!content.trim() && !imageUrl)}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {sending ? "..." : "Опубликовать"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
