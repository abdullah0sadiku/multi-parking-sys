"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Car,
  Timer,
  Receipt,
  CreditCard,
  LogOut,
  User,
  ParkingCircle,
  BadgeCheck,
  Clock,
  MapPin,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Pencil,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/store/authStore"
import { portalService } from "@/lib/services/portal.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import type {
  PortalVehicle,
  PortalSpot,
  PortalTariff,
  PortalSubscription,
  PortalInvoice,
} from "@/types"

// ─── Query keys ───────────────────────────────────────────────────────────────

const QK = {
  profile:       ["portal-profile"],
  vehicles:      ["portal-vehicles"],
  spots:         ["portal-spots"],
  tariffs:       ["portal-tariffs"],
  subscriptions: ["portal-subscriptions"],
  sessions:      ["portal-sessions"],
  invoices:      ["portal-invoices"],
}

// ─── Status colour helper ─────────────────────────────────────────────────────

function statusCls(status: string) {
  switch (status) {
    case "active":    return "bg-green-500/10 text-green-600 border-green-200"
    case "completed": return "bg-blue-500/10 text-blue-600 border-blue-200"
    case "cancelled": return "bg-red-500/10 text-red-600 border-red-200"
    case "expired":   return "bg-gray-500/10 text-gray-500 border-gray-200"
    case "paid":      return "bg-green-500/10 text-green-600 border-green-200"
    case "pending":   return "bg-yellow-500/10 text-yellow-600 border-yellow-200"
    default:          return "bg-muted text-muted-foreground border-border"
  }
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusCls(status)}`}>
      {status}
    </span>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color = "bg-primary/10 text-primary",
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-start gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Add Vehicle modal ────────────────────────────────────────────────────────

const vehicleSchema = z.object({
  license_plate: z.string().min(1, "License plate is required").max(32),
  vehicle_type:  z.string().max(64).optional().or(z.literal("")),
})
type VehicleForm = z.infer<typeof vehicleSchema>

function AddVehicleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (v: VehicleForm) =>
      portalService.addVehicle({ license_plate: v.license_plate, vehicle_type: v.vehicle_type || undefined }),
    onSuccess: () => {
      toast.success("Vehicle added")
      qc.invalidateQueries({ queryKey: QK.vehicles })
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <Modal title="Add Vehicle" onClose={onClose}>
      <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lp">License Plate *</Label>
          <Input id="lp" placeholder="e.g. AB-1234-CD" {...register("license_plate")} />
          {errors.license_plate && <p className="text-xs text-destructive">{errors.license_plate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vt">Vehicle Type <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="vt" placeholder="e.g. Sedan, SUV, Motorcycle" {...register("vehicle_type")} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Vehicle
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Subscribe modal ──────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  vehicle_id:  z.coerce.number().int().positive("Select a vehicle"),
  spot_id:     z.coerce.number().int().positive().optional(),
  tariff_id:   z.coerce.number().int().positive().optional(),
  valid_from:  z.string().min(1, "Start date required"),
  valid_to:    z.string().min(1, "End date required"),
}).refine((d) => !d.valid_from || !d.valid_to || d.valid_from <= d.valid_to, {
  message: "End date must be after start date",
  path: ["valid_to"],
})
type SubscribeForm = z.infer<typeof subscribeSchema>

function SubscribeModal({
  onClose,
  vehicles,
  spots,
  tariffs,
}: {
  onClose: () => void
  vehicles: PortalVehicle[]
  spots: PortalSpot[]
  tariffs: PortalTariff[]
}) {
  const qc = useQueryClient()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SubscribeForm>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { valid_from: format(new Date(), "yyyy-MM-dd") },
  })

  const selectedTariffId = Number(watch("tariff_id"))
  const selectedTariff   = tariffs.find((t) => t.id === selectedTariffId) ?? null

  const { mutate, isPending } = useMutation({
    mutationFn: (v: SubscribeForm) =>
      portalService.subscribe({
        vehicle_id: Number(v.vehicle_id),
        spot_id:    v.spot_id ? Number(v.spot_id) : null,
        tariff_id:  v.tariff_id ? Number(v.tariff_id) : null,
        valid_from: v.valid_from,
        valid_to:   v.valid_to,
      }),
    onSuccess: () => {
      toast.success("Subscription created!")
      qc.invalidateQueries({ queryKey: QK.subscriptions })
      qc.invalidateQueries({ queryKey: QK.spots })
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <Modal title="Subscribe to a Parking Spot" onClose={onClose}>
      <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">

        {/* Vehicle */}
        <div className="space-y-1.5">
          <Label htmlFor="sub-vehicle">Vehicle *</Label>
          {vehicles.length === 0 ? (
            <p className="text-sm text-destructive">Add a vehicle first before subscribing.</p>
          ) : (
            <select
              id="sub-vehicle"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("vehicle_id")}
            >
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate}{v.vehicle_type ? ` — ${v.vehicle_type}` : ""}
                </option>
              ))}
            </select>
          )}
          {errors.vehicle_id && <p className="text-xs text-destructive">{errors.vehicle_id.message}</p>}
        </div>

        {/* Spot */}
        <div className="space-y-1.5">
          <Label htmlFor="sub-spot">Parking Spot <span className="text-muted-foreground text-xs">(optional — auto-assigned if blank)</span></Label>
          <select
            id="sub-spot"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register("spot_id")}
          >
            <option value="">Any available spot</option>
            {spots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.spot_code} — {s.level_name} (Floor {s.floor_number})
              </option>
            ))}
          </select>
          {spots.length === 0 && (
            <p className="text-xs text-muted-foreground">No available spots right now.</p>
          )}
        </div>

        {/* Tariff */}
        <div className="space-y-1.5">
          <Label htmlFor="sub-tariff">Tariff / Plan <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <select
            id="sub-tariff"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register("tariff_id")}
          >
            <option value="">No tariff</option>
            {tariffs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.currency} {Number(t.rate_per_hour).toFixed(2)}/hr
              </option>
            ))}
          </select>
          {selectedTariff && (
            <p className="text-xs text-muted-foreground">
              Rate: {selectedTariff.currency} {Number(selectedTariff.rate_per_hour).toFixed(2)}/hr
              · VAT {Number(selectedTariff.vat_percent)}%
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sub-from">Start Date *</Label>
            <Input id="sub-from" type="date" {...register("valid_from")} />
            {errors.valid_from && <p className="text-xs text-destructive">{errors.valid_from.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-to">End Date *</Label>
            <Input id="sub-to" type="date" {...register("valid_to")} />
            {errors.valid_to && <p className="text-xs text-destructive">{errors.valid_to.message}</p>}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isPending || vehicles.length === 0}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Subscribe
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Edit Profile modal ───────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(255),
  phone:     z.string().max(64).optional().or(z.literal("")),
})
type ProfileForm = z.infer<typeof profileSchema>

function EditProfileModal({
  onClose,
  currentName,
  currentPhone,
}: {
  onClose: () => void
  currentName: string
  currentPhone: string | null
}) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: currentName, phone: currentPhone ?? "" },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (v: ProfileForm) =>
      portalService.updateProfile({ full_name: v.full_name, phone: v.phone || undefined }),
    onSuccess: () => {
      toast.success("Profile updated")
      qc.invalidateQueries({ queryKey: QK.profile })
      onClose()
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pf-name">Full Name *</Label>
          <Input id="pf-name" {...register("full_name")} />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pf-phone">Phone</Label>
          <Input id="pf-phone" type="tel" placeholder="+1 234-567-8901" {...register("phone")} />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── POS Payment Modal ────────────────────────────────────────────────────────

type PosStep = "form" | "processing" | "success"

const CARD_BRANDS = [
  { id: "visa",       label: "VISA" },
  { id: "mastercard", label: "Mastercard" },
  { id: "amex",       label: "Amex" },
]

const PROCESSING_STEPS = [
  "Connecting to bank…",
  "Verifying card details…",
  "Authorizing payment…",
  "Confirming transaction…",
]

/** Renders card number with proper grouped bullets for unfilled digits */
function cardDisplay(raw: string) {
  const digits = raw.replace(/\s/g, "").padEnd(16, "•")
  return [digits.slice(0,4), digits.slice(4,8), digits.slice(8,12), digits.slice(12,16)].join(" ")
}

function formatCardNumber(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
}

function formatExpiry(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2)
  return digits
}

function CardChip() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" className="opacity-90">
      <rect width="36" height="28" rx="4" fill="#D4AF37" />
      <rect x="12" y="0" width="12" height="28" fill="#C49A17" opacity="0.5" />
      <rect x="0" y="9" width="36" height="10" fill="#C49A17" opacity="0.5" />
      <rect x="12" y="9" width="12" height="10" fill="#B8860B" opacity="0.6" />
      <rect x="14" y="11" width="8" height="6" rx="1" fill="#D4AF37" />
    </svg>
  )
}

function PaymentModal({ inv, onClose, onPaid }: {
  inv: PortalInvoice
  onClose: () => void
  onPaid: () => void
}) {
  const [step, setStep]              = useState<PosStep>("form")
  const [brand, setBrand]            = useState("visa")
  const [cardNumber, setCardNumber]  = useState("")
  const [expiry, setExpiry]          = useState("")
  const [cvv, setCvv]                = useState("")
  const [name, setName]              = useState("")
  const [errors, setErrors]          = useState<Record<string, string>>({})
  const [transactionRef, setRef]     = useState("")
  const [progressW, setProgressW]    = useState(0)
  const [procStepIdx, setProcStepIdx] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const amount = Number(inv.total).toFixed(2)
  const last4  = cardNumber.replace(/\s/g, "").slice(-4) || "••••"

  // Kick off progress bar + step cycling when we enter "processing"
  useEffect(() => {
    if (step !== "processing") return
    // Start CSS transition on next tick so the element has rendered at 0%
    const t0 = setTimeout(() => setProgressW(100), 30)
    const interval = setInterval(() =>
      setProcStepIdx((i) => Math.min(i + 1, PROCESSING_STEPS.length - 1)), 700
    )
    return () => { clearTimeout(t0); clearInterval(interval) }
  }, [step])

  function validate() {
    const e: Record<string, string> = {}
    const digits = cardNumber.replace(/\s/g, "")
    if (digits.length < 16)               e.cardNumber = "Enter a 16-digit card number"
    if (!/^\d{2}\/\d{2}$/.test(expiry))   e.expiry     = "Enter expiry as MM/YY"
    else {
      const [mm, yy] = expiry.split("/").map(Number)
      const exp = new Date(2000 + yy, mm)   // first day of the month AFTER expiry
      if (mm < 1 || mm > 12 || exp <= new Date()) e.expiry = "Card has expired"
    }
    if (cvv.replace(/\D/g, "").length < 3) e.cvv  = "Enter a 3-digit CVV"
    if (!name.trim())                       e.name = "Cardholder name is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePay() {
    if (!validate()) return
    setProgressW(0)
    setProcStepIdx(0)
    setStep("processing")
    await new Promise((r) => setTimeout(r, 3000))
    try {
      const result = await portalService.payInvoice(inv.id, {
        cardholder_name: name.trim(),
        card_last4:      last4,
        card_brand:      brand.toUpperCase(),
      })
      setRef(result.transaction_ref)
      setStep("success")
      onPaid()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setStep("form")
    }
  }

  async function handleDownloadReceipt() {
    setDownloading(true)
    try { await portalService.downloadInvoice(inv.id) }
    catch (err) { toast.error(getApiErrorMessage(err)) }
    finally { setDownloading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ══ PROCESSING ══════════════════════════════════════════════════════ */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center gap-6 py-14 px-8 text-center">
            {/* Animated POS terminal icon */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
              <div className="absolute inset-3 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">Processing Payment</p>
              <p className="text-sm text-muted-foreground h-5 transition-all">
                {PROCESSING_STEPS[procStepIdx]}
              </p>
            </div>

            {/* Progress bar — driven by state transition, not broken keyframes */}
            <div className="w-full space-y-1.5">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all ease-in-out"
                  style={{ width: `${progressW}%`, transitionDuration: "3000ms" }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{progressW === 100 ? "100%" : "…"}</p>
            </div>

            <p className="text-xs text-muted-foreground">Do not close or refresh this page</p>
          </div>
        )}

        {/* ══ SUCCESS ═════════════════════════════════════════════════════════ */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-5 py-8 px-8 text-center">
            {/* Animated checkmark */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-4 ring-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>

            <div>
              <p className="text-xl font-bold text-foreground">Payment Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your invoice has been marked as paid.
              </p>
            </div>

            {/* Receipt card */}
            <div className="w-full rounded-xl border border-border bg-muted/40 divide-y divide-border text-left overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Payment Receipt
                </p>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <Row label="Invoice"     value={`INV-${String(inv.id).padStart(4, "0")}`} />
                <Row label="Amount paid" value={`$${amount}`} bold />
                <Row label="Card"        value={`${brand.toUpperCase()} •••• ${last4}`} />
                <Row label="Date"        value={format(new Date(), "MMM d, yyyy · HH:mm")} />
                <Row label="Reference"   value={transactionRef} mono />
              </div>
            </div>

            <div className="w-full flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleDownloadReceipt}
                disabled={downloading}
              >
                {downloading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Download className="h-4 w-4" />}
                Receipt PDF
              </Button>
              <Button className="flex-1" onClick={onClose}>Done</Button>
            </div>
          </div>
        )}

        {/* ══ CARD FORM ═══════════════════════════════════════════════════════ */}
        {step === "form" && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Secure Payment</h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-6 pt-5 pb-6 space-y-5">

              {/* Amount banner */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount due</span>
                <span className="text-2xl font-bold text-primary">${amount}</span>
              </div>

              {/* ── Live card preview ── */}
              <div
                className="relative h-44 rounded-2xl p-5 text-white overflow-hidden shadow-xl select-none"
                style={{
                  background: brand === "mastercard"
                    ? "linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)"
                    : brand === "amex"
                    ? "linear-gradient(135deg,#006FCF 0%,#004A97 100%)"
                    : "linear-gradient(135deg,#1e3a5f 0%,#2563EB 100%)",
                }}
              >
                {/* Subtle diagonal texture */}
                <div
                  className="absolute inset-0 opacity-[0.07]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(255,255,255,1) 18px,rgba(255,255,255,1) 19px)",
                  }}
                />
                {/* Shiny circle decoration */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
                <div className="absolute -right-4 top-8 h-20 w-20 rounded-full bg-white/5" />

                {/* Top row: chip + brand */}
                <div className="relative flex items-center justify-between">
                  <CardChip />
                  <span className="text-sm font-bold tracking-widest uppercase opacity-90">
                    {CARD_BRANDS.find((b) => b.id === brand)?.label}
                  </span>
                </div>

                {/* Card number */}
                <p className="relative mt-4 font-mono text-[1.15rem] tracking-[0.2em] text-white/95">
                  {cardDisplay(cardNumber)}
                </p>

                {/* Bottom row */}
                <div className="relative mt-3 flex justify-between items-end text-xs">
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-widest text-white/50 mb-0.5">
                      Card Holder
                    </p>
                    <p className="font-semibold truncate max-w-[170px] uppercase tracking-wide">
                      {name || "YOUR NAME"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-medium uppercase tracking-widest text-white/50 mb-0.5">
                      Expires
                    </p>
                    <p className="font-semibold">{expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>

              {/* Brand tabs */}
              <div className="flex gap-2">
                {CARD_BRANDS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBrand(b.id)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                      brand === b.id
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Card number input */}
              <div className="space-y-1.5">
                <Label htmlFor="pos-cn">Card Number</Label>
                <Input
                  id="pos-cn"
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) => {
                    setCardNumber(formatCardNumber(e.target.value))
                    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: "" }))
                  }}
                  maxLength={19}
                  className="font-mono text-base tracking-widest"
                  autoComplete="cc-number"
                />
                {errors.cardNumber && (
                  <p className="text-xs text-destructive">{errors.cardNumber}</p>
                )}
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pos-exp">Expiry Date</Label>
                  <Input
                    id="pos-exp"
                    placeholder="MM/YY"
                    inputMode="numeric"
                    value={expiry}
                    onChange={(e) => {
                      setExpiry(formatExpiry(e.target.value))
                      if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: "" }))
                    }}
                    maxLength={5}
                    className="font-mono"
                    autoComplete="cc-exp"
                  />
                  {errors.expiry && (
                    <p className="text-xs text-destructive">{errors.expiry}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pos-cvv">CVV / CVC</Label>
                  <Input
                    id="pos-cvv"
                    placeholder="•••"
                    inputMode="numeric"
                    type="password"
                    value={cvv}
                    onChange={(e) => {
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      if (errors.cvv) setErrors((prev) => ({ ...prev, cvv: "" }))
                    }}
                    maxLength={4}
                    autoComplete="cc-csc"
                  />
                  {errors.cvv && (
                    <p className="text-xs text-destructive">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Cardholder name */}
              <div className="space-y-1.5">
                <Label htmlFor="pos-name">Cardholder Name</Label>
                <Input
                  id="pos-name"
                  placeholder="As printed on the card"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
                  }}
                  autoComplete="cc-name"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  256-bit SSL encrypted · Card data is never stored on our servers
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button className="flex-1 gap-2" onClick={handlePay}>
                  <CreditCard className="h-4 w-4" />
                  Pay ${amount}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({
  label, value, mono = false, bold = false,
}: {
  label: string; value: string; mono?: boolean; bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span
        className={`text-foreground truncate text-right ${
          bold ? "font-bold" : "font-medium"
        } ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Invoice row with download + pay ─────────────────────────────────────────

function InvoiceRow({ inv, onPay }: { inv: PortalInvoice; onPay: (inv: PortalInvoice) => void }) {
  const [downloading, setDownloading] = useState(false)
  const handleDownload = async () => {
    setDownloading(true)
    try {
      await portalService.downloadInvoice(inv.id)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setDownloading(false)
    }
  }
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground font-mono text-xs">
        INV-{String(inv.id).padStart(4, "0")}
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {format(new Date(inv.issued_at), "MMM d, yyyy")}
      </td>
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {inv.due_at ? format(new Date(inv.due_at), "MMM d, yyyy") : "—"}
      </td>
      <td className="px-4 py-3 text-right font-semibold text-foreground">
        ${Number(inv.total).toFixed(2)}
      </td>
      <td className="px-4 py-3"><StatusPill status={inv.status} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {inv.status === "pending" && (
            <button
              onClick={() => onPay(inv)}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Pay
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
            title="Download PDF"
          >
            {downloading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
            PDF
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const router  = useRouter()
  const qc      = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()

  // Modal states
  const [showAddVehicle,   setShowAddVehicle]   = useState(false)
  const [showSubscribe,    setShowSubscribe]    = useState(false)
  const [showEditProfile,  setShowEditProfile]  = useState(false)
  const [deletingVehicle,  setDeletingVehicle]  = useState<PortalVehicle | null>(null)
  const [cancelingSub,     setCancelingSub]     = useState<PortalSubscription | null>(null)
  const [payingInvoice,    setPayingInvoice]    = useState<PortalInvoice | null>(null)

  // Auth guard
  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.replace("/register"); return }
    if (user?.role === "admin" || user?.role === "staff") router.replace("/administration")
  }, [isAuthenticated, authLoading, user, router])

  // ── Data fetches ───────────────────────────────────────────────────────────

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: QK.profile,
    queryFn:  portalService.getProfile,
    enabled:  isAuthenticated && user?.role === "customer",
  })

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: QK.vehicles,
    queryFn:  portalService.getVehicles,
    enabled:  isAuthenticated && user?.role === "customer",
  })

  const { data: spots = [] } = useQuery({
    queryKey: QK.spots,
    queryFn:  portalService.getAvailableSpots,
    enabled:  isAuthenticated && user?.role === "customer",
  })

  const { data: tariffs = [] } = useQuery({
    queryKey: QK.tariffs,
    queryFn:  portalService.getTariffs,
    enabled:  isAuthenticated && user?.role === "customer",
  })

  const { data: subscriptions = [], isLoading: subsLoading } = useQuery({
    queryKey: QK.subscriptions,
    queryFn:  portalService.getSubscriptions,
    enabled:  isAuthenticated && user?.role === "customer",
  })

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: QK.sessions,
    queryFn:  portalService.getSessions,
    enabled:  isAuthenticated && user?.role === "customer",
  })

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: QK.invoices,
    queryFn:  portalService.getInvoices,
    enabled:  isAuthenticated && user?.role === "customer",
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: number) => portalService.deleteVehicle(id),
    onSuccess: () => {
      toast.success("Vehicle removed")
      qc.invalidateQueries({ queryKey: QK.vehicles })
      setDeletingVehicle(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  const cancelSubMutation = useMutation({
    mutationFn: (id: number) => portalService.cancelSubscription(id),
    onSuccess: () => {
      toast.success("Subscription cancelled")
      qc.invalidateQueries({ queryKey: QK.subscriptions })
      qc.invalidateQueries({ queryKey: QK.spots })
      setCancelingSub(null)
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeSessions   = sessions.filter((s) => s.status === "active")
  const pendingInvoices  = invoices.filter((i) => i.status === "pending")
  const activeSubs       = subscriptions.filter((s) => s.status === "active")

  const handleLogout = () => { logout(); router.replace("/register") }

  // Loading/guard state
  if (authLoading || !isAuthenticated || (user?.role !== "customer" && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Modals ── */}
      {payingInvoice && (
        <PaymentModal
          inv={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaid={() => {
            qc.invalidateQueries({ queryKey: QK.invoices })
          }}
        />
      )}
      {showAddVehicle  && <AddVehicleModal onClose={() => setShowAddVehicle(false)} />}
      {showSubscribe   && (
        <SubscribeModal
          onClose={() => setShowSubscribe(false)}
          vehicles={vehicles}
          spots={spots}
          tariffs={tariffs}
        />
      )}
      {showEditProfile && profile && (
        <EditProfileModal
          onClose={() => setShowEditProfile(false)}
          currentName={profile.full_name}
          currentPhone={profile.phone}
        />
      )}

      {/* Delete vehicle confirm */}
      {deletingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Remove vehicle?</p>
                <p className="text-sm text-muted-foreground">{deletingVehicle.license_plate}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will remove the vehicle from your account. Active sessions linked to this vehicle cannot be deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeletingVehicle(null)} disabled={deleteVehicleMutation.isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteVehicleMutation.isPending}
                onClick={() => deleteVehicleMutation.mutate(deletingVehicle.id)}
              >
                {deleteVehicleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel subscription confirm */}
      {cancelingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Cancel subscription?</p>
                <p className="text-sm text-muted-foreground">{cancelingSub.license_plate} — {cancelingSub.spot_code ?? "Any spot"}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your reserved spot will be released and the subscription status will change to cancelled.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCancelingSub(null)} disabled={cancelSubMutation.isPending}>
                Keep it
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelSubMutation.isPending}
                onClick={() => cancelSubMutation.mutate(cancelingSub.id)}
              >
                {cancelSubMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Car className="h-5 w-5" />
            </div>
            <span className="font-semibold text-foreground">Customer Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {profile?.full_name ?? user?.email}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-8">

        {/* ── Profile card ── */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl font-bold">
            {(profile?.full_name ?? user?.email ?? "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {profileLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground">{profile?.full_name ?? "Your Account"}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
              </>
            )}
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={() => setShowEditProfile(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Car}       label="My Vehicles"          value={vehiclesLoading ? "…" : vehicles.length}        sub="Registered"               color="bg-primary/10 text-primary" />
          <StatCard icon={Timer}     label="Active Sessions"      value={sessionsLoading ? "…" : activeSessions.length}  sub={`${sessions.length} total`}   color="bg-green-500/10 text-green-600" />
          <StatCard icon={Receipt}   label="Pending Invoices"     value={invoicesLoading ? "…" : pendingInvoices.length} sub={`${invoices.length} total`}   color="bg-yellow-500/10 text-yellow-600" />
          <StatCard icon={BadgeCheck} label="Active Subscriptions" value={subsLoading ? "…" : activeSubs.length}         sub={`${subscriptions.length} total`} color="bg-blue-500/10 text-blue-600" />
        </div>

        {/* ── My Vehicles ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              My Vehicles
            </h2>
            <Button size="sm" className="gap-2" onClick={() => setShowAddVehicle(true)}>
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>

          {vehiclesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : vehicles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <Car className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No vehicles registered yet.</p>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddVehicle(true)}>
                <Plus className="h-4 w-4" />
                Add your first vehicle
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <div key={v.id} className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{v.license_plate}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.vehicle_type ?? "Unknown type"}</p>
                  </div>
                  <button
                    onClick={() => setDeletingVehicle(v)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove vehicle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Subscriptions ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              My Subscriptions
            </h2>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowSubscribe(true)}>
              <Plus className="h-4 w-4" />
              New Subscription
            </Button>
          </div>

          {subsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
              <CreditCard className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowSubscribe(true)} disabled={vehicles.length === 0}>
                <Plus className="h-4 w-4" />
                {vehicles.length === 0 ? "Add a vehicle first" : "Subscribe to a spot"}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {sub.license_plate} — {sub.spot_code ? `${sub.spot_code}${sub.level_name ? ` (${sub.level_name})` : ""}` : "Any spot"}
                      </p>
                      <p className="text-xs text-muted-foreground">{sub.tariff_name ?? "No tariff"}</p>
                    </div>
                    <StatusPill status={sub.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(new Date(sub.valid_from), "MMM d, yyyy")}</span>
                    <span>→</span>
                    <span>{format(new Date(sub.valid_to), "MMM d, yyyy")}</span>
                  </div>
                  {sub.monthly_fee != null && (
                    <p className="text-sm font-semibold text-foreground">${Number(sub.monthly_fee).toFixed(2)} / month</p>
                  )}
                  {sub.status === "active" && (
                    <button
                      onClick={() => setCancelingSub(sub)}
                      className="text-xs text-destructive hover:underline underline-offset-2 transition-colors"
                    >
                      Cancel subscription
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Parking Sessions ── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <ParkingCircle className="h-5 w-5 text-primary" />
            Parking Sessions
          </h2>
          {sessionsLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <ParkingCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No parking sessions yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehicle</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Spot</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Started</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Duration</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{s.license_plate}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {s.spot_code} ({s.level_name})
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(s.started_at), "MMM d, HH:mm")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {s.duration_minutes != null ? `${s.duration_minutes} min` : "Ongoing"}
                          </span>
                        </td>
                        <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ── Invoices ── */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Invoices &amp; Receipts
          </h2>
          {invoicesLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : invoices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Receipt className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issued</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invoices.map((inv) => (
                      <InvoiceRow key={inv.id} inv={inv} onPay={setPayingInvoice} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
