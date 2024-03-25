import { createClient } from "@supabase/supabase-js";
import { createParser } from "eventsource-parser";
import { readFileSync } from "fs";
import { join } from "path";
import { Configuration, OpenAIApi } from "openai";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase = createClient(supabaseUrl, supabaseKey);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { file_id, embeddingsProvider } = req.body;

    try {
      const { data: fileMetadata, error: metadataError, count } = await supabaseAdmin
        .from("files")
        .select("*", { count: "exact" })
        .eq("id", file_id)
        .single();

      if (metadataError) {
        throw new Error(`Failed to retrieve file metadata: ${metadataError.message}`);
      }

      if (count === 0) {
        throw new Error("File not found");
      } else if (count > 1) {
        throw new Error("Multiple files found with the same ID");
      }

      const { data, error } = await supabase.storage
        .from("files")
        .download(`${fileMetadata.path}`);

      if (error) {
        throw new Error(`Failed to download file: ${error.message}`);
      }

      const fileExtension = fileMetadata.name.split(".").pop();

      if (["csv", "json", "md", "pdf", "txt"].includes(fileExtension)) {
        const fileContent = data;
        let embeddings;

        if (embeddingsProvider === "openai") {
          const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
          });
          const openai = new OpenAIApi(configuration);
          const embeddingResponse = await openai.createEmbedding({
            model: "text-embedding-ada-002",
            input: fileContent,
          });
          embeddings = embeddingResponse.data.data[0].embedding;
        } else {
          // Handle other embedding providers
        }

        const { error: updateError } = await supabaseAdmin
          .from("files")
          .update({ embeddings })
          .eq("id", file_id);

        if (updateError) {
          throw new Error(`Failed to update file embeddings: ${updateError.message}`);
        }

        res.status(200).json({ message: "File processed successfully" });
      } else {
        res.status(400).json({ error: "Unsupported file type" });
      }
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}