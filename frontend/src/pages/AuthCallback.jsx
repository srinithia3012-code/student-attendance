import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuth } from "@/lib/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const email = searchParams.get("email");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    if (!token || !userId || !name || !email || !role) {
      navigate("/login", { replace: true });
      return;
    }

    setAuth(token, {
      userId: Number(userId),
      name,
      email,
      role,
      status: status || "active",
    });

    navigate("/dashboard", { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <p className="text-sm text-muted-foreground">Signing you in with Google...</p>
    </div>
  );
}
