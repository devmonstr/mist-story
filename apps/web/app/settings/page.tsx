'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import Link from 'next/link'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import {
  pageContentContainerClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useTheme } from 'next-themes'
import { useToast } from '@/hooks/use-toast'
import { useRequireAuth } from '@/hooks/use-require-auth'
import {
  downloadSecurityAuditLog,
  createRelay,
  deleteRelay,
  fetchAppearanceSettings,
  fetchIntegrationsSettings,
  fetchMyProfile,
  fetchNotificationSettings,
  fetchSecuritySettings,
  publishMyProfile,
  refreshMyProfile as refreshMyProfileFromApi,
  requestReauthChallenge,
  revokeCurrentSecuritySession,
  signOutAllSecuritySessions,
  uploadMyProfileImage,
  updateRelay,
  updateAppearanceSettings,
  updateNotificationSettings,
  verifyReauthChallenge,
  type AppearanceSettingsDto,
  type IntegrationsSettingsDto,
  type NotificationSettingsDto,
  type RelayDto,
  type SecuritySessionDto,
  type SecuritySettingsDto,
  type UploadProfileImageResponse,
} from '@/lib/api'
import {
  DEFAULT_NOSTR_PROFILE_RELAYS,
  buildProfileMetadataContent,
  fetchLatestProfileMetadata,
  getPublicKey,
  publishEventToRelays,
  signAuthChallengeWithExtension,
  signKind0MetadataEvent,
  type RelayPublishResult,
} from '@/lib/nostr-utils'
import type { NostrProfile } from '@/lib/nostr-types'
import { cn } from '@/lib/utils'
import {
  Bell,
  BookOpen,
  Camera,
  Check,
  Copy,
  Download,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Moon,
  MessageSquare,
  Palette,
  Pencil,
  Plus,
  RadioTower,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sun,
  Trash2,
  Type,
  User,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Never'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function compactValue(value: string, head = 14, tail = 10) {
  if (value.length <= head + tail + 3) {
    return value
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`
}

function inferDeviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return 'Unknown device'
  }

  const normalized = userAgent.toLowerCase()
  if (normalized.includes('iphone')) return 'iPhone'
  if (normalized.includes('ipad')) return 'iPad'
  if (normalized.includes('android')) return 'Android device'
  if (normalized.includes('mac os')) return 'Mac'
  if (normalized.includes('windows')) return 'Windows PC'
  if (normalized.includes('linux')) return 'Linux device'

  return 'Browser session'
}

function downloadBlobFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function resolveDownloadFileName(headerValue: string | null, fallback: string) {
  if (!headerValue) {
    return fallback
  }

  const quotedMatch = /filename="([^"]+)"/i.exec(headerValue)
  if (quotedMatch?.[1]) {
    return quotedMatch[1]
  }

  const simpleMatch = /filename=([^;]+)/i.exec(headerValue)
  if (simpleMatch?.[1]) {
    return simpleMatch[1].trim()
  }

  return fallback
}

function countEnabledNotificationSettings(settings: NotificationSettingsDto) {
  return NOTIFICATION_SETTING_DEFINITIONS.reduce(
    (count, setting) => count + (settings[setting.key] ? 1 : 0),
    0
  )
}

type MyProfilePayload = Awaited<ReturnType<typeof fetchMyProfile>>
type ProfileSummary = MyProfilePayload['profile']

type ProfileFormState = {
  name: string
  displayName: string
  about: string
  picture: string
  banner: string
  website: string
  nip05: string
  lud16: string
}

type ProfileImageAssetType = 'avatar' | 'banner'

type ProfileImageSelection = {
  dataUrl: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
}

type ProfileImageEditorOffset = {
  x: number
  y: number
}

type PendingProfileImageEdit = {
  assetType: ProfileImageAssetType
  sourceDataUrl: string
  fileName: string
  mimeType: string
  fileSizeBytes: number
  sourceWidth: number
  sourceHeight: number
}

type ProfileImageEditorConfig = {
  viewportWidth: number
  viewportHeight: number
  outputWidth: number
  outputHeight: number
  label: string
  helperText: string
}

type ProfileImageEditorDragState = {
  pointerId: number
  originX: number
  originY: number
  startOffset: ProfileImageEditorOffset
}

type RelayFormState = {
  url: string
  read: boolean
  write: boolean
}

type DirtyProfileFields = Record<keyof ProfileFormState, boolean>

const EMPTY_PROFILE_FORM: ProfileFormState = {
  name: '',
  displayName: '',
  about: '',
  picture: '',
  banner: '',
  website: '',
  nip05: '',
  lud16: '',
}

const EMPTY_RELAY_FORM: RelayFormState = {
  url: '',
  read: true,
  write: true,
}

const EMPTY_DIRTY_PROFILE_FIELDS: DirtyProfileFields = {
  name: false,
  displayName: false,
  about: false,
  picture: false,
  banner: false,
  website: false,
  nip05: false,
  lud16: false,
}

const MAX_PROFILE_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const PROFILE_IMAGE_EDITOR_MAX_ZOOM = 3.5

const PROFILE_IMAGE_EDITOR_CONFIG: Record<ProfileImageAssetType, ProfileImageEditorConfig> = {
  avatar: {
    viewportWidth: 280,
    viewportHeight: 280,
    outputWidth: 512,
    outputHeight: 512,
    label: 'profile picture',
    helperText: 'Drag to reposition your avatar, then zoom in for a tighter crop.',
  },
  banner: {
    viewportWidth: 320,
    viewportHeight: 120,
    outputWidth: 1600,
    outputHeight: 600,
    label: 'banner image',
    helperText: 'Frame the wide crop before you apply it to your profile banner.',
  },
}

const NOTIFICATION_SETTING_DEFINITIONS: Array<{
  key: keyof NotificationSettingsDto
  label: string
  description: string
  icon: typeof Mail
  accentClassName: string
}> = [
  {
    key: 'emailNotifications',
    label: 'Email updates',
    description: 'Receive important account updates and product news by email.',
    icon: Mail,
    accentClassName: 'text-sky-600',
  },
  {
    key: 'newChapterNotifications',
    label: 'New chapter alerts',
    description: 'Hear when authors you follow publish a new chapter.',
    icon: BookOpen,
    accentClassName: 'text-emerald-600',
  },
  {
    key: 'commentNotifications',
    label: 'Comment activity',
    description: 'Stay on top of replies and engagement around your work.',
    icon: MessageSquare,
    accentClassName: 'text-amber-600',
  },
  {
    key: 'followNotifications',
    label: 'Follower activity',
    description: 'Know when a new reader starts following your account.',
    icon: Users,
    accentClassName: 'text-rose-600',
  },
]

const APPEARANCE_THEME_OPTIONS: Array<{
  value: AppearanceSettingsDto['theme']
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Bright surfaces with crisp contrast for daytime reading.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Muted backgrounds that reduce glare in low light.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Auto',
    description: 'Follow your device setting and switch automatically.',
    icon: Monitor,
  },
]

const APPEARANCE_FONT_SIZE_OPTIONS: Array<{
  value: AppearanceSettingsDto['fontSize']
  label: string
  description: string
  previewClassName: string
}> = [
  {
    value: 'small',
    label: 'Compact',
    description: 'Fits more text on screen with a tighter rhythm.',
    previewClassName: 'text-sm',
  },
  {
    value: 'medium',
    label: 'Balanced',
    description: 'Default density for steady reading across devices.',
    previewClassName: 'text-base',
  },
  {
    value: 'large',
    label: 'Comfort',
    description: 'More generous sizing for long reading sessions.',
    previewClassName: 'text-lg',
  },
]

const EDITABLE_METADATA_KEYS = [
  'name',
  'display_name',
  'about',
  'picture',
  'banner',
  'website',
  'nip05',
  'lud16',
] as const

function createProfileForm(profile: ProfileSummary): ProfileFormState {
  return {
    name: profile.handle ?? '',
    displayName: profile.displayName ?? '',
    about: profile.about ?? '',
    picture: profile.avatarUrl ?? '',
    banner: profile.bannerUrl ?? '',
    website: profile.website ?? '',
    nip05: profile.nip05 ?? '',
    lud16: profile.lud16 ?? '',
  }
}

function stringValueOrEmpty(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function createProfileFormFromMetadata(metadata: Partial<Record<string, unknown>>) {
  return {
    name: stringValueOrEmpty(metadata.name),
    displayName: stringValueOrEmpty(metadata.display_name),
    about: stringValueOrEmpty(metadata.about),
    picture: stringValueOrEmpty(metadata.picture),
    banner: stringValueOrEmpty(metadata.banner),
    website: stringValueOrEmpty(metadata.website),
    nip05: stringValueOrEmpty(metadata.nip05),
    lud16: stringValueOrEmpty(metadata.lud16),
  }
}

function mergeProfileFormWithMetadata(
  currentForm: ProfileFormState,
  metadata: Partial<Record<string, unknown>>,
  dirtyFields: DirtyProfileFields
) {
  const nextForm = createProfileFormFromMetadata(metadata)

  return {
    name: dirtyFields.name ? currentForm.name : nextForm.name,
    displayName: dirtyFields.displayName ? currentForm.displayName : nextForm.displayName,
    about: dirtyFields.about ? currentForm.about : nextForm.about,
    picture: dirtyFields.picture ? currentForm.picture : nextForm.picture,
    banner: dirtyFields.banner ? currentForm.banner : nextForm.banner,
    website: dirtyFields.website ? currentForm.website : nextForm.website,
    nip05: dirtyFields.nip05 ? currentForm.nip05 : nextForm.nip05,
    lud16: dirtyFields.lud16 ? currentForm.lud16 : nextForm.lud16,
  }
}

function trimOrNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function buildEditableProfileMetadata(form: ProfileFormState): NostrProfile {
  return {
    name: trimOrNull(form.name) ?? undefined,
    display_name: trimOrNull(form.displayName) ?? undefined,
    about: trimOrNull(form.about) ?? undefined,
    picture: trimOrNull(form.picture) ?? undefined,
    banner: trimOrNull(form.banner) ?? undefined,
    website: trimOrNull(form.website) ?? undefined,
    nip05: trimOrNull(form.nip05) ?? undefined,
    lud16: trimOrNull(form.lud16) ?? undefined,
  }
}

function stripEditableMetadata(metadata: Record<string, unknown>) {
  const extraMetadata = { ...metadata }

  for (const key of EDITABLE_METADATA_KEYS) {
    delete extraMetadata[key]
  }

  return extraMetadata
}

function formatExtraMetadata(metadata: Record<string, unknown>) {
  return Object.keys(metadata).length > 0 ? JSON.stringify(metadata, null, 2) : '{}'
}

function parseExtraMetadata(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return {}
  }

  const parsed = JSON.parse(trimmed) as unknown
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('Additional metadata must be a JSON object')
  }

  return parsed as Record<string, unknown>
}

function buildProfileImageOptimizationToastPayload(
  results: UploadProfileImageResponse[]
) {
  if (results.length === 0) {
    return null
  }

  const queuedCount = results.filter(
    (result) => result.optimization.state === 'queued'
  ).length
  const skippedCount = results.length - queuedCount

  if (skippedCount === 0) {
    return {
      title: queuedCount === 1 ? 'Image optimization queued' : 'Image optimizations queued',
      description:
        queuedCount === 1
          ? 'Your uploaded profile image is being converted to WebP in the background.'
          : 'Your uploaded profile images are being converted to WebP in the background.',
    }
  }

  if (queuedCount === 0) {
    return {
      title: 'Images uploaded',
      description:
        skippedCount === 1
          ? 'Your image upload succeeded, but background WebP optimization was unavailable this time.'
          : 'Your image uploads succeeded, but background WebP optimization was unavailable this time.',
    }
  }

  return {
    title: 'Images uploaded',
    description: `Background optimization queued for ${queuedCount} image${queuedCount === 1 ? '' : 's'} and skipped for ${skippedCount}.`,
  }
}

function createRelayFormState(relay?: RelayDto): RelayFormState {
  return {
    url: relay?.url ?? EMPTY_RELAY_FORM.url,
    read: relay?.read ?? EMPTY_RELAY_FORM.read,
    write: relay?.write ?? EMPTY_RELAY_FORM.write,
  }
}

function isRelayFormValid(form: RelayFormState) {
  return form.url.trim().length > 0 && (form.read || form.write)
}

function hasRelayFormChanges(relay: RelayDto, form: RelayFormState) {
  return (
    relay.url !== form.url.trim() ||
    relay.read !== form.read ||
    relay.write !== form.write
  )
}

function getConfiguredRelayUrls(relays: RelayDto[], mode: 'read' | 'write') {
  return Array.from(
    new Set(
      relays
        .filter((relay) => (mode === 'read' ? relay.read : relay.write))
        .map((relay) => relay.url.trim())
        .filter((relayUrl) => relayUrl.length > 0)
    )
  )
}

function getEffectiveRelayDetails(relays: RelayDto[], mode: 'read' | 'write') {
  const configured = getConfiguredRelayUrls(relays, mode)

  if (configured.length > 0) {
    return {
      source: 'custom' as const,
      urls: configured,
    }
  }

  return {
    source: 'fallback' as const,
    urls: DEFAULT_NOSTR_PROFILE_RELAYS,
  }
}

function isDefaultRelayConfiguration(relays: RelayDto[]) {
  if (relays.length !== DEFAULT_NOSTR_PROFILE_RELAYS.length) {
    return false
  }

  const expected = new Set(DEFAULT_NOSTR_PROFILE_RELAYS)
  const actual = new Set(relays.map((relay) => relay.url))
  return (
    actual.size === expected.size &&
    relays.every((relay) => relay.read && relay.write && expected.has(relay.url))
  )
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getProfileImageEditorMetrics(
  image: PendingProfileImageEdit,
  zoom: number
) {
  const config = PROFILE_IMAGE_EDITOR_CONFIG[image.assetType]
  const baseScale = Math.max(
    config.viewportWidth / image.sourceWidth,
    config.viewportHeight / image.sourceHeight,
  )
  const scale = baseScale * zoom
  const scaledWidth = image.sourceWidth * scale
  const scaledHeight = image.sourceHeight * scale

  return {
    config,
    scale,
    scaledWidth,
    scaledHeight,
    minOffsetX: Math.min(0, config.viewportWidth - scaledWidth),
    maxOffsetX: 0,
    minOffsetY: Math.min(0, config.viewportHeight - scaledHeight),
    maxOffsetY: 0,
  }
}

function getCenteredProfileImageOffset(
  image: PendingProfileImageEdit,
  zoom: number
): ProfileImageEditorOffset {
  const { config, scaledWidth, scaledHeight } = getProfileImageEditorMetrics(image, zoom)

  return {
    x: (config.viewportWidth - scaledWidth) / 2,
    y: (config.viewportHeight - scaledHeight) / 2,
  }
}

function clampProfileImageEditorOffset(
  image: PendingProfileImageEdit,
  zoom: number,
  offset: ProfileImageEditorOffset
): ProfileImageEditorOffset {
  const { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY } = getProfileImageEditorMetrics(image, zoom)

  return {
    x: clampNumber(offset.x, minOffsetX, maxOffsetX),
    y: clampNumber(offset.y, minOffsetY, maxOffsetY),
  }
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read image data'))
    reader.readAsDataURL(blob)
  })
}

function readFileAsDataUrl(file: File) {
  return readBlobAsDataUrl(file)
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load the selected image'))
    image.src = dataUrl
  })
}

async function renderCroppedProfileImage(
  image: PendingProfileImageEdit,
  zoom: number,
  offset: ProfileImageEditorOffset
): Promise<ProfileImageSelection> {
  const { config, scale } = getProfileImageEditorMetrics(image, zoom)
  const sourceX = clampNumber(-offset.x / scale, 0, image.sourceWidth)
  const sourceY = clampNumber(-offset.y / scale, 0, image.sourceHeight)
  const sourceWidth = clampNumber(config.viewportWidth / scale, 1, image.sourceWidth - sourceX)
  const sourceHeight = clampNumber(config.viewportHeight / scale, 1, image.sourceHeight - sourceY)

  const canvas = document.createElement('canvas')
  canvas.width = config.outputWidth
  canvas.height = config.outputHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Image editor is not available in this browser')
  }

  const sourceImage = await loadImageFromDataUrl(image.sourceDataUrl)
  context.drawImage(
    sourceImage,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    config.outputWidth,
    config.outputHeight,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (!nextBlob) {
          reject(new Error('Failed to render the cropped image'))
          return
        }

        resolve(nextBlob)
      },
      image.mimeType,
      image.mimeType === 'image/png' ? undefined : 0.92,
    )
  })

  return {
    dataUrl: await readBlobAsDataUrl(blob),
    fileName: image.fileName,
    mimeType: blob.type || image.mimeType,
    fileSizeBytes: blob.size,
  }
}

export default function SettingsPage() {
  const { user, signOut, isLoading, isAuthenticated, isExtensionAvailable, refreshProfile } =
    useRequireAuth()
  const { setTheme } = useTheme()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState<MyProfilePayload | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM)
  const [dirtyProfileFields, setDirtyProfileFields] =
    useState<DirtyProfileFields>(EMPTY_DIRTY_PROFILE_FIELDS)
  const [additionalMetadata, setAdditionalMetadata] = useState('{}')
  const [hasLoadedLiveProfileMetadata, setHasLoadedLiveProfileMetadata] = useState(false)
  const [isProfileMetadataLoading, setIsProfileMetadataLoading] = useState(false)
  const [profileMetadataError, setProfileMetadataError] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null)
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null)
  const [profileRelayResults, setProfileRelayResults] = useState<RelayPublishResult[]>([])
  const [avatarImageSelection, setAvatarImageSelection] = useState<ProfileImageSelection | null>(null)
  const [bannerImageSelection, setBannerImageSelection] = useState<ProfileImageSelection | null>(null)
  const [pendingProfileImageEdit, setPendingProfileImageEdit] = useState<PendingProfileImageEdit | null>(null)
  const [profileImageEditorZoom, setProfileImageEditorZoom] = useState(1)
  const [profileImageEditorOffset, setProfileImageEditorOffset] = useState<ProfileImageEditorOffset>({
    x: 0,
    y: 0,
  })
  const [isDraggingProfileImageEditor, setIsDraggingProfileImageEditor] = useState(false)
  const [isApplyingProfileImageEdit, setIsApplyingProfileImageEdit] = useState(false)
  const [profileImageError, setProfileImageError] = useState<string | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsDto | null>(null)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [notificationLoaded, setNotificationLoaded] = useState(false)
  const [notificationSavedAt, setNotificationSavedAt] = useState<string | null>(null)

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettingsDto | null>(null)
  const [appearanceLoading, setAppearanceLoading] = useState(false)
  const [appearanceSaving, setAppearanceSaving] = useState(false)
  const [appearanceError, setAppearanceError] = useState<string | null>(null)
  const [appearanceLoaded, setAppearanceLoaded] = useState(false)
  const [appearanceSavedAt, setAppearanceSavedAt] = useState<string | null>(null)

  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsDto | null>(null)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securityLoaded, setSecurityLoaded] = useState(false)
  const [securityRequiresReauth, setSecurityRequiresReauth] = useState(false)
  const [securityActionError, setSecurityActionError] = useState<string | null>(null)
  const [securityActionInFlight, setSecurityActionInFlight] = useState<
    'reauth' | 'revoke-current' | 'sign-out-all' | 'download-audit' | null
  >(null)

  const [integrationsSettings, setIntegrationsSettings] = useState<IntegrationsSettingsDto | null>(null)
  const [integrationsLoading, setIntegrationsLoading] = useState(false)
  const [integrationsError, setIntegrationsError] = useState<string | null>(null)
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false)
  const [relayForm, setRelayForm] = useState<RelayFormState>(EMPTY_RELAY_FORM)
  const [editingRelayId, setEditingRelayId] = useState<string | null>(null)
  const [isSavingRelayForm, setIsSavingRelayForm] = useState(false)
  const [isResettingRelays, setIsResettingRelays] = useState(false)
  const [relayActionId, setRelayActionId] = useState<string | null>(null)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const copyTimerRef = useRef<number | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const profileImageEditorDragRef = useRef<ProfileImageEditorDragState | null>(null)
  const dirtyProfileFieldsRef = useRef<DirtyProfileFields>(EMPTY_DIRTY_PROFILE_FIELDS)
  const activeUserNpub = user?.npub ?? null
  const activeUserPubkey = user?.pubkey ?? null
  const activeUserNpubRef = useRef<string | null>(activeUserNpub)
  const notificationRequestIdRef = useRef(0)
  const appearanceRequestIdRef = useRef(0)
  const integrationsRequestIdRef = useRef(0)

  useEffect(() => {
    activeUserNpubRef.current = activeUserNpub
  }, [activeUserNpub])

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)

      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current)
      }

      copyTimerRef.current = window.setTimeout(() => {
        setCopiedValue(null)
      }, 1800)
    } catch (error) {
      console.error('Failed to copy value:', error)
    }
  }

  const ensureIntegrationsSettings = useCallback(async () => {
    const accountNpub = activeUserNpubRef.current
    if (!accountNpub) {
      return null
    }

    if (integrationsSettings) {
      return integrationsSettings
    }

    try {
      const payload = await fetchIntegrationsSettings()
      if (activeUserNpubRef.current !== accountNpub) {
        return null
      }

      setIntegrationsSettings(payload)
      setIntegrationsLoaded(true)
      return payload
    } catch {
      return null
    }
  }, [integrationsSettings])

  const resolveProfileRelayUrls = useCallback(async (mode: 'read' | 'write') => {
    const settings = await ensureIntegrationsSettings()
    const relays = settings?.relays ?? []
    const effective = getEffectiveRelayDetails(relays, mode)

    if (effective.urls.length > 0) {
      return effective.urls
    }

    return DEFAULT_NOSTR_PROFILE_RELAYS
  }, [ensureIntegrationsSettings])

  const loadSecuritySettings = useCallback(async (options?: { force?: boolean }) => {
    const accountNpub = activeUserNpubRef.current
    if (!isAuthenticated || !accountNpub) {
      return null
    }

    if (securityLoading) {
      return null
    }

    if (!options?.force && securityLoaded) {
      return securitySettings
    }

    setSecurityLoading(true)
    setSecurityError(null)

    try {
      const payload = await fetchSecuritySettings()
      if (activeUserNpubRef.current !== accountNpub) {
        return null
      }

      setSecuritySettings(payload)
      setSecurityRequiresReauth(false)
      setSecurityLoaded(true)
      return payload
    } catch (error) {
      if (activeUserNpubRef.current !== accountNpub) {
        return null
      }

      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: number }).status)
          : null

      if (status === 403) {
        setSecurityRequiresReauth(true)
        setSecuritySettings(null)
        setSecurityError(null)
      } else {
        const message = error instanceof Error ? error.message : 'Failed to load security settings'
        setSecurityError(message)
      }
      setSecurityLoaded(true)
      return null
    } finally {
      setSecurityLoading(false)
    }
  }, [isAuthenticated, securityLoaded, securityLoading, securitySettings])

  useEffect(() => {
    dirtyProfileFieldsRef.current = dirtyProfileFields
  }, [dirtyProfileFields])

  useEffect(() => {
    if (!isAuthenticated || !activeUserNpub) {
      setProfileData(null)
      setProfileError(null)
      setIsProfileLoading(false)
      setProfileForm(EMPTY_PROFILE_FORM)
      setDirtyProfileFields(EMPTY_DIRTY_PROFILE_FIELDS)
      setAdditionalMetadata('{}')
      setHasLoadedLiveProfileMetadata(false)
      setIsProfileMetadataLoading(false)
      setProfileMetadataError(null)
      setProfileSaveError(null)
      setProfileSaveSuccess(null)
      setProfileRelayResults([])
      setAvatarImageSelection(null)
      setBannerImageSelection(null)
      setPendingProfileImageEdit(null)
      setProfileImageError(null)
      setNotificationSettings(null)
      setNotificationLoading(false)
      setNotificationSaving(false)
      setNotificationError(null)
      setNotificationLoaded(false)
      setNotificationSavedAt(null)
      setAppearanceSettings(null)
      setAppearanceLoading(false)
      setAppearanceSaving(false)
      setAppearanceError(null)
      setAppearanceLoaded(false)
      setAppearanceSavedAt(null)
      setSecuritySettings(null)
      setSecurityLoading(false)
      setSecurityError(null)
      setSecurityLoaded(false)
      setSecurityRequiresReauth(false)
      setSecurityActionError(null)
      setSecurityActionInFlight(null)
      setIntegrationsSettings(null)
      setIntegrationsLoading(false)
      setIntegrationsError(null)
      setIntegrationsLoaded(false)
      setRelayForm(EMPTY_RELAY_FORM)
      setEditingRelayId(null)
      setIsSavingRelayForm(false)
      setIsResettingRelays(false)
      setRelayActionId(null)
      return
    }

    let cancelled = false

    const loadProfile = async () => {
      setIsProfileLoading(true)
      setProfileError(null)

      try {
        const payload = await fetchMyProfile()
        if (!cancelled) {
          setProfileData(payload)
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load profile'
          setProfileError(message)
        }
      } finally {
        if (!cancelled) {
          setIsProfileLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [activeUserNpub, isAuthenticated])

  useEffect(() => {
    if (!profileData) {
      return
    }

    setProfileForm(createProfileForm(profileData.profile))
    setDirtyProfileFields(EMPTY_DIRTY_PROFILE_FIELDS)
    setHasLoadedLiveProfileMetadata(false)
    setAvatarImageSelection(null)
    setBannerImageSelection(null)
    setPendingProfileImageEdit(null)
    setProfileImageError(null)
  }, [profileData])

  useEffect(() => {
    if (!pendingProfileImageEdit) {
      setProfileImageEditorZoom(1)
      setProfileImageEditorOffset({ x: 0, y: 0 })
      setIsDraggingProfileImageEditor(false)
      profileImageEditorDragRef.current = null
      return
    }

    setProfileImageEditorZoom(1)
    setProfileImageEditorOffset(getCenteredProfileImageOffset(pendingProfileImageEdit, 1))
    setIsDraggingProfileImageEditor(false)
    profileImageEditorDragRef.current = null
  }, [pendingProfileImageEdit])

  useEffect(() => {
    if (!isAuthenticated || !profileData?.profile.pubkey) {
      return
    }

    let cancelled = false

    const loadLiveMetadata = async () => {
      setIsProfileMetadataLoading(true)
      setProfileMetadataError(null)

      try {
        const readRelays = await resolveProfileRelayUrls('read')
        const metadata = await fetchLatestProfileMetadata(profileData.profile.pubkey, readRelays)
        if (cancelled) {
          return
        }

        if (metadata) {
          setProfileForm((current) =>
            mergeProfileFormWithMetadata(
              current,
              metadata,
              dirtyProfileFieldsRef.current
            )
          )
          setAdditionalMetadata(formatExtraMetadata(stripEditableMetadata(metadata)))
          setHasLoadedLiveProfileMetadata(true)
          return
        }

        if (!profileData.profile.profileEventCreatedAt) {
          setAdditionalMetadata('{}')
          setHasLoadedLiveProfileMetadata(true)
          return
        }

        setProfileMetadataError(
          'Could not load your latest live Nostr metadata. Refresh it before broadcasting profile changes.'
        )
      } catch (error) {
        if (cancelled) {
          return
        }

        const message =
          error instanceof Error ? error.message : 'Failed to load live Nostr metadata'
        setProfileMetadataError(message)
      } finally {
        if (!cancelled) {
          setIsProfileMetadataLoading(false)
        }
      }
    }

    void loadLiveMetadata()

    return () => {
      cancelled = true
    }
  }, [
    isAuthenticated,
    profileData?.profile.pubkey,
    profileData?.profile.profileEventCreatedAt,
    resolveProfileRelayUrls,
  ])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'notifications' || notificationLoaded || notificationLoading) {
      return
    }

    const accountNpub = activeUserNpubRef.current
    if (!accountNpub) {
      return
    }

    const requestId = notificationRequestIdRef.current + 1
    notificationRequestIdRef.current = requestId

    const loadNotifications = async () => {
      setNotificationLoading(true)
      setNotificationError(null)

      try {
        const payload = await fetchNotificationSettings()
        if (
          notificationRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          setNotificationSettings(payload)
        }
      } catch (error) {
        if (
          notificationRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          const message = error instanceof Error ? error.message : 'Failed to load notifications'
          setNotificationError(message)
        }
      } finally {
        if (
          notificationRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          setNotificationLoading(false)
          setNotificationLoaded(true)
        }
      }
    }

    void loadNotifications()
  }, [activeTab, activeUserNpub, isAuthenticated, notificationLoaded, notificationLoading])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'appearance' || appearanceLoaded || appearanceLoading) {
      return
    }

    const accountNpub = activeUserNpubRef.current
    if (!accountNpub) {
      return
    }

    const requestId = appearanceRequestIdRef.current + 1
    appearanceRequestIdRef.current = requestId

    const loadAppearance = async () => {
      setAppearanceLoading(true)
      setAppearanceError(null)

      try {
        const payload = await fetchAppearanceSettings()
        if (
          appearanceRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          setAppearanceSettings(payload)
          setTheme(payload.theme)
        }
      } catch (error) {
        if (
          appearanceRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          const message = error instanceof Error ? error.message : 'Failed to load appearance'
          setAppearanceError(message)
        }
      } finally {
        if (
          appearanceRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          setAppearanceLoading(false)
          setAppearanceLoaded(true)
        }
      }
    }

    void loadAppearance()
  }, [activeTab, activeUserNpub, appearanceLoaded, appearanceLoading, isAuthenticated, setTheme])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'security' || securityLoaded || securityLoading) {
      return
    }

    void loadSecuritySettings()
  }, [activeTab, activeUserNpub, isAuthenticated, loadSecuritySettings, securityLoaded, securityLoading])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'api' || integrationsLoaded || integrationsLoading) {
      return
    }

    const accountNpub = activeUserNpubRef.current
    if (!accountNpub) {
      return
    }

    const requestId = integrationsRequestIdRef.current + 1
    integrationsRequestIdRef.current = requestId

    const loadIntegrations = async () => {
      setIntegrationsLoading(true)
      setIntegrationsError(null)

      try {
        const payload = await fetchIntegrationsSettings()
        if (
          integrationsRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          setIntegrationsSettings(payload)
        }
      } catch (error) {
        if (
          integrationsRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          const message = error instanceof Error ? error.message : 'Failed to load integrations'
          setIntegrationsError(message)
        }
      } finally {
        if (
          integrationsRequestIdRef.current === requestId &&
          activeUserNpubRef.current === accountNpub
        ) {
          setIntegrationsLoading(false)
          setIntegrationsLoaded(true)
        }
      }
    }

    void loadIntegrations()
  }, [activeTab, activeUserNpub, integrationsLoaded, integrationsLoading, isAuthenticated])

  const handleRefreshProfile = async () => {
    setIsRefreshingProfile(true)
    setProfileError(null)

    try {
      const payload = await refreshMyProfileFromApi()
      setProfileData(payload)
      await refreshProfile()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh profile'
      setProfileError(message)
    } finally {
      setIsRefreshingProfile(false)
    }
  }

  const handleProfileFieldChange = (key: keyof ProfileFormState, value: string) => {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }))
    setDirtyProfileFields((current) => ({
      ...current,
      [key]: true,
    }))
    setProfileImageError(null)
    setProfileSaveError(null)
    setProfileSaveSuccess(null)
  }

  const applyProfileImageSelection = (
    assetType: ProfileImageAssetType,
    nextImage: ProfileImageSelection
  ) => {
    if (assetType === 'avatar') {
      setAvatarImageSelection(nextImage)
      handleProfileFieldChange('picture', nextImage.dataUrl)
      return
    }

    setBannerImageSelection(nextImage)
    handleProfileFieldChange('banner', nextImage.dataUrl)
  }

  const handleProfileImageSelection = (
    assetType: ProfileImageAssetType,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(file.type)) {
      setProfileImageError('Please choose a JPG, PNG, or WEBP image.')
      return
    }

    if (file.size > MAX_PROFILE_IMAGE_FILE_SIZE_BYTES) {
      setProfileImageError('Profile images must be 5MB or smaller.')
      return
    }

    void (async () => {
      try {
        const sourceDataUrl = await readFileAsDataUrl(file)
        const sourceImage = await loadImageFromDataUrl(sourceDataUrl)
        setPendingProfileImageEdit({
          assetType,
          sourceDataUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          sourceWidth: sourceImage.naturalWidth || sourceImage.width,
          sourceHeight: sourceImage.naturalHeight || sourceImage.height,
        })
        setProfileImageError(null)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to prepare the selected image'
        setProfileImageError(message)
      }
    })()
  }

  const clearProfileImage = (assetType: ProfileImageAssetType) => {
    if (assetType === 'avatar') {
      setAvatarImageSelection(null)
      handleProfileFieldChange('picture', '')
      if (avatarInputRef.current) {
        avatarInputRef.current.value = ''
      }
    } else {
      setBannerImageSelection(null)
      handleProfileFieldChange('banner', '')
      if (bannerInputRef.current) {
        bannerInputRef.current.value = ''
      }
    }

    setProfileImageError(null)
  }

  const handleProfileImageEditorOpenChange = (open: boolean) => {
    if (open || isApplyingProfileImageEdit) {
      return
    }

    setPendingProfileImageEdit(null)
  }

  const handleProfileImageEditorZoomChange = (value: number[]) => {
    const nextZoom = value[0] ?? 1
    if (!pendingProfileImageEdit) {
      return
    }

    const currentMetrics = getProfileImageEditorMetrics(pendingProfileImageEdit, profileImageEditorZoom)
    const nextMetrics = getProfileImageEditorMetrics(pendingProfileImageEdit, nextZoom)
    const focusX = (currentMetrics.config.viewportWidth / 2 - profileImageEditorOffset.x) / currentMetrics.scale
    const focusY = (currentMetrics.config.viewportHeight / 2 - profileImageEditorOffset.y) / currentMetrics.scale
    const nextOffset = clampProfileImageEditorOffset(pendingProfileImageEdit, nextZoom, {
      x: nextMetrics.config.viewportWidth / 2 - focusX * nextMetrics.scale,
      y: nextMetrics.config.viewportHeight / 2 - focusY * nextMetrics.scale,
    })

    setProfileImageEditorZoom(nextZoom)
    setProfileImageEditorOffset(nextOffset)
  }

  const handleProfileImageEditorPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!pendingProfileImageEdit) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    profileImageEditorDragRef.current = {
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startOffset: profileImageEditorOffset,
    }
    setIsDraggingProfileImageEditor(true)
  }

  const handleProfileImageEditorPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    const dragState = profileImageEditorDragRef.current
    if (!pendingProfileImageEdit || !dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    const nextOffset = clampProfileImageEditorOffset(pendingProfileImageEdit, profileImageEditorZoom, {
      x: dragState.startOffset.x + (event.clientX - dragState.originX),
      y: dragState.startOffset.y + (event.clientY - dragState.originY),
    })

    setProfileImageEditorOffset(nextOffset)
  }

  const finishProfileImageEditorDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = profileImageEditorDragRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    profileImageEditorDragRef.current = null
    setIsDraggingProfileImageEditor(false)
  }

  const handleApplyProfileImageEdit = async () => {
    if (!pendingProfileImageEdit) {
      return
    }

    setIsApplyingProfileImageEdit(true)

    try {
      const nextImage = await renderCroppedProfileImage(
        pendingProfileImageEdit,
        profileImageEditorZoom,
        profileImageEditorOffset,
      )

      applyProfileImageSelection(pendingProfileImageEdit.assetType, nextImage)
      setPendingProfileImageEdit(null)
      setProfileImageError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to crop the selected image'
      setProfileImageError(message)
    } finally {
      setIsApplyingProfileImageEdit(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileData) {
      return
    }

    if (!activeUserPubkey || activeUserPubkey !== profileData.profile.pubkey) {
      setProfileSaveError(
        'The active account changed while this page still had older profile data. Reload your profile settings and try again.'
      )
      return
    }

    if (!isExtensionAvailable) {
      setProfileSaveError(
        'Publishing profile metadata currently requires a Nostr signing extension with NIP-07 support.'
      )
      return
    }

    if (isProfileMetadataLoading || !hasLoadedLiveProfileMetadata) {
      setProfileSaveError(
        profileMetadataError
          ? `${profileMetadataError}. Load live Nostr metadata before broadcasting profile changes.`
          : 'Live Nostr metadata is still loading. Wait for it to finish before broadcasting profile changes.'
      )
      return
    }

    setProfileSaving(true)
    setProfileSaveError(null)
    setProfileSaveSuccess(null)
    setProfileRelayResults([])
    setProfileImageError(null)

    try {
      const nextProfileForm = { ...profileForm }
      const imageUploadTasks: Array<
        Promise<{
          assetType: ProfileImageAssetType
          response: UploadProfileImageResponse
        }>
      > = []

      if (avatarImageSelection) {
        imageUploadTasks.push(
          uploadMyProfileImage('avatar', {
            image: avatarImageSelection,
          }).then((response) => ({
            assetType: 'avatar',
            response,
          }))
        )
      }

      if (bannerImageSelection) {
        imageUploadTasks.push(
          uploadMyProfileImage('banner', {
            image: bannerImageSelection,
          }).then((response) => ({
            assetType: 'banner',
            response,
          }))
        )
      }

      const imageUploadResponses = await Promise.all(imageUploadTasks)

      for (const upload of imageUploadResponses) {
        if (upload.assetType === 'avatar') {
          nextProfileForm.picture = upload.response.url
          continue
        }

        nextProfileForm.banner = upload.response.url
      }

      const profile = buildEditableProfileMetadata(nextProfileForm)
      const extraMetadata = parseExtraMetadata(additionalMetadata)
      const mergedMetadata = buildProfileMetadataContent(profile, extraMetadata)
      const signedEvent = await signKind0MetadataEvent(mergedMetadata)

      if (!signedEvent) {
        throw new Error(
          'Failed to sign the kind 0 metadata event. Make sure your Nostr extension is unlocked.'
        )
      }

      const writeRelays = await resolveProfileRelayUrls('write')
      const relayResults = await publishEventToRelays(signedEvent, writeRelays)
      const successfulRelayCount = relayResults.filter((relay) => relay.success).length

      setProfileRelayResults(relayResults)

      if (successfulRelayCount === 0) {
        throw new Error(
          'All relay publishes failed. Your new profile metadata was not accepted by any relay.'
        )
      }

      const optimizationToast = buildProfileImageOptimizationToastPayload(
        imageUploadResponses.map((upload) => upload.response)
      )
      if (optimizationToast) {
        toast(optimizationToast)
      }

      try {
        const payload = await publishMyProfile({
          profile,
          signedEvent,
        })

        setProfileData(payload)
        setProfileForm(nextProfileForm)
        setDirtyProfileFields(EMPTY_DIRTY_PROFILE_FIELDS)
        setProfileSaveSuccess(
          `Published kind 0 metadata to ${successfulRelayCount}/${relayResults.length} relays and refreshed Mist Story's cache.`
        )
        await refreshProfile()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Mist Story failed to refresh its cached profile'
        setProfileSaveError(
          `${message}. Your metadata was still published to Nostr. You can use "Refresh from Nostr" to pull the latest copy back into Mist Story.`
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish profile metadata'
      setProfileSaveError(message)
    } finally {
      setProfileSaving(false)
    }
  }

  const saveNotificationSettings = async (nextSettings: NotificationSettingsDto) => {
    const previous = notificationSettings
    setNotificationSettings(nextSettings)
    setNotificationSaving(true)
    setNotificationError(null)
    setNotificationSavedAt(null)

    try {
      const saved = await updateNotificationSettings(nextSettings)
      setNotificationSettings(saved)
      setNotificationSavedAt(new Date().toISOString())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save notification settings'
      setNotificationError(message)
      setNotificationSettings(previous ?? nextSettings)
    } finally {
      setNotificationSaving(false)
    }
  }

  const handleToggleNotification = async (key: keyof NotificationSettingsDto) => {
    if (!notificationSettings) {
      return
    }

    await saveNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key],
    })
  }

  const handleApplyNotificationPreset = async (
    mode: 'all' | 'reading-only' | 'mute'
  ) => {
    if (!notificationSettings) {
      return
    }

    const nextSettings: NotificationSettingsDto =
      mode === 'all'
        ? {
            emailNotifications: true,
            newChapterNotifications: true,
            commentNotifications: true,
            followNotifications: true,
          }
        : mode === 'reading-only'
          ? {
              emailNotifications: true,
              newChapterNotifications: true,
              commentNotifications: false,
              followNotifications: false,
            }
          : {
              emailNotifications: false,
              newChapterNotifications: false,
              commentNotifications: false,
              followNotifications: false,
            }

    await saveNotificationSettings(nextSettings)
  }

  const saveAppearanceSettings = async (
    nextSettings: AppearanceSettingsDto,
    previousTheme = appearanceSettings?.theme
  ) => {
    const previous = appearanceSettings
    setAppearanceSettings(nextSettings)
    setAppearanceSaving(true)
    setAppearanceError(null)
    setAppearanceSavedAt(null)

    try {
      const saved = await updateAppearanceSettings(nextSettings)
      setAppearanceSettings(saved)
      setAppearanceSavedAt(new Date().toISOString())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save appearance settings'
      setAppearanceError(message)
      setAppearanceSettings(previous ?? nextSettings)
      if (previousTheme) {
        setTheme(previousTheme)
      }
    } finally {
      setAppearanceSaving(false)
    }
  }

  const handleAppearanceThemeChange = async (nextTheme: AppearanceSettingsDto['theme']) => {
    if (!appearanceSettings) {
      return
    }

    const previousTheme = appearanceSettings.theme
    setTheme(nextTheme)
    await saveAppearanceSettings({
      ...appearanceSettings,
      theme: nextTheme,
    }, previousTheme)
  }

  const handleAppearanceFontSizeChange = async (nextFontSize: AppearanceSettingsDto['fontSize']) => {
    if (!appearanceSettings) {
      return
    }

    await saveAppearanceSettings({
      ...appearanceSettings,
      fontSize: nextFontSize,
    })
  }

  const handleResetAppearance = async () => {
    setTheme('system')
    await saveAppearanceSettings({
      theme: 'system',
      fontSize: 'medium',
    }, appearanceSettings?.theme)
  }

  const runSecurityReauth = useCallback(async () => {
    if (!isExtensionAvailable) {
      throw new Error('Sensitive actions require a Nostr signing extension with NIP-07 support.')
    }

    const accountPubkey = securitySettings?.pubkey ?? user?.pubkey ?? profileData?.profile.pubkey ?? null
    if (!accountPubkey) {
      throw new Error('Could not determine the current account pubkey for re-authentication.')
    }

    const pubkey = await getPublicKey()
    if (!pubkey) {
      throw new Error('Could not read your Nostr public key from the extension.')
    }

    if (pubkey !== accountPubkey) {
      throw new Error('The connected Nostr extension does not match the current Mist Story account.')
    }

    setSecurityActionInFlight('reauth')
    const { challenge } = await requestReauthChallenge()
    const signedEvent = await signAuthChallengeWithExtension(pubkey, challenge)

    if (!signedEvent) {
      throw new Error('Re-authentication was cancelled or the extension could not sign the challenge.')
    }

    await verifyReauthChallenge({
      challenge,
      signedEvent,
    })
  }, [isExtensionAvailable, profileData?.profile.pubkey, securitySettings?.pubkey, user?.pubkey])

  const handleUnlockSecurityDetails = async () => {
    setSecurityActionError(null)

    try {
      await runSecurityReauth()
      await loadSecuritySettings({ force: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlock security details'
      setSecurityActionError(message)
    } finally {
      setSecurityActionInFlight(null)
    }
  }

  const handleRevokeCurrentSecuritySession = async () => {
    setSecurityActionError(null)

    try {
      await runSecurityReauth()
      setSecurityActionInFlight('revoke-current')
      await revokeCurrentSecuritySession()
      signOut()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke the current session'
      setSecurityActionError(message)
    } finally {
      setSecurityActionInFlight(null)
    }
  }

  const handleSignOutAllSecuritySessions = async () => {
    setSecurityActionError(null)

    try {
      await runSecurityReauth()
      setSecurityActionInFlight('sign-out-all')
      await signOutAllSecuritySessions()
      signOut()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out all sessions'
      setSecurityActionError(message)
    } finally {
      setSecurityActionInFlight(null)
    }
  }

  const handleDownloadSecurityAuditLog = async () => {
    setSecurityActionError(null)

    try {
      await runSecurityReauth()
      setSecurityActionInFlight('download-audit')
      const payload = await downloadSecurityAuditLog()
      const fallbackFileName = `mist-security-audit-${new Date().toISOString().slice(0, 10)}.json`
      downloadBlobFile(
        payload.blob,
        resolveDownloadFileName(payload.fileName, fallbackFileName)
      )
      toast({
        title: 'Security audit log downloaded',
        description: 'Your latest authentication activity has been exported as JSON.',
      })
      await loadSecuritySettings({ force: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download the security audit log'
      setSecurityActionError(message)
    } finally {
      setSecurityActionInFlight(null)
    }
  }

  const resetRelayForm = () => {
    setRelayForm(EMPTY_RELAY_FORM)
    setEditingRelayId(null)
    setIntegrationsError(null)
  }

  const handleSaveRelay = async () => {
    const url = relayForm.url.trim()
    if (!url) {
      setIntegrationsError('Relay URL is required')
      return
    }

    if (!relayForm.read && !relayForm.write) {
      setIntegrationsError('Enable read or write for this relay')
      return
    }

    setIsSavingRelayForm(true)
    setIntegrationsError(null)

    try {
      const payload = editingRelayId
        ? await updateRelay(editingRelayId, {
            url,
            read: relayForm.read,
            write: relayForm.write,
          })
        : await createRelay({
            url,
            read: relayForm.read,
            write: relayForm.write,
          })

      resetRelayForm()
      setIntegrationsSettings((current) => {
        if (!current) {
          return {
            apiKeys: [],
            relays: [payload],
          }
        }

        if (editingRelayId) {
          return {
            ...current,
            relays: current.relays.map((relay) => (relay.id === editingRelayId ? payload : relay)),
          }
        }

        return {
          ...current,
          relays: [payload, ...current.relays],
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save relay'
      setIntegrationsError(message)
    } finally {
      setIsSavingRelayForm(false)
    }
  }

  const handleEditRelay = (relay: RelayDto) => {
    setIntegrationsError(null)
    setEditingRelayId(relay.id)
    setRelayForm(createRelayFormState(relay))
  }

  const handleToggleRelayRole = async (
    relay: RelayDto,
    mode: 'read' | 'write',
    checked: boolean
  ) => {
    const nextRelay = {
      ...relay,
      read: mode === 'read' ? checked : relay.read,
      write: mode === 'write' ? checked : relay.write,
    }

    if (!nextRelay.read && !nextRelay.write) {
      setIntegrationsError('Enable read or write for this relay')
      return
    }

    setRelayActionId(relay.id)
    setIntegrationsError(null)

    try {
      const payload = await updateRelay(relay.id, {
        url: relay.url,
        read: nextRelay.read,
        write: nextRelay.write,
      })
      setIntegrationsSettings((current) =>
        current
          ? {
              ...current,
              relays: current.relays.map((item) => (item.id === relay.id ? payload : item)),
            }
          : current
      )

      if (editingRelayId === relay.id) {
        setRelayForm(createRelayFormState(payload))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update relay'
      setIntegrationsError(message)
    } finally {
      setRelayActionId(null)
    }
  }

  const handleAddRecommendedRelay = async (url: string) => {
    setRelayActionId(url)
    setIntegrationsError(null)

    try {
      const payload = await createRelay({
        url,
        read: true,
        write: true,
      })
      setIntegrationsSettings((current) =>
        current
          ? {
              ...current,
              relays: [payload, ...current.relays],
            }
          : {
              apiKeys: [],
              relays: [payload],
            }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add relay'
      setIntegrationsError(message)
    } finally {
      setRelayActionId(null)
    }
  }

  const handleDeleteRelay = async (relayId: string) => {
    setRelayActionId(relayId)
    setIntegrationsError(null)

    try {
      await deleteRelay(relayId)
      setIntegrationsSettings((current) =>
        current
          ? {
              ...current,
              relays: current.relays.filter((relay) => relay.id !== relayId),
            }
          : current
      )

      if (editingRelayId === relayId) {
        resetRelayForm()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove relay'
      setIntegrationsError(message)
    } finally {
      setRelayActionId(null)
    }
  }

  const handleResetRelaysToDefault = async () => {
    setIsResettingRelays(true)
    setIntegrationsError(null)

    try {
      const currentRelays = integrationsSettings?.relays ?? []
      const defaultRelayUrls = new Set(DEFAULT_NOSTR_PROFILE_RELAYS)
      const seenDefaultRelayUrls = new Set<string>()

      for (const relay of currentRelays) {
        if (!defaultRelayUrls.has(relay.url) || seenDefaultRelayUrls.has(relay.url)) {
          await deleteRelay(relay.id)
          continue
        }

        seenDefaultRelayUrls.add(relay.url)

        if (!relay.read || !relay.write) {
          await updateRelay(relay.id, {
            url: relay.url,
            read: true,
            write: true,
          })
        }
      }

      const configuredUrls = new Set(currentRelays.map((relay) => relay.url))
      for (const relayUrl of DEFAULT_NOSTR_PROFILE_RELAYS) {
        if (!configuredUrls.has(relayUrl)) {
          await createRelay({
            url: relayUrl,
            read: true,
            write: true,
          })
        }
      }

      const payload = await fetchIntegrationsSettings()
      setIntegrationsSettings(payload)
      setIntegrationsLoaded(true)
      resetRelayForm()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to reset relays to the default set'
      setIntegrationsError(message)

      try {
        const payload = await fetchIntegrationsSettings()
        setIntegrationsSettings(payload)
        setIntegrationsLoaded(true)
      } catch {
        // Keep the original reset error visible if the refresh also fails.
      }
    } finally {
      setIsResettingRelays(false)
    }
  }

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'Nostr Relays', icon: RadioTower },
  ]

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

  const configuredRelays = integrationsSettings?.relays ?? []
  const sortedConfiguredRelays = [...configuredRelays].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  )
  const editingRelay = editingRelayId
    ? configuredRelays.find((relay) => relay.id === editingRelayId) ?? null
    : null
  const configuredReadRelays = getConfiguredRelayUrls(configuredRelays, 'read')
  const configuredWriteRelays = getConfiguredRelayUrls(configuredRelays, 'write')
  const effectiveReadRelays = getEffectiveRelayDetails(configuredRelays, 'read')
  const effectiveWriteRelays = getEffectiveRelayDetails(configuredRelays, 'write')
  const effectiveReadSource =
    effectiveReadRelays.source === 'custom' ? 'Custom relays' : 'Built-in fallback'
  const effectiveWriteSource =
    effectiveWriteRelays.source === 'custom' ? 'Custom relays' : 'Built-in fallback'
  const recommendedRelayUrls = DEFAULT_NOSTR_PROFILE_RELAYS.filter(
    (relayUrl) => !configuredRelays.some((relay) => relay.url === relayUrl)
  )
  const isUsingDefaultRelaySet = isDefaultRelayConfiguration(configuredRelays)
  const relayFormHasChanges = editingRelay ? hasRelayFormChanges(editingRelay, relayForm) : true
  const relayFormSubmitDisabled =
    isSavingRelayForm ||
    isResettingRelays ||
    !isRelayFormValid(relayForm) ||
    (editingRelay ? !relayFormHasChanges : false)
  const activeSecuritySessions = [...(securitySettings?.activeSessions ?? [])].sort(
    (left, right) => right.authenticatedAt.localeCompare(left.authenticatedAt)
  )
  const enabledNotificationCount = notificationSettings
    ? countEnabledNotificationSettings(notificationSettings)
    : 0
  const emailNotificationsEnabled = notificationSettings?.emailNotifications ?? false
  const selectedThemeOption =
    APPEARANCE_THEME_OPTIONS.find((option) => option.value === appearanceSettings?.theme) ?? null
  const selectedFontSizeOption =
    APPEARANCE_FONT_SIZE_OPTIONS.find((option) => option.value === appearanceSettings?.fontSize) ?? null
  const securityReauth = securitySettings?.reauth ?? null
  const isSecurityActionPending = securityActionInFlight !== null

  const activeProfileImageEditorConfig = pendingProfileImageEdit
    ? PROFILE_IMAGE_EDITOR_CONFIG[pendingProfileImageEdit.assetType]
    : null
  const activeProfileImageEditorMetrics = pendingProfileImageEdit
    ? getProfileImageEditorMetrics(pendingProfileImageEdit, profileImageEditorZoom)
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      <div className={`${pageContentContainerClassName} ${pageSectionPaddingClassName}`}>
        <h1 className={pageHeadingTitleClassName}>Settings</h1>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <nav className="lg:col-span-1">
            <div className="space-y-1 border border-border/40 rounded bg-card p-2">
              {settingsSections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
                      activeTab === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                )
              })}
              <Separator className="my-2" />
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium text-destructive hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </nav>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Profile Settings</h2>
                  <div className="rounded border border-border/40 bg-card p-6">
                    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                      <p>
                        This form edits your public Nostr kind `0` metadata. Mist Story supports the
                        core NIP-01 fields `name`, `about`, and `picture`, plus the profile fields we
                        already surface in-app such as `display_name`, `banner`, `website`, `nip05`,
                        and `lud16`.
                      </p>
                      <p>
                        When you save, Mist Story signs a fresh kind `0` event through your NIP-07
                        extension, broadcasts it to your write relays, and then updates the cached
                        profile used across the site.
                      </p>
                    </div>
                  </div>
                </div>

                {isProfileLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : profileError ? (
                  <div className="rounded border border-destructive/30 bg-card p-6 text-destructive">
                    {profileError}
                  </div>
                ) : profileData ? (
                  <>
                    <Dialog
                      open={pendingProfileImageEdit !== null}
                      onOpenChange={handleProfileImageEditorOpenChange}
                    >
                      {pendingProfileImageEdit && activeProfileImageEditorConfig && activeProfileImageEditorMetrics ? (
                        <DialogContent className="w-full max-w-[min(36rem,calc(100%-1.5rem))] gap-5 p-0 sm:max-w-2xl" showCloseButton={false}>
                          <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-4 text-left">
                            <div>
                              <DialogTitle>Edit media</DialogTitle>
                              <DialogDescription className="mt-1">
                                Adjust your {activeProfileImageEditorConfig.label} before applying it to the profile form.
                              </DialogDescription>
                            </div>
                            <Button
                              type="button"
                              className="rounded-full px-5"
                              onClick={() => void handleApplyProfileImageEdit()}
                              disabled={isApplyingProfileImageEdit}
                            >
                              {isApplyingProfileImageEdit ? 'Applying...' : 'Apply'}
                            </Button>
                          </DialogHeader>

                          <div className="space-y-4 px-5 pb-5">
                            <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-900/60">
                              <div
                                className={cn(
                                  'relative mx-auto overflow-hidden border-4 border-sky-500 bg-black/90 shadow-inner touch-none select-none',
                                  pendingProfileImageEdit.assetType === 'avatar' ? 'rounded-[2rem]' : 'rounded-2xl',
                                  isDraggingProfileImageEditor ? 'cursor-grabbing' : 'cursor-grab',
                                )}
                                style={{
                                  width: `${activeProfileImageEditorConfig.viewportWidth}px`,
                                  height: `${activeProfileImageEditorConfig.viewportHeight}px`,
                                }}
                                onPointerDown={handleProfileImageEditorPointerDown}
                                onPointerMove={handleProfileImageEditorPointerMove}
                                onPointerUp={finishProfileImageEditorDrag}
                                onPointerCancel={finishProfileImageEditorDrag}
                              >
                                <img
                                  src={pendingProfileImageEdit.sourceDataUrl}
                                  alt={`Selected ${activeProfileImageEditorConfig.label}`}
                                  className="pointer-events-none absolute left-0 top-0 max-w-none"
                                  style={{
                                    width: `${activeProfileImageEditorMetrics.scaledWidth}px`,
                                    height: `${activeProfileImageEditorMetrics.scaledHeight}px`,
                                    transform: `translate(${profileImageEditorOffset.x}px, ${profileImageEditorOffset.y}px)`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-border/50 bg-background/80 px-4 py-3">
                              <p className="text-sm text-muted-foreground">
                                {activeProfileImageEditorConfig.helperText}
                              </p>
                              <div className="flex items-center gap-3">
                                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                                <Slider
                                  value={[profileImageEditorZoom]}
                                  min={1}
                                  max={PROFILE_IMAGE_EDITOR_MAX_ZOOM}
                                  step={0.01}
                                  onValueChange={handleProfileImageEditorZoomChange}
                                  aria-label="Zoom selected image"
                                />
                                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>

                          <DialogFooter className="border-t px-5 py-4 sm:justify-between">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setPendingProfileImageEdit(null)}
                              disabled={isApplyingProfileImageEdit}
                            >
                              Cancel
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              JPG, PNG, and WEBP are supported. We upload the cropped result to R2 when you save.
                            </p>
                          </DialogFooter>
                        </DialogContent>
                      ) : null}
                    </Dialog>

                    <div className="overflow-hidden rounded border border-border/40 bg-card">
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => handleProfileImageSelection('banner', event)}
                        className="hidden"
                      />
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => handleProfileImageSelection('avatar', event)}
                        className="hidden"
                      />

                      <div className="relative h-40 w-full bg-muted">
                        {profileForm.banner ? (
                          <img
                            src={profileForm.banner}
                            alt="Profile banner preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-muted via-muted/80 to-muted">
                            <div className="text-center text-sm text-muted-foreground">
                              <p>No banner selected</p>
                              <p className="mt-1 text-xs">Recommended wide image, JPG/PNG/WEBP, up to 5MB</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-t from-black/65 via-black/35 to-transparent p-4">
                          <div>
                            <p className="text-sm font-medium text-white">Banner image</p>
                            <p className="text-xs text-white/80">
                              Upload to R2 from this page, then publish it in your next kind 0 update.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="gap-2"
                              onClick={() => bannerInputRef.current?.click()}
                            >
                              <ImagePlus className="h-4 w-4" />
                              {profileForm.banner ? 'Change banner' : 'Upload banner'}
                            </Button>
                            {profileForm.banner ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                                onClick={() => clearProfileImage('banner')}
                              >
                                <X className="h-4 w-4" />
                                Remove
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                className="group relative block rounded-full transition-transform hover:scale-[1.02]"
                                aria-label="Choose profile picture"
                              >
                                {profileForm.picture ? (
                                  <img
                                    src={profileForm.picture}
                                    alt={profileData.profile.displayName ?? 'Profile avatar'}
                                    className="h-20 w-20 rounded-full border border-border/60 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-border/70 bg-muted text-muted-foreground">
                                    <User className="h-7 w-7" />
                                  </div>
                                )}
                                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white transition-colors group-hover:bg-black/45">
                                  <Camera className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                                </span>
                              </button>
                              {profileForm.picture ? (
                                <button
                                  type="button"
                                  onClick={() => clearProfileImage('avatar')}
                                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground transition-colors hover:bg-destructive/90"
                                  aria-label="Remove profile picture"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </div>
                            <div>
                              <h3 className="font-serif text-xl font-semibold text-foreground">
                                {profileData.profile.displayName ?? profileData.profile.handle ?? 'Unnamed profile'}
                              </h3>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Click the avatar to choose a new profile picture.
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <code
                                  className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded bg-muted px-2 py-1 text-xs text-muted-foreground"
                                  title={profileData.profile.npub}
                                >
                                  {compactValue(profileData.profile.npub)}
                                </code>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-2"
                                  onClick={() => void handleCopy(profileData.profile.npub)}
                                >
                                  {copiedValue === profileData.profile.npub ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy npub
                                    </>
                                  )}
                                </Button>
                              </div>
                              {profileData.profile.nip05 && (
                                <p className="text-sm text-muted-foreground">@{profileData.profile.nip05}</p>
                              )}
                            </div>
                          </div>
                        <div className="flex flex-col gap-3 lg:max-w-xs lg:items-end">
                            {profileImageError ? (
                              <p className="max-w-xs text-sm text-destructive">{profileImageError}</p>
                            ) : (
                              <p className="max-w-xs text-right text-xs text-muted-foreground">
                                Avatar and banner uploads support JPG, PNG, and WEBP up to 5MB each.
                                Files go to Cloudflare R2 when you save.
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 lg:justify-end">
                            <Button
                              variant="outline"
                              onClick={() => void handleRefreshProfile()}
                              disabled={isRefreshingProfile}
                            >
                              {isRefreshingProfile ? 'Refreshing...' : 'Refresh from Nostr'}
                            </Button>
                            <Button asChild>
                              <Link href={`/profile/${user?.npub}`}>View Profile</Link>
                            </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded border border-border/40 bg-background p-4">
                            <div className="text-2xl font-semibold text-foreground">
                              {profileData.stats.novels.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Novels</div>
                          </div>
                          <div className="rounded border border-border/40 bg-background p-4">
                            <div className="text-2xl font-semibold text-foreground">
                              {profileData.stats.followers.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Followers</div>
                          </div>
                          <div className="rounded border border-border/40 bg-background p-4">
                            <div className="text-2xl font-semibold text-foreground">
                              {profileData.stats.following.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Following</div>
                          </div>
                          <div className="rounded border border-border/40 bg-background p-4">
                            <div className="text-2xl font-semibold text-foreground">
                              {profileData.stats.totalReads.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Reads</div>
                          </div>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                          <div className="space-y-6 rounded border border-border/40 bg-background p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Name</label>
                                <Input
                                  value={profileForm.name}
                                  onChange={(event) => handleProfileFieldChange('name', event.target.value)}
                                  placeholder="nostr handle or short name"
                                />
                                <p className="text-xs text-muted-foreground">
                                  NIP-01 `name`. This is the stable short identifier other clients often
                                  use first.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Display name</label>
                                <Input
                                  value={profileForm.displayName}
                                  onChange={(event) =>
                                    handleProfileFieldChange('displayName', event.target.value)
                                  }
                                  placeholder="reader-facing display name"
                                />
                                <p className="text-xs text-muted-foreground">
                                  NIP-24 `display_name`. If you set this, keep `name` set too.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Website</label>
                                <Input
                                  value={profileForm.website}
                                  onChange={(event) =>
                                    handleProfileFieldChange('website', event.target.value)
                                  }
                                  placeholder="https://your-site.example"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">NIP-05</label>
                                <Input
                                  value={profileForm.nip05}
                                  onChange={(event) => handleProfileFieldChange('nip05', event.target.value)}
                                  placeholder="name@example.com"
                                />
                              </div>

                              <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-foreground">
                                  Lightning address (`lud16`)
                                </label>
                                <Input
                                  value={profileForm.lud16}
                                  onChange={(event) => handleProfileFieldChange('lud16', event.target.value)}
                                  placeholder="name@getalby.com"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Bio</label>
                              <Textarea
                                value={profileForm.about}
                                onChange={(event) => handleProfileFieldChange('about', event.target.value)}
                                placeholder="Tell readers who you are and what you write about."
                                rows={5}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-3">
                                <label className="text-sm font-medium text-foreground">
                                  Additional metadata JSON
                                </label>
                                {isProfileMetadataLoading ? (
                                  <span className="text-xs text-muted-foreground">Loading live metadata...</span>
                                ) : null}
                              </div>
                              <Textarea
                                value={additionalMetadata}
                                onChange={(event) => {
                                  setAdditionalMetadata(event.target.value)
                                  setProfileSaveError(null)
                                  setProfileSaveSuccess(null)
                                }}
                                placeholder='{"bot": true}'
                                rows={8}
                                className="font-mono text-xs"
                              />
                              <p className="text-xs text-muted-foreground">
                                Use this for any extra kind `0` metadata keys that Mist Story does not
                                expose as dedicated inputs. Keys managed by the form above override this
                                JSON when publishing.
                              </p>
                              {profileMetadataError ? (
                                <p className="text-xs text-destructive">{profileMetadataError}</p>
                              ) : null}
                            </div>

                            <div className="flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">
                                  {isExtensionAvailable
                                    ? 'Saving will sign and broadcast a new kind 0 event.'
                                    : 'Install or enable a Nostr extension to sign and publish profile metadata.'}
                                </p>
                                {!hasLoadedLiveProfileMetadata ? (
                                  <p className="text-xs text-muted-foreground">
                                    Load the latest live metadata before broadcasting so Mist Story can
                                    preserve unmanaged kind 0 fields.
                                  </p>
                                ) : null}
                                {profileSaveError ? (
                                  <p className="text-sm text-destructive">{profileSaveError}</p>
                                ) : profileSaveSuccess ? (
                                  <p className="text-sm text-emerald-600">{profileSaveSuccess}</p>
                                ) : null}
                              </div>

                              <Button
                                onClick={() => void handleSaveProfile()}
                                disabled={
                                  profileSaving ||
                                  !isExtensionAvailable ||
                                  isProfileMetadataLoading ||
                                  !hasLoadedLiveProfileMetadata
                                }
                              >
                                {profileSaving ? 'Publishing...' : 'Save & Broadcast'}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded border border-border/40 bg-background p-4">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Last synced</p>
                              <p className="mt-2 text-sm text-foreground">
                                {formatDateTime(profileData.sync.lastSyncedAt)}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {profileData.sync.isStale
                                  ? 'Profile is stale and due for refresh.'
                                  : 'Cached profile is fresh.'}
                              </p>
                            </div>

                            <div className="rounded border border-border/40 bg-background p-4">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">Live snapshot</p>
                              <dl className="mt-3 space-y-3 text-sm">
                                <div>
                                  <dt className="text-muted-foreground">Name</dt>
                                  <dd className="text-foreground">{profileData.profile.handle ?? 'Not set'}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground">Website</dt>
                                  <dd className="break-all text-foreground">
                                    {profileData.profile.website ?? 'Not set'}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground">Lightning</dt>
                                  <dd className="text-foreground">{profileData.profile.lud16 ?? 'Not set'}</dd>
                                </div>
                                <div>
                                  <dt className="text-muted-foreground">Bio</dt>
                                  <dd className="text-foreground">
                                    {profileData.profile.about ?? 'No bio set on Nostr yet.'}
                                  </dd>
                                </div>
                              </dl>
                            </div>

                            {profileRelayResults.length > 0 ? (
                              <div className="rounded border border-border/40 bg-background p-4">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Relay publish results
                                </p>
                                <div className="mt-3 space-y-3">
                                  {profileRelayResults.map((relay) => (
                                    <div
                                      key={relay.relayUrl}
                                      className="rounded border border-border/40 bg-card p-3"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <p className="break-all text-sm text-foreground">{relay.relayUrl}</p>
                                        <span
                                          className={`rounded px-2 py-1 text-xs ${
                                            relay.success
                                              ? 'bg-emerald-500/10 text-emerald-700'
                                              : 'bg-destructive/10 text-destructive'
                                          }`}
                                        >
                                          {relay.success ? 'OK' : 'Failed'}
                                        </span>
                                      </div>
                                      {relay.message ? (
                                        <p className="mt-2 text-xs text-muted-foreground">{relay.message}</p>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Your public profile URL:{' '}
                            <code className="rounded bg-muted px-2 py-1 text-xs">
                              Mist Story.app/profile/{user?.npub?.slice(0, 16)}...
                            </code>
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Notification Settings</h2>
                {notificationLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : notificationError ? (
                  <div className="rounded border border-destructive/30 bg-card p-6 text-destructive">
                    {notificationError}
                  </div>
                ) : notificationSettings ? (
                  <div className="space-y-6">
                    <div className="rounded border border-border/40 bg-card p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <h3 className="flex items-center gap-2 font-medium text-foreground">
                            <Bell className="h-4 w-4" />
                            Delivery overview
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Choose how much Mist Story should tap you on the shoulder. Changes save automatically as you toggle.
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded border border-border/40 bg-background px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Enabled channels</p>
                            <p className="mt-2 text-2xl font-semibold text-foreground">{enabledNotificationCount}/4</p>
                          </div>
                          <div className="rounded border border-border/40 bg-background px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Email delivery</p>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {emailNotificationsEnabled ? 'Inbox enabled' : 'Email paused'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => void handleApplyNotificationPreset('all')}
                          disabled={notificationSaving}
                        >
                          <Check className="h-4 w-4" />
                          Enable all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => void handleApplyNotificationPreset('reading-only')}
                          disabled={notificationSaving}
                        >
                          <BookOpen className="h-4 w-4" />
                          Reading only
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => void handleApplyNotificationPreset('mute')}
                          disabled={notificationSaving}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Mute all
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {NOTIFICATION_SETTING_DEFINITIONS.map((setting) => {
                        const checked = notificationSettings[setting.key]
                        const Icon = setting.icon

                        return (
                          <div
                            key={setting.key}
                            className={cn(
                              'rounded border bg-card p-5 transition-colors',
                              checked ? 'border-primary/40 bg-primary/5' : 'border-border/40'
                            )}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <div
                                  className={cn(
                                    'mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border',
                                    checked
                                      ? 'border-primary/30 bg-primary/10 text-primary'
                                      : 'border-border/40 bg-background text-muted-foreground',
                                    checked ? setting.accentClassName : null
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-foreground">{setting.label}</p>
                                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                                      {checked ? 'Active' : 'Muted'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {checked ? 'Currently active for this account.' : 'Currently muted for this account.'}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={checked}
                                onCheckedChange={() => void handleToggleNotification(setting.key)}
                                disabled={notificationSaving}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="rounded border border-border/40 bg-card px-4 py-3 text-sm text-muted-foreground">
                      {notificationSaving
                        ? 'Saving notification preferences...'
                        : notificationSavedAt
                          ? `Saved ${formatDateTime(notificationSavedAt)}. Preferences sync to your account automatically across devices.`
                          : 'Preferences sync to your account automatically, so the same choices follow you across devices.'}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Appearance</h2>
                {appearanceLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : appearanceError ? (
                  <div className="rounded border border-destructive/30 bg-card p-6 text-destructive">
                    {appearanceError}
                  </div>
                ) : appearanceSettings ? (
                  <div className="space-y-6">
                    <div className="rounded border border-border/40 bg-card p-6">
                      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-3">
                              <h3 className="flex items-center gap-2 font-medium text-foreground">
                                <Palette className="h-4 w-4" />
                                Reader preview
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Tune the mood of the interface and the pacing of your reading layout before it follows your account everywhere else.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => void handleResetAppearance()}
                              disabled={appearanceSaving}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reset to default
                            </Button>
                          </div>
                          <div
                            className={cn(
                              'rounded-xl border px-5 py-5 transition-colors',
                              appearanceSettings.theme === 'dark'
                                ? 'border-slate-700 bg-slate-950 text-slate-100'
                                : appearanceSettings.theme === 'light'
                                  ? 'border-stone-200 bg-stone-50 text-stone-900'
                                  : 'border-sky-200 bg-gradient-to-br from-sky-50 via-stone-50 to-white text-stone-900'
                            )}
                          >
                            <p className="text-xs uppercase tracking-[0.25em] opacity-70">Mist Story Reader</p>
                            <p className={cn('mt-3 font-serif leading-relaxed', selectedFontSizeOption?.previewClassName ?? 'text-base')}>
                              The lantern at the harbor flickered once, then steadied. Mina turned the page and kept reading.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full border border-current/15 px-2.5 py-1 opacity-80">
                                Theme: {selectedThemeOption?.label ?? 'System'}
                              </span>
                              <span className="rounded-full border border-current/15 px-2.5 py-1 opacity-80">
                                Font size: {selectedFontSizeOption?.label ?? 'Medium'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                          <div className="rounded border border-border/40 bg-background px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Theme mode</p>
                            <p className="mt-2 text-sm font-medium text-foreground">{selectedThemeOption?.label ?? 'System'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{selectedThemeOption?.description}</p>
                          </div>
                          <div className="rounded border border-border/40 bg-background px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reader scale</p>
                            <p className="mt-2 text-sm font-medium text-foreground">{selectedFontSizeOption?.label ?? 'Medium'}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{selectedFontSizeOption?.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded border border-border/40 bg-card p-6">
                      <h3 className="text-sm font-medium text-foreground mb-4">Theme</h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {APPEARANCE_THEME_OPTIONS.map((option) => {
                          const selected = appearanceSettings.theme === option.value
                          const Icon = option.icon

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => void handleAppearanceThemeChange(option.value)}
                              disabled={appearanceSaving}
                              aria-pressed={selected}
                              className={cn(
                                'rounded border p-4 text-left transition-colors',
                                selected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border/40 bg-background hover:border-border'
                              )}
                            >
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-background">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="mt-4 font-medium text-foreground">{option.label}</p>
                              <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="rounded border border-border/40 bg-card p-6">
                      <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
                        <Type className="h-4 w-4" />
                        Reader font size
                      </h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {APPEARANCE_FONT_SIZE_OPTIONS.map((option) => {
                          const selected = appearanceSettings.fontSize === option.value

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => void handleAppearanceFontSizeChange(option.value)}
                              disabled={appearanceSaving}
                              aria-pressed={selected}
                              className={cn(
                                'rounded border p-4 text-left transition-colors',
                                selected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border/40 bg-background hover:border-border'
                              )}
                            >
                              <p className={cn('font-medium text-foreground', option.previewClassName)}>{option.label}</p>
                              <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="rounded border border-border/40 bg-card px-4 py-3 text-sm text-muted-foreground">
                      {appearanceSaving
                        ? 'Saving appearance preferences...'
                        : appearanceSavedAt
                          ? `Saved ${formatDateTime(appearanceSavedAt)}. Theme and font size sync to your account so your reading setup stays consistent across devices.`
                          : 'Theme and font size sync to your account, so your reading setup stays consistent when you move between devices.'}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Security</h2>
                {securityLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : securityError ? (
                  <div className="rounded border border-destructive/30 bg-card p-6 text-destructive">
                    {securityError}
                  </div>
                ) : securityRequiresReauth ? (
                  <div className="space-y-6">
                    <div className="rounded border border-border/40 bg-card p-6">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-1 h-5 w-5 text-foreground" />
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-medium text-foreground">Unlock security details</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                              Device, IP, user-agent, and session history are protected behind a recent
                              Nostr signature. Re-authenticate to view this section.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() => void handleUnlockSecurityDetails()}
                            disabled={isSecurityActionPending}
                          >
                            {securityActionInFlight === 'reauth' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                            Re-authenticate to continue
                          </Button>
                          {securityActionError ? (
                            <div className="rounded border border-destructive/30 bg-background p-4 text-sm text-destructive">
                              {securityActionError}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : securitySettings ? (
                  <div className="space-y-6">
                    <div className="rounded border border-border/40 bg-card p-6">
                      <div className="flex items-start gap-3">
                        <Shield className="mt-1 h-5 w-5 text-foreground" />
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-2">Nostr Account</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your account is secured through your Nostr identity and the session managed by Mist Story.
                          </p>

                          <div className="space-y-3">
                            <div className="rounded border border-border/40 bg-background p-4">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">npub</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                  {compactValue(securitySettings.npub)}
                                </code>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-2"
                                  onClick={() => void handleCopy(securitySettings.npub)}
                                >
                                  {copiedValue === securitySettings.npub ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="rounded border border-border/40 bg-background p-4">
                              <p className="text-xs uppercase tracking-wide text-muted-foreground">pubkey</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground break-all">
                                  {compactValue(securitySettings.pubkey, 18, 12)}
                                </code>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-2"
                                  onClick={() => void handleCopy(securitySettings.pubkey)}
                                >
                                  {copiedValue === securitySettings.pubkey ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded border border-border/40 bg-card p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <h3 className="flex items-center gap-2 font-medium text-foreground">
                            <ShieldAlert className="h-4 w-4" />
                            Sensitive Actions
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Session revocation and audit export require a fresh Nostr signature before the action runs.
                          </p>
                          {securityReauth ? (
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>
                                Recent re-auth status:{' '}
                                <span className={securityReauth.required ? 'text-amber-600' : 'text-emerald-600'}>
                                  {securityReauth.required ? 'Required now' : 'Valid'}
                                </span>
                              </p>
                              <p>Last re-authenticated: {formatDateTime(securityReauth.reauthenticatedAt)}</p>
                              <p>Valid until: {formatDateTime(securityReauth.validUntil)}</p>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-3 sm:min-w-64">
                          <Button
                            type="button"
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={() => void handleDownloadSecurityAuditLog()}
                            disabled={isSecurityActionPending}
                          >
                            {securityActionInFlight === 'download-audit' || securityActionInFlight === 'reauth' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            Download auth audit log
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="justify-start gap-2"
                            onClick={() => void handleRevokeCurrentSecuritySession()}
                            disabled={isSecurityActionPending}
                          >
                            {securityActionInFlight === 'revoke-current' || securityActionInFlight === 'reauth' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <LogOut className="h-4 w-4" />
                            )}
                            Revoke current session
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="justify-start gap-2"
                            onClick={() => void handleSignOutAllSecuritySessions()}
                            disabled={isSecurityActionPending}
                          >
                            {securityActionInFlight === 'sign-out-all' || securityActionInFlight === 'reauth' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldAlert className="h-4 w-4" />
                            )}
                            Sign out all sessions
                          </Button>
                        </div>
                      </div>

                      {securityActionError ? (
                        <div className="mt-4 rounded border border-destructive/30 bg-background p-4 text-sm text-destructive">
                          {securityActionError}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded border border-border/40 bg-card p-6">
                      <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
                        <Monitor className="h-4 w-4" />
                        Active Sessions
                      </h3>
                      {activeSecuritySessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active sessions are currently recorded.</p>
                      ) : (
                        <div className="space-y-3">
                          {activeSecuritySessions.map((session: SecuritySessionDto) => (
                            <div
                              key={session.id}
                              className="rounded border border-border/40 bg-background p-4"
                            >
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-foreground">
                                      {session.deviceLabel ?? inferDeviceLabel(session.userAgent)}
                                    </p>
                                    {session.current ? (
                                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                        Current session
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                                    <div>
                                      <p className="text-xs uppercase tracking-wide">IP address</p>
                                      <p className="mt-1 break-all text-foreground">
                                        {session.ipAddress ?? 'Unknown'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs uppercase tracking-wide">Origin</p>
                                      <p className="mt-1 break-all text-foreground">
                                        {session.origin ?? 'Unknown'}
                                      </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                      <p className="text-xs uppercase tracking-wide">User agent</p>
                                      <p className="mt-1 break-all text-foreground">
                                        {session.userAgent ?? 'Unknown'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1 text-sm text-muted-foreground lg:text-right">
                                  <p>Signed in: {formatDateTime(session.authenticatedAt)}</p>
                                  <p>Re-authenticated: {formatDateTime(session.reauthenticatedAt)}</p>
                                  <p>Session created: {formatDateTime(session.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded border border-border/40 bg-card p-6">
                      <h3 className="flex items-center gap-2 font-medium text-foreground mb-4">
                        <KeyRound className="h-4 w-4" />
                        Recent Auth Activity
                      </h3>
                      {securitySettings.recentAuthActivity.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recent authentication activity.</p>
                      ) : (
                        <div className="space-y-3">
                          {securitySettings.recentAuthActivity.map((activity) => (
                            <div
                              key={activity.id}
                              className="rounded border border-border/40 bg-background p-4"
                            >
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                  <p className="font-medium text-foreground">{activity.action}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {activity.resultCode}
                                    {activity.detail ? ` · ${activity.detail}` : ''}
                                  </p>
                                  {activity.context ? (
                                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                      <p>Device: {activity.context.deviceLabel ?? inferDeviceLabel(activity.context.userAgent)}</p>
                                      <p>IP: {activity.context.ipAddress ?? 'Unknown'}</p>
                                      <p className="sm:col-span-2 break-all">
                                        User agent: {activity.context.userAgent ?? 'Unknown'}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Nostr Relays</h2>
                {integrationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : integrationsSettings ? (
                  <div className="space-y-6">
                    {integrationsError && (
                      <div className="rounded border border-destructive/30 bg-card p-6 text-destructive">
                        {integrationsError}
                      </div>
                    )}

                    <div className="space-y-6">
                        <div className="rounded border border-border/40 bg-card p-6">
                          <div className="flex items-start gap-3">
                            <RadioTower className="mt-0.5 h-5 w-5 text-foreground" />
                            <div className="flex-1 space-y-4">
                              <div>
                                <h3 className="font-medium text-foreground">Relay Manager</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  Control the Nostr relays Mist Story uses to refresh and broadcast your
                                  profile metadata.
                                </p>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded border border-border/40 bg-background p-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                    Configured
                                  </p>
                                  <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {configuredRelays.length}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Saved relays in your account
                                  </p>
                                </div>

                                <div className="rounded border border-border/40 bg-background p-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                    Read In Use
                                  </p>
                                  <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {effectiveReadRelays.urls.length}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">{effectiveReadSource}</p>
                                </div>

                                <div className="rounded border border-border/40 bg-background p-3">
                                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                    Write In Use
                                  </p>
                                  <p className="mt-2 text-2xl font-semibold text-foreground">
                                    {effectiveWriteRelays.urls.length}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">{effectiveWriteSource}</p>
                                </div>
                              </div>

                              <div className="grid gap-3 lg:grid-cols-2">
                                <div className="rounded border border-border/40 bg-background p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">Effective read relays</p>
                                      <p className="mt-1 text-xs text-muted-foreground">{effectiveReadSource}</p>
                                    </div>
                                    <span className="rounded border border-border/50 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                      Read
                                    </span>
                                  </div>
                                  <div className="mt-3 space-y-2">
                                    {effectiveReadRelays.urls.map((relayUrl) => (
                                      <div
                                        key={`effective-read-${relayUrl}`}
                                        className="rounded border border-border/40 px-3 py-2 text-xs text-foreground break-all"
                                      >
                                        {relayUrl}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="rounded border border-border/40 bg-background p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">Effective write relays</p>
                                      <p className="mt-1 text-xs text-muted-foreground">{effectiveWriteSource}</p>
                                    </div>
                                    <span className="rounded border border-border/50 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                                      Write
                                    </span>
                                  </div>
                                  <div className="mt-3 space-y-2">
                                    {effectiveWriteRelays.urls.map((relayUrl) => (
                                      <div
                                        key={`effective-write-${relayUrl}`}
                                        className="rounded border border-border/40 px-3 py-2 text-xs text-foreground break-all"
                                      >
                                        {relayUrl}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                If no custom read or write relays are enabled for a mode, Mist Story falls
                                back to the built-in profile relays above.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded border border-border/40 bg-card p-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">
                                {editingRelay ? 'Edit relay' : 'Add relay'}
                              </h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Save a relay once, then fine-tune read and write roles any time.
                              </p>
                            </div>
                            {editingRelay ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={resetRelayForm}
                                disabled={isSavingRelayForm}
                              >
                                Cancel edit
                              </Button>
                            ) : null}
                          </div>

                          <div className="mt-5 space-y-4">
                            <Input
                              value={relayForm.url}
                              onChange={(event) =>
                                setRelayForm((current) => ({ ...current, url: event.target.value }))
                              }
                              placeholder="wss://relay.example.com"
                            />
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2 text-sm text-foreground">
                                <Switch
                                  checked={relayForm.read}
                                  onCheckedChange={(checked) =>
                                    setRelayForm((current) => ({ ...current, read: Boolean(checked) }))
                                  }
                                />
                                Read
                              </label>
                              <label className="flex items-center gap-2 text-sm text-foreground">
                                <Switch
                                  checked={relayForm.write}
                                  onCheckedChange={(checked) =>
                                    setRelayForm((current) => ({ ...current, write: Boolean(checked) }))
                                  }
                                />
                                Write
                              </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              <Button
                                onClick={() => void handleSaveRelay()}
                                disabled={relayFormSubmitDisabled}
                              >
                                {isSavingRelayForm
                                  ? 'Saving...'
                                  : editingRelay
                                    ? 'Save relay'
                                    : 'Add relay'}
                              </Button>
                              <p className="self-center text-xs text-muted-foreground">
                                Relay URLs must start with <code>ws://</code> or <code>wss://</code>.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded border border-border/40 bg-card p-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">Configured relays</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Update roles inline, edit the URL, or remove relays you no longer use.
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Read enabled: {configuredReadRelays.length} · Write enabled: {configuredWriteRelays.length}
                              </p>
                            </div>
                            <span className="rounded border border-border/50 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              {configuredRelays.length} saved
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleResetRelaysToDefault()}
                              disabled={isResettingRelays || isUsingDefaultRelaySet}
                            >
                              {isResettingRelays ? 'Resetting...' : 'Reset to default'}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Keeps only the built-in relay set and enables both read and write for each.
                            </p>
                          </div>

                          <div className="mt-5 space-y-3">
                            {configuredRelays.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No custom relays yet. Add one below or start from the recommended list.
                              </p>
                            ) : (
                              sortedConfiguredRelays.map((relay) => {
                                const isBusy = relayActionId === relay.id || isResettingRelays

                                return (
                                  <div
                                    key={relay.id}
                                    className="rounded border border-border/40 bg-background p-4"
                                  >
                                    <div className="flex flex-col gap-4">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-2">
                                          <p className="font-medium text-foreground break-all">{relay.url}</p>
                                          <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="rounded border border-border/50 px-2 py-1 text-muted-foreground">
                                              {relay.read ? 'Read enabled' : 'Read disabled'}
                                            </span>
                                            <span className="rounded border border-border/50 px-2 py-1 text-muted-foreground">
                                              {relay.write ? 'Write enabled' : 'Write disabled'}
                                            </span>
                                          </div>
                                          <p className="text-xs text-muted-foreground">
                                            Updated {formatDateTime(relay.updatedAt)}
                                          </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => handleEditRelay(relay)}
                                            disabled={isBusy || isSavingRelayForm}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => void handleDeleteRelay(relay.id)}
                                            disabled={isBusy || isSavingRelayForm}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Remove
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-wrap gap-4">
                                          <label className="flex items-center gap-2 text-sm text-foreground">
                                            <Switch
                                              checked={relay.read}
                                              disabled={isBusy || isSavingRelayForm}
                                              onCheckedChange={(checked) =>
                                                void handleToggleRelayRole(relay, 'read', Boolean(checked))
                                              }
                                            />
                                            Read
                                          </label>
                                          <label className="flex items-center gap-2 text-sm text-foreground">
                                            <Switch
                                              checked={relay.write}
                                              disabled={isBusy || isSavingRelayForm}
                                              onCheckedChange={(checked) =>
                                                void handleToggleRelayRole(relay, 'write', Boolean(checked))
                                              }
                                            />
                                            Write
                                          </label>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          {editingRelayId === relay.id
                                            ? 'Editing in the relay form above.'
                                            : 'Toggle roles here for quick updates.'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>

                        <div className="rounded border border-border/40 bg-card p-6">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">Recommended profile relays</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Quick-add the default relays Mist Story falls back to for profile refresh and
                                publish.
                              </p>
                            </div>
                            <span className="rounded border border-border/50 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                              Defaults
                            </span>
                          </div>

                          <div className="mt-5 space-y-3">
                            {recommendedRelayUrls.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                All recommended relays are already configured.
                              </p>
                            ) : (
                              recommendedRelayUrls.map((relayUrl) => (
                                <div
                                  key={relayUrl}
                                  className="flex flex-col gap-3 rounded border border-border/40 bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                  <div>
                                    <p className="font-medium text-foreground break-all">{relayUrl}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Adds this relay with both read and write enabled.
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() => void handleAddRecommendedRelay(relayUrl)}
                                    disabled={
                                      relayActionId === relayUrl || isSavingRelayForm || isResettingRelays
                                    }
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    {relayActionId === relayUrl ? 'Adding...' : 'Add relay'}
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                  </div>
                ) : integrationsError ? (
                  <div className="rounded border border-destructive/30 bg-card p-6 text-destructive">
                    {integrationsError}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  )
}
