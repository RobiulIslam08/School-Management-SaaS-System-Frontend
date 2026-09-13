import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">School Management OS</p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-5xl">
        এক স্কুল, এক ডাটাবেজ, সম্পূর্ণ আলাদা অপারেশন।
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        ভর্তি থেকে ফলাফল, ফি থেকে হাজিরা — বাংলাদেশি স্কুলের জন্য প্রিমিয়াম ড্যাশবোর্ড।
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground" href="/login">
          স্কুল লগইন
        </Link>
        <Link className="inline-flex h-11 items-center rounded-md border border-border bg-white px-5 text-sm font-medium" href="/apply">
          অনলাইন ভর্তি আবেদন
        </Link>
      </div>
    </div>
  );
}
