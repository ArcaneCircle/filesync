import Dexie, { type EntityTable } from "dexie";

export const db = new Dexie("appdb") as Dexie & {
  files: EntityTable<FileMeta, "id">;
  chunks: EntityTable<Chunk, "id">;
};
db.version(1).stores({ files: "id", chunks: "[file+id], pending" });
