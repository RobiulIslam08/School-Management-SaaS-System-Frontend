import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function OwnerForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
      <ForgotPasswordForm owner />
    </div>
  );
}
