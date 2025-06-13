import { type Message } from "ai";

export type Attachment = NonNullable<Message['experimental_attachments']>[number];