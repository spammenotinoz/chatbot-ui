import { FC, useState } from "react";
import { FileIcon } from "@/components/ui/file-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits";
import { getFileFromStorage } from "@/db/storage/files";
import { Tables } from "@/supabase/types";
import { SidebarItem } from "../all/sidebar-display-item";

interface FileItemProps {
  file: Tables<"files">;
}

export const FileItem: FC<FileItemProps> = ({ file }) => {
  const [name, setName] = useState(file.name);
  const [isTyping, setIsTyping] = useState(false);
  const [description, setDescription] = useState(file.description);

  const getLinkAndView = async () => {
    const link = await getFileFromStorage(file.file_path);
    window.open(link, "_blank");
  };

  return (
    <SidebarItem
      item={file}
      isTyping={isTyping}
      contentType="files"
      icon={<FileIcon type={file.type} size={30} />}
      updateState={{ name, description }}
      renderInputs={() => (
        <>
          <div
            className="cursor-pointer underline hover:opacity-50"
            onClick={getLinkAndView}
            role="button"
            aria-label={`View ${file.name}`}
          >
            View {file.name}
          </div>

          <div className="flex flex-col justify-between">
            <div>{file.type}</div>
            <div>{formatFileSize(file.size)}</div>
            <div>{file.tokens.toLocaleString()} tokens</div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="fileName">Name</Label>
            <Input
              id="fileName"
              placeholder="File name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={FILE_NAME_MAX}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fileDescription">Description</Label>
            <Input
              id="fileDescription"
              placeholder="File description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={FILE_DESCRIPTION_MAX}
            />
          </div>
        </>
      )}
    />
  );
};

export const formatFileSize = (sizeInBytes: number): string => {
  const units = ["bytes", "KB", "MB", "GB"];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};