// schema.ts — Drizzle ORM (Postgres) for the event domain
// Requires: CREATE EXTENSION IF NOT EXISTS pgcrypto;

import {
  pgTable,
  uuid,
  text,
  integer,
  varchar,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

// ================= Enums =================
export const roleEnum = pgEnum("role_enum", ["attendee", "admin", "gate", "support"]);
export const orderStatusEnum = pgEnum("order_status_enum", ["PENDING", "PAID", "EXPIRED", "CANCELLED"]);
export const paymentStatusEnum = pgEnum("payment_status_enum", ["PENDING", "PAID", "FAILED", "EXPIRED", "VOIDED"]);
export const ticketStatusEnum = pgEnum("ticket_status_enum", ["UNPAID", "PAID", "CANCELLED"]);

// ================= USERS =================
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull().unique(),
    fullName: text("full_name"),
    whatsappE164: text("whatsapp_e164"),
    role: roleEnum("role").notNull().default("attendee"),
    profileCompletedAt: timestamp("profile_completed_at", { withTimezone: true }),
  },
  (t) => ({
    emailUQ: uniqueIndex("users_email_uidx").on(t.email),
    clerkUQ: uniqueIndex("users_clerk_uidx").on(t.clerkUserId),
  })
);

// ================= ORDERS =================
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    amount: integer("amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => ({
    userIdx: index("orders_user_idx").on(t.userId),
    statusIdx: index("orders_status_idx").on(t.status),
  })
);

// ================= PAYMENTS =================
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    providerRef: text("provider_ref").notNull().unique(), // Xendit invoice id
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    invoiceUrl: text("invoice_url"),
    amount: integer("amount").notNull(),
    payload: jsonb("payload"), // webhook snapshot (optional)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("payments_order_idx").on(t.orderId),
    providerRefUQ: uniqueIndex("payments_provider_ref_uidx").on(t.providerRef),
  })
);

// ================= TICKETS =================
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id),
    status: ticketStatusEnum("status").notNull().default("UNPAID"),
    entryToken: text("entry_token").notNull().unique(), // QR payload token
    shortCode: varchar("short_code", { length: 24 }).notNull().unique(),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    gate: text("gate"),
  issuedBy: text("issued_by"),
  buyerName: text("buyer_name"),
  ticketType: text("ticket_type"),
  },
  (t) => ({
    userIdx: index("tickets_user_idx").on(t.userId),
    orderIdx: index("tickets_order_idx").on(t.orderId),
    tokenUQ: uniqueIndex("tickets_entry_token_uidx").on(t.entryToken),
    shortUQ: uniqueIndex("tickets_short_code_uidx").on(t.shortCode),
  })
);

// ================ Relations (optional) ================
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  tickets: many(tickets),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  payments: many(payments),
  tickets: many(tickets),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  order: one(orders, { fields: [tickets.orderId], references: [orders.id] }),
  user: one(users, { fields: [tickets.userId], references: [users.id] }),
}));

// ================ Helper Types ========================
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;
export type Ticket = InferSelectModel<typeof tickets>;
export type NewTicket = InferInsertModel<typeof tickets>;
