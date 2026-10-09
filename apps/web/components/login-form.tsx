"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage, safeNext, signIn } from "@/lib/auth-client";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type Values = z.infer<typeof schema>;

/**
 * login-01 card wired to Better Auth.
 * - `redirect` (standalone /login page): on success go to ?next= or /dashboard/overview.
 * - otherwise (dashboard auth gate): stay on the URL and router.refresh() so the server gate re-renders.
 */
export function LoginForm({ redirect = false, className, ...props }: React.ComponentProps<"div"> & { redirect?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const signupNext = redirect ? params.get("next") : pathname;
  const signupHref = signupNext ? `/signup?next=${encodeURIComponent(signupNext)}` : "/signup";
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      const { error } = await signIn.email({ email: values.email, password: values.password });
      if (error) return setServerError(authErrorMessage(error));
      if (redirect) router.replace(next);
      router.refresh();
    } catch {
      setServerError(authErrorMessage(null));
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl leading-tight font-semibold tracking-tight">
            Sign in to PlayerPulse
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Enter your email below to sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {serverError && (
                <Alert variant="destructive">
                  <AlertCircleIcon />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="login-email"
                      type="email"
                      placeholder="you@studio.com"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      disabled={submitting}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={fieldState.invalid}
                      disabled={submitting}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Field>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2Icon className="animate-spin" />}
                  {submitting ? "Signing in…" : "Sign in"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href={signupHref}>Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
