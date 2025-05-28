import MageFolderFill from "~icons/mage/folder-fill";
import MageUsersFill from "~icons/mage/users-fill";

import { formatBytes } from "~/lib/util";

interface Props {
  fileCount: number;
  totalSize: number;
  peerCount: number;
}

export default function Footer({ peerCount, fileCount, totalSize }: Props) {
  const footerStyle = {
    display: "flex",
    flexDirection: "row" as "row",
    flexWrap: "nowrap" as "nowrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: "1em",
    position: "fixed" as "fixed",
    bottom: "0",
    width: "100%",
    margin: "0 0 0 -1em",
    background: "#f0f0f0",
  };
  const iconStyle = {
    color: "#737373",
    width: "1em",
    height: "auto",
    verticalAlign: "middle",
    paddingBottom: "0.2em",
  };

  //console.log("FOOTER RERENDERED");
  return (
    <div style={footerStyle}>
      <div style={{ padding: "0.5em 1em" }}>
        <MageFolderFill style={iconStyle} />{" "}
        <span>
          {fileCount} Files ({formatBytes(totalSize)})
        </span>
      </div>
      <div style={{ padding: "0.5em 1em" }}>
        <MageUsersFill style={iconStyle} /> <span>{peerCount} Online</span>
      </div>
    </div>
  );
}
