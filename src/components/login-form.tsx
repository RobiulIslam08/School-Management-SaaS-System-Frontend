"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useLoginMutation, useVerify2faMutation } from "@/lib/api/schoolApi";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitch } from "./language-switch";
import { Button, Card, FieldError, Input, Label } from "./ui";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm({ owner = false }: { owner?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const [verify2fa, { isLoading: verifying }] = useVerify2faMutation();
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const result = await login({ ...values, owner });
    if ("error" in result) {
      toast.error(t.auth.loginFailed);
      return;
    }
    if (result.data?.data.requiresTwoFactor && result.data.data.tempToken) {
      setTempToken(result.data.data.tempToken);
      toast.success(result.data.message ?? t.auth.twoFactor);
      return;
    }
    toast.success(result.data?.message ?? t.auth.signIn);
    router.push(owner ? "/__owner/packages" : "/dashboard");
  }

  async function on2fa() {
    if (!tempToken) return;
    const result = await verify2fa({ tempToken, code });
    if ("error" in result) {
      toast.error(t.auth.loginFailed);
      return;
    }
    toast.success(result.data?.message ?? t.auth.signIn);
    router.push("/__owner/packages");
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-4 flex justify-end">
        <LanguageSwitch />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {owner ? t.auth.owner : t.auth.school}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{owner ? t.auth.ownerTitle : t.auth.loginTitle}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{owner ? t.auth.ownerHint : t.auth.loginHint}</p>
      {tempToken ? (
        <div className="mt-6 space-y-3">
          <Label htmlFor="code">{t.auth.twoFactor}</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" />
          <Button className="w-full" disabled={verifying} aria-busy={verifying} onClick={on2fa}>
            {verifying ? t.auth.verifying : t.auth.verify}
          </Button>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <Label htmlFor="email">{t.common.email}</Label>
            <Input id="email" type="email" autoComplete="username" {...form.register("email")} />
            <FieldError message={form.formState.errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="pr-11"
                {...form.register("password")}
              />
              <button
                type="button"
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={showPassword ? t.common.hide : t.common.show}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <FieldError message={form.formState.errors.password?.message} />
          </div>
          <Button className="w-full" disabled={isLoading} aria-busy={isLoading} type="submit">
            {isLoading ? t.auth.signingIn : t.auth.signIn}
          </Button>
          <p className="text-center text-sm">
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href={owner ? "/__owner/forgot-password" : "/forgot-password"}
            >
              {t.auth.forgot}
            </Link>
          </p>
        </form>
      )}
    </Card>
  );
}
