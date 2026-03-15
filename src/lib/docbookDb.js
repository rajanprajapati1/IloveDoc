import Dexie from "dexie";

class DocBookDB extends Dexie {
  constructor() {
    super("docbook-indexeddb");
    this.version(1).stores({
      notes: "id, updatedAt, createdAt",
      images: "id, noteId, createdAt",
      meta: "key",
    });
    this.version(3).stores({
      notes: "id, updatedAt, createdAt, deletedAt",
      images: "id, noteId, createdAt",
      stickyNotes: "id, noteId, createdAt",
      meta: "key",
    });
  }
}

export const docbookDb = new DocBookDB();

