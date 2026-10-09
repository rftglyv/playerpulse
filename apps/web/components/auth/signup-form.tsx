"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authErrorMessage, safeNext, signUp } from "@/lib/auth-client";

const schema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60, "Name must be 60 characters or fewer."),
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
  description?: string;
}[] = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", description: "At least 8 characters." },
  { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password" },
];

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
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
    <form id="signup-form" noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {serverError && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        {FIELDS.map((f) => (
          <Controller
            key={f.name}
            name={f.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`signup-${f.name}`}>{f.label}</FieldLabel>
                <Input
                  {...field}
                  id={`signup-${f.name}`}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  aria-invalid={fieldState.invalid}
                  disabled={submitting}
                />
                {f.description && !fieldState.invalid && (
                  <FieldDescription className="font-mono text-[11px]">{f.description}</FieldDescription>
                )}
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        ))}
      </FieldGroup>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2Icon className="animate-spin" />}
        {submitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
