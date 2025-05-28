import MagePlus from "~icons/mage/plus";
import { useRef, useCallback } from "react";

import { FileManager } from "~/lib/filemanager";

const pickerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "fixed" as "fixed",
  bottom: "2em",
  right: "0.4em",
  background: "#1E90FF",
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "2em",
  height: "2em",
  fontSize: "2em",
  cursor: "pointer",
  boxShadow:
    "0 2px 2px 0 rgba(0,0,0,0.14),0 1px 5px 0 rgba(0,0,0,0.12),0 3px 1px -2px rgba(0,0,0,0.2)",
};

interface Props {
  manager: FileManager;
}

export default function FilePicker({ manager }: Props) {
  const inputFile = useRef<HTMLInputElement | null>(null);

  const onChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      for (const file of event.target.files) {
        await manager.importFile(file);
      }
      event.target.value = "";
    },
    [manager],
  );
  const onClick = useCallback(() => {
    inputFile.current?.click();
  }, [inputFile]);

  //console.log("FILE PICKER RERENDERED");
  return (
    <button onClick={onClick} style={pickerStyle}>
      <MagePlus style={{ verticalAlign: "middle" }} />
      <input
        type="file"
        multiple={true}
        onChange={onChange}
        ref={inputFile}
        style={{ display: "none" }}
      />
    </button>
  );
}
