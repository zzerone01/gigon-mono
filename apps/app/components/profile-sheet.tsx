"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { api } from "@/lib/api";
import { LANGUAGE_OPTIONS, SKILL_OPTIONS, initials, type Profile } from "@/lib/domain";
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
  const [languages, setLanguages] = useState<string[]>(profile.languages);
  const [bio, setBio] = useState(profile.bio);
  const [availability, setAvailability] = useState(profile.availability);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isWorker = profile.active_role === "worker";

  const save = async (patch: Record<string, unknown>) => {
    setError("");
    try {
      await api.post("/api/profile", patch);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Functional updates: rapid toggles must each build on the latest list,
  // or a stale closure drops the earlier change (last write wins server-side).
  const toggleLanguage = (lang: string) => {
    setLanguages((prev) => {
      const next = prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang];
      void save({ languages: next });
      return next;
    });
  };

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

  const toggleSkill = (skill: string) => {
    setSkills((prev) => {
      const next = prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill];
      void save({ skills: next });
      return next;
    });
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
          <>
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

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold">
                About you <span className="font-normal text-ink-muted">(shown to businesses)</span>
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onBlur={() => {
                  if (bio !== profile.bio) void save({ bio });
                }}
                maxLength={200}
                placeholder="One or two sentences — e.g. hotel housekeeping for 3 years, fast and careful."
                className="min-h-[58px] resize-none rounded-[11px] border border-line px-3 py-2.5 text-[12.5px] leading-normal outline-none focus:border-royal"
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-[12.5px] font-semibold">Languages</span>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <Chip
                    key={lang}
                    label={lang}
                    active={languages.includes(lang)}
                    onClick={() => toggleLanguage(lang)}
                  />
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold">Usual availability</span>
              <input
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                onBlur={() => {
                  if (availability !== profile.availability) void save({ availability });
                }}
                maxLength={60}
                placeholder="e.g. Weekdays · 1 – 6 PM"
                className="h-10 rounded-[10px] border border-line px-3 text-[12.5px] outline-none focus:border-royal"
              />
            </label>
          </>
        )}

        {error && <p className="text-[12.5px] font-semibold text-red">{error}</p>}
      </div>
    </Sheet>
  );
}
