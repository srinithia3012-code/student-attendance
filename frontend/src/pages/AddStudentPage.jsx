import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

export default function AddStudentPage() {
  const [classes, setClasses] = useState([]);
  const [unmappedStudentUsers, setUnmappedStudentUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    classId: "",
    batch: "",
    rollNumber: "",
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [createNewAccount, setCreateNewAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [classesRes, usersRes, studentsRes] = await Promise.all([
          api.get("/classes"),
          api.get("/users?page=1&limit=500"),
          api.get("/students"),
        ]);

        const users = usersRes.data?.users || [];
        const studentRows = studentsRes.data?.students || [];
        const mappedUserIds = new Set(studentRows.map((row) => row.userId));
        const availableStudentUsers = users.filter(
          (user) => user.role === "student" && !mappedUserIds.has(user.userId)
        );

        setClasses(classesRes.data?.classes || []);
        setUnmappedStudentUsers(availableStudentUsers);
        if (availableStudentUsers.length === 0) {
          setCreateNewAccount(true);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load form options");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "classId") {
      const selectedClass = classes.find((item) => String(item.classId) === String(value));
      setForm((prev) => ({
        ...prev,
        classId: value,
        batch: selectedClass ? String(selectedClass.semester ?? "") : "",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectStudent = (event) => {
    const { value } = event.target;
    setSelectedUserId(value);
    const selected = unmappedStudentUsers.find((user) => String(user.userId) === String(value));
    setForm((prev) => ({
      ...prev,
      name: selected?.name || "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.classId || !form.rollNumber.trim()) {
      setError("All fields are required");
      return;
    }

    if (!createNewAccount && !selectedUserId) {
      setError("Select an existing student account or enable create new.");
      return;
    }

    if (createNewAccount && !form.name.trim()) {
      setError("Student name is required to create a new account.");
      return;
    }

    setSubmitting(true);
    try {
      let finalUserId = selectedUserId ? Number(selectedUserId) : null;

      if (createNewAccount) {
        const normalizedName = form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".");
        const generatedEmail = `${normalizedName}.${Date.now()}@student.local`;
        const generatedPassword = `Student@${form.rollNumber.trim()}`;

        const registerRes = await api.post("/auth/register", {
          name: form.name.trim(),
          email: generatedEmail,
          password: generatedPassword,
          role: "student",
        });

        finalUserId = registerRes.data?.user?.userId ?? null;
        if (!finalUserId) {
          throw new Error("Student user creation failed");
        }
      }

      await api.post("/students", {
        userId: Number(finalUserId),
        classId: Number(form.classId),
        rollNumber: form.rollNumber.trim(),
      });
      setSuccess("Student mapped successfully");
      setUnmappedStudentUsers((prev) => prev.filter((user) => user.userId !== Number(finalUserId)));
      window.dispatchEvent(
        new CustomEvent("student-mapped", {
          detail: { userId: Number(finalUserId), name: form.name.trim() },
        })
      );
      setForm({ name: "", classId: "", batch: "", rollNumber: "" });
      setSelectedUserId("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Add Student</h2>
        <p className="text-stone-600">Assign a student user to a class with roll number.</p>
      </section>

      <Card className="max-w-2xl border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>New Student Entry</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-stone-600">Loading options...</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                <label className="text-sm font-medium text-stone-700">
                  <input
                    checked={!createNewAccount}
                    className="mr-2"
                    onChange={() => setCreateNewAccount(false)}
                    type="radio"
                  />
                  Map existing student account
                </label>
                <label className="text-sm font-medium text-stone-700">
                  <input
                    checked={createNewAccount}
                    className="mr-2"
                    onChange={() => setCreateNewAccount(true)}
                    type="radio"
                  />
                  Create new student account
                </label>
              </div>

              {!createNewAccount ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700" htmlFor="existingUser">
                    Existing Student Account
                  </label>
                  <select
                    className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                    id="existingUser"
                    onChange={handleSelectStudent}
                    value={selectedUserId}
                  >
                    <option value="">Select student account</option>
                    {unmappedStudentUsers.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.name || user.email} {user.email ? `(${user.email})` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedUserId ? (
                    <p className="text-xs text-stone-500">This will link the selected account.</p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="name">
                  Student Name
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="name"
                  name="name"
                  onChange={handleChange}
                  placeholder="Enter full name"
                  value={form.name}
                  readOnly={!createNewAccount}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="batch">
                  Batch
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="batch"
                  name="batch"
                  placeholder="Auto from class"
                  readOnly
                  value={form.batch}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="classId">
                  Class
                </label>
                <select
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="classId"
                  name="classId"
                  onChange={handleChange}
                  value={form.classId}
                >
                  <option value="">Select class</option>
                  {classes.map((classItem) => (
                    <option key={classItem.classId} value={classItem.classId}>
                      {classItem.name} - Semester {classItem.semester} {classItem.section || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="rollNumber">
                  Roll Number
                </label>
                <input
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  id="rollNumber"
                  name="rollNumber"
                  onChange={handleChange}
                  placeholder="Enter roll number"
                  value={form.rollNumber}
                />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

              <Button className="bg-stone-900 hover:bg-stone-800" disabled={submitting} type="submit">
                {submitting ? "Adding..." : "Add Student"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
