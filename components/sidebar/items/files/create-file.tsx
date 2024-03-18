import { ACCEPTED_FILE_TYPES } from "@/components/chat/chat-hooks/use-select-file-handler";
import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChatbotUIContext } from "@/context/context";
import { FILE_DESCRIPTION_MAX, FILE_NAME_MAX } from "@/db/limits";
import { TablesInsert } from "@/supabase/types";
import { FC, useContext, useState } from "react";

interface CreateFileProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const CreateFile: FC<CreateFileProps> = ({ isOpen, onOpenChange }) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext);

  const [name, setName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Early return if context values are not available
  // Move this check after the useState calls
  if (!profile || !selectedWorkspace) return null;

  const handleSelectedFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const fileNameWithoutExtension = file.name.split(".").slice(0, -1).join(".");
    setName(fileNameWithoutExtension);
  };

  return (
    <SidebarCreateItem
      contentType="files"
      createState={{
          file: selectedFile,
          user_id: profile.user_id,
          name,
          description,
          file_path: "",
          size: selectedFile?.size || 0,
          tokens: 0,
          type: selectedFile?.type || "",
        } as TablesInsert<"files">
      }
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>File</Label>
            <Input
              type="file"
              onChange={handleSelectedFile}
              accept={ACCEPTED_FILE_TYPES}
            />
          </div>

          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              placeholder="File name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={FILE_NAME_MAX}
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              placeholder="File description..."
              value={description} // Corrected to use description
              onChange={(e) => setDescription(e.target.value)}
              maxLength={FILE_DESCRIPTION_MAX}
            />
          </div>
        </>
      )}
    />
  );
};