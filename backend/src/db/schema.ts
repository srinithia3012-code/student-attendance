import {
  pgTable,
  serial,
  varchar,
  timestamp,
  date,
  integer,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* =========================
   ENUMS
========================= */
export const roleEnum = pgEnum("role", ["admin", "teacher", "student"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent"]);
export const staffAttendanceStatusEnum = pgEnum("staff_attendance_status", ["present", "absent", "late"]);

/* =========================
   USER TABLE
========================= */
export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: roleEnum("role").notNull(),
  status: userStatusEnum("status").default("active"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  address: varchar("address", { length: 255 }),
  parentName: varchar("parent_name", { length: 150 }),
  education: varchar("education", { length: 150 }),
  dob: date("dob"),
  age: integer("age"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   CLASS TABLE
========================= */
export const classes = pgTable("classes", {
  classId: serial("class_id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  semester: integer("semester").notNull(),
  section: varchar("section", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   STUDENT TABLE
   - rollNumber unique per class
========================= */
export const students = pgTable(
  "students",
  {
    studentId: serial("student_id").primaryKey(),
    userId: integer("user_id").references(() => users.userId).notNull(),
    classId: integer("class_id").references(() => classes.classId).notNull(),
    rollNumber: varchar("roll_number", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueRollPerClass: uniqueIndex("unique_roll_per_class").on(table.classId, table.rollNumber),
  })
);

/* =========================
   SUBJECT TABLE
   - name unique per class
========================= */
export const subjects = pgTable(
  "subjects",
  {
    subjectId: serial("subject_id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    classId: integer("class_id").references(() => classes.classId).notNull(),
    teacherId: integer("teacher_id").references(() => users.userId).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    uniqueNamePerClass: uniqueIndex("unique_subject_per_class").on(table.classId, table.name),
  })
);

/* =========================
   ATTENDANCE SESSION TABLE
========================= */
export const attendanceSessions = pgTable("attendance_sessions", {
  sessionId: serial("session_id").primaryKey(),
  classId: integer("class_id").references(() => classes.classId).notNull(),
  subjectId: integer("subject_id").references(() => subjects.subjectId).notNull(),
  sessionDate: date("session_date").notNull(),
  sessionStartTime: varchar("session_start_time", { length: 20 }),
  sessionEndTime: varchar("session_end_time", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   ATTENDANCE TABLE
========================= */
export const attendance = pgTable("attendance", {
  attendanceId: serial("attendance_id").primaryKey(),
  studentId: integer("student_id").references(() => students.studentId).notNull(),
  subjectId: integer("subject_id").references(() => subjects.subjectId).notNull(),
  sessionId: integer("session_id").references(() => attendanceSessions.sessionId).notNull(),
  attendanceDate: date("attendance_date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   STAFF ATTENDANCE TABLE
========================= */
export const staffAttendance = pgTable("staff_attendance", {
  staffAttendanceId: serial("staff_attendance_id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.userId).notNull(),
  attendanceDate: date("attendance_date").notNull(),
  department: varchar("department", { length: 100 }),
  subject: varchar("subject", { length: 150 }),
  scanType: varchar("scan_type", { length: 20 }).default("qr"),
  status: staffAttendanceStatusEnum("status").default("present").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
