import { Link } from "react-router-dom";

export default function AttendanceProgressNavLink({ role }) {
  if (role !== "admin" && role !== "teacher") {
    return null;
  }

  return (
    <Link className="text-sm font-medium text-stone-700 hover:text-stone-900 hover:underline" to="/attendance-progress">
      Student Attendance %
    </Link>
  );
}
