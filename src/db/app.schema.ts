import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { user } from "./auth.schema";
import type { PaymentScene, PaymentStatus, PaymentType, PlanInterval } from "@/payment/types";

const vector4096 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(4096)";
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
});

export const payment = pgTable("payment", {
	id: text("id").primaryKey(),
	priceId: text('price_id').notNull(),
	type: text('type').notNull().$type<PaymentType>(),
	scene: text('scene').$type<PaymentScene>(), // payment scene: 'lifetime', 'credit', 'subscription'
	interval: text('interval').$type<PlanInterval>(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	customerId: text('customer_id').notNull(),
	subscriptionId: text('subscription_id'),
	sessionId: text('session_id'),
	invoiceId: text('invoice_id').unique(), // unique constraint for avoiding duplicate processing
	status: text('status').notNull().$type<PaymentStatus>(),
	paid: boolean('paid').notNull().default(false), // indicates whether payment is completed (set in invoice.paid event)
	periodStart: timestamp('period_start'),
	periodEnd: timestamp('period_end'),
	cancelAtPeriodEnd: boolean('cancel_at_period_end'),
	trialStart: timestamp('trial_start'),
	trialEnd: timestamp('trial_end'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
	paymentTypeIdx: index("payment_type_idx").on(table.type),
	paymentSceneIdx: index("payment_scene_idx").on(table.scene),
	paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
	paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
	paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
	paymentStatusIdx: index("payment_status_idx").on(table.status),
	paymentPaidIdx: index("payment_paid_idx").on(table.paid),
	paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
	paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
	paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

export const userCredit = pgTable("user_credit", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	currentCredits: integer("current_credits").notNull().default(0),
	lastRefreshAt: timestamp("last_refresh_at"), // deprecated
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
}));

export const creditTransaction = pgTable("credit_transaction", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	type: text("type").notNull(),
	description: text("description"),
	amount: integer("amount").notNull(),
	remainingAmount: integer("remaining_amount"),
	paymentId: text("payment_id"), // field name is paymentId, but actually it's invoiceId
	expirationDate: timestamp("expiration_date"),
	expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
	creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
	creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

export const dreams = pgTable("dreams", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	title: text("title").notNull(),
	content: text("content").notNull(),
	mood: text("mood"),
	tags: text("tags").array(),
	aiAnalysis: text("ai_analysis"),
	aiAnalyzedAt: timestamp("ai_analyzed_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
	dreamsUserIdIdx: index("dreams_user_id_idx").on(table.userId),
	dreamsCreatedAtIdx: index("dreams_created_at_idx").on(table.createdAt),
}));

export const dreamAnalysisUsage = pgTable("dream_analysis_usage", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	dreamId: text("dream_id").notNull().references(() => dreams.id, { onDelete: 'cascade' }),
	createdAt: timestamp("created_at", { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
	dreamAnalysisUsageUserIdIdx: index("dream_analysis_usage_user_id_idx").on(table.userId),
	dreamAnalysisUsageDreamIdIdx: index("dream_analysis_usage_dream_id_idx").on(table.dreamId),
	dreamAnalysisUsageCreatedAtIdx: index("dream_analysis_usage_created_at_idx").on(table.createdAt),
}));

export const knowledgeFiles = pgTable("knowledge_files", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	fileName: text("file_name").notNull(),
	fileType: text("file_type").notNull(), // pdf, txt, md, epub, docx
	fileSize: integer("file_size").notNull(),
	filePath: text("file_path").notNull(), // local path
	title: text("title"),
	author: text("author"),
	description: text("description"),
	status: text("status").notNull().default('pending'), // pending, processing, completed, failed
	chunkCount: integer("chunk_count"),
	errorMessage: text("error_message"),
	sourceUrl: text("source_url"),
	sourceType: text("source_type"),
	language: text("language"),
	license: text("license"),
	copyrightStatus: text("copyright_status"),
	sourceWeight: real("source_weight").default(1),
	isActive: boolean("is_active").default(true),
	checksum: text("checksum"),
	parserVersion: text("parser_version"),
	chunkerVersion: text("chunker_version"),
	embeddingModel: text("embedding_model"),
	embeddingDimension: integer("embedding_dimension").default(4096),
	metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
	processedAt: timestamp("processed_at", { mode: 'date' }),
	createdAt: timestamp("created_at", { mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
	knowledgeFilesUserIdIdx: index("knowledge_files_user_id_idx").on(table.userId),
	knowledgeFilesStatusIdx: index("knowledge_files_status_idx").on(table.status),
}));

export const dreambookQueries = pgTable("dreambook_queries", {
	id: text("id").primaryKey().$defaultFn(() => randomUUID()),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
	query: text("query").notNull(),
	resultCount: integer("result_count").notNull().default(0),
	createdAt: timestamp("created_at", { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
	dreambookQueriesUserIdIdx: index("dreambook_queries_user_id_idx").on(table.userId),
	dreambookQueriesCreatedAtIdx: index("dreambook_queries_created_at_idx").on(table.createdAt),
}));

export const knowledgeChunks = pgTable("knowledge_chunks", {
	id: text("id").primaryKey(),
	fileId: text("file_id").notNull().references(() => knowledgeFiles.id, {
		onDelete: "cascade",
	}),
	fileName: text("file_name").notNull(),
	title: text("title").notNull(),
	text: text("text").notNull(),
	searchTokens: text("search_tokens").notNull(),
	chunkId: integer("chunk_id").notNull(),
	start: integer("start").notNull(),
	end: integer("end").notNull(),
	embedding: vector4096("embedding").notNull(),
	language: text("language"),
	sourceType: text("source_type"),
	sectionTitle: text("section_title"),
	sectionPath: text("section_path"),
	symbolTerms: text("symbol_terms").array(),
	tags: text("tags").array(),
	chunkType: text("chunk_type"),
	tokenCount: integer("token_count"),
	qualityScore: real("quality_score").default(1),
	isActive: boolean("is_active").default(true),
	metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
	createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
}, (table) => ({
	knowledgeChunksFileIdIdx: index("knowledge_chunks_file_id_idx").on(table.fileId),
	knowledgeChunksCreatedAtIdx: index("knowledge_chunks_created_at_idx").on(table.createdAt),
	knowledgeChunksChunkTypeIdx: index("knowledge_chunks_chunk_type_idx").on(table.chunkType),
	knowledgeChunksActiveIdx: index("knowledge_chunks_active_idx").on(
		table.isActive,
		table.sourceType,
		table.chunkType
	),
	knowledgeChunksFileChunkIdx: uniqueIndex("knowledge_chunks_file_chunk_idx").on(
		table.fileId,
		table.chunkId
	),
}));
