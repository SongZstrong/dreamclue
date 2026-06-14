import { apikey, knowledgeChunks, payment, user } from "./schema";

export type User = typeof user.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type ApiKey = typeof apikey.$inferSelect;
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
