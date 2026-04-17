import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import api from "@/lib/api";

export default function StudentStaffAvailabilityPage() {
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const fetchStaffAttendance = async (date) => {
    setLoading(true);
    try {
      const [attendanceRes, teachersRes] = await Promise.all([
        api.get(`/staff-attendance?date=${date}`),
        api.get("/users?page=1&limit=1000"),
      ]);

      const attendance = attendanceRes.data?.attendance || [];
      const users = teachersRes.data?.users || [];
      const teachers = users.filter((u) => u.role === "teacher");

      setStaffAttendance(attendance);
      setAllTeachers(teachers);
    } catch (error) {
      console.error("Error fetching staff attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAttendance(selectedDate);
  }, [selectedDate]);

  const getTeacherStatus = (teacherId) => {
    return staffAttendance.find((record) => record.teacherId === teacherId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-50 border-green-200";
      case "absent":
        return "bg-red-50 border-red-200";
      case "late":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "absent":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "late":
        return <Clock className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const isToday = selectedDate === getTodayString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Staff Availability</h1>
        <p className="mt-2 text-stone-600">Check teacher availability for the day</p>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-2 text-stone-900 focus:border-stone-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-600">Loading staff information...</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allTeachers.map((teacher) => {
            const status = getTeacherStatus(teacher.userId);
            const statusVal = status?.status || "unknown";

            return (
              <div
                key={teacher.userId}
                className={`rounded-lg border-2 p-4 transition-colors ${getStatusColor(statusVal)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900">{teacher.name}</h3>
                    <p className="text-sm text-stone-600">{teacher.email}</p>
                  </div>
                  <div className="flex-shrink-0">{getStatusIcon(statusVal)}</div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeColor(statusVal)}`}
                  >
                    {statusVal === "unknown" ? "No Record" : statusVal}
                  </span>
                  {status?.department && (
                    <span className="text-xs text-stone-600">{status.department}</span>
                  )}
                </div>

                {statusVal === "absent" && (
                  <div className="mt-3 rounded-md bg-red-100 p-2">
                    <p className="text-xs font-medium text-red-800">Teacher Absent Today</p>
                  </div>
                )}

                {statusVal === "late" && (
                  <div className="mt-3 rounded-md bg-amber-100 p-2">
                    <p className="text-xs font-medium text-amber-800">Teacher Running Late</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && allTeachers.length === 0 && (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
          <p className="text-stone-600">No teachers found</p>
        </div>
      )}
    </div>
  );
}
