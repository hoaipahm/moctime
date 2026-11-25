import {
  defaultPreferences,
  type Entry,
  type Preferences,
  type Snapshot,
} from "./domain";
const databaseName = "moc-personal-v1";
let connection: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  if (!connection)
    connection = new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("entries", { keyPath: "id" });
        request.result.createObjectStore("settings");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        connection = undefined;
        reject(request.error);
      };
      request.onblocked = () => reject(new Error("blocked"));
    });
  return connection;
}
async function transaction<T>(
  stores: string[],
  mode: IDBTransactionMode,
  action: (tx: IDBTransaction) => IDBRequest<T>,
): Promise<T> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(stores, mode);
    const request = action(tx);
    let result: T;
    request.onsuccess = () => {
      result = request.result;
    };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("aborted"));
  });
}
export async function loadData(): Promise<Snapshot> {
  const [entries, prefs] = await Promise.all([
    transaction<Entry[]>(["entries"], "readonly", (tx) =>
      tx.objectStore("entries").getAll(),
    ),
    transaction<Preferences | undefined>(["settings"], "readonly", (tx) =>
      tx.objectStore("settings").get("preferences"),
    ),
  ]);
  return {
    version: 1,
    entries,
    preferences: { ...defaultPreferences, ...prefs },
  };
}
export async function putEntry(entry: Entry) {
  await transaction(["entries"], "readwrite", (tx) =>
    tx.objectStore("entries").put(entry),
  );
}
export async function removeEntry(id: string) {
  await transaction(["entries"], "readwrite", (tx) =>
    tx.objectStore("entries").delete(id),
  );
}
export async function putPreferences(prefs: Preferences) {
  await transaction(["settings"], "readwrite", (tx) =>
    tx.objectStore("settings").put(prefs, "preferences"),
  );
}
export async function replaceData(snapshot: Snapshot) {
  await transaction(["entries", "settings"], "readwrite", (tx) => {
    const store = tx.objectStore("entries");
    store.clear();
    for (const entry of snapshot.entries) store.put(entry);
    return tx.objectStore("settings").put(snapshot.preferences, "preferences");
  });
}
