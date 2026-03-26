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
import { useRequireAuth } from '@/hooks/use-require-auth'
import {
  createApiKey,
  createRelay,
  deleteRelay,
  fetchAppearanceSettings,
  fetchIntegrationsSettings,
  fetchMyProfile,
  fetchNotificationSettings,
  fetchSecuritySettings,
  publishMyProfile,
  refreshMyProfile as refreshMyProfileFromApi,
  revokeApiKey,
  uploadMyProfileImage,
  updateAppearanceSettings,
  updateNotificationSettings,
  type AppearanceSettingsDto,
  type IntegrationsSettingsDto,
  type NotificationSettingsDto,
  type SecuritySettingsDto,
} from '@/lib/api'
import {
  DEFAULT_NOSTR_PROFILE_RELAYS,
  buildProfileMetadataContent,
  fetchLatestProfileMetadata,
  publishEventToRelays,
  signKind0MetadataEvent,
  type RelayPublishResult,
} from '@/lib/nostr-utils'
import type { NostrProfile } from '@/lib/nostr-types'
import { cn } from '@/lib/utils'
import {
  Bell,
  Camera,
  Check,
  Code,
  Copy,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Palette,
  Shield,
  User,
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
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState<MyProfilePayload | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [isRefreshingProfile, setIsRefreshingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM)
  const [additionalMetadata, setAdditionalMetadata] = useState('{}')
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

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettingsDto | null>(null)
  const [appearanceLoading, setAppearanceLoading] = useState(false)
  const [appearanceSaving, setAppearanceSaving] = useState(false)
  const [appearanceError, setAppearanceError] = useState<string | null>(null)
  const [appearanceLoaded, setAppearanceLoaded] = useState(false)

  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsDto | null>(null)
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securityLoaded, setSecurityLoaded] = useState(false)

  const [integrationsSettings, setIntegrationsSettings] = useState<IntegrationsSettingsDto | null>(null)
  const [integrationsLoading, setIntegrationsLoading] = useState(false)
  const [integrationsError, setIntegrationsError] = useState<string | null>(null)
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false)
  const [apiKeyName, setApiKeyName] = useState('')
  const [relayUrl, setRelayUrl] = useState('')
  const [relayRead, setRelayRead] = useState(true)
  const [relayWrite, setRelayWrite] = useState(false)
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false)
  const [isCreatingRelay, setIsCreatingRelay] = useState(false)
  const [creatingApiKeyResult, setCreatingApiKeyResult] = useState<{ name: string; token: string } | null>(null)
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const copyTimerRef = useRef<number | null>(null)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const bannerInputRef = useRef<HTMLInputElement | null>(null)
  const profileImageEditorDragRef = useRef<ProfileImageEditorDragState | null>(null)

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
    if (integrationsSettings) {
      return integrationsSettings
    }

    try {
      const payload = await fetchIntegrationsSettings()
      setIntegrationsSettings(payload)
      setIntegrationsLoaded(true)
      return payload
    } catch {
      return null
    }
  }, [integrationsSettings])

  const resolveProfileRelayUrls = useCallback(async (mode: 'read' | 'write') => {
    const settings = await ensureIntegrationsSettings()
    const configured = settings?.relays
      .filter((relay) => (mode === 'read' ? relay.read : relay.write))
      .map((relay) => relay.url.trim())
      .filter((relayUrl) => relayUrl.length > 0)

    if (configured && configured.length > 0) {
      return Array.from(new Set(configured))
    }

    return DEFAULT_NOSTR_PROFILE_RELAYS
  }, [ensureIntegrationsSettings])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const loadProfile = async () => {
      setIsProfileLoading(true)
      setProfileError(null)

      try {
        const payload = await fetchMyProfile()
        setProfileData(payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load profile'
        setProfileError(message)
      } finally {
        setIsProfileLoading(false)
      }
    }

    void loadProfile()
  }, [isAuthenticated])

  useEffect(() => {
    if (!profileData) {
      return
    }

    setProfileForm(createProfileForm(profileData.profile))
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

        setAdditionalMetadata(formatExtraMetadata(stripEditableMetadata(metadata ?? {})))
      } catch (error) {
        if (cancelled) {
          return
        }

        const message =
          error instanceof Error ? error.message : 'Failed to load live Nostr metadata'
        setProfileMetadataError(message)
        setAdditionalMetadata('{}')
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

    const loadNotifications = async () => {
      setNotificationLoading(true)
      setNotificationError(null)

      try {
        const payload = await fetchNotificationSettings()
        setNotificationSettings(payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load notifications'
        setNotificationError(message)
      } finally {
        setNotificationLoading(false)
        setNotificationLoaded(true)
      }
    }

    void loadNotifications()
  }, [activeTab, isAuthenticated, notificationLoaded, notificationLoading])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'appearance' || appearanceLoaded || appearanceLoading) {
      return
    }

    const loadAppearance = async () => {
      setAppearanceLoading(true)
      setAppearanceError(null)

      try {
        const payload = await fetchAppearanceSettings()
        setAppearanceSettings(payload)
        setTheme(payload.theme)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load appearance'
        setAppearanceError(message)
      } finally {
        setAppearanceLoading(false)
        setAppearanceLoaded(true)
      }
    }

    void loadAppearance()
  }, [activeTab, appearanceLoaded, appearanceLoading, isAuthenticated, setTheme])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'security' || securityLoaded || securityLoading) {
      return
    }

    const loadSecurity = async () => {
      setSecurityLoading(true)
      setSecurityError(null)

      try {
        const payload = await fetchSecuritySettings()
        setSecuritySettings(payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load security settings'
        setSecurityError(message)
      } finally {
        setSecurityLoading(false)
        setSecurityLoaded(true)
      }
    }

    void loadSecurity()
  }, [activeTab, isAuthenticated, securityLoaded, securityLoading])

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'api' || integrationsLoaded || integrationsLoading) {
      return
    }

    const loadIntegrations = async () => {
      setIntegrationsLoading(true)
      setIntegrationsError(null)

      try {
        const payload = await fetchIntegrationsSettings()
        setIntegrationsSettings(payload)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load integrations'
        setIntegrationsError(message)
      } finally {
        setIntegrationsLoading(false)
        setIntegrationsLoaded(true)
      }
    }

    void loadIntegrations()
  }, [activeTab, integrationsLoaded, integrationsLoading, isAuthenticated])

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

    if (!isExtensionAvailable) {
      setProfileSaveError(
        'Publishing profile metadata currently requires a Nostr signing extension with NIP-07 support.'
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

      if (avatarImageSelection) {
        const uploadedAvatar = await uploadMyProfileImage('avatar', {
          image: avatarImageSelection,
        })
        nextProfileForm.picture = uploadedAvatar.url
      }

      if (bannerImageSelection) {
        const uploadedBanner = await uploadMyProfileImage('banner', {
          image: bannerImageSelection,
        })
        nextProfileForm.banner = uploadedBanner.url
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

      try {
        const payload = await publishMyProfile({
          profile,
          signedEvent,
        })

        setProfileData(payload)
        setProfileForm(nextProfileForm)
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

  const handleToggleNotification = async (key: keyof NotificationSettingsDto) => {
    if (!notificationSettings) {
      return
    }

    const nextSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    }

    setNotificationSettings(nextSettings)
    setNotificationSaving(true)
    setNotificationError(null)

    try {
      const saved = await updateNotificationSettings(nextSettings)
      setNotificationSettings(saved)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save notification settings'
      setNotificationError(message)
      setNotificationSettings(notificationSettings)
    } finally {
      setNotificationSaving(false)
    }
  }

  const saveAppearanceSettings = async (
    nextSettings: AppearanceSettingsDto,
    previousTheme = appearanceSettings?.theme
  ) => {
    const previous = appearanceSettings
    setAppearanceSettings(nextSettings)
    setAppearanceSaving(true)
    setAppearanceError(null)

    try {
      const saved = await updateAppearanceSettings(nextSettings)
      setAppearanceSettings(saved)
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

  const handleCreateApiKey = async () => {
    const name = apiKeyName.trim()
    if (!name) {
      setIntegrationsError('API key name is required')
      return
    }

    setIsCreatingApiKey(true)
    setIntegrationsError(null)

    try {
      const payload = await createApiKey({ name })
      setCreatingApiKeyResult({ name: payload.apiKey.name, token: payload.token })
      setApiKeyName('')
      setIntegrationsSettings((current) =>
        current
          ? {
              ...current,
              apiKeys: [payload.apiKey, ...current.apiKeys],
            }
          : {
              apiKeys: [payload.apiKey],
              relays: [],
            }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create API key'
      setIntegrationsError(message)
    } finally {
      setIsCreatingApiKey(false)
    }
  }

  const handleRevokeApiKey = async (apiKeyId: string) => {
    setIntegrationsError(null)

    try {
      await revokeApiKey(apiKeyId)
      setIntegrationsSettings((current) =>
        current
          ? {
              ...current,
              apiKeys: current.apiKeys.filter((apiKey) => apiKey.id !== apiKeyId),
            }
          : current
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke API key'
      setIntegrationsError(message)
    }
  }

  const handleCreateRelay = async () => {
    const url = relayUrl.trim()
    if (!url) {
      setIntegrationsError('Relay URL is required')
      return
    }

    setIsCreatingRelay(true)
    setIntegrationsError(null)

    try {
      const payload = await createRelay({
        url,
        read: relayRead,
        write: relayWrite,
      })
      setRelayUrl('')
      setRelayRead(true)
      setRelayWrite(false)
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
      const message = error instanceof Error ? error.message : 'Failed to save relay'
      setIntegrationsError(message)
    } finally {
      setIsCreatingRelay(false)
    }
  }

  const handleDeleteRelay = async (relayId: string) => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove relay'
      setIntegrationsError(message)
    }
  }

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'api', label: 'API & Integration', icon: Code },
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
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Settings</h1>

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
                                {profileSaveError ? (
                                  <p className="text-sm text-destructive">{profileSaveError}</p>
                                ) : profileSaveSuccess ? (
                                  <p className="text-sm text-emerald-600">{profileSaveSuccess}</p>
                                ) : null}
                              </div>

                              <Button
                                onClick={() => void handleSaveProfile()}
                                disabled={profileSaving || !isExtensionAvailable}
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
                  <div className="space-y-4">
                    {[
                      {
                        key: 'emailNotifications',
                        label: 'Email Notifications',
                        description: 'Receive updates and news via email',
                      },
                      {
                        key: 'newChapterNotifications',
                        label: 'New Chapter Alerts',
                        description: 'Get notified when authors you follow publish new chapters',
                      },
                      {
                        key: 'commentNotifications',
                        label: 'Comment Notifications',
                        description: 'Be notified when readers comment on your work',
                      },
                      {
                        key: 'followNotifications',
                        label: 'New Follower Alerts',
                        description: 'Get notified when someone follows you',
                      },
                    ].map((setting) => {
                      const checked = notificationSettings[setting.key as keyof NotificationSettingsDto]

                      return (
                        <div
                          key={setting.key}
                          className="flex items-center justify-between gap-4 border border-border/40 rounded bg-card p-4"
                        >
                          <div>
                            <p className="font-medium text-foreground">{setting.label}</p>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                          <Switch
                            checked={checked}
                            onCheckedChange={() =>
                              void handleToggleNotification(setting.key as keyof NotificationSettingsDto)
                            }
                            disabled={notificationSaving}
                          />
                        </div>
                      )
                    })}
                    <p className="text-sm text-muted-foreground">
                      {notificationSaving ? 'Saving notification preferences...' : 'Preferences save automatically.'}
                    </p>
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
                      <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
                      <div className="space-y-3">
                        {(['light', 'dark', 'system'] as const).map((themeOption) => (
                          <label key={themeOption} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="theme"
                              value={themeOption}
                              checked={appearanceSettings.theme === themeOption}
                              onChange={() => void handleAppearanceThemeChange(themeOption)}
                              className="h-4 w-4"
                            />
                            <span className="text-foreground capitalize">
                              {themeOption === 'system' ? 'Auto (system)' : themeOption}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded border border-border/40 bg-card p-6">
                      <label className="block text-sm font-medium text-foreground mb-3">Reader Font Size</label>
                      <div className="space-y-3">
                        {(['small', 'medium', 'large'] as const).map((size) => (
                          <label key={size} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="fontSize"
                              value={size}
                              checked={appearanceSettings.fontSize === size}
                              onChange={() => void handleAppearanceFontSizeChange(size)}
                              className="h-4 w-4"
                            />
                            <span
                              className={`text-foreground capitalize ${
                                size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                              }`}
                            >
                              {size}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {appearanceSaving ? 'Saving appearance preferences...' : 'Theme and font size sync to your account.'}
                    </p>
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
                                <div>
                                  <p className="font-medium text-foreground">{activity.action}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {activity.resultCode}
                                    {activity.detail ? ` · ${activity.detail}` : ''}
                                  </p>
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
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">API & Integration</h2>
                {integrationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : integrationsError ? (
                  <div className="rounded border border-destructive/30 bg-card p-6 text-destructive">
                    {integrationsError}
                  </div>
                ) : integrationsSettings ? (
                  <div className="space-y-6">
                    {creatingApiKeyResult && (
                      <div className="rounded border border-primary/30 bg-primary/5 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-medium text-foreground">API key created</h3>
                            <p className="text-sm text-muted-foreground">
                              This token is shown once. Copy it now and store it securely.
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setCreatingApiKeyResult(null)}>
                            Dismiss
                          </Button>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div className="rounded border border-border/40 bg-background p-4">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {creatingApiKeyResult.name}
                            </p>
                            <code className="mt-2 block break-all rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                              {creatingApiKeyResult.token}
                            </code>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleCopy(creatingApiKeyResult.token)}
                          >
                            {copiedValue === creatingApiKeyResult.token ? 'Copied' : 'Copy token'}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-6 xl:grid-cols-2">
                      <div className="rounded border border-border/40 bg-card p-6">
                        <h3 className="font-medium text-foreground mb-2">API Keys</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Generate and revoke tokens for external integrations.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Input
                            value={apiKeyName}
                            onChange={(event) => setApiKeyName(event.target.value)}
                            placeholder="New API key name"
                          />
                          <Button
                            onClick={() => void handleCreateApiKey()}
                            disabled={isCreatingApiKey || !apiKeyName.trim()}
                          >
                            {isCreatingApiKey ? 'Creating...' : 'Create Key'}
                          </Button>
                        </div>

                        <div className="mt-5 space-y-3">
                          {integrationsSettings.apiKeys.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No API keys yet.</p>
                          ) : (
                            integrationsSettings.apiKeys.map((apiKey) => (
                              <div key={apiKey.id} className="rounded border border-border/40 bg-background p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-1">
                                    <p className="font-medium text-foreground">{apiKey.name}</p>
                                    <p className="text-xs text-muted-foreground">{apiKey.keyPreview}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Created {formatDateTime(apiKey.createdAt)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Last used {formatDateTime(apiKey.lastUsedAt)}
                                    </p>
                                    {apiKey.revokedAt && (
                                      <p className="text-xs text-destructive">
                                        Revoked {formatDateTime(apiKey.revokedAt)}
                                      </p>
                                    )}
                                  </div>
                                  {!apiKey.revokedAt ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => void handleRevokeApiKey(apiKey.id)}
                                    >
                                      Revoke
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Revoked</span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded border border-border/40 bg-card p-6">
                        <h3 className="font-medium text-foreground mb-2">Relay Configuration</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage the relays used for content syncing.
                        </p>

                        <div className="space-y-4">
                          <Input
                            value={relayUrl}
                            onChange={(event) => setRelayUrl(event.target.value)}
                            placeholder="wss://relay.example.com"
                          />
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm text-foreground">
                              <Switch checked={relayRead} onCheckedChange={(checked) => setRelayRead(Boolean(checked))} />
                              Read
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground">
                              <Switch checked={relayWrite} onCheckedChange={(checked) => setRelayWrite(Boolean(checked))} />
                              Write
                            </label>
                          </div>
                          <Button onClick={() => void handleCreateRelay()} disabled={isCreatingRelay || !relayUrl.trim()}>
                            {isCreatingRelay ? 'Saving...' : 'Add Relay'}
                          </Button>
                        </div>

                        <div className="mt-5 space-y-3">
                          {integrationsSettings.relays.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No relays configured yet.</p>
                          ) : (
                            integrationsSettings.relays.map((relay) => (
                              <div key={relay.id} className="rounded border border-border/40 bg-background p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="space-y-2">
                                    <p className="font-medium text-foreground break-all">{relay.url}</p>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      <span className="rounded bg-muted px-2 py-1">
                                        {relay.read ? 'Read enabled' : 'Read disabled'}
                                      </span>
                                      <span className="rounded bg-muted px-2 py-1">
                                        {relay.write ? 'Write enabled' : 'Write disabled'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Added {formatDateTime(relay.createdAt)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Updated {formatDateTime(relay.updatedAt)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void handleDeleteRelay(relay.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
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
