import throttle from "lodash/throttle";
import shuffle from "lodash/shuffle";
import { RealTime, Peer } from "@webxdc/realtime";
import { db } from "~/lib/storage";

const CHUNK_SIZE = 1204 * 1024 * 1;
type SetFilesCallback = (files: FileMeta[]) => void;

export class FileManager {
  private realtime: RealTime<State, Payload>;
  private setFiles: SetFilesCallback;
  private request: PeerRequest | null;

  constructor(
    setPeers: (peers: Peer<State>[]) => void,
    setFiles: SetFilesCallback,
  ) {
    this.request = null;
    const throttledSetFiles = throttle(setFiles, 400);
    this.setFiles = (files: FileMeta[]) => {
      this.realtime.setState({ files });
      throttledSetFiles(
        files
          .filter((file) => file.size >= 0)
          .sort((a, b) => b.lastModified - a.lastModified),
      );
    };
    const throttledSetPeers = throttle(setPeers, 400);
    const onPeersChanged = async (peers: Peer<State>[]) => {
      //console.log("peers changed");
      const req = this.request;
      if (req && !peers.find((p) => p.id === req.peer)) this.request = null;
      await this.syncFileList(peers);
      throttledSetPeers(peers);
    };
    const onPayload = async (_deviceId: string, payload: Payload) => {
      await this.processPayload(payload);
    };
    this.realtime = new RealTime({
      onPeersChanged,
      onPayload,
    });
  }

  async start() {
    this.setFiles(await db.files.toArray());
    this.realtime.connect();
    window.addEventListener("beforeunload", () => this.realtime.disconnect());
    setTimeout(() => this.syncChunks(), 100);
  }

  async deleteFile(id: string) {
    await db.transaction("rw", db.files, db.chunks, async () => {
      await db.chunks.where("file").equals(id).delete();
      await db.files.put({
        id,
        pending: [],
        name: "",
        lastModified: Date.now(),
        size: -1,
        type: "",
      });
    });
    this.setFiles(await db.files.toArray());
  }

  async exportFile(meta: FileMeta) {
    const chunks = await db.chunks.where("file").equals(meta.id).sortBy("id");
    const blobs = [];
    for (const chunk of chunks) {
      blobs.push(chunk.blob);
    }
    window.webxdc.sendToChat({
      file: {
        name: meta.name,
        blob: new Blob(blobs),
      },
    });
  }

  async importFile(file: File) {
    await db.transaction("rw", db.files, db.chunks, async () => {
      const id = getRandomUUID();
      await db.files.add({
        id,
        pending: [],
        name: file.name,
        lastModified: file.lastModified || Date.now(),
        size: file.size,
        type: file.type,
      });
      for (let i = 0; i < Math.ceil(file.size / CHUNK_SIZE); i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        await db.chunks.add({
          file: id,
          id: i,
          blob: file.slice(start, end),
        });
      }
    });
    this.setFiles(await db.files.toArray());
  }

  getDownloadProgress(file: FileMeta): number {
    const total = Math.ceil(file.size / CHUNK_SIZE);
    const done = total - file.pending.length;
    return Math.floor((done / total) * 100);
  }

  private async processPayload(payload: Payload) {
    if ("request" in payload) {
      const req = payload.request;
      //console.log("RECEIVED request", req);
      if (req.peer === this.realtime.getDeviceId()) {
        const file = await db.files.where("id").equals(req.file).first();
        if (file) {
          const chunk = await db.chunks
            .where({ file: req.file, id: req.chunk })
            .first();
          if (chunk) {
            this.sendResponse(file.lastModified, chunk);
          }
        }
      }
    } else if ("response" in payload) {
      const res = payload.response;
      //console.log("RECEIVED response", res);
      const files = this.realtime.getState()?.files || [];
      const file = files.find((f: FileMeta) => f.id === res.file);
      if (
        file &&
        file.lastModified === res.lastModified &&
        file.pending.indexOf(res.chunk) >= 0
      ) {
        await db.transaction("rw", db.files, db.chunks, async () => {
          file.pending = file.pending.filter((c: number) => c !== res.chunk);
          await db.files.put(file);
          await db.chunks.put({
            file: res.file,
            id: res.chunk,
            blob: new Blob([res.data]),
          });
        });
        const req = this.request;
        if (req && req.file === res.file && req.chunk === res.chunk) {
          this.request = null;
        }
        this.setFiles(await db.files.toArray());
      }
    } else {
      console.error("unexpected payload", payload);
    }
  }

  private async sendResponse(lastModified: number, chunk: Chunk) {
    const response = {
      file: chunk.file,
      lastModified,
      chunk: chunk.id,
      data: await blobToUint8Array(chunk.blob),
    };
    //console.log("SENT response", response);
    this.realtime.sendPayload({ response });
  }

  private async sendRequest(request: PeerRequest) {
    //console.log("SENT request", request);
    this.request = request;
    this.realtime.sendPayload({ request });
  }

  private async createRequest(
    meta: FileMeta,
    chunkId: number,
  ): Promise<PeerRequest | null> {
    for (const peer of shuffle(this.realtime.getPeers())) {
      const file = peer.state.files.find((f: FileMeta) => f.id === meta.id);
      if (
        file &&
        file.lastModified === meta.lastModified &&
        file.pending.indexOf(chunkId) < 0
      ) {
        return {
          time: Date.now(),
          file: meta.id,
          chunk: chunkId,
          peer: peer.id,
        };
      }
    }
    return null;
  }

  private async syncChunks() {
    if (!this.request || Date.now() - this.request.time > 10000) {
      let request = null;
      const files = this.realtime.getState()?.files || [];
      for (const file of files) {
        if (file.pending.length > 0) {
          for (const chunkId of shuffle(file.pending)) {
            request = await this.createRequest(file, chunkId);
            if (request) break;
          }
        }
        if (request) {
          await this.sendRequest(request);
          break;
        }
      }
    }
    setTimeout(() => this.syncChunks(), this.request ? 10 : 100);
  }

  private async syncFileList(peers: Peer<State>[]) {
    const files = this.realtime.getState()?.files || [];
    let changed = false;
    for (const peer of peers) {
      for (let file of peer.state.files) {
        const myFile = files.find((f: FileMeta) => f.id === file.id);
        if (!myFile) {
          // doesn't exist, insert
          file = { ...file, pending: [] };
          for (let i = 0; i < Math.ceil(file.size / CHUNK_SIZE); i++) {
            file.pending.push(i);
          }
          await db.files.add(file);

          files.push(file);
          changed = true;
        } else if (myFile.lastModified < file.lastModified) {
          // update, drop outdated chunks
          file = { ...file, pending: [] };
          if (file.size > 0) {
            for (let i = 0; i < Math.ceil(file.size / CHUNK_SIZE); i++) {
              file.pending.push(i);
            }
          }
          await db.transaction("rw", db.files, db.chunks, async () => {
            await db.files.put(file);
            await db.chunks.where("file").equals(file.id).delete();
          });
          myFile.name = file.name;
          myFile.pending = file.pending;
          myFile.lastModified = file.lastModified;
          myFile.size = file.size;
          myFile.type = file.type;
          changed = true;
        }
      }
    }
    if (changed) this.setFiles(files);
  }
}

function getRandomUUID(): string {
  try {
    return crypto.randomUUID();
  } catch (ex) {
    const s4 = () => {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    };
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, _reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}
