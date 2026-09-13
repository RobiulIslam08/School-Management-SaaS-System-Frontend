"use client";

import { useState } from "react";
import { toastApiResult } from "@/lib/toast-api";
import { Button, Card, Input, Label } from "@/components/ui";
import { useGetBrandingQuery, usePublicAdmitMutation } from "@/lib/api/schoolApi";

export default function ApplyPage() {
  const { data } = useGetBrandingQuery();
  const [admit] = usePublicAdmitMutation();
  const [form, setForm] = useState({ name: "", gender: "male", academicYear: "2026", phone: "", guardianName: "", guardianPhone: "" });
  const branding = data?.data;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center p-6">
      <Card className="w-full">
        <h1 className="text-2xl font-semibold">{String(branding?.name ?? "Online admission")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">পাবলিক ফর্ম — Owner প্যাকেজে চালু থাকতে হবে।</p>
        <form className="mt-6 space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          const result = await admit({
            name: form.name,
            gender: form.gender,
            academicYear: form.academicYear,
            phone: form.phone,
            guardian: { guardianName: form.guardianName, phone: form.guardianPhone },
          });
          if (!toastApiResult(result, "আবেদন গৃহীত", "আবেদন গ্রহণ হয়নি — মডিউল বন্ধ থাকতে পারে")) return;
        }}>
          <div><Label>শিক্ষার্থীর নাম</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>ফোন</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>অভিভাবক</Label><Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} /></div>
          <Button className="w-full" type="submit">আবেদন পাঠান</Button>
        </form>
      </Card>
    </div>
  );
}
