type EventKey<T extends object> = Extract<keyof T, string>;
type EventHandler<T> = (payload: T) => void;

export class EventBus<T extends object> {
  private listeners = new Map<EventKey<T>, Set<EventHandler<T[keyof T]>>>();

  on<K extends EventKey<T>>(event: K, handler: EventHandler<T[K]>): () => void {
    const bucket =
      this.listeners.get(event) ?? new Set<EventHandler<T[keyof T]>>();
    bucket.add(handler as EventHandler<T[keyof T]>);
    this.listeners.set(event, bucket);

    return () => {
      bucket.delete(handler as EventHandler<T[keyof T]>);
      if (bucket.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<K extends EventKey<T>>(event: K, payload: T[K]): void {
    const bucket = this.listeners.get(event);
    if (!bucket) {
      return;
    }

    bucket.forEach((handler) => {
      handler(payload);
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}
