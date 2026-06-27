type Listener = (event: SessionEvent) => void;

export type SessionEvent = {
  type:
    | "transcript.created"
    | "important_item.candidate"
    | "important_item.updated"
    | "important_item.sent"
    | "confirmation.created"
    | "call.sent"
    | "session.updated"
    | "session.ended";
  sessionId: string;
  data: unknown;
};

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(sessionId: string, listener: Listener): () => void {
    if (!this.listeners.has(sessionId)) {
      this.listeners.set(sessionId, new Set());
    }
    this.listeners.get(sessionId)!.add(listener);

    return () => {
      const set = this.listeners.get(sessionId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) this.listeners.delete(sessionId);
      }
    };
  }

  emit(event: SessionEvent) {
    const set = this.listeners.get(event.sessionId);
    if (set) {
      for (const listener of set) {
        listener(event);
      }
    }
  }
}

export const eventBus = new EventBus();
