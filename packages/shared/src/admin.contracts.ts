import { z } from "zod"
import { novelStatusSchema, novelVisibilitySchema } from "./novel.contracts"

export const adminRoleFlagsSchema = z.object({
  isReader: z.boolean(),
  isWriter: z.boolean(),
  isAdmin: z.boolean(),
})

export const adminOverviewSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  totalReaders: z.number().int().nonnegative(),
  totalWriters: z.number().int().nonnegative(),
  totalAdmins: z.number().int().nonnegative(),
  totalNovels: z.number().int().nonnegative(),
  publishedNovels: z.number().int().nonnegative(),
  hiddenNovels: z.number().int().nonnegative(),
  totalChapters: z.number().int().nonnegative(),
  openReports: z.number().int().nonnegative(),
  queuedPayoutRequests: z.number().int().nonnegative(),
  failedPayoutRequests: z.number().int().nonnegative(),
})

export const adminUserSummarySchema = z.object({
  id: z.string(),
  pubkey: z.string(),
  npub: z.string(),
  displayName: z.string().nullable(),
  handle: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
  profileFetchedAt: z.string().nullable(),
  publishedNovels: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  roles: adminRoleFlagsSchema,
})

export const adminNovelSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  authorId: z.string(),
  authorDisplayName: z.string(),
  visibility: novelVisibilitySchema,
  status: novelStatusSchema,
  genre: z.string(),
  chaptersCount: z.number().int().nonnegative(),
  rating: z.number(),
  ratingsCount: z.number().int().nonnegative(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
})

export const adminReportSummarySchema = z.object({
  id: z.string(),
  reason: z.enum(["SPAM", "HARASSMENT", "HATE", "MISINFORMATION", "NSFW", "OTHER"]),
  status: z.enum(["OPEN", "REVIEWED", "RESOLVED", "REJECTED"]),
  commentExcerpt: z.string(),
  novelSlug: z.string(),
  chapterNumber: z.number().int().nullable(),
  reporterDisplayName: z.string().nullable(),
  createdAt: z.string(),
})

export const adminPayoutRequestSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  userDisplayName: z.string().nullable(),
  amountSats: z.number().int().nonnegative(),
  status: z.enum(["REQUESTED", "QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELED", "REJECTED"]),
  destination: z.string(),
  createdAt: z.string(),
})

export const adminStudioResponseSchema = z.object({
  overview: adminOverviewSchema,
  reports: z.array(adminReportSummarySchema),
  payoutRequests: z.array(adminPayoutRequestSummarySchema),
})

export const adminPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(["all", "reader", "writer", "admin"]).default("all"),
  sort: z.enum(["recent", "name"]).default("recent"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const adminNovelListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  visibility: z.enum(["all", "PUBLISHED", "HIDDEN"]).default("all"),
  status: z.enum(["all", "Ongoing", "Completed", "Hiatus"]).default("all"),
  sort: z.enum(["updated", "title", "rating"]).default("updated"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const adminUserListResponseSchema = z.object({
  items: z.array(adminUserSummarySchema),
  pagination: adminPaginationSchema,
})

export const adminNovelListResponseSchema = z.object({
  items: z.array(adminNovelSummarySchema),
  pagination: adminPaginationSchema,
})

export const updateAdminUserRolesInputSchema = adminRoleFlagsSchema

export const updateAdminNovelVisibilityInputSchema = z.object({
  visibility: novelVisibilitySchema,
})

export type AdminRoleFlags = z.infer<typeof adminRoleFlagsSchema>
export type AdminOverview = z.infer<typeof adminOverviewSchema>
export type AdminUserSummary = z.infer<typeof adminUserSummarySchema>
export type AdminNovelSummary = z.infer<typeof adminNovelSummarySchema>
export type AdminReportSummary = z.infer<typeof adminReportSummarySchema>
export type AdminPayoutRequestSummary = z.infer<typeof adminPayoutRequestSummarySchema>
export type AdminStudioResponse = z.infer<typeof adminStudioResponseSchema>
export type AdminPagination = z.infer<typeof adminPaginationSchema>
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>
export type AdminNovelListQuery = z.infer<typeof adminNovelListQuerySchema>
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>
export type AdminNovelListResponse = z.infer<typeof adminNovelListResponseSchema>
export type UpdateAdminUserRolesInput = z.infer<typeof updateAdminUserRolesInputSchema>
export type UpdateAdminNovelVisibilityInput = z.infer<typeof updateAdminNovelVisibilityInputSchema>
