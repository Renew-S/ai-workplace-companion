export type ReminderTask = {
  dueDate?: string;
  suggestedTime?: string;
  done: boolean;
};

// Dates without a clock time remain actionable through the end of that day.
function endOfDay(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function lastClockTime(text: string): { hour: number; minute: number } | null {
  const matches = [...text.matchAll(/\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi)];
  const match = matches.at(-1);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (minute > 59 || hour > (meridiem ? 12 : 23) || (meridiem && hour < 1)) return null;
  if (meridiem) hour = (hour % 12) + (meridiem === "pm" ? 12 : 0);
  return { hour, minute };
}

export function taskDeadline(task: ReminderTask, mode: string, now: Date): Date | null {
  const time = lastClockTime(task.suggestedTime ?? "");
  let deadline: Date | null = null;

  if (task.dueDate) {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(task.dueDate);
    if (parts) deadline = endOfDay(Number(parts[1]), Number(parts[2]), Number(parts[3]));
  } else if (mode === "daily") {
    deadline = endOfDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
  } else if (mode === "weekly") {
    const weekday = /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:day)?\b/i.exec(task.suggestedTime ?? "");
    const dayIndex = weekday ? ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(weekday[1].slice(0, 3).toLowerCase()) : 6;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    deadline = endOfDay(monday.getFullYear(), monday.getMonth() + 1, monday.getDate() + dayIndex);
    // Date arithmetic across month boundaries must be performed on a Date.
    if (!deadline) {
      monday.setDate(monday.getDate() + dayIndex);
      deadline = endOfDay(monday.getFullYear(), monday.getMonth() + 1, monday.getDate());
    }
  } else if (mode === "monthly") {
    const text = task.suggestedTime ?? "";
    const week = /\bWeek\s+\d+\s*\(.*?[–—-]\s*(\d{1,2})(?:st|nd|rd|th)?\)/i.exec(text);
    const dated = /\b(\d{1,2})(?:st|nd|rd|th)\b/i.exec(text);
    const day = week ? Number(week[1]) : dated ? Number(dated[1]) : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    deadline = endOfDay(now.getFullYear(), now.getMonth() + 1, day);
  }

  if (deadline && time) deadline.setHours(time.hour, time.minute, 59, 999);
  return deadline;
}

export function isTaskOverdue(task: ReminderTask, mode: string, now: Date): boolean {
  if (task.done) return false;
  const deadline = taskDeadline(task, mode, now);
  return deadline !== null && now.getTime() > deadline.getTime();
}