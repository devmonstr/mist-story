-- CreateEnum
CREATE TYPE "AuthAuditAction" AS ENUM ('CHALLENGE_ISSUED', 'CHALLENGE_REJECTED', 'VERIFY_ATTEMPT', 'VERIFY_SUCCESS', 'VERIFY_FAILURE');

-- CreateEnum
CREATE TYPE "NovelStatus" AS ENUM ('Ongoing', 'Completed', 'Hiatus');

-- CreateEnum
CREATE TYPE "NovelVisibility" AS ENUM ('PUBLISHED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "NovelWorkType" AS ENUM ('ORIGINAL', 'TRANSLATION');

-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ChapterVersionPublishState" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "RelayPublishState" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'INVOICE_CREATED', 'SETTLED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'INVOICE_CREATED', 'SETTLED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('AUTHOR_REVENUE', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "PayoutRequestStatus" AS ENUM ('REQUESTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PayoutDestinationType" AS ENUM ('LIGHTNING_ADDRESS', 'LNURL');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE', 'MISINFORMATION', 'NSFW', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CHAPTER_PUBLISHED', 'USER_FOLLOWED', 'NOVEL_BOOKMARKED', 'MENTION', 'COMMENT_REPLY', 'COMMENT_LIKE', 'REPORT_UPDATE', 'MODERATION', 'ORDER_SETTLED', 'NOVEL_RATED', 'CHAPTER_PURCHASED', 'PAYOUT_REQUEST_QUEUED', 'PAYOUT_COMPLETED', 'PAYOUT_FAILED', 'ADMIN_REPORT_OPENED', 'ADMIN_PAYOUT_REQUESTED', 'ADMIN_PAYOUT_FAILED');

-- CreateEnum
CREATE TYPE "NotificationPreferencePreset" AS ENUM ('MINIMAL', 'CREATOR', 'ADMIN_ON_CALL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AppTheme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReaderFontSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "CommentNostrPublishState" AS ENUM ('NONE', 'PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('COMMENT', 'REPORT');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('COMMENT_HIDDEN', 'COMMENT_RESTORED', 'REPORT_REVIEWED', 'REPORT_RESOLVED', 'REPORT_REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "handle" TEXT,
    "displayName" TEXT,
    "about" TEXT,
    "avatarUrl" TEXT,
    "bannerUrl" TEXT,
    "nip05" TEXT,
    "nip05VerifiedAt" TIMESTAMP(3),
    "lud16" TEXT,
    "website" TEXT,
    "profileEventId" TEXT,
    "profileEventCreatedAt" TIMESTAMP(3),
    "profileFetchedAt" TIMESTAMP(3),
    "notificationPreset" "NotificationPreferencePreset",
    "notificationPresetUpdatedAt" TIMESTAMP(3),
    "isReader" BOOLEAN NOT NULL DEFAULT true,
    "isWriter" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuthAuditAction" NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "origin" TEXT,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "pubkey" TEXT,
    "userId" TEXT,
    "resultCode" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Novel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "genre" TEXT NOT NULL,
    "workType" "NovelWorkType" NOT NULL DEFAULT 'ORIGINAL',
    "subgenres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchDocument" tsvector,
    "authorDisplayName" TEXT NOT NULL DEFAULT '',
    "translatorName" TEXT NOT NULL DEFAULT '',
    "status" "NovelStatus" NOT NULL DEFAULT 'Ongoing',
    "visibility" "NovelVisibility" NOT NULL DEFAULT 'HIDDEN',
    "contentWarning" TEXT NOT NULL DEFAULT '',
    "rating" DECIMAL(3,1) NOT NULL DEFAULT 0,
    "ratingsCount" INTEGER NOT NULL DEFAULT 0,
    "updateNote" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT NOT NULL DEFAULT '',
    "coverStorageKey" TEXT,
    "coverMimeType" TEXT,
    "coverOriginalName" TEXT,
    "coverFileSizeBytes" INTEGER,
    "chaptersCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Novel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "contentDraft" TEXT,
    "draftCiphertext" TEXT,
    "draftIv" TEXT,
    "draftAuthTag" TEXT,
    "draftAlgorithm" TEXT,
    "draftKeyVersion" TEXT,
    "status" "ChapterStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "latestVersionId" TEXT,
    "latestPublishedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NovelBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovelBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "appearanceTheme" "AppTheme" NOT NULL DEFAULT 'SYSTEM',
    "readerFontSize" "ReaderFontSize" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPreview" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRelay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT true,
    "write" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRelay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NovelRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NovelRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "chapterId" TEXT,
    "chapterNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterPrice" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "amountSats" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SATS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterVersion" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "previewText" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "ciphertext" TEXT,
    "cipherIv" TEXT,
    "cipherAuthTag" TEXT,
    "cipherAlgorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "wrappedDek" TEXT NOT NULL,
    "wrappedDekIv" TEXT NOT NULL,
    "wrappedDekAuthTag" TEXT NOT NULL,
    "wrapAlgorithm" TEXT NOT NULL DEFAULT 'aes-256-gcm',
    "masterKeyVersion" TEXT NOT NULL,
    "publishState" "ChapterVersionPublishState" NOT NULL DEFAULT 'PENDING',
    "publishedEventId" TEXT,
    "publishedRelayCount" INTEGER NOT NULL DEFAULT 0,
    "lastPublishError" TEXT,
    "publishRequestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterVersionRelayPublish" (
    "id" TEXT NOT NULL,
    "chapterVersionId" TEXT NOT NULL,
    "relayUrl" TEXT NOT NULL,
    "publishState" "RelayPublishState" NOT NULL DEFAULT 'PENDING',
    "eventId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "lastAttemptedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChapterVersionRelayPublish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'SATS',
    "subtotalSats" INTEGER NOT NULL,
    "totalSats" INTEGER NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "novelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "unitAmountSats" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "lineTotalSats" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountSats" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SATS',
    "invoiceBolt11" TEXT,
    "invoiceRef" TEXT,
    "invoiceExpiresAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentSettlementEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "providerRef" TEXT,
    "settledAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentSettlementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "entryKey" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "authorId" TEXT,
    "entryType" "LedgerEntryType" NOT NULL,
    "amountSats" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SATS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountSats" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SATS',
    "destination" TEXT NOT NULL,
    "destinationType" "PayoutDestinationType" NOT NULL,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "availableSnapshotSats" INTEGER NOT NULL,
    "queuedAt" TIMESTAMP(3),
    "processingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "amountSats" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SATS',
    "destination" TEXT NOT NULL,
    "destinationType" "PayoutDestinationType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "providerRef" TEXT,
    "txRef" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "novelSlug" TEXT NOT NULL,
    "chapterNumber" INTEGER,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "status" "CommentStatus" NOT NULL DEFAULT 'VISIBLE',
    "content" TEXT NOT NULL,
    "mentionsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "nostrEventId" TEXT,
    "nostrParentEventId" TEXT,
    "nostrRootExternalId" TEXT,
    "nostrRootKind" TEXT,
    "nostrRelayHints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nostrPublishState" "CommentNostrPublishState" NOT NULL DEFAULT 'NONE',
    "nostrPublishedAt" TIMESTAMP(3),
    "nostrPublishError" TEXT,
    "nostrEventJson" JSONB,
    "hiddenAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "hiddenReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nostrEventId" TEXT,
    "nostrPublishState" "CommentNostrPublishState" NOT NULL DEFAULT 'NONE',
    "nostrPublishedAt" TIMESTAMP(3),
    "nostrPublishError" TEXT,
    "nostrEventJson" JSONB,
    "nostrRelayHints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLikeDelete" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetNostrEventId" TEXT NOT NULL,
    "nostrEventId" TEXT,
    "nostrPublishState" "CommentNostrPublishState" NOT NULL DEFAULT 'NONE',
    "nostrPublishedAt" TIMESTAMP(3),
    "nostrPublishError" TEXT,
    "nostrEventJson" JSONB,
    "nostrRelayHints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLikeDelete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentMention" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "mentionedUserId" TEXT,
    "mentionHandle" TEXT,
    "mentionPubkey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "NotificationType" NOT NULL,
    "commentId" TEXT,
    "mentionId" TEXT,
    "reportId" TEXT,
    "novelId" TEXT,
    "novelSlug" TEXT,
    "chapterId" TEXT,
    "chapterNumber" INTEGER,
    "orderId" TEXT,
    "payoutRequestId" TEXT,
    "targetUrl" TEXT,
    "dedupeKey" TEXT,
    "groupKey" TEXT,
    "metadata" JSONB,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAuditLog" (
    "id" TEXT NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "actionType" "ModerationActionType" NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "commentId" TEXT,
    "reportId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_pubkey_key" ON "User"("pubkey");

-- CreateIndex
CREATE INDEX "User_displayName_idx" ON "User"("displayName");

-- CreateIndex
CREATE INDEX "User_handle_idx" ON "User"("handle");

-- CreateIndex
CREATE INDEX "AuthAuditLog_action_createdAt_idx" ON "AuthAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAuditLog_pubkey_createdAt_idx" ON "AuthAuditLog"("pubkey", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAuditLog_userId_createdAt_idx" ON "AuthAuditLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Novel_slug_key" ON "Novel"("slug");

-- CreateIndex
CREATE INDEX "Novel_authorId_idx" ON "Novel"("authorId");

-- CreateIndex
CREATE INDEX "Novel_visibility_status_idx" ON "Novel"("visibility", "status");

-- CreateIndex
CREATE INDEX "Novel_visibility_genre_idx" ON "Novel"("visibility", "genre");

-- CreateIndex
CREATE INDEX "Novel_visibility_workType_idx" ON "Novel"("visibility", "workType");

-- CreateIndex
CREATE INDEX "Novel_visibility_publishedAt_idx" ON "Novel"("visibility", "publishedAt");

-- CreateIndex
CREATE INDEX "Novel_visibility_updatedAt_idx" ON "Novel"("visibility", "updatedAt");

-- CreateIndex
CREATE INDEX "Novel_visibility_ratingsCount_idx" ON "Novel"("visibility", "ratingsCount");

-- CreateIndex
CREATE INDEX "Novel_visibility_authorDisplayName_idx" ON "Novel"("visibility", "authorDisplayName");

-- CreateIndex
CREATE INDEX "Chapter_novelId_status_idx" ON "Chapter"("novelId", "status");

-- CreateIndex
CREATE INDEX "Chapter_latestVersionId_idx" ON "Chapter"("latestVersionId");

-- CreateIndex
CREATE INDEX "Chapter_latestPublishedVersionId_idx" ON "Chapter"("latestPublishedVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_novelId_number_key" ON "Chapter"("novelId", "number");

-- CreateIndex
CREATE INDEX "NovelBookmark_userId_createdAt_idx" ON "NovelBookmark"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NovelBookmark_novelId_createdAt_idx" ON "NovelBookmark"("novelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NovelBookmark_userId_novelId_key" ON "NovelBookmark"("userId", "novelId");

-- CreateIndex
CREATE INDEX "UserFollow_followerId_createdAt_idx" ON "UserFollow"("followerId", "createdAt");

-- CreateIndex
CREATE INDEX "UserFollow_followingId_createdAt_idx" ON "UserFollow"("followingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSetting_userId_key" ON "UserSetting"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserApiKey_keyHash_key" ON "UserApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "UserApiKey_userId_createdAt_idx" ON "UserApiKey"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserApiKey_userId_revokedAt_createdAt_idx" ON "UserApiKey"("userId", "revokedAt", "createdAt");

-- CreateIndex
CREATE INDEX "UserRelay_userId_createdAt_idx" ON "UserRelay"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelay_userId_url_key" ON "UserRelay"("userId", "url");

-- CreateIndex
CREATE INDEX "NovelRating_novelId_createdAt_idx" ON "NovelRating"("novelId", "createdAt");

-- CreateIndex
CREATE INDEX "NovelRating_userId_createdAt_idx" ON "NovelRating"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NovelRating_userId_novelId_key" ON "NovelRating"("userId", "novelId");

-- CreateIndex
CREATE INDEX "ReadingProgress_userId_updatedAt_idx" ON "ReadingProgress"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ReadingProgress_novelId_updatedAt_idx" ON "ReadingProgress"("novelId", "updatedAt");

-- CreateIndex
CREATE INDEX "ReadingProgress_chapterId_idx" ON "ReadingProgress"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingProgress_userId_novelId_key" ON "ReadingProgress"("userId", "novelId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterPrice_chapterId_key" ON "ChapterPrice"("chapterId");

-- CreateIndex
CREATE INDEX "ChapterVersion_chapterId_publishState_idx" ON "ChapterVersion"("chapterId", "publishState");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterVersion_chapterId_version_key" ON "ChapterVersion"("chapterId", "version");

-- CreateIndex
CREATE INDEX "ChapterVersionRelayPublish_relayUrl_publishState_idx" ON "ChapterVersionRelayPublish"("relayUrl", "publishState");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterVersionRelayPublish_chapterVersionId_relayUrl_key" ON "ChapterVersionRelayPublish"("chapterVersionId", "relayUrl");

-- CreateIndex
CREATE INDEX "Order_buyerId_createdAt_idx" ON "Order"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_authorId_idx" ON "OrderItem"("authorId");

-- CreateIndex
CREATE INDEX "OrderItem_novelId_idx" ON "OrderItem"("novelId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_chapterId_key" ON "OrderItem"("orderId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_invoiceRef_idx" ON "Payment"("invoiceRef");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSettlementEvent_idempotencyKey_key" ON "PaymentSettlementEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentSettlementEvent_paymentId_receivedAt_idx" ON "PaymentSettlementEvent"("paymentId", "receivedAt");

-- CreateIndex
CREATE INDEX "Entitlement_orderId_idx" ON "Entitlement"("orderId");

-- CreateIndex
CREATE INDEX "Entitlement_paymentId_idx" ON "Entitlement"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_userId_chapterId_key" ON "Entitlement"("userId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_entryKey_key" ON "LedgerEntry"("entryKey");

-- CreateIndex
CREATE INDEX "LedgerEntry_orderId_entryType_idx" ON "LedgerEntry"("orderId", "entryType");

-- CreateIndex
CREATE INDEX "LedgerEntry_authorId_createdAt_idx" ON "LedgerEntry"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_userId_createdAt_idx" ON "PayoutRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_createdAt_idx" ON "PayoutRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_requestId_key" ON "Payout"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_idempotencyKey_key" ON "Payout"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payout_userId_createdAt_idx" ON "Payout"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payout_status_createdAt_idx" ON "Payout"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_nostrEventId_key" ON "Comment"("nostrEventId");

-- CreateIndex
CREATE INDEX "Comment_novelSlug_chapterNumber_status_createdAt_idx" ON "Comment"("novelSlug", "chapterNumber", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_userId_createdAt_idx" ON "Comment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_createdAt_idx" ON "Comment"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_nostrPublishState_createdAt_idx" ON "Comment"("nostrPublishState", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_nostrEventId_key" ON "CommentLike"("nostrEventId");

-- CreateIndex
CREATE INDEX "CommentLike_userId_createdAt_idx" ON "CommentLike"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLikeDelete_targetNostrEventId_key" ON "CommentLikeDelete"("targetNostrEventId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLikeDelete_nostrEventId_key" ON "CommentLikeDelete"("nostrEventId");

-- CreateIndex
CREATE INDEX "CommentLikeDelete_userId_createdAt_idx" ON "CommentLikeDelete"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CommentLikeDelete_nostrPublishState_createdAt_idx" ON "CommentLikeDelete"("nostrPublishState", "createdAt");

-- CreateIndex
CREATE INDEX "CommentMention_mentionedUserId_createdAt_idx" ON "CommentMention"("mentionedUserId", "createdAt");

-- CreateIndex
CREATE INDEX "CommentMention_mentionHandle_idx" ON "CommentMention"("mentionHandle");

-- CreateIndex
CREATE INDEX "CommentMention_mentionPubkey_idx" ON "CommentMention"("mentionPubkey");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_mentionId_key" ON "Notification"("mentionId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_type_createdAt_idx" ON "Notification"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_reportId_createdAt_idx" ON "Notification"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_dedupeKey_createdAt_idx" ON "Notification"("dedupeKey", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_groupKey_createdAt_idx" ON "Notification"("groupKey", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_type_idx" ON "NotificationPreference"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_key" ON "NotificationPreference"("userId", "type");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterUserId_createdAt_idx" ON "Report"("reporterUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_commentId_reporterUserId_key" ON "Report"("commentId", "reporterUserId");

-- CreateIndex
CREATE INDEX "ModerationAuditLog_targetType_createdAt_idx" ON "ModerationAuditLog"("targetType", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAuditLog_actorUserId_createdAt_idx" ON "ModerationAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAuditLog_commentId_createdAt_idx" ON "ModerationAuditLog"("commentId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAuditLog_reportId_createdAt_idx" ON "ModerationAuditLog"("reportId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Novel" ADD CONSTRAINT "Novel_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES "ChapterVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_latestPublishedVersionId_fkey" FOREIGN KEY ("latestPublishedVersionId") REFERENCES "ChapterVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelBookmark" ADD CONSTRAINT "NovelBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelBookmark" ADD CONSTRAINT "NovelBookmark_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetting" ADD CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApiKey" ADD CONSTRAINT "UserApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelay" ADD CONSTRAINT "UserRelay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelRating" ADD CONSTRAINT "NovelRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NovelRating" ADD CONSTRAINT "NovelRating_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterPrice" ADD CONSTRAINT "ChapterPrice_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterVersion" ADD CONSTRAINT "ChapterVersion_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterVersionRelayPublish" ADD CONSTRAINT "ChapterVersionRelayPublish_chapterVersionId_fkey" FOREIGN KEY ("chapterVersionId") REFERENCES "ChapterVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSettlementEvent" ADD CONSTRAINT "PaymentSettlementEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PayoutRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLikeDelete" ADD CONSTRAINT "CommentLikeDelete_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLikeDelete" ADD CONSTRAINT "CommentLikeDelete_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentMention" ADD CONSTRAINT "CommentMention_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_mentionId_fkey" FOREIGN KEY ("mentionId") REFERENCES "CommentMention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAuditLog" ADD CONSTRAINT "ModerationAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAuditLog" ADD CONSTRAINT "ModerationAuditLog_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAuditLog" ADD CONSTRAINT "ModerationAuditLog_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
