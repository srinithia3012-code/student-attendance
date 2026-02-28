import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { getToken, getUser, setAuth } from "@/lib/auth";

export default function Profile() {
  const currentUser = getUser();
  const [profile, setProfile] = useState(currentUser);
  const [draft, setDraft] = useState({ name: "", email: "" });
  const [extraDraft, setExtraDraft] = useState({
    phoneNumber: "",
    address: "",
    parentName: "",
    education: "",
    dob: "",
    age: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const profileStorageKey = useMemo(
    () => `attendance_profile_custom_${currentUser?.userId ?? "guest"}`,
    [currentUser?.userId]
  );
  const isTeacher = profile?.role === "teacher";
  const isStudent = profile?.role === "student";

  const initials = (draft?.name || profile?.name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser?.userId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/me");
        if (data?.user) {
          setProfile(data.user);
          setDraft({
            name: data.user.name || "",
            email: data.user.email || "",
          });
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Showing local profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser?.userId]);

  useEffect(() => {
    if (!currentUser?.userId) return;
    try {
      const raw = localStorage.getItem(profileStorageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.avatarUrl) setAvatarUrl(saved.avatarUrl);
      if (saved?.name || saved?.email) {
        setDraft((prev) => ({
          name: saved.name ?? prev.name,
          email: saved.email ?? prev.email,
        }));
      }
      setExtraDraft((prev) => ({
        phoneNumber: saved?.phoneNumber ?? prev.phoneNumber,
        address: saved?.address ?? prev.address,
        parentName: saved?.parentName ?? prev.parentName,
        education: saved?.education ?? prev.education,
        dob: saved?.dob ?? prev.dob,
        age: saved?.age ?? prev.age,
      }));
    } catch {
      // no-op
    }
  }, [currentUser?.userId, profileStorageKey]);

  const withProfilePayload = (overrides = {}) => ({
    avatarUrl,
    name: draft.name,
    email: draft.email,
    phoneNumber: extraDraft.phoneNumber,
    address: extraDraft.address,
    parentName: extraDraft.parentName,
    education: extraDraft.education,
    dob: extraDraft.dob,
    age: extraDraft.age,
    ...overrides,
  });

  const persistCustomProfile = (next) => {
    localStorage.setItem(profileStorageKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("profile-custom-updated", { detail: { userId: currentUser?.userId } }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setAvatarUrl(result);
      persistCustomProfile(withProfilePayload({ avatarUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setAvatarUrl("");
    persistCustomProfile(withProfilePayload({ avatarUrl: "" }));
  };

  const handleSaveProfile = () => {
    const nextProfile = {
      ...(profile || {}),
      name: draft.name.trim() || profile?.name || "",
      email: draft.email.trim() || profile?.email || "",
    };
    setProfile(nextProfile);
    persistCustomProfile(withProfilePayload({ name: nextProfile.name, email: nextProfile.email }));

    const token = getToken();
    if (token && currentUser) {
      setAuth(token, {
        ...currentUser,
        name: nextProfile.name,
        email: nextProfile.email,
      });
    }

    setSuccess("Profile updated successfully");
    setIsEditing(false);
    setTimeout(() => setSuccess(""), 1800);
  };

  const handleCancelEdit = () => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(profileStorageKey) || "{}");
    } catch {
      saved = {};
    }

    setDraft({
      name: saved?.name || profile?.name || "",
      email: saved?.email || profile?.email || "",
    });
    setExtraDraft({
      phoneNumber: saved?.phoneNumber || "",
      address: saved?.address || "",
      parentName: saved?.parentName || "",
      education: saved?.education || "",
      dob: saved?.dob || "",
      age: saved?.age || "",
    });
    setIsEditing(false);
  };

  const handleExtraChange = (field, value) => {
    if (field === "dob") {
      const date = new Date(value);
      const today = new Date();
      let nextAge = "";
      if (!Number.isNaN(date.getTime())) {
        let years = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
          years -= 1;
        }
        nextAge = years >= 0 ? String(years) : "";
      }
      setExtraDraft((prev) => ({ ...prev, dob: value, age: nextAge }));
      return;
    }
    setExtraDraft((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Profile</h2>
        <p className="text-stone-600">Details about the currently logged-in user.</p>
      </section>

      <Card className="max-w-2xl border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle className="text-stone-900">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {loading ? <p className="text-stone-600">Loading profile...</p> : null}
          {!loading && error ? <p className="text-amber-700">{error}</p> : null}
          {success ? <p className="text-emerald-700">{success}</p> : null}

          <div className="mb-4 flex items-center gap-4 rounded-lg border border-stone-200 bg-stone-50 p-3">
            <div className="h-16 w-16 overflow-hidden rounded-full border border-stone-300 bg-stone-200">
              {avatarUrl ? (
                <img alt="Profile" className="h-full w-full object-cover" src={avatarUrl} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-stone-700">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={() => fileInputRef.current?.click()} size="sm" type="button" variant="outline">
                    Upload Image
                  </Button>
                  <Button onClick={handleRemoveImage} size="sm" type="button" variant="outline">
                    Remove Image
                  </Button>
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    type="file"
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="font-medium text-stone-500">Name</span>
            {isEditing ? (
              <Input
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              />
            ) : (
              <span className="text-stone-900">{draft?.name || profile?.name || "-"}</span>
            )}

            <span className="font-medium text-stone-500">Email</span>
            {isEditing ? (
              <Input
                value={draft.email}
                onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
              />
            ) : (
              <span className="text-stone-900">{draft?.email || profile?.email || "-"}</span>
            )}

            <span className="font-medium text-stone-500">Role</span>
            <span className="text-stone-900">{profile?.role ?? "-"}</span>

            <span className="font-medium text-stone-500">Status</span>
            <span className="text-stone-900">{profile?.status ?? "-"}</span>

            <span className="font-medium text-stone-500">Phone Number</span>
            {isEditing ? (
              <Input
                value={extraDraft.phoneNumber}
                onChange={(e) => handleExtraChange("phoneNumber", e.target.value)}
              />
            ) : (
              <span className="text-stone-900">{extraDraft.phoneNumber || "-"}</span>
            )}

            <span className="font-medium text-stone-500">Address</span>
            {isEditing ? (
              <Input value={extraDraft.address} onChange={(e) => handleExtraChange("address", e.target.value)} />
            ) : (
              <span className="text-stone-900">{extraDraft.address || "-"}</span>
            )}

            {isStudent && (
              <>
                <span className="font-medium text-stone-500">Parent Name</span>
                {isEditing ? (
                  <Input
                    value={extraDraft.parentName}
                    onChange={(e) => handleExtraChange("parentName", e.target.value)}
                  />
                ) : (
                  <span className="text-stone-900">{extraDraft.parentName || "-"}</span>
                )}
              </>
            )}

            {isTeacher && (
              <>
                <span className="font-medium text-stone-500">Education</span>
                {isEditing ? (
                  <Input
                    value={extraDraft.education}
                    onChange={(e) => handleExtraChange("education", e.target.value)}
                  />
                ) : (
                  <span className="text-stone-900">{extraDraft.education || "-"}</span>
                )}
              </>
            )}

            <span className="font-medium text-stone-500">DOB</span>
            {isEditing ? (
              <Input type="date" value={extraDraft.dob} onChange={(e) => handleExtraChange("dob", e.target.value)} />
            ) : (
              <span className="text-stone-900">{extraDraft.dob || "-"}</span>
            )}

            <span className="font-medium text-stone-500">Age</span>
            {isEditing ? (
              <Input value={extraDraft.age} readOnly />
            ) : (
              <span className="text-stone-900">{extraDraft.age || "-"}</span>
            )}
          </div>

          {isEditing ? (
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveProfile} size="sm">
                Save
              </Button>
              <Button onClick={handleCancelEdit} size="sm" variant="outline">
                Cancel
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
