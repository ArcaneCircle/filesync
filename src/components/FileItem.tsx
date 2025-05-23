import { FileManager } from "~/lib/filemanager";

interface Props {
  file: FileMeta;
  manager: FileManager;
}

export default function FileItem({ manager, file }: Props) {
  const ShareBtn = ({ file }: { file: FileMeta }) => (
    <button onClick={() => manager.exportFile(file)}>Share</button>
  );

  const DeleteBtn = ({ file }: { file: FileMeta }) => (
    <button onClick={() => manager.deleteFile(file.id)}>Delete</button>
  );

  const percentage = manager.getDownloadProgress(file);
  return (
    <div style={{ paddingBottom: "1em" }}>
      {percentage}% {file.name} - {formatBytes(file.size)}{" "}
      {!file.pending.length && <ShareBtn file={file} />}{" "}
      <DeleteBtn file={file} />
      <details>{JSON.stringify(file)}</details>
    </div>
  );
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024; // Define the base for conversion
  const dm = decimals < 0 ? 0 : decimals; // Ensure decimals is non-negative
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]; // Define size units

  const i = Math.floor(Math.log(bytes) / Math.log(k)); // Determine the index for the size unit
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]; // Format and return the result
}
