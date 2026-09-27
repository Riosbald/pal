import { z } from "zod";

export const QueuedAudioChunkSchema = z.object({
  id: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
  workspaceId: z.string().trim().min(1),
  sequence: z.number().int().nonnegative(),
  audioData: z.string().regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/, "audioData must be base64"),
  createdAt: z.string().datetime(),
  attempts: z.number().int().nonnegative(),
});

export type QueuedAudioChunk = z.infer<typeof QueuedAudioChunkSchema>;

export interface AudioQueueStore {
  list(): Promise<QueuedAudioChunk[]>;
  put(chunk: QueuedAudioChunk): Promise<void>;
  remove(id: string): Promise<void>;
}

/** A deterministic queue coordinator suitable for IndexedDB/SQLite adapters. */
export class OfflineAudioQueue {
  constructor(private readonly store: AudioQueueStore) {}

  async enqueue(input: Omit<QueuedAudioChunk, "createdAt" | "attempts"> & { createdAt?: string }): Promise<QueuedAudioChunk> {
    const chunk = QueuedAudioChunkSchema.parse({
      ...input,
      createdAt: input.createdAt ?? new Date().toISOString(),
      attempts: 0,
    });
    await this.store.put(chunk);
    return chunk;
  }

  async drain(send: (chunk: QueuedAudioChunk) => Promise<void>): Promise<{ sent: number; retained: number }> {
    const chunks = (await this.store.list()).sort((a, b) =>
      a.sessionId === b.sessionId ? a.sequence - b.sequence : a.createdAt.localeCompare(b.createdAt),
    );
    let sent = 0;

    for (const original of chunks) {
      const chunk = QueuedAudioChunkSchema.parse(original);
      try {
        await send(chunk);
        await this.store.remove(chunk.id);
        sent += 1;
      } catch {
        await this.store.put({ ...chunk, attempts: chunk.attempts + 1 });
      }
    }

    return { sent, retained: chunks.length - sent };
  }
}
