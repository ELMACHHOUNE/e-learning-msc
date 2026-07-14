"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Save, Eye, EyeOff } from "lucide-react";
import LogoSpinner from "@/components/shared/logo-spinner";
import { toast } from "@/components/ui/alert";

function getSafeSessionImage(image?: string | null) {
  if (!image) return undefined;
  if (image.startsWith("data:")) return undefined;
  if (image.length > 512) return undefined;
  return image;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

export default function ProfilePage() {
  const { status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.error) return;
          setProfile(data);
          setName(data.name);
          setPhone(data.phone ?? "");
          setAvatarPreview(data.avatar ?? null);
        });
    }
  }, [status, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ variant: 'error', title: 'Validation error', message: 'Full name is required' });
      return
    }

    setSaving(true);

    const body: Record<string, unknown> = { name, phone };
    if (avatarPreview && avatarPreview.startsWith("data:")) {
      body.avatar = avatarPreview;
    }
    if (currentPassword && newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) {
        toast({ variant: 'error', title: 'Update failed', message: data.error });
      } else {
        toast({ variant: 'success', title: 'Profile updated successfully' });
        setCurrentPassword("");
        setNewPassword("");
        setProfile(data);
        update({ name: data.name, image: getSafeSessionImage(data.avatar) });
      }
    } catch {
      toast({ variant: 'error', title: 'Update failed', message: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !profile) return <LogoSpinner />

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-180 mx-auto px-6 py-16">
        <h1 className="text-display-sm text-ink font-bold uppercase leading-[0.95] mb-10">
          Account Settings
        </h1>

        <section className="mb-12">
          <h2 className="text-heading-xs text-ink font-bold uppercase tracking-widest mb-6">
            Profile Picture
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-soft">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary text-on-primary text-heading-sm font-700">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border border-hairline-strong bg-canvas text-ink text-button-sm font-bold uppercase py-2 px-4 rounded-xs hover:bg-surface-soft transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-heading-xs text-ink font-bold uppercase tracking-widest mb-6">
            Personal Information
          </h2>
          <div className="space-y-5">
            <div>
              <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors"
              />
            </div>
            <div>
              <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full border border-hairline bg-surface-soft text-mute text-body-md px-4 py-2.5 rounded-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 rounded-xs outline-none focus:border-ink transition-colors"
              />
            </div>
            <div>
              <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">
                Role
              </label>
              <input
                type="text"
                value={
                  profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                }
                disabled
                className="w-full border border-hairline bg-surface-soft text-mute text-body-md px-4 py-2.5 rounded-xs cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-heading-xs text-ink font-bold uppercase tracking-widest mb-6">
            Change Password
          </h2>
          <p className="text-caption text-mute mb-5 leading-normal">
            Leave blank to keep your current password.
          </p>
          <div className="space-y-5">
            <div>
              <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 pr-10 rounded-xs outline-none focus:border-ink transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink bg-transparent border-none cursor-pointer"
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-caption text-mute uppercase tracking-widest font-600 mb-1.5 block">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-hairline-strong bg-canvas text-ink text-body-md px-4 py-2.5 pr-10 rounded-xs outline-none focus:border-ink transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink bg-transparent border-none cursor-pointer"
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-on-primary text-button-md font-bold uppercase tracking-[0.144px] py-3 px-8 rounded-xs hover:bg-primary-deep transition-colors disabled:opacity-50 cursor-pointer border-none"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
