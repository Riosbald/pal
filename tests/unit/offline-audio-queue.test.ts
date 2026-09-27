import { describe, expect, it } from "vitest";
import { OfflineAudioQueue, type AudioQueueStore, type QueuedAudioChunk } from "@/services/mobile/offline-audio-queue";

class MemoryQueue implements AudioQueueStore {
  private readonly chunks = new Map<string, QueuedAudioChunk>();
  async list() { return [...this.chunks.values()]; }
  async put(chunk: QueuedAudioChunk) { this.chunks.set(chunk.id, chunk); }
  async remove(id: string) { this.chunks.delete(id); }
}

const chunk = (id: string, sequence: number) => ({
  id,
  sessionId: "session_1",
  workspaceId: "workspace_1",
  sequence,
  audioData: "AA==",
});

describe("OfflineAudioQueue", () => {
  it("validates and enqueues audio chunks", async () => {
    const queue = new OfflineAudioQueue(new MemoryQueue());
    const stored = await queue.enqueue(chunk("chunk_1", 0));
    expect(stored.attempts).toBe(0);
    expect(stored.sequence).toBe(0);
  });

  it("drains in sequence order and removes acknowledged chunks", async () => {
    const store = new MemoryQueue();
    const queue = new OfflineAudioQueue(store);
    await queue.enqueue(chunk("chunk_2", 1));
    await queue.enqueue(chunk("chunk_1", 0));
    const sent: number[] = [];

    const result = await queue.drain(async (item) => { sent.push(item.sequence); });
    expect(sent).toEqual([0, 1]);
    expect(result).toEqual({ sent: 2, retained: 0 });
    expect(await store.list()).toHaveLength(0);
  });

  it("retains failed chunks and increments attempts", async () => {
    const store = new MemoryQueue();
    const queue = new OfflineAudioQueue(store);
    await queue.enqueue(chunk("chunk_1", 0));

    const result = await queue.drain(async () => { throw new Error("offline"); });
    expect(result).toEqual({ sent: 0, retained: 1 });
    expect((await store.list())[0]?.attempts).toBe(1);
  });
});
