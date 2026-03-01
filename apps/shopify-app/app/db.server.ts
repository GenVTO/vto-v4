import { KVSessionStorage } from "@shopify/shopify-app-session-storage-kv";
import type { Session } from "@shopify/shopify-api";
import type { SessionStorage } from "@shopify/shopify-app-session-storage";

// In-memory fallback used in local dev (Node.js / Vite mode without a real CF KV binding).
class MemorySessionStorage implements SessionStorage {
  private sessions = new Map<string, Session>();
  private shopIndex = new Map<string, Set<string>>();

  async storeSession(session: Session): Promise<boolean> {
    this.sessions.set(session.id, session);
    const set = this.shopIndex.get(session.shop) ?? new Set();
    set.add(session.id);
    this.shopIndex.set(session.shop, set);
    return true;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async deleteSession(id: string): Promise<boolean> {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.delete(id);
      this.shopIndex.get(session.shop)?.delete(id);
    }
    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    await Promise.all(ids.map((id) => this.deleteSession(id)));
    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    const ids = this.shopIndex.get(shop) ?? new Set<string>();
    return Array.from(ids)
      .map((id) => this.sessions.get(id))
      .filter(Boolean) as Session[];
  }
}

/**
 * Hybrid session storage:
 * - Uses Cloudflare KV in production / Wrangler preview (when `setNamespace` is called).
 * - Falls back to an in-memory Map for local Node.js / Vite dev mode.
 */
class HybridSessionStorage implements SessionStorage {
  private kv = new KVSessionStorage();
  private memory = new MemorySessionStorage();
  private useKV = false;

  setNamespace(namespace: KVNamespace): void {
    this.kv.setNamespace(namespace);
    this.useKV = true;
  }

  storeSession(session: Session) {
    return this.useKV
      ? this.kv.storeSession(session)
      : this.memory.storeSession(session);
  }
  loadSession(id: string) {
    return this.useKV
      ? this.kv.loadSession(id)
      : this.memory.loadSession(id);
  }
  deleteSession(id: string) {
    return this.useKV
      ? this.kv.deleteSession(id)
      : this.memory.deleteSession(id);
  }
  deleteSessions(ids: string[]) {
    return this.useKV
      ? this.kv.deleteSessions(ids)
      : this.memory.deleteSessions(ids);
  }
  findSessionsByShop(shop: string) {
    return this.useKV
      ? this.kv.findSessionsByShop(shop)
      : this.memory.findSessionsByShop(shop);
  }
}

// Session storage backed by Cloudflare KV in production.
// The KV namespace is injected at request time via sessionStorage.setNamespace(env.SESSION_KV)
// in entry.server.tsx. Falls back to in-memory for local dev (no CF KV binding available).
export const sessionStorage = new HybridSessionStorage();
