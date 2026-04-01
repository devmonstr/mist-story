"use client"

import type { ComponentType } from "react"
import Link from "next/link"
import { BookOpenText, Loader2, RefreshCw, Shield, Users, BarChart3 } from "lucide-react"
import type {
  AdminNovelListQuery,
  AdminNovelListResponse,
  AdminNovelSummary,
  AdminRoleFlags,
  AdminStudioResponse,
  AdminUserListQuery,
  AdminUserListResponse,
  AdminUserSummary,
} from "@mist/shared"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminPagination } from "./admin-pagination"
import { AdminTableControls } from "./admin-table-controls"

type AdminStudioShellProps = {
  snapshot: AdminStudioResponse
  users: AdminUserListResponse
  novels: AdminNovelListResponse
  currentUserId: string
  isRefreshing: boolean
  isUsersLoading: boolean
  isNovelsLoading: boolean
  pendingUserId: string | null
  pendingNovelId: string | null
  onRefresh: () => void
  onUserRolesChange: (targetUser: AdminUserSummary, nextRoles: AdminRoleFlags) => Promise<void>
  onNovelVisibilityChange: (
    targetNovel: AdminNovelSummary,
    visibility: "PUBLISHED" | "HIDDEN"
  ) => Promise<void>
  userSearch: string
  onUserSearchChange: (value: string) => void
  userRole: AdminUserListQuery["role"]
  onUserRoleChange: (value: AdminUserListQuery["role"]) => void
  userSort: AdminUserListQuery["sort"]
  onUserSortChange: (value: AdminUserListQuery["sort"]) => void
  userPage: number
  userPageSize: number
  userTotalItems: number
  userTotalPages: number
  onUserPageChange: (page: number) => void
  onUserPageSizeChange: (pageSize: number) => void
  novelSearch: string
  onNovelSearchChange: (value: string) => void
  novelVisibility: AdminNovelListQuery["visibility"]
  onNovelVisibilityChangeFilter: (value: AdminNovelListQuery["visibility"]) => void
  novelStatus: AdminNovelListQuery["status"]
  onNovelStatusChange: (value: AdminNovelListQuery["status"]) => void
  novelSort: AdminNovelListQuery["sort"]
  onNovelSortChange: (value: AdminNovelListQuery["sort"]) => void
  novelPage: number
  novelPageSize: number
  novelTotalItems: number
  novelTotalPages: number
  onNovelPageChange: (page: number) => void
  onNovelPageSizeChange: (pageSize: number) => void
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function formatDate(value: string | null) {
  if (!value) {
    return "Never"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[150px] rounded-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  count,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  count: string
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-background p-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <Icon className="h-4 w-4" />
          <span>Admin section</span>
        </div>
        <h2 className="font-serif text-2xl font-medium text-foreground">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="border border-border bg-muted/30 px-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {count}
      </div>
    </div>
  )
}

function ToggleChip({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "border px-2 py-1 text-[11px] uppercase tracking-[0.18em] transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

function EmptyRow({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
        {label}
      </td>
    </tr>
  )
}

export function AdminStudioShell({
  snapshot,
  users,
  novels,
  currentUserId,
  isRefreshing,
  isUsersLoading,
  isNovelsLoading,
  pendingUserId,
  pendingNovelId,
  onRefresh,
  onUserRolesChange,
  onNovelVisibilityChange,
  userSearch,
  onUserSearchChange,
  userRole,
  onUserRoleChange,
  userSort,
  onUserSortChange,
  userPage,
  userPageSize,
  userTotalItems,
  userTotalPages,
  onUserPageChange,
  onUserPageSizeChange,
  novelSearch,
  onNovelSearchChange,
  novelVisibility,
  onNovelVisibilityChangeFilter,
  novelStatus,
  onNovelStatusChange,
  novelSort,
  onNovelSortChange,
  novelPage,
  novelPageSize,
  novelTotalItems,
  novelTotalPages,
  onNovelPageChange,
  onNovelPageSizeChange,
}: AdminStudioShellProps) {
  return (
    <div className="space-y-6">
      <div className="border border-border bg-background p-6 shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Platform administration</span>
            </div>
            <h1 className="font-serif text-4xl font-medium text-foreground">
              Admin Studio
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Control readers, writers, and novel visibility from a single operational
              console built for large datasets.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-none"
              onClick={onRefresh}
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Total Users
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 font-serif text-3xl text-foreground">
            {formatNumber(snapshot.overview.totalUsers)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {formatNumber(snapshot.overview.totalReaders)} readers /{" "}
            {formatNumber(snapshot.overview.totalWriters)} writers
          </div>
        </div>
        <div className="border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Total Novels
            </div>
            <BookOpenText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 font-serif text-3xl text-foreground">
            {formatNumber(snapshot.overview.totalNovels)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {formatNumber(snapshot.overview.publishedNovels)} published /{" "}
            {formatNumber(snapshot.overview.hiddenNovels)} hidden
          </div>
        </div>
        <div className="border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Reports
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 font-serif text-3xl text-foreground">
            {formatNumber(snapshot.overview.openReports)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">Open moderation items</div>
        </div>
        <div className="border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Payout Queue
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 font-serif text-3xl text-foreground">
            {formatNumber(snapshot.overview.queuedPayoutRequests)}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {formatNumber(snapshot.overview.failedPayoutRequests)} failed requests
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-border bg-background shadow-none">
          <SectionHeader
            icon={Users}
            title="Writer & Reader Access"
            description="Search through the user base, adjust role flags, and page through the result set without loading everything at once."
            count={`${formatNumber(userTotalItems)} matching users`}
          />
          <div className="p-5">
            <AdminTableControls
              search={userSearch}
              onSearchChange={onUserSearchChange}
              searchPlaceholder="Search name prefix, handle, npub, or pubkey"
              pageSize={userPageSize}
              onPageSizeChange={onUserPageSizeChange}
              pageSizeOptions={[10, 20, 50, 100]}
              filtersSlot={
                <div className="flex flex-wrap items-center gap-2">
                  <FilterSelect
                    label="Role"
                    value={userRole}
                    onValueChange={(value) =>
                      onUserRoleChange(value as AdminUserListQuery["role"])
                    }
                    options={[
                      { value: "all", label: "All roles" },
                      { value: "reader", label: "Readers" },
                      { value: "writer", label: "Writers" },
                      { value: "admin", label: "Admins" },
                    ]}
                  />
                  <FilterSelect
                    label="Sort"
                    value={userSort}
                    onValueChange={(value) =>
                      onUserSortChange(value as AdminUserListQuery["sort"])
                    }
                    options={[
                      { value: "recent", label: "Newest first" },
                      { value: "name", label: "Name A-Z" },
                    ]}
                  />
                </div>
              }
              summary={
                isUsersLoading
                  ? "Loading user page"
                  : `Page ${userPage} of ${Math.max(userTotalPages, 1)}`
              }
              actionLabel="Refresh"
              onAction={onRefresh}
            />

            <div className="overflow-x-auto border border-border">
              <table className="min-w-full border-collapse text-left">
                <thead className="border-b border-border bg-muted/20">
                  <tr className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Roles</th>
                    <th className="px-4 py-3 font-medium">Network</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {users.items.length === 0 ? (
                    <EmptyRow
                      label={
                        isUsersLoading ? "Loading users..." : "No users match the current query."
                      }
                    />
                  ) : (
                    users.items.map((user) => {
                      const isCurrentUser = user.id === currentUserId
                      const isPending = pendingUserId === user.id

                      return (
                        <tr
                          key={user.id}
                          className={isCurrentUser ? "bg-muted/20" : "bg-background"}
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="font-medium text-foreground">
                              {user.displayName || user.handle || "Unnamed user"}
                              {isCurrentUser ? (
                                <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 break-all text-xs text-muted-foreground">
                              {user.handle ? `@${user.handle}` : user.npub}
                            </div>
                            <div className="mt-1 break-all text-[11px] text-muted-foreground">
                              {user.pubkey}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <ToggleChip
                                label="Reader"
                                active={user.roles.isReader}
                                disabled={isPending}
                                onClick={() =>
                                  void onUserRolesChange(user, {
                                    ...user.roles,
                                    isReader: !user.roles.isReader,
                                  })
                                }
                              />
                              <ToggleChip
                                label="Writer"
                                active={user.roles.isWriter}
                                disabled={isPending}
                                onClick={() =>
                                  void onUserRolesChange(user, {
                                    ...user.roles,
                                    isWriter: !user.roles.isWriter,
                                  })
                                }
                              />
                              <ToggleChip
                                label="Admin"
                                active={user.roles.isAdmin}
                                disabled={isPending}
                                onClick={() =>
                                  void onUserRolesChange(user, {
                                    ...user.roles,
                                    isAdmin: !user.roles.isAdmin,
                                  })
                                }
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                            <div>Followers: {formatNumber(user.followers)}</div>
                            <div>Following: {formatNumber(user.following)}</div>
                            <div>Published novels: {formatNumber(user.publishedNovels)}</div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                            <div>Created {formatDate(user.createdAt)}</div>
                            <div>Profile sync {formatDate(user.profileFetchedAt)}</div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            {isPending ? (
                              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving
                              </div>
                            ) : (
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                Role edits update immediately
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination
              page={userPage}
              totalPages={userTotalPages}
              totalItems={userTotalItems}
              pageSize={userPageSize}
              onPageChange={onUserPageChange}
            />
          </div>
        </section>

        <section className="border border-border bg-background shadow-none">
          <SectionHeader
            icon={BookOpenText}
            title="Novel Oversight"
            description="Inspect and moderate novels at scale, with search and paging so the table stays usable as the catalogue grows."
            count={`${formatNumber(novelTotalItems)} matching novels`}
          />
          <div className="p-5">
            <AdminTableControls
              search={novelSearch}
              onSearchChange={onNovelSearchChange}
              searchPlaceholder="Search title prefix, slug, or author"
              pageSize={novelPageSize}
              onPageSizeChange={onNovelPageSizeChange}
              pageSizeOptions={[10, 20, 50, 100]}
              filtersSlot={
                <div className="flex flex-wrap items-center gap-2">
                  <FilterSelect
                    label="Visibility"
                    value={novelVisibility}
                    onValueChange={(value) =>
                      onNovelVisibilityChangeFilter(
                        value as AdminNovelListQuery["visibility"]
                      )
                    }
                    options={[
                      { value: "all", label: "All visibility" },
                      { value: "PUBLISHED", label: "Published" },
                      { value: "HIDDEN", label: "Hidden" },
                    ]}
                  />
                  <FilterSelect
                    label="Status"
                    value={novelStatus}
                    onValueChange={(value) =>
                      onNovelStatusChange(value as AdminNovelListQuery["status"])
                    }
                    options={[
                      { value: "all", label: "All status" },
                      { value: "Ongoing", label: "Ongoing" },
                      { value: "Completed", label: "Completed" },
                      { value: "Hiatus", label: "Hiatus" },
                    ]}
                  />
                  <FilterSelect
                    label="Sort"
                    value={novelSort}
                    onValueChange={(value) =>
                      onNovelSortChange(value as AdminNovelListQuery["sort"])
                    }
                    options={[
                      { value: "updated", label: "Recently updated" },
                      { value: "title", label: "Title A-Z" },
                      { value: "rating", label: "Most rated" },
                    ]}
                  />
                </div>
              }
              summary={
                isNovelsLoading
                  ? "Loading novel page"
                  : `Page ${novelPage} of ${Math.max(novelTotalPages, 1)}`
              }
              actionLabel="Refresh"
              onAction={onRefresh}
            />

            <div className="overflow-x-auto border border-border">
              <table className="min-w-full border-collapse text-left">
                <thead className="border-b border-border bg-muted/20">
                  <tr className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Novel</th>
                    <th className="px-4 py-3 font-medium">Visibility</th>
                    <th className="px-4 py-3 font-medium">Stats</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {novels.items.length === 0 ? (
                    <EmptyRow
                      label={
                        isNovelsLoading ? "Loading novels..." : "No novels match the current query."
                      }
                    />
                  ) : (
                    novels.items.map((novel) => {
                      const isPending = pendingNovelId === novel.id
                      const nextVisibility =
                        novel.visibility === "PUBLISHED" ? "HIDDEN" : "PUBLISHED"

                      return (
                        <tr key={novel.id}>
                          <td className="px-4 py-4 align-top">
                            <div className="font-medium text-foreground">{novel.title}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              /{novel.slug}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              {novel.authorDisplayName} - {novel.genre}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <span className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                {novel.visibility}
                              </span>
                              <span className="border border-border px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                {novel.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                            <div>Chapters: {formatNumber(novel.chaptersCount)}</div>
                            <div>
                              Rating: {novel.rating.toFixed(1)} ({formatNumber(novel.ratingsCount)})
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                            <div>Updated {formatDate(novel.updatedAt)}</div>
                            <div>Published {formatDate(novel.publishedAt)}</div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-none"
                              disabled={isPending}
                              onClick={() =>
                                void onNovelVisibilityChange(novel, nextVisibility)
                              }
                            >
                              {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : null}
                              Move to {nextVisibility}
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <AdminPagination
              page={novelPage}
              totalPages={novelTotalPages}
              totalItems={novelTotalItems}
              pageSize={novelPageSize}
              onPageChange={onNovelPageChange}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border border-border bg-background p-5 shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Moderation feed
              </div>
              <h3 className="mt-2 font-serif text-2xl text-foreground">Recent reports</h3>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {formatNumber(snapshot.reports.length)} items
            </div>
          </div>
          <div className="space-y-3">
            {snapshot.reports.length === 0 ? (
              <div className="border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                No recent reports.
              </div>
            ) : (
              snapshot.reports.map((report) => (
                <div key={report.id} className="border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{report.reason}</span>
                    <span>{report.status}</span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground">
                    {report.commentExcerpt}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground">
                    /{report.novelSlug}
                    {report.chapterNumber ? ` - Chapter ${report.chapterNumber}` : ""}
                    {report.reporterDisplayName ? ` - ${report.reporterDisplayName}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="border border-border bg-background p-5 shadow-none">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Operations queue
              </div>
              <h3 className="mt-2 font-serif text-2xl text-foreground">Payout requests</h3>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {formatNumber(snapshot.payoutRequests.length)} items
            </div>
          </div>
          <div className="space-y-3">
            {snapshot.payoutRequests.length === 0 ? (
              <div className="border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                No active payout requests.
              </div>
            ) : (
              snapshot.payoutRequests.map((request) => (
                <div key={request.id} className="border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{request.status}</span>
                    <span>{formatDate(request.createdAt)}</span>
                    <span>{formatNumber(request.amountSats)} sats</span>
                  </div>
                  <p className="mt-3 text-sm text-foreground">
                    {request.userDisplayName || request.userId}
                  </p>
                  <p className="mt-2 break-all text-xs text-muted-foreground">
                    {request.destination}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between border border-border bg-background px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>Current operator: {currentUserId}</span>
        <Link href="/studio" className="hover:text-foreground">
          Return to Writer Studio
        </Link>
      </div>
    </div>
  )
}
