"use client";

import { useEffect, useRef, useCallback } from "react";

type PollData = {
  transcriptEntries: unknown[];
  confirmationActions: unknown[];
  importantItems: unknown[];
  status: string;
};

type PollHandlers = {
  onTranscripts?: (items: unknown[]) => void;
  onConfirmations?: (items: unknown[]) => void;
  onImportantItems?: (items: unknown[]) => void;
  onSessionEnded?: () => void;
};

export function useSessionPolling(
  sessionId: string | null,
  handlers: PollHandlers,
  intervalMs = 2000
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const knownTranscriptIds = useRef(new Set<string>());
  const knownConfirmationIds = useRef(new Set<string>());
  const knownItemIds = useRef(new Set<string>());
  const sessionEnded = useRef(false);

  const reset = useCallback(() => {
    knownTranscriptIds.current.clear();
    knownConfirmationIds.current.clear();
    knownItemIds.current.clear();
    sessionEnded.current = false;
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    reset();

    let active = true;

    async function poll() {
      if (!active || !sessionId) return;

      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) return;

        const data: PollData = await res.json();

        const transcripts = (data.transcriptEntries || []) as { id: string }[];
        const newTranscripts = transcripts.filter(
          (t) => !knownTranscriptIds.current.has(t.id)
        );
        if (newTranscripts.length > 0) {
          for (const t of newTranscripts) knownTranscriptIds.current.add(t.id);
          handlersRef.current.onTranscripts?.(newTranscripts);
        }

        const confirmations = (data.confirmationActions || []) as { id: string }[];
        const newConfirmations = confirmations.filter(
          (c) => !knownConfirmationIds.current.has(c.id)
        );
        if (newConfirmations.length > 0) {
          for (const c of newConfirmations)
            knownConfirmationIds.current.add(c.id);
          handlersRef.current.onConfirmations?.(newConfirmations);
        }

        const items = (data.importantItems || []) as { id: string }[];
        const newItems = items.filter(
          (i) => !knownItemIds.current.has(i.id)
        );
        const updatedItems = items.filter(
          (i) => knownItemIds.current.has(i.id)
        );
        if (newItems.length > 0 || updatedItems.length > 0) {
          for (const i of items) knownItemIds.current.add(i.id);
          handlersRef.current.onImportantItems?.(items);
        }

        if (
          data.status === "ended" &&
          !sessionEnded.current
        ) {
          sessionEnded.current = true;
          handlersRef.current.onSessionEnded?.();
        }
      } catch {
        // network error, retry next interval
      }
    }

    poll();
    const timer = setInterval(poll, intervalMs);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [sessionId, intervalMs, reset]);

  return { reset };
}
