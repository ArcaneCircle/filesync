import { useMemo } from "react";

import { FileManager } from "~/lib/filemanager";
import FileItem from "~/components/FileItem";

interface Props {
  files: FileMeta[];
  manager: FileManager;
}

export default function FileList({ manager, files }: Props) {
  const items = files.map((f) =>
    useMemo(
      () => <FileItem key={f.id} file={f} manager={manager} />,
      [f.id, f.lastModified, f.pending.length],
    ),
  );
  //console.log("FILE LIST RERENDERED");
  return (
    <div style={{ paddingBottom: "8em" }}>
      {files.length ? (
        items
      ) : (
        <p style={{ textAlign: "center", fontSize: "1.5em", color: "#737373" }}>
          No files imported.
          <br /> Use the "+" button to add files.
        </p>
      )}
    </div>
  );
}
