import { EmailEmbedding } from "./email-embedding";

export interface Email {
  content: string;
  embedding?: EmailEmbedding;
}

export type EmailWithEmbedding = Email & Required<Pick<Email, "embedding">>;
