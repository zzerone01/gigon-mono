"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { api } from "@/lib/api";
import { SKILL_OPTIONS, initials, type Profile } from "@/lib/domain";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "./icons";
import { Avatar, Chip, Sheet } from "./ui";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Edit sheet for the signed-in profile: photo + (workers) skill tags. */
export function ProfileSheet({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isWorker = profile.active_role === "worker";

  const close = () => {
    router.refresh();
    onClose();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo is too big — max 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const ext =
        file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${profile.id}/${Date.now()}.${ext}`;
      const supabase = supabaseBrowser();
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await api.post("/api/profile", { avatarUrl: data.publicUrl });
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  const removePhoto = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post("/api/profile", { avatarUrl: null });
      setAvatarUrl(null);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  const toggleSkill = async (skill: string) => {
    const next = skills.includes(skill) ? skills.filter((s) => s !== skill) : [...skills, skill];
    setSkills(next);
    setError("");
    try {
      await api.post("/api/profile", { skills: next });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Sheet onClose={close} maxHeight="80%" desktop="modal">
      <div className="flex shrink-0 items-center gap-2.5 px-5 pb-2.5 pt-3.5">
        <span className="flex-1 font-display text-[17px] font-semibold">Your profile</span>
        <button
          aria-label="Close"
          onClick={close}
          className="flex size-8 items-center justify-center rounded-full bg-tint-soft text-slate"
        >
          <Icon name="x" size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1">
        <div className="flex items-center gap-3.5">
          <Avatar name={initials(profile.full_name)} src={avatarUrl} size={64} />
          <div className="flex flex-col items-start gap-1.5">
            <span className="text-sm font-semibold">{profile.full_name}</span>
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold hover:bg-bg-soft disabled:opacity-60"
              >
                <Icon name="camera" size={13} />
                {busy ? "Saving…" : avatarUrl ? "Change photo" : "Add photo"}
              </button>
              {avatarUrl && (
                <button
                  onClick={removePhoto}
                  disabled={busy}
                  className="h-8 rounded-full px-2 text-xs text-ink-muted underline underline-offset-2 disabled:opacity-60"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <p className="-mt-2 text-[11px] leading-normal text-ink-muted">
          {isWorker
            ? "A clear photo of yourself helps businesses pick you — applications with a photo get chosen more."
            : "A photo or logo makes your postings look more trustworthy to workers."}
        </p>

        {isWorker && (
          <div className="flex flex-col gap-2">
            <span className="text-[12.5px] font-semibold">What work do you do?</span>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={skills.includes(s)}
                  onClick={() => void toggleSkill(s)}
                />
              ))}
            </div>
            <p className="text-[11px] leading-normal text-ink-muted">
              Shown on your applications instead of “General” — pick everything you can do.
            </p>
          </div>
        )}

        {error && <p className="text-[12.5px] font-semibold text-red">{error}</p>}
      </div>
    </Sheet>
  );
}
