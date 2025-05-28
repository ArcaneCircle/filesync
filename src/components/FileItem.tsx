import { useMemo } from "react";

import MageFileFill from "~icons/mage/file-fill";
import MageDownload from "~icons/mage/download";
import MageTrash2Fill from "~icons/mage/trash-2-fill";

import { FileManager } from "~/lib/filemanager";
import { formatDateShort, formatBytes } from "~/lib/util";

interface Props {
  file: FileMeta;
  manager: FileManager;
}

export default function FileItem({ manager, file }: Props) {
  const percentage = manager.getDownloadProgress(file);
  const containerStyle = {
    display: "flex",
    flexDirection: "row" as "row",
    flexWrap: "nowrap" as "nowrap",
    alignItems: "stretch",
    gap: "1em",
  };
  const fileIconStyle = {
    color: percentage === 100 ? "#1E90FF" : "#737373",
    width: "2em",
    height: "auto",
    flexShrink: "0",
  };
  const rightStyle = {
    display: "flex",
    justifyContent: "space-between",
    flexGrow: "1",
    borderBottom: "1px solid #e0e0e0",
    padding: "1em 1em 1em 0",
    overflow: "hidden",
  };
  const metaStyle = {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "0.3em",
    overflow: "hidden",
  };
  const fileNameStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    textWrap: "nowrap" as "nowrap",
    whiteSpace: "nowrap",
    color: percentage === 100 ? undefined : "#737373",
  };
  const iconsStyle = {
    alignContent: "center",
    flexShrink: "0",
    marginLeft: "0.5em",
  };
  const btnStyle = {
    color: "white",
    border: "none",
    borderRadius: "5px",
  };

  const shareBtn = useMemo(() => {
    const style = {
      ...btnStyle,
      marginRight: "1em",
      background: "#32CD32",
    };
    return (
      <button style={style} onClick={() => manager.exportFile(file)}>
        <MageDownload style={{ fontSize: "2em" }} />
      </button>
    );
  }, [file.id]);

  const deleteBtn = useMemo(
    () => (
      <button
        style={{ ...btnStyle, background: "#da342f" }}
        onClick={() => manager.deleteFile(file.id)}
      >
        <MageTrash2Fill style={{ fontSize: "2em" }} />
      </button>
    ),
    [file.id],
  );

  //console.log(`[${file.id}] FILE ITEM RERENDERED`);
  return (
    <div style={containerStyle}>
      <MageFileFill style={fileIconStyle} />
      <div style={rightStyle}>
        <div style={metaStyle}>
          <strong style={fileNameStyle}>{file.name}</strong>
          <small style={{ color: "#737373" }}>
            {percentage === 100 ? "" : percentage + "% - "}{" "}
            {formatDateShort(file.lastModified)}, {formatBytes(file.size)}
          </small>
        </div>
        <div style={iconsStyle}>
          {!file.pending.length && shareBtn}
          {deleteBtn}
        </div>
      </div>
    </div>
  );
}
