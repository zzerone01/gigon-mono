"use client";

import { useEffect, useRef, useState } from "react";

import type { Message } from "@/lib/domain";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "./icons";
import { Sheet } from "./ui";

/* ------------------------------ chat sheet ------------------------------ */

export function ChatSheet({
  matchId,
  meId,
  name,
  initialsLabel,
  sub,
  quicks,
  onClose,
}: {
  matchId: string;
  meId: string;
  name: string;
  initialsLabel: string;
  sub: string;
  quicks: string[];
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = supabaseBrowser();

  useEffect(() => {
    let alive = true;
    supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("id")
      .then(({ data }) => {
        if (alive && data) setMsgs(data);
      });
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMsgs((m) =>
            m.some((x) => x.id === (payload.new as Message).id)
              ? m
              : [...m, payload.new as Message],
          );
        },
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [matchId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [msgs]);

  const send = async (text: string) => {
    const body = text.trim();
    if (!body) return;
    setInput("");
    const { data } = await supabase.rpc("send_message", { p_match: matchId, p_body: body });
    // Optimistic append in case realtime lags
    if (data) {
      setMsgs((m) =>
        m.some((x) => x.id === data)
          ? m
          : [
              ...m,
              {
                id: data,
                match_id: matchId,
                sender_id: meId,
                body,
                created_at: new Date().toISOString(),
              },
            ],
      );
    }
  };

  return (
    <div className="fixed inset-0 z-44 flex flex-col justify-end md:inset-auto md:bottom-5 md:right-5 md:block">
      <button
        aria-label="Close"
        onClick={onClose}
        className="anim-fade absolute inset-0 cursor-pointer bg-[rgba(15,27,46,0.45)] md:hidden"
      />
      <div className="anim-sheet relative flex h-[78dvh] max-h-[640px] flex-col overflow-hidden rounded-t-[18px] bg-white shadow-[0_-12px_40px_rgba(15,27,46,0.25)] md:anim-modal md:h-[540px] md:w-[380px] md:rounded-[18px] md:shadow-[0_24px_64px_rgba(15,27,46,0.35)]">
        <div className="flex shrink-0 items-center gap-2.5 bg-royal px-4 py-3">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-xs font-bold text-white">
            {initialsLabel}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold leading-tight text-white">{name}</div>
            <div className="text-[10.5px] text-navy-muted">
              {sub} · in-app only, no numbers shared
            </div>
          </div>
          <button
            aria-label="Close chat"
            onClick={onClose}
            className="flex size-[34px] items-center justify-center rounded-full bg-white/12 text-white"
          >
            <Icon name="chevronDown" size={15} strokeWidth={2.2} />
          </button>
        </div>
        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-[7px] overflow-y-auto bg-bg-soft p-3.5"
        >
          <span className="self-center rounded-full bg-tint px-3 py-1 text-[10.5px] text-ink-muted">
            Matched · in-app chat only, no numbers shared
          </span>
          {msgs.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-[13px] px-3 py-[9px] text-[13px] leading-snug ${
                    mine ? "bg-royal text-white" : "border border-line bg-white text-ink"
                  }`}
                >
                  {m.body}
                  <div
                    className={`mt-0.5 text-right text-[9px] ${mine ? "text-navy-muted" : "text-ink-muted"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString("en-PH", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex shrink-0 gap-[5px] overflow-x-auto px-3 pb-[3px] pt-2">
          {quicks.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="h-[30px] shrink-0 whitespace-nowrap rounded-full bg-tint px-3 text-[11.5px] font-medium text-royal-dark"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-[7px] px-3 pb-3.5 pt-[7px]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Message…"
            className="h-[42px] min-w-0 flex-1 rounded-[10px] border border-line px-[13px] text-[13px] outline-none focus:border-royal"
          />
          <button
            aria-label="Send"
            onClick={() => send(input)}
            className="flex size-[42px] shrink-0 items-center justify-center rounded-[10px] bg-royal text-white hover:bg-royal-dark"
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ rate sheet ------------------------------ */

export function RateSheet({
  forName,
  paySub,
  tags,
  placeholder,
  onSubmit,
  onClose,
}: {
  forName: string;
  paySub: string;
  tags: string[];
  placeholder: string;
  onSubmit: (stars: number, tags: string[], comment: string) => Promise<void>;
  onClose: () => void;
}) {
  const [stars, setStars] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const can = stars > 0 && !busy;

  return (
    <Sheet onClose={onClose} z={45}>
      <div className="flex flex-col items-center gap-3 rounded-t-[18px] p-5 pt-3.5">
        <div className="h-1 w-10 rounded-full bg-line" />
        <span className="anim-pop flex size-12 items-center justify-center rounded-full bg-success">
          <Icon name="check" size={25} color="#fff" strokeWidth={2.6} />
        </span>
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="font-display text-xl font-bold tracking-tight">Gig complete!</h2>
          <p className="text-xs text-slate">{paySub}</p>
          <span className="rounded-full border border-success-border bg-success-bg px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.1em] text-success">
            COMPLETED · PIN VERIFIED
          </span>
        </div>
        <span className="text-[12.5px] font-semibold">How was {forName}?</span>
        <div className="flex gap-[5px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              aria-label={`${i} stars`}
              onClick={() => setStars(i)}
              className="flex size-[42px] items-center justify-center"
            >
              <Icon name="star" size={31} fill={i <= stars ? "#F5A623" : "#E2E7EF"} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {tags.map((t) => {
            const on = !!selected[t];
            return (
              <button
                key={t}
                onClick={() => setSelected((s) => ({ ...s, [t]: !s[t] }))}
                className={`h-[31px] rounded-full border px-3 text-[11.5px] font-medium ${
                  on ? "border-royal bg-tint text-royal-dark" : "border-line bg-white text-slate"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={placeholder}
          className="min-h-14 w-full resize-none rounded-[11px] border border-line px-3 py-2.5 text-[12.5px] leading-normal outline-none focus:border-royal"
        />
        <button
          disabled={!can}
          onClick={async () => {
            setBusy(true);
            await onSubmit(
              stars,
              Object.keys(selected).filter((k) => selected[k]),
              comment,
            );
            setBusy(false);
          }}
          className={`h-12 w-full rounded-[10px] text-sm font-semibold ${
            can ? "bg-amber text-ink hover:bg-[#E99B16]" : "bg-line text-ink-muted"
          }`}
        >
          {busy ? "Posting…" : "Post review"}
        </button>
      </div>
    </Sheet>
  );
}
