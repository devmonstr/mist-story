"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Loader2, ShieldAlert } from "lucide-react"
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
import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { useToast } from "@/hooks/use-toast"
import {
  fetchAdminNovels,
  fetchAdminStudio,
  fetchAdminUsers,
  updateAdminNovelVisibility,
  updateAdminUserRoles,
} from "@/lib/api"
import { AdminStudioShell } from "./admin-studio-shell"

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_USER_ROLE: AdminUserListQuery["role"] = "all"
const DEFAULT_USER_SORT: AdminUserListQuery["sort"] = "recent"
const DEFAULT_NOVEL_VISIBILITY: AdminNovelListQuery["visibility"] = "all"
const DEFAULT_NOVEL_STATUS: AdminNovelListQuery["status"] = "all"
const DEFAULT_NOVEL_SORT: AdminNovelListQuery["sort"] = "updated"

const EMPTY_USER_LIST: AdminUserListResponse = {
  items: [],
  pagination: {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  },
}

const EMPTY_NOVEL_LIST: AdminNovelListResponse = {
  items: [],
  pagination: {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  },
}

const EMPTY_STUDIO_SNAPSHOT: AdminStudioResponse = {
  overview: {
    totalUsers: 0,
    totalReaders: 0,
    totalWriters: 0,
    totalAdmins: 0,
    totalNovels: 0,
    publishedNovels: 0,
    hiddenNovels: 0,
    totalChapters: 0,
    openReports: 0,
    queuedPayoutRequests: 0,
    failedPayoutRequests: 0,
  },
  reports: [],
  payoutRequests: [],
}

export default function AdminStudioPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const { toast } = useToast()
  const [snapshot, setSnapshot] = useState<AdminStudioResponse | null>(null)
  const [users, setUsers] = useState<AdminUserListResponse | null>(null)
  const [novels, setNovels] = useState<AdminNovelListResponse | null>(null)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isNovelsLoading, setIsNovelsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [pendingNovelId, setPendingNovelId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState("")
  const [userRole, setUserRole] = useState<AdminUserListQuery["role"]>(DEFAULT_USER_ROLE)
  const [userSort, setUserSort] = useState<AdminUserListQuery["sort"]>(DEFAULT_USER_SORT)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [novelSearch, setNovelSearch] = useState("")
  const [novelVisibility, setNovelVisibility] =
    useState<AdminNovelListQuery["visibility"]>(DEFAULT_NOVEL_VISIBILITY)
  const [novelStatus, setNovelStatus] =
    useState<AdminNovelListQuery["status"]>(DEFAULT_NOVEL_STATUS)
  const [novelSort, setNovelSort] =
    useState<AdminNovelListQuery["sort"]>(DEFAULT_NOVEL_SORT)
  const [novelPage, setNovelPage] = useState(1)
  const [novelPageSize, setNovelPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [hasBootstrapped, setHasBootstrapped] = useState(false)
  const snapshotRequestId = useRef(0)
  const usersRequestId = useRef(0)
  const novelsRequestId = useRef(0)
  const skipNextUserEffect = useRef(true)
  const skipNextNovelEffect = useRef(true)

  const loadSnapshot = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (!isAuthenticated || !user?.isAdmin) {
      return
    }

    const requestId = ++snapshotRequestId.current

    try {
      if (mode === "refresh") {
        setIsRefreshing(true)
      }

      const nextSnapshot = await fetchAdminStudio()
      if (requestId !== snapshotRequestId.current) {
        return
      }
      setSnapshot(nextSnapshot)
    } catch (error) {
      console.error("Failed to fetch admin studio snapshot:", error)
      toast({
        title: "Unable to load admin studio",
        description:
          error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      })
      if (requestId === snapshotRequestId.current) {
        setSnapshot((current) => current ?? EMPTY_STUDIO_SNAPSHOT)
      }
    } finally {
      if (requestId === snapshotRequestId.current) {
        setIsRefreshing(false)
      }
    }
  }, [isAuthenticated, toast, user?.isAdmin])

  const loadUsers = useCallback(async () => {
    if (!isAuthenticated || !user?.isAdmin) {
      setIsUsersLoading(false)
      return
    }

    const requestId = ++usersRequestId.current

    try {
      setIsUsersLoading(true)
      const nextUsers = await fetchAdminUsers({
        q: userSearch.trim() || undefined,
        role: userRole,
        sort: userSort,
        page: userPage,
        pageSize: userPageSize,
      })
      if (requestId !== usersRequestId.current) {
        return
      }
      setUsers(nextUsers)
      setUserPage(nextUsers.pagination.page)
      setUserPageSize(nextUsers.pagination.pageSize)
    } catch (error) {
      console.error("Failed to fetch admin users:", error)
      toast({
        title: "Unable to load users",
        description:
          error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      })
      if (requestId === usersRequestId.current) {
        setUsers((current) => current ?? EMPTY_USER_LIST)
      }
    } finally {
      if (requestId === usersRequestId.current) {
        setIsUsersLoading(false)
      }
    }
  }, [
    isAuthenticated,
    toast,
    user?.isAdmin,
    userPage,
    userPageSize,
    userRole,
    userSearch,
    userSort,
  ])

  const loadNovels = useCallback(async () => {
    if (!isAuthenticated || !user?.isAdmin) {
      setIsNovelsLoading(false)
      return
    }

    const requestId = ++novelsRequestId.current

    try {
      setIsNovelsLoading(true)
      const nextNovels = await fetchAdminNovels({
        q: novelSearch.trim() || undefined,
        visibility: novelVisibility,
        status: novelStatus,
        sort: novelSort,
        page: novelPage,
        pageSize: novelPageSize,
      })
      if (requestId !== novelsRequestId.current) {
        return
      }
      setNovels(nextNovels)
      setNovelPage(nextNovels.pagination.page)
      setNovelPageSize(nextNovels.pagination.pageSize)
    } catch (error) {
      console.error("Failed to fetch admin novels:", error)
      toast({
        title: "Unable to load novels",
        description:
          error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      })
      if (requestId === novelsRequestId.current) {
        setNovels((current) => current ?? EMPTY_NOVEL_LIST)
      }
    } finally {
      if (requestId === novelsRequestId.current) {
        setIsNovelsLoading(false)
      }
    }
  }, [
    isAuthenticated,
    novelPage,
    novelPageSize,
    novelSearch,
    novelSort,
    novelStatus,
    novelVisibility,
    toast,
    user?.isAdmin,
  ])

  const refreshAll = useCallback(() => {
    void Promise.all([loadSnapshot("refresh"), loadUsers(), loadNovels()])
  }, [loadNovels, loadSnapshot, loadUsers])

  useEffect(() => {
    if (hasBootstrapped || isLoading || !isAuthenticated || !user?.isAdmin) {
      return
    }

    let cancelled = false

    void Promise.all([loadSnapshot("initial"), loadUsers(), loadNovels()]).finally(() => {
      if (!cancelled) {
        setHasBootstrapped(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [hasBootstrapped, isAuthenticated, isLoading, loadNovels, loadSnapshot, loadUsers, user?.isAdmin])

  useEffect(() => {
    if (!hasBootstrapped || !isAuthenticated || !user?.isAdmin) {
      return
    }

    if (skipNextUserEffect.current) {
      skipNextUserEffect.current = false
      return
    }

    const timeout = window.setTimeout(() => {
      void loadUsers()
    }, 250)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    hasBootstrapped,
    isAuthenticated,
    loadUsers,
    user?.isAdmin,
    userSearch,
    userRole,
    userSort,
    userPage,
    userPageSize,
  ])

  useEffect(() => {
    if (!hasBootstrapped || !isAuthenticated || !user?.isAdmin) {
      return
    }

    if (skipNextNovelEffect.current) {
      skipNextNovelEffect.current = false
      return
    }

    const timeout = window.setTimeout(() => {
      void loadNovels()
    }, 250)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    hasBootstrapped,
    isAuthenticated,
    loadNovels,
    novelPage,
    novelPageSize,
    novelSearch,
    novelSort,
    novelStatus,
    novelVisibility,
    user?.isAdmin,
  ])

  const handleUserSearchChange = useCallback((value: string) => {
    setUserSearch(value)
    setUserPage(1)
  }, [])

  const handleUserPageSizeChange = useCallback((value: number) => {
    setUserPageSize(value)
    setUserPage(1)
  }, [])

  const handleUserRoleChange = useCallback((value: AdminUserListQuery["role"]) => {
    setUserRole(value)
    setUserPage(1)
  }, [])

  const handleUserSortChange = useCallback((value: AdminUserListQuery["sort"]) => {
    setUserSort(value)
    setUserPage(1)
  }, [])

  const handleNovelSearchChange = useCallback((value: string) => {
    setNovelSearch(value)
    setNovelPage(1)
  }, [])

  const handleNovelPageSizeChange = useCallback((value: number) => {
    setNovelPageSize(value)
    setNovelPage(1)
  }, [])

  const handleNovelVisibilityFilterChange = useCallback(
    (value: AdminNovelListQuery["visibility"]) => {
      setNovelVisibility(value)
      setNovelPage(1)
    },
    []
  )

  const handleNovelStatusChange = useCallback((value: AdminNovelListQuery["status"]) => {
    setNovelStatus(value)
    setNovelPage(1)
  }, [])

  const handleNovelSortChange = useCallback((value: AdminNovelListQuery["sort"]) => {
    setNovelSort(value)
    setNovelPage(1)
  }, [])

  const handleUserRolesChange = async (
    targetUser: AdminUserSummary,
    nextRoles: AdminRoleFlags
  ) => {
    try {
      setPendingUserId(targetUser.id)
      const updatedUser = await updateAdminUserRoles(targetUser.id, nextRoles)
      setUsers((current) =>
        current
          ? {
              ...current,
              items: current.items.map((userItem) =>
                userItem.id === updatedUser.id ? updatedUser : userItem
              ),
            }
          : current
      )
      setSnapshot((current) =>
        current
          ? {
              ...current,
              overview: {
                ...current.overview,
                totalReaders:
                  current.overview.totalReaders +
                  (updatedUser.roles.isReader === targetUser.roles.isReader
                    ? 0
                    : updatedUser.roles.isReader
                      ? 1
                      : -1),
                totalWriters:
                  current.overview.totalWriters +
                  (updatedUser.roles.isWriter === targetUser.roles.isWriter
                    ? 0
                    : updatedUser.roles.isWriter
                      ? 1
                      : -1),
                totalAdmins:
                  current.overview.totalAdmins +
                  (updatedUser.roles.isAdmin === targetUser.roles.isAdmin
                    ? 0
                    : updatedUser.roles.isAdmin
                      ? 1
                      : -1),
              },
            }
          : current
      )
    } catch (error) {
      console.error("Failed to update user roles:", error)
      toast({
        title: "Role update failed",
        description:
          error instanceof Error ? error.message : "The user roles could not be saved.",
        variant: "destructive",
      })
    } finally {
      setPendingUserId(null)
    }
  }

  const handleNovelVisibilityChange = async (
    targetNovel: AdminNovelSummary,
    visibility: "PUBLISHED" | "HIDDEN"
  ) => {
    try {
      setPendingNovelId(targetNovel.id)
      const updatedNovel = await updateAdminNovelVisibility(targetNovel.id, { visibility })
      setNovels((current) =>
        current
          ? {
              ...current,
              items: current.items.map((novelItem) =>
                novelItem.id === updatedNovel.id ? updatedNovel : novelItem
              ),
            }
          : current
      )
      setSnapshot((current) =>
        current
          ? {
              ...current,
              overview: {
                ...current.overview,
                publishedNovels:
                  current.overview.publishedNovels +
                  (updatedNovel.visibility === targetNovel.visibility
                    ? 0
                    : updatedNovel.visibility === "PUBLISHED"
                      ? 1
                      : -1),
                hiddenNovels:
                  current.overview.hiddenNovels +
                  (updatedNovel.visibility === targetNovel.visibility
                    ? 0
                    : updatedNovel.visibility === "HIDDEN"
                      ? 1
                      : -1),
              },
            }
          : current
      )
    } catch (error) {
      console.error("Failed to update novel visibility:", error)
      toast({
        title: "Visibility update failed",
        description:
          error instanceof Error ? error.message : "The novel visibility could not be updated.",
        variant: "destructive",
      })
    } finally {
      setPendingNovelId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-xl border border-border bg-card p-8 text-center shadow-none">
            <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 font-serif text-3xl font-medium text-foreground">
              Admin access required
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This studio is only available to platform administrators with elevated
              permissions.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button asChild>
                <Link href="/studio">Return to Writer Studio</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/library">Go to Library</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (snapshot === null || users === null || novels === null) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <AdminStudioShell
            snapshot={snapshot}
            users={users}
            novels={novels}
            currentUserId={user.id ?? ""}
            isRefreshing={isRefreshing}
            isUsersLoading={isUsersLoading}
            isNovelsLoading={isNovelsLoading}
            pendingUserId={pendingUserId}
            pendingNovelId={pendingNovelId}
            onRefresh={refreshAll}
            onUserRolesChange={handleUserRolesChange}
            onNovelVisibilityChange={handleNovelVisibilityChange}
            userSearch={userSearch}
            onUserSearchChange={handleUserSearchChange}
            userRole={userRole}
            onUserRoleChange={handleUserRoleChange}
            userSort={userSort}
            onUserSortChange={handleUserSortChange}
            userPage={users.pagination.page}
            userPageSize={users.pagination.pageSize}
            userTotalItems={users.pagination.totalItems}
            userTotalPages={users.pagination.totalPages}
            onUserPageChange={setUserPage}
            onUserPageSizeChange={handleUserPageSizeChange}
            novelSearch={novelSearch}
            onNovelSearchChange={handleNovelSearchChange}
            novelVisibility={novelVisibility}
            onNovelVisibilityChangeFilter={handleNovelVisibilityFilterChange}
            novelStatus={novelStatus}
            onNovelStatusChange={handleNovelStatusChange}
            novelSort={novelSort}
            onNovelSortChange={handleNovelSortChange}
            novelPage={novels.pagination.page}
            novelPageSize={novels.pagination.pageSize}
            novelTotalItems={novels.pagination.totalItems}
            novelTotalPages={novels.pagination.totalPages}
            onNovelPageChange={setNovelPage}
            onNovelPageSizeChange={handleNovelPageSizeChange}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
