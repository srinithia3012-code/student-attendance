import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function AddTeacherPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    education: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Name, email and password are required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "teacher",
        phoneNumber: form.phoneNumber.trim() || undefined,
        education: form.education.trim() || undefined,
      });
      setSuccess("Teacher added successfully");
      setForm({
        name: "",
        email: "",
        password: "",
        phoneNumber: "",
        education: "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Add Teacher</h2>
        <p className="text-stone-600">Create a teacher account (admin only).</p>
      </section>

      <Card className="max-w-2xl border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Teacher Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="name">
                Name
              </label>
              <input
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                id="name"
                name="name"
                onChange={handleChange}
                placeholder="Teacher name"
                value={form.name}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="email">
                Email
              </label>
              <input
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                id="email"
                name="email"
                onChange={handleChange}
                placeholder="teacher@example.com"
                type="email"
                value={form.email}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="password">
                Password
              </label>
              <input
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                id="password"
                name="password"
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                type="password"
                value={form.password}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="phoneNumber">
                  Phone Number
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="phoneNumber"
                  name="phoneNumber"
                  onChange={handleChange}
                  placeholder="Optional"
                  value={form.phoneNumber}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="education">
                  Education
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="education"
                  name="education"
                  onChange={handleChange}
                  placeholder="Optional"
                  value={form.education}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

            <Button className="bg-stone-900 hover:bg-stone-800" disabled={submitting} type="submit">
              {submitting ? "Adding..." : "Add Teacher"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
