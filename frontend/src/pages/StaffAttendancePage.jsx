import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { getUser } from "@/lib/auth";
import api from "@/lib/api";

export default function StaffAttendancePage() {
  const user = getUser();
  const todayIso = useMemo(() => new Date().toLocaleDateString("en-CA"), []);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [status, setStatus] = useState("present");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const fetchSelectedRecord = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/staff-attendance?teacherId=${user?.userId}&date=${selectedDate}`);
        const records = res.data?.attendance || [];
        if (records.length > 0) {
          setSelectedRecord(records[0]);
          setStatus(records[0].status || "present");
          setDepartment(records[0].department || "");
        } else {
          setSelectedRecord(null);
          setStatus("present");
          setDepartment("");
        }
      } catch (err) {
        console.error("Failed to fetch selected record", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId) {
      fetchSelectedRecord();
    }
  }, [user?.userId, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/staff-attendance", {
        teacherId: user?.userId,
        date: selectedDate,
        department: department || null,
        status,
      });

      const submittedStatus = response.data?.attendance?.status || status;
      setSuccess(`${selectedRecord ? "Attendance updated" : "Attendance marked"} as ${submittedStatus} for ${selectedDate}`);
      
      setSelectedRecord({
        status: submittedStatus,
        department: response.data?.attendance?.department || department,
        attendanceDate: selectedDate,
      });

      window.dispatchEvent(
        new CustomEvent("staff-attendance-updated", {
          detail: {
            teacherId: user?.userId,
            date: selectedDate,
            status: submittedStatus,
          },
        })
      );
      
      setStatus("present");
      setDepartment("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (stat) => {
    switch (stat) {
      case "present":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "absent":
        return <AlertCircle className="h-5 w-5 text-rose-600" />;
      case "late":
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (stat) => {
    switch (stat) {
      case "present":
        return "from-emerald-50 to-white border-emerald-200 text-emerald-900";
      case "absent":
        return "from-rose-50 to-white border-rose-200 text-rose-900";
      case "late":
        return "from-amber-50 to-white border-amber-200 text-amber-900";
      default:
        return "from-stone-50 to-white border-stone-200 text-stone-900";
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold tracking-tight text-stone-900">Staff Attendance</h2>
        <p className="text-stone-600">Mark your attendance for the day.</p>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600 shadow-sm">
          Checking selected staff record...
        </div>
      ) : null}

      {selectedRecord && (
        <div className={`rounded-2xl border bg-gradient-to-br ${getStatusColor(selectedRecord.status)} p-4 shadow-sm`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(selectedRecord.status)}
            <div>
              <p className="font-semibold capitalize">Selected Date Status: {selectedRecord.status}</p>
              <p className="text-sm">Marked on {selectedRecord.attendanceDate}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="border-stone-200 bg-white/95">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  type="date"
                  value={selectedDate}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  onChange={(e) => setStatus(e.target.value)}
                  value={status}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700" htmlFor="department">
                Department/Class (Optional)
              </label>
              <input
                id="department"
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Computer Science, Lab"
                type="text"
                value={department}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

            <Button className="bg-stone-900 hover:bg-stone-800" disabled={submitting} type="submit">
              {submitting ? "Saving..." : selectedRecord ? "Update Attendance" : "Mark Attendance"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
