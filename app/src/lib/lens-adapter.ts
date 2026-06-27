export type LensMessage = {
  mode: "caption" | "important" | "call" | "confirm";
  title?: string;
  body: string;
  priority: "normal" | "high" | "urgent";
  actions?: string[];
};

export interface LensDisplayAdapter {
  send(message: LensMessage): Promise<void>;
  clear(): Promise<void>;
}

export class MockLensAdapter implements LensDisplayAdapter {
  private listeners: ((msg: LensMessage | null) => void)[] = [];

  onMessage(listener: (msg: LensMessage | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async send(message: LensMessage): Promise<void> {
    this.listeners.forEach((l) => l(message));
  }

  async clear(): Promise<void> {
    this.listeners.forEach((l) => l(null));
  }
}
