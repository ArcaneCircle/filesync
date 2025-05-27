import { useState } from "react";

import { FileManager } from "~/lib/filemanager";
import { Peer } from "@webxdc/realtime";

import FileItem from "~/components/FileItem";

export default function App() {
  const [peers, setPeers] = useState<Peer<State>[]>([]);
  let [files, setFiles] = useState<FileMeta[]>([]);
  const [manager] = useState(() => {
    const manager = new FileManager(setPeers, setFiles);
    manager.start();
    return manager;
  });

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    for (const file of event.target.files) {
      manager.importFile(file);
    }
  };

  return (
    <>
      <div>Peers: {peers.length}</div>
      <div>Files: {files.length}</div>
      <p>
        <input type="file" multiple={true} onChange={onFile} />
      </p>
      <div>
        {files.map((f) => (
          <FileItem file={f} manager={manager} />
        ))}
      </div>
    </>
  );
}
