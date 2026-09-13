"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForgotPasswordMutation } from "@/lib/api/schoolApi";
import { toastApiResult } from "@/lib/toast-api";
import { LanguageSwitch } from "./language-switch";
import { Button, Card, FieldError, Input, Label } from "./ui";

const schema = z.object({
  email: z.string().email("সঠিক ইমেইল লিখুন"),
});

export function ForgotPasswordForm({ owner = false }: { owner?: boolean }) {
  const router = useRouter();
  const [requestReset, { isLoading }] = useForgotPasswordMutation();
  const [devCode, setDevCode] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const loginHref = owner ? "/__owner/login" : "/login";
  const resetHref = owner ? "/__owner/reset-password" : "/reset-password";
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const result = await requestReset({ email: values.email, owner });
    if (!toastApiResult(result, "If this email is registered, a password reset code was sent.")) {
      return;
    }
    setSubmittedEmail(values.email);
    const code = result.data?.data.devCode;
    setDevCode(typeof code === "string" && code.length === 6 ? code : null);
  }

  if (submittedEmail) {
    const next = `${resetHref}?email=${encodeURIComponent(submittedEmail)}`;
    return (
      <Card className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <LanguageSwitch />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {owner ? "Platform Owner" : "School Dashboard"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">কোড পাঠানো হয়েছে</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          এই ইমেইল রেজিস্টার্ড থাকলে ৬-ডিজিট রিসেট কোড পাঠানো হয়েছে। কোড ১৫ মিনিটের মধ্যে ব্যবহার করুন।
        </p>
        {devCode ? (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm">
            Reset code: <span className="font-semibold tracking-widest">{devCode}</span>
          </p>
        ) : null}
        <Button className="mt-6 w-full" onClick={() => router.push(next)} type="button">
          কোড দিয়ে পাসওয়ার্ড বদলান
        </Button>
        <p className="mt-4 text-center text-sm">
          <Link className="text-primary underline-offset-4 hover:underline" href={loginHref}>
            লগইনে ফিরুন
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-4 flex justify-end">
        <LanguageSwitch />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {owner ? "Platform Owner" : "School Dashboard"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">পাসওয়ার্ড ভুলে গেছেন?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        রেজিস্টার্ড ইমেইল দিন। অ্যাকাউন্ট থাকলে একটি রিসেট কোড তৈরি হবে।
      </p>
      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="email">ইমেইল</Label>
          <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <Button className="w-full" disabled={isLoading} type="submit">
          কোড পাঠান
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link className="text-primary underline-offset-4 hover:underline" href={loginHref}>
          লগইনে ফিরুন
        </Link>
      </p>
    </Card>
  );
}
