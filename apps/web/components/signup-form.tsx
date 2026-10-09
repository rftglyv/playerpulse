"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Iconizer } from "@/components/iconizer";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage, safeNext, signUp } from "@/lib/auth-client";

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(60, "Name must be 60 characters or fewer."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm: z.string().min(1, "Confirm your password."),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match." });

type Values = z.infer<typeof schema>;

const FIELDS: {
  name: keyof Values;
  label: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  description?: string;
  icon: string;
}[] = [
  { name: "name", label: "Name", type: "text", autoComplete: "name", icon: "person" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@studio.com", icon: "mail" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    description: "At least 8 characters.",
    icon: "lock",
  },
  { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password", icon: "lock" },
];

/** login-01-style signup card. On success go to ?next= or /dashboard/overview. */
export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useSearchParams();
  const rawNext = params.get("next");
  const next = safeNext(rawNext);
  const loginHref = rawNext ? `/login?next=${encodeURIComponent(rawNext)}` : "/login";
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });
  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      const { error } = await signUp.email({ name: values.name, email: values.email, password: values.password });
      if (error) return setServerError(authErrorMessage(error));
      router.replace(next);
      router.refresh();
    } catch {
      setServerError(authErrorMessage(null));
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl leading-tight font-semibold tracking-tight">Create your account</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your details below to create a PlayerPulse account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="signup-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              {serverError && (
                <Alert
                  variant="destructive"
                  className="grid-cols-[auto_1fr] gap-x-2 *:data-[slot=alert-description]:col-start-2"
                >
                  <Iconizer icon="error" size={16} className="row-span-2 translate-y-0.5" />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              {FIELDS.map((f) => (
                <Controller
                  key={f.name}
                  name={f.name}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`signup-${f.name}`}>{f.label}</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          {...field}
                          id={`signup-${f.name}`}
                          type={f.type}
                          placeholder={f.placeholder}
                          autoComplete={f.autoComplete}
                          aria-invalid={fieldState.invalid}
                          disabled={submitting}
                        />
                        <InputGroupAddon>
                          <Iconizer icon={f.icon} size={16} />
                        </InputGroupAddon>
                      </InputGroup>
                      {f.description && !fieldState.invalid && (
                        <FieldDescription className="text-xs">{f.description}</FieldDescription>
                      )}
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              ))}
              <Field>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Spinner data-icon="inline-start" />}
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link href={loginHref}>Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
