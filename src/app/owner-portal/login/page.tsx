import { LoginForm } from "@/components/login-form";

export default function OwnerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 p-6">
      <LoginForm owner />
    </div>
  );
}
