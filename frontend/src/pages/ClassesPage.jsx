import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function ClassesPage() {
  const user = getUser();
  const isAdmin = user?.role === "admin";
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", semester: "", section: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const fetchClasses = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/classes");
      setClasses(data.classes || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!form.name.trim() || !String(form.semester).trim()) {
      setSubmitError("Class name and semester are required.");
      return;
    }

    const semesterValue = Number(form.semester);
    if (!Number.isInteger(semesterValue) || semesterValue < 1) {
      setSubmitError("Semester must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/classes", {
        name: form.name.trim(),
        semester: semesterValue,
        section: form.section.trim() || undefined,
      });
      setSubmitSuccess("Class added successfully.");
      setForm({ name: "", semester: "", section: "" });
      fetchClasses();
    } catch (err) {
      setSubmitError(err?.response?.data?.message || "Failed to add class.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Classes</h2>
        <p className="text-stone-600">All classes in the attendance system.</p>
      </section>

      {isAdmin ? (
        <Card className="max-w-2xl border-stone-200 bg-white/95">
          <CardHeader>
            <CardTitle>Add Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="name">
                  Class Name
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="name"
                  name="name"
                  onChange={handleChange}
                  placeholder="BCA 1st Year"
                  value={form.name}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="semester">
                    Semester
                  </label>
                  <input
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    id="semester"
                    name="semester"
                    onChange={handleChange}
                    placeholder="1"
                    value={form.semester}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="section">
                    Section
                  </label>
                  <input
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    id="section"
                    name="section"
                    onChange={handleChange}
                    placeholder="A"
                    value={form.section}
                  />
                </div>
              </div>

              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
              {submitSuccess ? <p className="text-sm text-emerald-700">{submitSuccess}</p> : null}

              <button
                className="inline-flex items-center justify-center rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Adding..." : "Add Class"}
              </button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Class List</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Section</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>Loading classes...</TableCell>
                </TableRow>
              ) : classes.length === 0 ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={4}>
                    No classes found.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((classItem) => (
                  <TableRow key={classItem.classId}>
                    <TableCell>{classItem.classId}</TableCell>
                    <TableCell>{classItem.name}</TableCell>
                    <TableCell>{classItem.semester}</TableCell>
                    <TableCell>{classItem.section || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
