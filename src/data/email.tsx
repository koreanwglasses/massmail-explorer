import { EmailEmbedding } from "./email-embedding";

export interface Email {
  embedding?: EmailEmbedding;
}

export type EmailWithEmbedding = Email & Required<Pick<Email, "embedding">>;
