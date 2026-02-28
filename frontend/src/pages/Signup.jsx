import { useState } from "react";
import { Chrome, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const roles = ["admin", "teacher", "student"];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const playSignupSuccessSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.connect(ctx.destination);

      const tone = (frequency, start, duration) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = frequency;
        osc.connect(gain);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      tone(740, now, 0.09);
      tone(920, now + 0.1, 0.09);
      tone(1100, now + 0.2, 0.12);
    } catch {
      // no-op
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/auth/register", form);
      setAuth(data.token, data.user);
      playSignupSuccessSound();
      setSuccess("Signup successful");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-100 to-stone-100">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold text-stone-900">Student Attendance</h1>
          <Button asChild className="bg-stone-900 hover:bg-stone-800" size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle className="text-stone-900">Signup</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-600">Students can create account and then get mapped to class by teacher.</p>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
              <Button className="w-full bg-stone-900 hover:bg-stone-800" disabled={loading} type="submit">
                {loading ? "Creating account..." : "Signup"}
              </Button>
              <Button className="w-full" onClick={handleGoogleSignIn} type="button" variant="outline">
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link className="underline" to="/login">
                  Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 text-center text-sm text-stone-700">
          Built for attendance management
        </div>
      </footer>
    </div>
  );
}
