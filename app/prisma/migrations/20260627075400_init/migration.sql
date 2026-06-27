-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "organization_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contact_email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facility_type" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "facilities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "counters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "facility_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "counter_code" TEXT,
    "qr_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "counters_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "facility_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "password_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "users_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "counter_id" TEXT NOT NULL,
    "staff_user_id" TEXT,
    "session_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "visitor_label" TEXT,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "started_at" DATETIME,
    "ended_at" DATETIME,
    "expires_at" DATETIME NOT NULL,
    "metadata_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sessions_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sessions_counter_id_fkey" FOREIGN KEY ("counter_id") REFERENCES "counters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sessions_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "consent_type" TEXT NOT NULL,
    "consented" BOOLEAN NOT NULL,
    "consent_text_version" TEXT NOT NULL,
    "consented_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consent_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transcript_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "speaker_type" TEXT NOT NULL,
    "speaker_name" TEXT,
    "source" TEXT NOT NULL,
    "original_text" TEXT NOT NULL,
    "display_text" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "confidence" REAL,
    "sequence_no" INTEGER NOT NULL,
    "created_by_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transcript_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transcript_entries_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "important_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "source_transcript_entry_id" TEXT,
    "item_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "extraction_source" TEXT NOT NULL,
    "review_status" TEXT NOT NULL DEFAULT 'candidate',
    "reviewed_by_user_id" TEXT,
    "sent_at" DATETIME,
    "display_until" DATETIME,
    "metadata_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "important_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "important_items_source_transcript_entry_id_fkey" FOREIGN KEY ("source_transcript_entry_id") REFERENCES "transcript_entries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "important_items_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "confirmation_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "message" TEXT,
    "handled_by_user_id" TEXT,
    "handled_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "confirmation_actions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "confirmation_actions_handled_by_user_id_fkey" FOREIGN KEY ("handled_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "facility_id" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "easy_japanese_body" TEXT,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "message_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "message_templates_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "call_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "counter_id" TEXT,
    "call_number" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "sent_by_user_id" TEXT,
    "sent_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "call_notifications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "call_notifications_counter_id_fkey" FOREIGN KEY ("counter_id") REFERENCES "counters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "call_notifications_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lens_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "adapter_type" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "actions_json" TEXT,
    "delivery_status" TEXT NOT NULL DEFAULT 'queued',
    "error_message" TEXT,
    "sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lens_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organization_id" TEXT NOT NULL,
    "facility_id" TEXT,
    "actor_user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata_json" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "facilities_organization_id_idx" ON "facilities"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "counters_qr_token_key" ON "counters"("qr_token");

-- CreateIndex
CREATE INDEX "counters_facility_id_idx" ON "counters"("facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_facility_id_idx" ON "users"("facility_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_code_key" ON "sessions"("session_code");

-- CreateIndex
CREATE INDEX "sessions_organization_id_created_at_idx" ON "sessions"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "sessions_facility_id_created_at_idx" ON "sessions"("facility_id", "created_at");

-- CreateIndex
CREATE INDEX "sessions_counter_id_status_idx" ON "sessions"("counter_id", "status");

-- CreateIndex
CREATE INDEX "consent_records_session_id_idx" ON "consent_records"("session_id");

-- CreateIndex
CREATE INDEX "transcript_entries_session_id_sequence_no_idx" ON "transcript_entries"("session_id", "sequence_no");

-- CreateIndex
CREATE INDEX "transcript_entries_session_id_created_at_idx" ON "transcript_entries"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "important_items_session_id_review_status_idx" ON "important_items"("session_id", "review_status");

-- CreateIndex
CREATE INDEX "important_items_session_id_item_type_idx" ON "important_items"("session_id", "item_type");

-- CreateIndex
CREATE INDEX "confirmation_actions_session_id_created_at_idx" ON "confirmation_actions"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "message_templates_organization_id_category_idx" ON "message_templates"("organization_id", "category");

-- CreateIndex
CREATE INDEX "message_templates_facility_id_idx" ON "message_templates"("facility_id");

-- CreateIndex
CREATE INDEX "call_notifications_session_id_sent_at_idx" ON "call_notifications"("session_id", "sent_at");

-- CreateIndex
CREATE INDEX "call_notifications_counter_id_sent_at_idx" ON "call_notifications"("counter_id", "sent_at");

-- CreateIndex
CREATE INDEX "lens_events_session_id_created_at_idx" ON "lens_events"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");
