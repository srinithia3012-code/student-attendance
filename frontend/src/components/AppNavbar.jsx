import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppNavbar({ user, initials, onLogout }) {
  const [avatarUrl, setAvatarUrl] = useState("");
  const profileStorageKey = useMemo(
    () => `attendance_profile_custom_${user?.userId ?? "guest"}`,
    [user?.userId]
  );

  useEffect(() => {
    const loadAvatar = () => {
      try {
        const raw = localStorage.getItem(profileStorageKey);
        if (!raw) {
          setAvatarUrl("");
          return;
        }
        const saved = JSON.parse(raw);
        setAvatarUrl(saved?.avatarUrl || "");
      } catch {
        setAvatarUrl("");
      }
    };

    const onProfileUpdated = () => {
      loadAvatar();
    };

    loadAvatar();
    window.addEventListener("profile-custom-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-custom-updated", onProfileUpdated);
  }, [profileStorageKey]);

  return (
    <header className="sticky top-0 z-30 border-b bg-white/85 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-stone-300 bg-stone-200">
            {avatarUrl ? (
              <img alt="Profile" className="h-full w-full object-cover" src={avatarUrl} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-stone-900 text-xs font-semibold text-white">
                {initials}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">Student Attendance</h1>
            <p className="text-xs text-stone-600">Role: {user?.role ?? "unknown"}</p>
          </div>
        </div>
        <nav className="flex items-center gap-3">
          <Link className="text-sm font-medium text-stone-700 hover:text-stone-900 hover:underline" to="/dashboard">
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-100 text-blue-800 shadow-sm hover:bg-blue-200"
            title="Profile"
            aria-label="Profile"
          >
            <CircleUserRound size={18} />
          </Link>
          <Button className="bg-stone-900 hover:bg-stone-800" onClick={onLogout} size="sm">
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
