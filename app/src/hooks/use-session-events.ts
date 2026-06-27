"use client";

import { useEffect, useRef, useCallback } from "react";

type EventHandler = (data: unknown) => void;

export function useSessionEvents(
  sessionId: string | null,
  handlers: Record<string, EventHandler>
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (!sessionId) return undefined;

    const eventSource = new EventSource(`/api/sessions/${sessionId}/events`);

    const eventTypes = [
      "transcript.created",
      "important_item.candidate",
      "important_item.updated",
      "important_item.sent",
      "confirmation.created",
      "call.sent",
      "session.updated",
      "session.ended",
    ];

    for (const type of eventTypes) {
      eventSource.addEventListener(type, (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          handlersRef.current[type]?.(data);
        } catch {
          // ignore parse errors
        }
      });
    }

    eventSource.onerror = () => {
      eventSource.close();
      setTimeout(() => connect(), 3000);
    };

    return eventSource;
  }, [sessionId]);

  useEffect(() => {
    const es = connect();
    return () => es?.close();
  }, [connect]);
}
