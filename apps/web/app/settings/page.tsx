'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useTheme } from 'next-themes'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { LogOut, User, Bell, Lock, Palette, Code, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { user, signOut, isLoading, isAuthenticated } = useRequireAuth()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    name: 'Sarah Mitchell',
    email: 'sarah@example.com',
    bio: 'Storyteller exploring themes of identity, love, and transformation.',
    location: 'Portland, Oregon',
    website: 'https://sarahstories.com',
  })
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    newChapterNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    fontSize: 'medium',
  })
  type Preferences = typeof preferences
  type PreferenceKey = keyof Preferences

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePreferenceChange = <K extends PreferenceKey>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const notificationSettings: Array<{
    key: Exclude<PreferenceKey, 'fontSize'>
    label: string
    description: string
  }> = [
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
  ]

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
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Used for notifications and account recovery</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Max 200 characters</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <Button>Save Changes</Button>
                  </form>
                </div>

                <Separator />

                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Public Profile</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your public profile URL: <code className="bg-muted px-2 py-1 rounded text-xs">Mist Story.app/profile/{user?.npub?.slice(0, 16)}...</code>
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={`/profile/${user?.npub}`}>View Profile</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Notification Settings</h2>
                <div className="space-y-4">
                  {notificationSettings.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between border border-border/40 rounded bg-card p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{setting.label}</p>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => handlePreferenceChange(setting.key, !preferences[setting.key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences[setting.key] ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences[setting.key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Appearance</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Theme</label>
                    <div className="space-y-2">
                      {['light', 'dark', 'system'].map((themeOption) => (
                        <label key={themeOption} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="theme"
                            value={themeOption}
                            checked={theme === themeOption}
                            onChange={() => setTheme(themeOption)}
                            className="h-4 w-4"
                          />
                          <span className="text-foreground capitalize">{themeOption === 'system' ? 'Auto (system)' : themeOption}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-3">Reader Font Size</label>
                    <div className="space-y-2">
                      {['small', 'medium', 'large'].map((size) => (
                        <label key={size} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="fontSize"
                            value={size}
                            checked={preferences.fontSize === size}
                            onChange={() => handlePreferenceChange('fontSize', size)}
                            className="h-4 w-4"
                          />
                          <span className={`text-foreground capitalize ${size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'}`}>
                            {size}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">Security</h2>
                <div className="space-y-4">
                  <div className="border border-border/40 rounded bg-card p-6">
                    <h3 className="font-medium text-foreground mb-2">Nostr NIP-07 Extension</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your account is secured through your Nostr NIP-07 compatible wallet extension
                    </p>
                    <p className="text-xs font-mono text-muted-foreground break-all bg-muted p-2 rounded mb-4">
                      npub: {user?.npub}
                    </p>
                    <Button variant="outline">Manage Connected Apps</Button>
                  </div>

                  <div className="border border-border/40 rounded bg-card p-6">
                    <h3 className="font-medium text-foreground mb-2">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-4">Add an extra layer of security to your account</p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-6">API & Integration</h2>
                <div className="space-y-4">
                  <div className="border border-border/40 rounded bg-card p-6">
                    <h3 className="font-medium text-foreground mb-2">API Keys</h3>
                    <p className="text-sm text-muted-foreground mb-4">Generate API keys for external integrations</p>
                    <Button variant="outline">Generate New Key</Button>
                  </div>

                  <div className="border border-border/40 rounded bg-card p-6">
                    <h3 className="font-medium text-foreground mb-2">Relay Configuration</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage Nostr relays for syncing your content
                    </p>
                    <Button variant="outline">Configure Relays</Button>
                  </div>
                </div>
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
