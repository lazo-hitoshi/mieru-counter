-- Mieru Counter: Create all tables

CREATE TABLE "organizations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "organization_type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "contact_email" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "facilities" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "facility_type" TEXT NOT NULL,
  "address" TEXT,
  "phone" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "settings_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "counters" (
  "id" TEXT NOT NULL,
  "facility_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "counter_code" TEXT,
  "qr_token" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "counters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "facility_id" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'staff',
  "password_hash" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "facility_id" TEXT NOT NULL,
  "counter_id" TEXT NOT NULL,
  "staff_user_id" TEXT,
  "session_code" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'waiting',
  "visitor_label" TEXT,
  "language" TEXT NOT NULL DEFAULT 'ja',
  "started_at" TIMESTAMP(3),
  "ended_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "metadata_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consent_records" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "consent_type" TEXT NOT NULL,
  "consented" BOOLEAN NOT NULL,
  "consent_text_version" TEXT NOT NULL,
  "consented_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transcript_entries" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "speaker_type" TEXT NOT NULL,
  "speaker_name" TEXT,
  "source" TEXT NOT NULL,
  "original_text" TEXT NOT NULL,
  "display_text" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'ja',
  "confidence" DOUBLE PRECISION,
  "sequence_no" INTEGER NOT NULL,
  "created_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transcript_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "important_items" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "source_transcript_entry_id" TEXT,
  "item_type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "extraction_source" TEXT NOT NULL,
  "review_status" TEXT NOT NULL DEFAULT 'candidate',
  "reviewed_by_user_id" TEXT,
  "sent_at" TIMESTAMP(3),
  "display_until" TIMESTAMP(3),
  "metadata_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "important_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "confirmation_actions" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "target_type" TEXT,
  "target_id" TEXT,
  "message" TEXT,
  "handled_by_user_id" TEXT,
  "handled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "confirmation_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "message_templates" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "facility_id" TEXT,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "easy_japanese_body" TEXT,
  "language" TEXT NOT NULL DEFAULT 'ja',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "call_notifications" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "counter_id" TEXT,
  "call_number" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "sent_by_user_id" TEXT,
  "sent_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "call_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lens_events" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "adapter_type" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "title" TEXT,
  "body" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "actions_json" TEXT,
  "delivery_status" TEXT NOT NULL DEFAULT 'queued',
  "error_message" TEXT,
  "sent_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lens_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "facility_id" TEXT,
  "actor_user_id" TEXT,
  "action" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "metadata_json" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "counters_qr_token_key" ON "counters"("qr_token");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "sessions_session_code_key" ON "sessions"("session_code");

-- Indexes
CREATE INDEX "facilities_organization_id_idx" ON "facilities"("organization_id");
CREATE INDEX "counters_facility_id_idx" ON "counters"("facility_id");
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");
CREATE INDEX "users_facility_id_idx" ON "users"("facility_id");
CREATE INDEX "sessions_organization_id_created_at_idx" ON "sessions"("organization_id", "created_at");
CREATE INDEX "sessions_facility_id_created_at_idx" ON "sessions"("facility_id", "created_at");
CREATE INDEX "sessions_counter_id_status_idx" ON "sessions"("counter_id", "status");
CREATE INDEX "consent_records_session_id_idx" ON "consent_records"("session_id");
CREATE INDEX "transcript_entries_session_id_sequence_no_idx" ON "transcript_entries"("session_id", "sequence_no");
CREATE INDEX "transcript_entries_session_id_created_at_idx" ON "transcript_entries"("session_id", "created_at");
CREATE INDEX "important_items_session_id_review_status_idx" ON "important_items"("session_id", "review_status");
CREATE INDEX "important_items_session_id_item_type_idx" ON "important_items"("session_id", "item_type");
CREATE INDEX "confirmation_actions_session_id_created_at_idx" ON "confirmation_actions"("session_id", "created_at");
CREATE INDEX "message_templates_organization_id_category_idx" ON "message_templates"("organization_id", "category");
CREATE INDEX "message_templates_facility_id_idx" ON "message_templates"("facility_id");
CREATE INDEX "call_notifications_session_id_sent_at_idx" ON "call_notifications"("session_id", "sent_at");
CREATE INDEX "call_notifications_counter_id_sent_at_idx" ON "call_notifications"("counter_id", "sent_at");
CREATE INDEX "lens_events_session_id_created_at_idx" ON "lens_events"("session_id", "created_at");
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- Foreign keys
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "counters" ADD CONSTRAINT "counters_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_counter_id_fkey" FOREIGN KEY ("counter_id") REFERENCES "counters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_staff_user_id_fkey" FOREIGN KEY ("staff_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transcript_entries" ADD CONSTRAINT "transcript_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transcript_entries" ADD CONSTRAINT "transcript_entries_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "important_items" ADD CONSTRAINT "important_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "important_items" ADD CONSTRAINT "important_items_source_transcript_entry_id_fkey" FOREIGN KEY ("source_transcript_entry_id") REFERENCES "transcript_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "important_items" ADD CONSTRAINT "important_items_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "confirmation_actions" ADD CONSTRAINT "confirmation_actions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "confirmation_actions" ADD CONSTRAINT "confirmation_actions_handled_by_user_id_fkey" FOREIGN KEY ("handled_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "call_notifications" ADD CONSTRAINT "call_notifications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "call_notifications" ADD CONSTRAINT "call_notifications_counter_id_fkey" FOREIGN KEY ("counter_id") REFERENCES "counters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "call_notifications" ADD CONSTRAINT "call_notifications_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lens_events" ADD CONSTRAINT "lens_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
