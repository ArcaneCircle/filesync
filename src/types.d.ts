declare type Payload =
  | {
      request: PeerRequest;
    }
  | {
      response: PeerResponse;
    };

declare interface PeerRequest {
  time: number;
  file: string;
  chunk: number;
  peer: string;
}

declare interface PeerResponse {
  file: string;
  lastModified: number;
  chunk: number;
  data: Uint8Array;
}

declare interface FileMeta {
  id: string;
  pending: number[];
  name: string;
  lastModified: number;
  size: number;
  type: string;
}

declare interface Chunk {
  file: string;
  id: number;
  blob: Blob;
}

declare interface State {
  files: FileMeta[];
}
