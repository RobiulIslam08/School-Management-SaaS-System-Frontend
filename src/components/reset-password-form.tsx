"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useEffect, useMemo } from "react";
import { useResetPasswordMutation } from "@/lib/api/schoolApi";
import { toastApiResult } from "@/lib/toast-api";
import { LanguageSwitch } from "./language-switch";
import { Button, Card, FieldError, Input, Label } from "./ui";

const schema = z
  .object({
    email: z.string().email("সঠিক ইমেইল লিখুন"),
    code: z.string().regex(/^\d{6}$/, "৬ ডিজিটের কোড দিন"),
    password: z.string().min(8, "নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষর"),
    confirm: z.string().min(8, "পাসওয়ার্ড আবার লিখুন"),
  })
  .refine((value) => value.password === value.confirm, {
    message: "পাসওয়ার্ড দুটি মিলেনি",
    path: ["confirm"],
  });

function ResetPasswordFields({ owner }: { owner: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const loginHref = owner ? "/__owner/login" : "/login";
  const forgotHref = owner ? "/__owner/forgot-password" : "/forgot-password";
  const defaultValues = useMemo(
    () => ({ email: emailFromQuery, code: "", password: "", confirm: "" }),
    [emailFromQuery]
  );
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, form]);

  async function onSubmit(values: z.infer<typeof schema>) {
    const result = await resetPassword({
      email: values.email,
      code: values.code,
      password: values.password,
      owner,
    });
    if (!toastApiResult(result, "Password updated successfully. Sign in with your new password.")) {
      return;
    }
    router.push(loginHref);
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-4 flex justify-end">
        <LanguageSwitch />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {owner ? "Platform Owner" : "School Dashboard"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">নতুন পাসওয়ার্ড দিন</h1>
      <p className="mt-1 text-sm text-muted-foreground">ইমেইল, ৬-ডিজিট কোড এবং নতুন পাসওয়ার্ড লিখুন।</p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="email">ইমেইল</Label>
          <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="code">রিসেট কোড</Label>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            {...form.register("code")}
          />
          <FieldError message={form.formState.errors.code?.message} />
        </div>
        <div>
          <Label htmlFor="password">নতুন পাসওয়ার্ড</Label>
          <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <div>
          <Label htmlFor="confirm">পাসওয়ার্ড আবার</Label>
          <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
          <FieldError message={form.formState.errors.confirm?.message} />
        </div>
        <Button className="w-full" disabled={isLoading} type="submit">
          পাসওয়ার্ড আপডেট করুন
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        কোড পাননি?{" "}
        <Link className="text-primary underline-offset-4 hover:underline" href={forgotHref}>
          আবার চান
        </Link>
        {" · "}
        <Link className="text-primary underline-offset-4 hover:underline" href={loginHref}>
          লগইনে ফিরুন
        </Link>
      </p>
    </Card>
  );
}

export function ResetPasswordForm({ owner = false }: { owner?: boolean }) {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-6 space-y-3">
            <div className="h-11 animate-pulse rounded-md bg-muted" />
            <div className="h-11 animate-pulse rounded-md bg-muted" />
            <div className="h-11 animate-pulse rounded-md bg-muted" />
          </div>
        </Card>
      }
    >
      <ResetPasswordFields owner={owner} />
    </Suspense>
  );
}
