import { TypeormStore } from "connect-typeorm";
import { Store } from "express-session";
import { AppDataSource } from "../config/data-source";
import { AppSession } from "../entities/AppSession";

/**
 * A Proxy store that waits for the TypeORM Data Source to be initialized
 * before attempting to access the repository.
 * This prevents the "Repository not found" error during startup on Vercel.
 */
class LazyTypeormStore extends Store {
  private innerStore: TypeormStore | null = null;

  private getStore(): TypeormStore {
    if (!this.innerStore) {
      if (!AppDataSource.isInitialized) {
        console.warn("[Session Store] Database not initialized. Waiting...");
        throw new Error("Database not initialized yet. Lazy session store cannot be accessed.");
      }
      
      try {
        console.log("[Session Store] Initializing TypeormStore with AppSession repository...");
        const repository = AppDataSource.getRepository(AppSession);
        this.innerStore = new TypeormStore({
          cleanupLimit: 2,
          ttl: 86400,
        }).connect(repository);
        console.log("[Session Store] TypeormStore connected successfully.");
      } catch (error) {
        console.error("[Session Store] Failed to connect TypeormStore:", error);
        throw error;
      }
    }
    return this.innerStore;
  }

  public get = (sid: string, callback: (err: any, session?: any) => void) => {
    try {
      this.getStore().get(sid, (err, session) => {
        if (err) console.error(`[Session Store] Error getting session ${sid}:`, err);
        else if (!session) console.log(`[Session Store] Session ${sid} not found.`);
        else console.log(`[Session Store] Session ${sid} retrieved successfully (User: ${session.userId || 'None'}).`);
        callback(err, session);
      });
    } catch (e) {
      callback(e);
    }
  };

  public set = (sid: string, session: any, callback?: (err?: any) => void) => {
    try {
      console.log(`[Session Store] Saving session ${sid} (User: ${session.userId || 'None'})...`);
      this.getStore().set(sid, session, (err) => {
        if (err) console.error(`[Session Store] Error saving session ${sid}:`, err);
        else console.log(`[Session Store] Session ${sid} saved successfully.`);
        if (callback) callback(err);
      });
    } catch (e) {
      if (callback) callback(e);
    }
  };

  public destroy = (sid: string, callback?: (err?: any) => void) => {
    try {
      this.getStore().destroy(sid, callback);
    } catch (e) {
      if (callback) callback(e);
    }
  };
  
  // Implement other required methods for a Store if necessary
  public touch = (sid: string, session: any, callback?: (err?: any) => void) => {
      try {
          this.getStore().touch(sid, session, callback);
      } catch (e) {
          if (callback) callback(e);
      }
  }
}

const instance = new LazyTypeormStore();
export const getSessionStore = () => instance;
