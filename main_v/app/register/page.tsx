"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Car, Loader2, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/lib/services/auth.service"
import { portalService } from "@/lib/services/portal.service"
import { getApiErrorMessage } from "@/lib/api/axiosInstance"
import { useAuth } from "@/store/authStore"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const registerSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(255),
  email:     z.string().email("Enter a valid email"),
  password:  z.string().min(8, "Password must be at least 8 characters"),
  phone:     z.string().max(64).optional().or(z.literal("")),
})

type LoginForm    = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomerAuthPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [tab, setTab] = useState<"signin" | "signup">("signin")

  // Already logged in → redirect
  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    if (user?.role === "admin" || user?.role === "staff") {
      router.replace("/administration")
    } else {
      router.replace("/register/dashboard")
    }
  }, [isAuthenticated, authLoading, user, router])

  // ── Login ──────────────────────────────────────────────────────────────────
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      login(data)
      toast.success("Welcome back!")
      if (data.user.role === "admin" || data.user.role === "staff") {
        router.replace("/administration")
      } else {
        router.replace("/register/dashboard")
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  // ── Register ───────────────────────────────────────────────────────────────
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })
  const registerMutation = useMutation({
    mutationFn: (values: RegisterForm) =>
      portalService.register({
        full_name: values.full_name,
        email:     values.email,
        password:  values.password,
        phone:     values.phone || undefined,
      }),
    onSuccess: (data) => {
      login(data)
      toast.success("Account created! Welcome!")
      router.replace("/register/dashboard")
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Car className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your vehicles, subscriptions &amp; parking sessions
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl border border-border bg-muted p-1 gap-1">
          <button
            onClick={() => setTab("signin")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === "signin"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </button>
        </div>

        {/* ── Sign In form ── */}
        {tab === "signin" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <form
              onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email address</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loginMutation.isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setTab("signup")}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create one
              </button>
            </p>
          </div>
        )}

        {/* ── Sign Up form ── */}
        {tab === "signup" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <form
              onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="reg-full_name">Full Name *</Label>
                <Input
                  id="reg-full_name"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  {...registerForm.register("full_name")}
                />
                {registerForm.formState.errors.full_name && (
                  <p className="text-xs text-destructive">
                    {registerForm.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email address *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password *</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  {...registerForm.register("password")}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">Phone <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="+1 234-567-8901"
                  autoComplete="tel"
                  {...registerForm.register("phone")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {registerMutation.isPending ? "Creating account…" : "Create Account"}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setTab("signin")}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Staff / Admin?{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-foreground">
            Go to admin panel
          </a>
        </p>
      </div>
    </div>
  )
}
