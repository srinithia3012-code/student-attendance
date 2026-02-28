import { useState } from "react";
import { Chrome, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { setAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await api.post("/auth/login", form);
      setAuth(data.token, data.user);
      setSuccess("Login successful");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-50 via-stone-100 to-orange-100">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold text-stone-900">Student Attendance</h1>
          <Button asChild className="bg-stone-900 hover:bg-stone-800" size="sm">
            <Link to="/signup">Create account</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle className="text-stone-900">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
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
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
              <Button className="w-full bg-stone-900 hover:bg-stone-800" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Login"}
              </Button>
              <Button className="w-full" onClick={handleGoogleSignIn} type="button" variant="outline">
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
              <p className="text-sm text-muted-foreground">
                No account?{" "}
                <Link className="underline" to="/signup">
                  Signup
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
