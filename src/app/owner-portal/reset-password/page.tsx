import { ResetPasswordForm } from "@/components/reset-password-form";

export default function OwnerResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
      <ResetPasswordForm owner />
    </div>
  );
}
