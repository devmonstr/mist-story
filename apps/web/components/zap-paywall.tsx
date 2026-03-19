"use client"

import { useState, useEffect } from "react"
import { Zap, Lock, Loader2, ExternalLink, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  fetchLnurlPayData,
  requestInvoice,
  buildZapRequest,
  payWithWebLN,
  storeZapReceipt,
  type ZapConfig,
} from "@/lib/zap-utils"

interface ZapPaywallProps {
  novelId: string
  chapterId: string
  chapterTitle: string
  chapterNumber: number
  amountSats: number
  recipientPubkey: string
  recipientLud16?: string
  onUnlocked: () => void
  // Reader theme support
  theme?: {
    bg: string
    mutedText: string
    border: string
  }
}

type PaywallStep = "idle" | "loading" | "invoice" | "paying" | "success" | "error"

export function ZapPaywall({
  novelId,
  chapterId,
  chapterTitle,
  chapterNumber,
  amountSats,
  recipientPubkey,
  recipientLud16,
  onUnlocked,
  theme,
}: ZapPaywallProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<PaywallStep>("idle")
  const [invoice, setInvoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [hasWebLN, setHasWebLN] = useState(false)

  useEffect(() => {
    const webln = (window as Window & { webln?: unknown }).webln
    setHasWebLN(!!webln)
  }, [])

  const handleOpen = () => {
    setOpen(true)
    setStep("idle")
    setInvoice(null)
    setError(null)
  }

  const handleGetInvoice = async () => {
    setStep("loading")
    setError(null)

    try {
      const config: ZapConfig = {
        amountSats,
        recipientPubkey,
        recipientLud16,
        novelId,
        chapterId,
        chapterTitle,
      }

      let pr: string | null = null

      if (recipientLud16) {
        const lnurlData = await fetchLnurlPayData(recipientLud16)
        if (!lnurlData) throw new Error("Could not fetch Lightning address data")

        const zapRequest = await buildZapRequest(config)
        const invoiceData = await requestInvoice(
          lnurlData.callback,
          amountSats * 1000,
          zapRequest ?? undefined
        )
        if (!invoiceData) throw new Error("Could not generate invoice")
        pr = invoiceData.pr
      } else {
        // Fallback: no lud16, show manual payment note
        throw new Error("Author has no Lightning address configured")
      }

      setInvoice(pr)
      setStep("invoice")

      // Auto-pay with WebLN if available
      if (hasWebLN) {
        await handleWebLNPay(pr)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create invoice"
      setError(message)
      setStep("error")
    }
  }

  const handleWebLNPay = async (pr: string) => {
    setStep("paying")
    const result = await payWithWebLN(pr)
    if (result.success) {
      storeZapReceipt(novelId, chapterId)
      setStep("success")
      setTimeout(() => {
        setOpen(false)
        onUnlocked()
      }, 1200)
    } else {
      setError(result.error ?? "Payment failed")
      setStep("invoice") // fall back to show invoice for manual pay
    }
  }

  const handleCopyInvoice = async () => {
    if (!invoice) return
    await navigator.clipboard.writeText(invoice)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Simulate unlock after manual payment (user confirms)
  const handleManualConfirm = () => {
    storeZapReceipt(novelId, chapterId)
    setStep("success")
    setTimeout(() => {
      setOpen(false)
      onUnlocked()
    }, 1200)
  }

  return (
    <>
      {/* Paywall Overlay */}
      <div className="relative">
        {/* Blurred preview */}
        <div
          className="pointer-events-none select-none"
          style={{ filter: "blur(6px)", opacity: 0.4, maxHeight: "200px", overflow: "hidden" }}
          aria-hidden="true"
        >
          <p className="mb-6 leading-relaxed">
            This chapter is locked. Zap to unlock and support the author directly.
            The content continues beyond this point with the full story waiting for you...
          </p>
          <p className="mb-6 leading-relaxed">
            Lightning-fast payments, no middlemen, just you and the author.
          </p>
        </div>

        {/* Lock card */}
        <div className={`relative z-10 flex flex-col items-center gap-4 rounded-2xl border px-6 py-10 text-center shadow-sm ${theme?.bg ?? "bg-background"}`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className={`text-sm font-medium ${theme?.mutedText ?? "text-muted-foreground"}`}>
              Chapter {chapterNumber}
            </p>
            <h3 className="mt-1 text-lg font-semibold">{chapterTitle}</h3>
          </div>
          <p className={`max-w-xs text-sm ${theme?.mutedText ?? "text-muted-foreground"}`}>
            This chapter requires a one-time zap of{" "}
            <span className="font-semibold text-foreground">{amountSats} sats</span> to unlock.
            Your payment goes directly to the author.
          </p>
          <Button onClick={handleOpen} size="lg" className="gap-2">
            <Zap className="h-4 w-4" />
            Zap to Unlock · {amountSats} sats
          </Button>
        </div>
      </div>

      {/* Zap Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Unlock Chapter
            </DialogTitle>
            <DialogDescription>
              Pay <strong>{amountSats} sats</strong> to unlock &ldquo;{chapterTitle}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {step === "idle" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {hasWebLN
                    ? "Your Lightning wallet is detected. Click below to pay instantly."
                    : "Generate an invoice and pay with any Lightning wallet."}
                </p>
                <Button onClick={handleGetInvoice} className="w-full gap-2">
                  <Zap className="h-4 w-4" />
                  {hasWebLN ? "Pay with Wallet" : "Generate Invoice"}
                </Button>
              </div>
            )}

            {step === "loading" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating invoice...</p>
              </div>
            )}

            {step === "paying" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                <p className="text-sm text-muted-foreground">Waiting for payment...</p>
              </div>
            )}

            {step === "invoice" && invoice && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Copy this invoice and pay with your Lightning wallet, then confirm below.
                </p>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <code className="flex-1 truncate text-xs">{invoice}</code>
                  <Button variant="ghost" size="icon" onClick={handleCopyInvoice} className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(`lightning:${invoice}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Wallet App
                </Button>
                <Button onClick={handleManualConfirm} className="w-full gap-2">
                  <Check className="h-4 w-4" />
                  I&apos;ve Paid — Unlock Chapter
                </Button>
              </div>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-medium">Chapter Unlocked!</p>
                <p className="text-sm text-muted-foreground">Enjoy the story ⚡</p>
              </div>
            )}

            {step === "error" && (
              <div className="space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" onClick={() => setStep("idle")} className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
