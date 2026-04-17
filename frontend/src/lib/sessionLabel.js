export const formatSessionTiming = (session) => {
  const start = session?.sessionStartTime || "";
  const end = session?.sessionEndTime || "";

  if (start && end) return `${start} - ${end}`;
  if (start) return `Starts ${start}`;
  if (end) return `Ends ${end}`;
  return "";
};

export const formatSessionLabel = (session, className, subjectName) => {
  const parts = [className || "Class", subjectName || "Subject"];
  const timing = formatSessionTiming(session);

  if (session?.sessionDate) {
    parts.push(session.sessionDate);
  }
  if (timing) {
    parts.push(timing);
  }

  return parts.join(" - ");
};
