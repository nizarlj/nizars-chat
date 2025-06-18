import { type Message } from "ai";
import { Id } from "@convex/_generated/dataModel";

export type Attachment = NonNullable<Message['experimental_attachments']>[number] & {
  isUploading?: boolean;
  progress?: number;
  file?: File;
  error?: string;
  storageId?: Id<"_storage">;
  prompt?: string | null;
  threadId?: Id<"threads"> | null;
  createdAt?: number;
};