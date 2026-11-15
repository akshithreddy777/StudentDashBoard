// =====================================================
// StudyDeck – script.js  (complete app)
// 0 Helpers · 1 DOM refs · 2 State · 3 Shell/Theme/Nav · 4 Dashboard
// 5 Tasks · 6 Notes · 7 Pomodoro · 8 Expenses · 9 Goals · 10 Calendar
// 11 Analytics · 12 Notifications · 13 Global search · 14 API · 15 Init
// =====================================================


// ---------- 0. HELPERS ----------
const STORAGE_KEYS = {
  tasks: "sd_tasks",
  notes: "sd_notes",
  expenses: "sd_expenses",
  goals: "sd_goals",
  events: "sd_events",
  study: "sd_study",
  notifications: "sd_notifications",
  reminded: "sd_reminded",
  activity: "sd_activity",
  theme: "sd_theme",
};

// Read from Local Storage. Storage only holds strings, so we JSON.parse.
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error(`Could not read "${key}"`, error);
    return fallback;
  }
}

// Write to Local Storage. Arrays/objects must become strings with JSON.stringify.
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Could not save "${key}"`, error);
    showToast("Could not save your data (storage may be full or blocked).");
  }
}

const $ = (id) => document.getElementById(id);

function pad(number) {
  return String(number).padStart(2, "0");
}

// Local date as "YYYY-MM-DD" (toISOString would use UTC and can be off by a day).
function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
  return toISODate(new Date());
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatMoney(amount) {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Debounce: wait until the user stops typing before running fn.
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Safe element creator: textContent never runs user text as HTML.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function emptyState(message) {
  return el("p", "text-sm py-6 text-center muted", message);
}

function actionButton(label, action, id, className = "btn-ghost") {
  const button = el("button", `${className} px-3 py-1.5 text-sm`, label);
  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

let toastTimeoutId;
function showToast(message) {
  shell.toast.textContent = message;
  shell.toast.classList.remove("hidden");
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => shell.toast.classList.add("hidden"), 3000);
}


// ---------- 1. DOM REFERENCES ----------
const shell = {
  navLinks: document.querySelectorAll(".nav-link"),
  views: document.querySelectorAll("[data-view]"),
  search: $("globalSearch"),
  searchWrap: $("searchWrap"),
  results: $("searchResults"),
  notifWrap: $("notifWrap"),
  notifBtn: $("notificationBtn"),
  notifBadge: $("notificationBadge"),
  notifPanel: $("notificationPanel"),
  notifList: $("notificationList"),
  notifClear: $("clearNotifications"),
  themeToggle: $("themeToggle"),
  toast: $("toast"),
};

const dash = {
  welcome: $("welcomeMessage"), dateTime: $("currentDateTime"),
  totalTasks: $("statTotalTasks"), completedTasks: $("statCompletedTasks"),
  pendingTasks: $("statPendingTasks"), studyHours: $("statStudyHours"),
  totalExpenses: $("statTotalExpenses"), completionPercent: $("statCompletionPercent"),
  completionBar: $("completionBar"), todayText: $("todayProgressText"),
  todayBar: $("todayProgressBar"), activity: $("recentActivityList"),
  quoteText: $("quoteText"), quoteAuthor: $("quoteAuthor"), newQuote: $("newQuoteBtn"),
};

const taskEls = {
  form: $("taskForm"), id: $("taskId"), title: $("taskTitle"), priority: $("taskPriority"),
  dueDate: $("taskDueDate"), submit: $("taskSubmitBtn"), cancel: $("taskCancelBtn"),
  search: $("taskSearch"), filterStatus: $("taskFilterStatus"),
  filterPriority: $("taskFilterPriority"), sort: $("taskSort"), list: $("taskList"),
};

const noteEls = {
  form: $("noteForm"), id: $("noteId"), title: $("noteTitle"), body: $("noteBody"),
  submit: $("noteSubmitBtn"), cancel: $("noteCancelBtn"), search: $("noteSearch"), list: $("noteList"),
};

const timerEls = {
  modes: $("timerModes"), label: $("timerLabel"), display: $("timerDisplay"),
  progress: $("timerProgress"), toggle: $("timerToggleBtn"), reset: $("timerResetBtn"),
  sessions: $("sessionsCount"), total: $("totalStudyTime"),
};

const expenseEls = {
  form: $("expenseForm"), id: $("expenseId"), title: $("expenseTitle"), amount: $("expenseAmount"),
  category: $("expenseCategory"), date: $("expenseDate"), submit: $("expenseSubmitBtn"),
  cancel: $("expenseCancelBtn"), total: $("expenseTotal"), month: $("expenseMonthTotal"),
  breakdown: $("categoryBreakdown"), monthly: $("expenseMonthly"), list: $("expenseList"),
};

const goalEls = {
  form: $("goalForm"), id: $("goalId"), title: $("goalTitle"), type: $("goalType"),
  target: $("goalTarget"), submit: $("goalSubmitBtn"), cancel: $("goalCancelBtn"), list: $("goalList"),
};

const calEls = {
  title: $("calendarTitle"), prev: $("calPrev"), next: $("calNext"), grid: $("calendarGrid"),
  form: $("eventForm"), id: $("eventId"), evTitle: $("eventTitle"), date: $("eventDate"),
  time: $("eventTime"), submit: $("eventSubmitBtn"), cancel: $("eventCancelBtn"),
  dayTitle: $("dayEventsTitle"), dayList: $("dayEventsList"), upcoming: $("upcomingList"),
};

const anaEls = {
  hours: $("anaWeekHours"), completed: $("anaCompleted"), productivity: $("anaProductivity"),
  consistency: $("anaConsistency"), chart: $("anaChart"), spent: $("anaSpent"), categories: $("anaCategories"),
};


// ---------- 2. STATE ----------
const studentName = "Student";
const BASE_TITLE = document.title;

let tasks = loadFromStorage(STORAGE_KEYS.tasks, []);
let notes = loadFromStorage(STORAGE_KEYS.notes, []);
let expenses = loadFromStorage(STORAGE_KEYS.expenses, []);
let goals = loadFromStorage(STORAGE_KEYS.goals, []);
let events = loadFromStorage(STORAGE_KEYS.events, []);
let studySessions = loadFromStorage(STORAGE_KEYS.study, []);
let notifications = loadFromStorage(STORAGE_KEYS.notifications, []);
let remindedKeys = loadFromStorage(STORAGE_KEYS.reminded, []);
let activity = loadFromStorage(STORAGE_KEYS.activity, []);

const now = new Date();
let calYear = now.getFullYear();
let calMonth = now.getMonth();
let selectedDate = todayISO();


// ---------- 3. SHELL: NAVIGATION, THEME, CLOCK ----------
function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function updateDateTime() {
  const current = new Date();
  const dateText = current.toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeText = current.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  dash.welcome.textContent = `${getGreeting(current.getHours())}, ${studentName}`;
  dash.dateTime.textContent = `${dateText} · ${timeText}`;
}

function showSection(sectionId) {
  shell.views.forEach((view) => view.classList.toggle("hidden", view.id !== sectionId));
  shell.navLinks.forEach((link) => {
    const isActive = link.dataset.section === sectionId;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  shell.notifPanel.classList.add("hidden");
  shell.results.classList.add("hidden");
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  shell.themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const nextTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
  saveToStorage(STORAGE_KEYS.theme, nextTheme);
}

function loadTheme() {
  const saved = loadFromStorage(STORAGE_KEYS.theme, null);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

shell.navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showSection(link.dataset.section);
  });
});
shell.themeToggle.addEventListener("click", toggleTheme);


// ---------- 4. DASHBOARD ----------
function getCompletionPercent() {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((task) => task.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

function sumMinutes(sessions) {
  return sessions.reduce((sum, session) => sum + session.minutes, 0);
}

function logActivity(text) {
  activity.unshift({ text, time: Date.now() });
  activity = activity.slice(0, 8);
  saveToStorage(STORAGE_KEYS.activity, activity);
}

function renderStats() {
  const completed = tasks.filter((task) => task.completed).length;
  const percent = getCompletionPercent();
  const totalMinutes = sumMinutes(studySessions);

  dash.totalTasks.textContent = tasks.length;
  dash.completedTasks.textContent = completed;
  dash.pendingTasks.textContent = tasks.length - completed;
  dash.studyHours.textContent = `${(totalMinutes / 60).toFixed(1)}h`;
  dash.totalExpenses.textContent = formatMoney(expenses.reduce((sum, e) => sum + e.amount, 0));
  dash.completionPercent.textContent = `${percent}%`;
  dash.completionBar.style.width = `${percent}%`;

  const todayMinutes = sumMinutes(studySessions.filter((s) => s.date === todayISO()));
  const dailyGoals = goals.filter((goal) => goal.type === "daily");
  const target = dailyGoals.reduce((sum, goal) => sum + goal.targetMinutes, 0) || 120;
  dash.todayText.textContent = `${todayMinutes} of ${target} minutes studied today`;
  dash.todayBar.style.width = `${Math.min(100, Math.round((todayMinutes / target) * 100))}%`;
}

function renderActivity() {
  dash.activity.replaceChildren();
  if (activity.length === 0) {
    dash.activity.append(el("li", "muted", "Nothing yet. Add your first task to get started."));
    return;
  }
  activity.forEach((item) => {
    const li = el("li", "flex justify-between gap-3");
    const when = new Date(item.time).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
    li.append(el("span", "", item.text), el("span", "muted whitespace-nowrap", when));
    dash.activity.append(li);
  });
}


// ---------- 5. TASKS ----------
const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

function isOverdue(task) {
  return !task.completed && task.dueDate && task.dueDate < todayISO();
}

function getVisibleTasks() {
  const query = taskEls.search.value.trim().toLowerCase();
  const status = taskEls.filterStatus.value;
  const priority = taskEls.filterPriority.value;
  const sortBy = taskEls.sort.value;

  // filter() returns a NEW array, so sort() below doesn't change our saved data.
  const result = tasks.filter((task) => {
    const matchesQuery = task.title.toLowerCase().includes(query);
    const matchesStatus =
      status === "all" || (status === "completed" ? task.completed : !task.completed);
    const matchesPriority = priority === "all" || task.priority === priority;
    return matchesQuery && matchesStatus && matchesPriority;
  });

  result.sort((a, b) => {
    if (sortBy === "due") {
      return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    }
    if (sortBy === "priority") return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    return b.createdAt - a.createdAt; // newest first
  });
  return result;
}

function createTaskItem(task) {
  const li = el("li", "card p-4 flex flex-wrap items-center gap-3");

  const checkbox = el("input", "w-5 h-5");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.dataset.action = "toggle";
  checkbox.dataset.id = task.id;
  checkbox.setAttribute("aria-label", `Mark "${task.title}" as completed`);

  const info = el("div", "flex-1 min-w-[180px]");
  info.append(
    el("p", task.completed ? "font-semibold line-through muted" : "font-semibold", task.title),
    el("p", isOverdue(task) ? "text-sm mt-0.5 overdue" : "text-sm mt-0.5 muted",
      task.dueDate ? `Due ${formatDate(task.dueDate)}${isOverdue(task) ? " (overdue)" : ""}` : "No due date")
  );

  const badge = el("span", `badge badge-${task.priority} capitalize`, task.priority);
  const actions = el("div", "flex gap-2");
  actions.append(
    actionButton("Edit", "edit", task.id),
    actionButton("Delete", "delete", task.id, "btn-danger")
  );

  li.append(checkbox, info, badge, actions);
  return li;
}

function renderTasks() {
  taskEls.list.replaceChildren();
  const visible = getVisibleTasks();
  if (visible.length === 0) {
    taskEls.list.append(
      emptyState(tasks.length === 0 ? "No tasks yet. Add your first one above." : "No tasks match your filters.")
    );
    return;
  }
  visible.forEach((task) => taskEls.list.append(createTaskItem(task)));
}

function resetTaskForm() {
  taskEls.form.reset();
  taskEls.id.value = "";
  taskEls.priority.value = "medium";
  taskEls.submit.textContent = "Add task";
  taskEls.cancel.classList.add("hidden");
}

function startEditTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  taskEls.id.value = task.id;
  taskEls.title.value = task.title;
  taskEls.priority.value = task.priority;
  taskEls.dueDate.value = task.dueDate;
  taskEls.submit.textContent = "Save changes";
  taskEls.cancel.classList.remove("hidden");
  taskEls.title.focus();
  taskEls.form.scrollIntoView({ behavior: "smooth", block: "center" });
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  task.completedAt = task.completed ? todayISO() : null;
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  logActivity(`${task.completed ? "Completed" : "Reopened"} task "${task.title}"`);
  refreshAll();
}

function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task || !confirm(`Delete task "${task.title}"?`)) return;
  tasks = tasks.filter((t) => t.id !== id);
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  logActivity(`Deleted task "${task.title}"`);
  if (taskEls.id.value === id) resetTaskForm();
  refreshAll();
}

taskEls.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskEls.title.value.trim();
  if (title.length < 3) {
    showToast("Task title needs at least 3 characters.");
    taskEls.title.focus();
    return;
  }
  const data = { title, priority: taskEls.priority.value, dueDate: taskEls.dueDate.value };

  if (taskEls.id.value) {
    const task = tasks.find((t) => t.id === taskEls.id.value);
    if (task) Object.assign(task, data);
    logActivity(`Updated task "${title}"`);
  } else {
    tasks.push({ id: generateId(), ...data, completed: false, completedAt: null, createdAt: Date.now() });
    logActivity(`Added task "${title}"`);
  }
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  resetTaskForm();
  refreshAll();
});

taskEls.cancel.addEventListener("click", resetTaskForm);

// Event delegation: ONE listener on the list handles every button/checkbox inside it.
taskEls.list.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const { action, id } = target.dataset;
  if (action === "toggle") toggleTask(id);
  else if (action === "edit") startEditTask(id);
  else if (action === "delete") deleteTask(id);
});

[taskEls.search, taskEls.filterStatus, taskEls.filterPriority, taskEls.sort].forEach((control) => {
  control.addEventListener("input", renderTasks);
});


// ---------- 6. NOTES ----------
function renderNotes() {
  noteEls.list.replaceChildren();
  const query = noteEls.search.value.trim().toLowerCase();
  const visible = notes
    .filter((note) => `${note.title} ${note.body}`.toLowerCase().includes(query))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (visible.length === 0) {
    noteEls.list.append(emptyState(notes.length === 0 ? "No notes yet. Write your first one above." : "No notes match your search."));
    return;
  }

  visible.forEach((note) => {
    const card = el("article", "card p-5 flex flex-col gap-2");
    const when = new Date(note.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const actions = el("div", "flex gap-2 mt-auto pt-2");
    actions.append(actionButton("Edit", "edit", note.id), actionButton("Delete", "delete", note.id, "btn-danger"));
    card.append(
      el("h3", "font-bold text-lg", note.title),
      el("p", "text-sm whitespace-pre-wrap break-words", note.body),
      el("p", "text-xs muted", `Updated ${when}`),
      actions
    );
    noteEls.list.append(card);
  });
}

function resetNoteForm() {
  noteEls.form.reset();
  noteEls.id.value = "";
  noteEls.submit.textContent = "Save note";
  noteEls.cancel.classList.add("hidden");
}

noteEls.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = noteEls.title.value.trim();
  const body = noteEls.body.value.trim();
  if (!title || !body) {
    showToast("A note needs both a title and a description.");
    return;
  }
  if (noteEls.id.value) {
    const note = notes.find((n) => n.id === noteEls.id.value);
    if (note) Object.assign(note, { title, body, updatedAt: Date.now() });
    logActivity(`Updated note "${title}"`);
  } else {
    notes.push({ id: generateId(), title, body, createdAt: Date.now(), updatedAt: Date.now() });
    logActivity(`Added note "${title}"`);
  }
  saveToStorage(STORAGE_KEYS.notes, notes);
  resetNoteForm();
  refreshAll();
});

noteEls.cancel.addEventListener("click", resetNoteForm);
noteEls.search.addEventListener("input", renderNotes);

noteEls.list.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const note = notes.find((n) => n.id === target.dataset.id);
  if (!note) return;
  if (target.dataset.action === "edit") {
    noteEls.id.value = note.id;
    noteEls.title.value = note.title;
    noteEls.body.value = note.body;
    noteEls.submit.textContent = "Save changes";
    noteEls.cancel.classList.remove("hidden");
    noteEls.title.focus();
    noteEls.form.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (target.dataset.action === "delete" && confirm(`Delete note "${note.title}"?`)) {
    notes = notes.filter((n) => n.id !== note.id);
    saveToStorage(STORAGE_KEYS.notes, notes);
    logActivity(`Deleted note "${note.title}"`);
    if (noteEls.id.value === note.id) resetNoteForm();
    refreshAll();
  }
});


// ---------- 7. POMODORO TIMER ----------
const TIMER_MODES = {
  focus: { label: "Focus", minutes: 25 },
  short: { label: "Short break", minutes: 5 },
  long: { label: "Long break", minutes: 15 },
};

let timerMode = "focus";
let timerSecondsLeft = TIMER_MODES.focus.minutes * 60;
let timerIntervalId = null; // null = not running
let timerEndTime = 0;       // the clock time when the timer should hit zero

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function startTimer() {
  if (timerIntervalId !== null) return;
  requestNotificationPermission();
  // Using a target end time (not "subtract 1 each tick") keeps the timer accurate
  // even if the browser slows down timers in background tabs.
  timerEndTime = Date.now() + timerSecondsLeft * 1000;
  timerIntervalId = setInterval(tickTimer, 250);
  renderTimer();
}

function pauseTimer() {
  timerSecondsLeft = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  renderTimer();
}

function resetTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  timerSecondsLeft = TIMER_MODES[timerMode].minutes * 60;
  renderTimer();
}

function tickTimer() {
  timerSecondsLeft = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
  if (timerSecondsLeft === 0) {
    completeTimer();
  } else {
    renderTimer();
  }
}

function completeTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  const mode = TIMER_MODES[timerMode];

  if (timerMode === "focus") {
    studySessions.push({ id: generateId(), date: todayISO(), minutes: mode.minutes });
    saveToStorage(STORAGE_KEYS.study, studySessions);
    logActivity(`Finished a ${mode.minutes}-minute focus session`);
  }
  const message = timerMode === "focus"
    ? `Focus session complete! Take a break.`
    : `${mode.label} is over. Ready to focus?`;
  addNotification(message);
  sendBrowserNotification("StudyDeck", message);
  showToast(message);

  timerSecondsLeft = mode.minutes * 60;
  refreshAll();
}

function setTimerMode(modeKey) {
  timerMode = modeKey;
  resetTimer();
}

function renderTimer() {
  const total = TIMER_MODES[timerMode].minutes * 60;
  const display = `${pad(Math.floor(timerSecondsLeft / 60))}:${pad(timerSecondsLeft % 60)}`;
  const running = timerIntervalId !== null;

  timerEls.display.textContent = display;
  timerEls.label.textContent = TIMER_MODES[timerMode].label;
  timerEls.progress.style.width = `${((total - timerSecondsLeft) / total) * 100}%`;
  timerEls.toggle.textContent = running ? "Pause" : timerSecondsLeft < total ? "Resume" : "Start";
  document.title = running ? `${display} · ${BASE_TITLE}` : BASE_TITLE;

  timerEls.modes.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === timerMode);
  });
  timerEls.sessions.textContent = studySessions.length;
  timerEls.total.textContent = formatMinutes(sumMinutes(studySessions));
}

timerEls.toggle.addEventListener("click", () => {
  if (timerIntervalId === null) startTimer();
  else pauseTimer();
});
timerEls.reset.addEventListener("click", resetTimer);
timerEls.modes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (button) setTimerMode(button.dataset.mode);
});


// ---------- 8. EXPENSES ----------
function renderCategoryBars(container, list) {
  container.replaceChildren();
  const total = list.reduce((sum, e) => sum + e.amount, 0);
  if (total === 0) {
    container.append(emptyState("No spending to show yet."));
    return;
  }
  const byCategory = list.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, amount]) => {
      const row = el("div", "mb-3");
      const head = el("div", "flex justify-between text-sm mb-1");
      head.append(el("span", "font-semibold", category), el("span", "muted", formatMoney(amount)));
      const track = el("div", "progress-track");
      const fill = el("div", "progress-fill");
      fill.style.width = `${Math.round((amount / total) * 100)}%`;
      track.append(fill);
      row.append(head, track);
      container.append(row);
    });
}

function renderExpenses() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = todayISO().slice(0, 7);
  const monthTotal = expenses
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((sum, e) => sum + e.amount, 0);
  expenseEls.total.textContent = formatMoney(total);
  expenseEls.month.textContent = formatMoney(monthTotal);

  renderCategoryBars(expenseEls.breakdown, expenses);

  // Monthly summary: group amounts by "YYYY-MM"
  expenseEls.monthly.replaceChildren();
  const byMonth = expenses.reduce((acc, e) => {
    const key = e.date.slice(0, 7);
    acc[key] = (acc[key] ?? 0) + e.amount;
    return acc;
  }, {});
  const monthKeys = Object.keys(byMonth).sort().reverse();
  if (monthKeys.length === 0) expenseEls.monthly.append(emptyState("No monthly data yet."));
  monthKeys.forEach((key) => {
    const label = new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    const row = el("div", "flex justify-between py-1.5 text-sm");
    row.append(el("span", "", label), el("span", "font-semibold", formatMoney(byMonth[key])));
    expenseEls.monthly.append(row);
  });

  // Expense list
  expenseEls.list.replaceChildren();
  if (expenses.length === 0) {
    expenseEls.list.append(emptyState("No expenses yet. Add your first one above."));
    return;
  }
  [...expenses].sort((a, b) => b.date.localeCompare(a.date)).forEach((expense) => {
    const li = el("li", "card p-4 flex flex-wrap items-center gap-3");
    const info = el("div", "flex-1 min-w-[160px]");
    info.append(
      el("p", "font-semibold", expense.title),
      el("p", "text-sm muted", `${expense.category} · ${formatDate(expense.date)}`)
    );
    const actions = el("div", "flex gap-2");
    actions.append(actionButton("Edit", "edit", expense.id), actionButton("Delete", "delete", expense.id, "btn-danger"));
    li.append(info, el("p", "font-bold", formatMoney(expense.amount)), actions);
    expenseEls.list.append(li);
  });
}

function resetExpenseForm() {
  expenseEls.form.reset();
  expenseEls.id.value = "";
  expenseEls.date.value = todayISO();
  expenseEls.submit.textContent = "Add expense";
  expenseEls.cancel.classList.add("hidden");
}

expenseEls.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = expenseEls.title.value.trim();
  const amount = parseFloat(expenseEls.amount.value);
  const date = expenseEls.date.value;

  if (!title) return showToast("Please enter what the expense was for.");
  if (!Number.isFinite(amount) || amount <= 0) return showToast("Amount must be a number greater than 0.");
  if (!date) return showToast("Please choose a date.");

  const data = { title, amount, category: expenseEls.category.value, date };
  if (expenseEls.id.value) {
    const expense = expenses.find((e) => e.id === expenseEls.id.value);
    if (expense) Object.assign(expense, data);
    logActivity(`Updated expense "${title}"`);
  } else {
    expenses.push({ id: generateId(), ...data });
    logActivity(`Added expense "${title}" (${formatMoney(amount)})`);
  }
  saveToStorage(STORAGE_KEYS.expenses, expenses);
  resetExpenseForm();
  refreshAll();
});

expenseEls.cancel.addEventListener("click", resetExpenseForm);

expenseEls.list.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const expense = expenses.find((e) => e.id === target.dataset.id);
  if (!expense) return;
  if (target.dataset.action === "edit") {
    expenseEls.id.value = expense.id;
    expenseEls.title.value = expense.title;
    expenseEls.amount.value = expense.amount;
    expenseEls.category.value = expense.category;
    expenseEls.date.value = expense.date;
    expenseEls.submit.textContent = "Save changes";
    expenseEls.cancel.classList.remove("hidden");
    expenseEls.form.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (target.dataset.action === "delete" && confirm(`Delete expense "${expense.title}"?`)) {
    expenses = expenses.filter((e) => e.id !== expense.id);
    saveToStorage(STORAGE_KEYS.expenses, expenses);
    logActivity(`Deleted expense "${expense.title}"`);
    refreshAll();
  }
});


// ---------- 9. STUDY GOALS ----------
function renderGoals() {
  goalEls.list.replaceChildren();
  if (goals.length === 0) {
    goalEls.list.append(emptyState("No goals yet. Set a daily or weekly goal above."));
    return;
  }
  goals.forEach((goal) => {
    const percent = Math.min(100, Math.round((goal.doneMinutes / goal.targetMinutes) * 100));
    const complete = goal.doneMinutes >= goal.targetMinutes;

    const card = el("li", "card p-5");
    const head = el("div", "flex flex-wrap items-center gap-2 mb-2");
    head.append(
      el("h3", "font-bold flex-1", goal.title),
      el("span", "badge badge-low capitalize", goal.type),
      el("span", complete ? "badge badge-done" : "badge badge-medium", complete ? "Completed" : "In progress")
    );
    const track = el("div", "progress-track");
    const fill = el("div", "progress-fill");
    fill.style.width = `${percent}%`;
    track.append(fill);

    const actions = el("div", "flex flex-wrap gap-2 mt-3");
    const plus15 = actionButton("+15 min", "progress", goal.id);
    plus15.dataset.minutes = "15";
    const plus30 = actionButton("+30 min", "progress", goal.id);
    plus30.dataset.minutes = "30";
    actions.append(plus15, plus30, actionButton("Edit", "edit", goal.id), actionButton("Delete", "delete", goal.id, "btn-danger"));

    card.append(
      head,
      el("p", "text-sm muted mb-2", `${goal.doneMinutes} of ${goal.targetMinutes} minutes (${percent}%)`),
      track,
      actions
    );
    goalEls.list.append(card);
  });
}

function resetGoalForm() {
  goalEls.form.reset();
  goalEls.id.value = "";
  goalEls.submit.textContent = "Add goal";
  goalEls.cancel.classList.add("hidden");
}

goalEls.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = goalEls.title.value.trim();
  const targetMinutes = parseInt(goalEls.target.value, 10);
  if (!title) return showToast("Please name your goal.");
  if (!Number.isInteger(targetMinutes) || targetMinutes < 1) return showToast("Target must be at least 1 minute.");

  if (goalEls.id.value) {
    const goal = goals.find((g) => g.id === goalEls.id.value);
    if (goal) Object.assign(goal, { title, type: goalEls.type.value, targetMinutes });
    logActivity(`Updated goal "${title}"`);
  } else {
    goals.push({ id: generateId(), title, type: goalEls.type.value, targetMinutes, doneMinutes: 0 });
    logActivity(`Added goal "${title}"`);
  }
  saveToStorage(STORAGE_KEYS.goals, goals);
  resetGoalForm();
  refreshAll();
});

goalEls.cancel.addEventListener("click", resetGoalForm);

goalEls.list.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const goal = goals.find((g) => g.id === target.dataset.id);
  if (!goal) return;

  if (target.dataset.action === "progress") {
    const wasComplete = goal.doneMinutes >= goal.targetMinutes;
    goal.doneMinutes += Number(target.dataset.minutes);
    if (!wasComplete && goal.doneMinutes >= goal.targetMinutes) {
      addNotification(`Goal completed: "${goal.title}" 🎉`);
      logActivity(`Completed goal "${goal.title}"`);
    }
  } else if (target.dataset.action === "edit") {
    goalEls.id.value = goal.id;
    goalEls.title.value = goal.title;
    goalEls.type.value = goal.type;
    goalEls.target.value = goal.targetMinutes;
    goalEls.submit.textContent = "Save changes";
    goalEls.cancel.classList.remove("hidden");
    goalEls.form.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  } else if (target.dataset.action === "delete") {
    if (!confirm(`Delete goal "${goal.title}"?`)) return;
    goals = goals.filter((g) => g.id !== goal.id);
  }
  saveToStorage(STORAGE_KEYS.goals, goals);
  refreshAll();
});


// ---------- 10. CALENDAR & PLANNER ----------
function getEventsOn(isoDate) {
  return events
    .filter((e) => e.date === isoDate)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
}

function getTasksDueOn(isoDate) {
  return tasks.filter((t) => !t.completed && t.dueDate === isoDate);
}

function renderCalendar() {
  const firstDay = new Date(calYear, calMonth, 1);
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  calEls.title.textContent = firstDay.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  calEls.grid.replaceChildren();

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((name) => {
    calEls.grid.append(el("div", "text-xs font-bold text-center muted py-1", name));
  });
  for (let i = 0; i < firstDay.getDay(); i++) calEls.grid.append(el("div"));

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toISODate(new Date(calYear, calMonth, day));
    const button = el("button", "cal-day", String(day));
    button.type = "button";
    button.dataset.date = iso;
    if (iso === todayISO()) button.classList.add("today");
    if (iso === selectedDate) button.classList.add("selected");
    if (getEventsOn(iso).length > 0 || getTasksDueOn(iso).length > 0) button.classList.add("has-item");
    calEls.grid.append(button);
  }

  renderDayPanel();
  renderUpcoming();
}

function renderDayPanel() {
  calEls.dayTitle.textContent = `Schedule for ${formatDate(selectedDate)}`;
  calEls.dayList.replaceChildren();
  const dayEvents = getEventsOn(selectedDate);
  const dayTasks = getTasksDueOn(selectedDate);

  if (dayEvents.length === 0 && dayTasks.length === 0) {
    calEls.dayList.append(emptyState("Nothing planned for this day."));
    return;
  }
  dayEvents.forEach((ev) => {
    const li = el("li", "flex items-center gap-2 py-2");
    li.append(
      el("span", "muted text-sm w-14", ev.time || "All day"),
      el("span", "flex-1 font-semibold", ev.title),
      actionButton("Edit", "edit", ev.id),
      actionButton("Delete", "delete", ev.id, "btn-danger")
    );
    calEls.dayList.append(li);
  });
  dayTasks.forEach((task) => {
    const li = el("li", "flex items-center gap-2 py-2");
    li.append(el("span", "muted text-sm w-14", "Due"), el("span", "flex-1", `Task: ${task.title}`));
    calEls.dayList.append(li);
  });
}

function renderUpcoming() {
  calEls.upcoming.replaceChildren();
  const today = todayISO();
  const limit = toISODate(addDays(new Date(), 30));

  const items = [
    ...events.filter((e) => e.date >= today && e.date <= limit)
      .map((e) => ({ date: e.date, time: e.time || "", text: e.title, kind: "Event" })),
    ...tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= limit)
      .map((t) => ({ date: t.dueDate, time: "", text: t.title, kind: t.dueDate < today ? "Overdue" : "Deadline" })),
  ].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 8);

  if (items.length === 0) {
    calEls.upcoming.append(emptyState("No upcoming events or deadlines."));
    return;
  }
  items.forEach((item) => {
    const li = el("li", "flex justify-between gap-3 py-1.5 text-sm");
    li.append(
      el("span", item.kind === "Overdue" ? "overdue" : "", `${item.kind}: ${item.text}`),
      el("span", "muted whitespace-nowrap", formatDate(item.date))
    );
    calEls.upcoming.append(li);
  });
}

function resetEventForm() {
  calEls.form.reset();
  calEls.id.value = "";
  calEls.date.value = selectedDate;
  calEls.submit.textContent = "Add event";
  calEls.cancel.classList.add("hidden");
}

function changeMonth(step) {
  calMonth += step;
  if (calMonth < 0) { calMonth = 11; calYear -= 1; }
  if (calMonth > 11) { calMonth = 0; calYear += 1; }
  renderCalendar();
}

calEls.prev.addEventListener("click", () => changeMonth(-1));
calEls.next.addEventListener("click", () => changeMonth(1));

calEls.grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-date]");
  if (!button) return;
  selectedDate = button.dataset.date;
  if (!calEls.id.value) calEls.date.value = selectedDate;
  renderCalendar();
});

calEls.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = calEls.evTitle.value.trim();
  const date = calEls.date.value;
  if (!title) return showToast("Please enter an event title.");
  if (!date) return showToast("Please choose a date.");

  const data = { title, date, time: calEls.time.value };
  if (calEls.id.value) {
    const ev = events.find((e) => e.id === calEls.id.value);
    if (ev) Object.assign(ev, data);
    logActivity(`Updated event "${title}"`);
  } else {
    events.push({ id: generateId(), ...data });
    logActivity(`Added event "${title}"`);
  }
  selectedDate = date;
  const [year, month] = date.split("-").map(Number);
  calYear = year;
  calMonth = month - 1;
  saveToStorage(STORAGE_KEYS.events, events);
  resetEventForm();
  refreshAll();
});

calEls.cancel.addEventListener("click", resetEventForm);

calEls.dayList.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const ev = events.find((e) => e.id === target.dataset.id);
  if (!ev) return;
  if (target.dataset.action === "edit") {
    calEls.id.value = ev.id;
    calEls.evTitle.value = ev.title;
    calEls.date.value = ev.date;
    calEls.time.value = ev.time;
    calEls.submit.textContent = "Save changes";
    calEls.cancel.classList.remove("hidden");
    calEls.evTitle.focus();
  } else if (target.dataset.action === "delete" && confirm(`Delete event "${ev.title}"?`)) {
    events = events.filter((e) => e.id !== ev.id);
    saveToStorage(STORAGE_KEYS.events, events);
    logActivity(`Deleted event "${ev.title}"`);
    refreshAll();
  }
});


// ---------- 11. ANALYTICS (no chart library, just divs) ----------
function getLastNDates(n) {
  // Array.from({length: n}, fn) builds an array by calling fn for each index.
  return Array.from({ length: n }, (_, i) => toISODate(addDays(new Date(), i - (n - 1))));
}

function renderAnalytics() {
  const days = getLastNDates(7);
  const minutesPerDay = days.map((day) => sumMinutes(studySessions.filter((s) => s.date === day)));
  const totalMinutes = minutesPerDay.reduce((a, b) => a + b, 0);
  const maxMinutes = Math.max(...minutesPerDay, 1);
  const activeDays = minutesPerDay.filter((m) => m > 0).length;

  anaEls.hours.textContent = `${(totalMinutes / 60).toFixed(1)}h`;
  anaEls.completed.textContent = tasks.filter((t) => t.completed && days.includes(t.completedAt)).length;
  anaEls.productivity.textContent = `${getCompletionPercent()}%`;
  anaEls.consistency.textContent = `${Math.round((activeDays / 7) * 100)}%`;

  anaEls.chart.replaceChildren();
  days.forEach((day, index) => {
    const column = el("div", "flex flex-col items-center justify-end gap-1 flex-1");
    const bar = el("div", "bar");
    bar.style.height = `${Math.round((minutesPerDay[index] / maxMinutes) * 130) + 4}px`;
    bar.title = `${minutesPerDay[index]} minutes`;
    const weekday = new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });
    column.append(el("span", "text-xs muted", `${minutesPerDay[index]}m`), bar, el("span", "text-xs font-semibold", weekday));
    anaEls.chart.append(column);
  });

  const weekExpenses = expenses.filter((e) => days.includes(e.date));
  anaEls.spent.textContent = formatMoney(weekExpenses.reduce((sum, e) => sum + e.amount, 0));
  renderCategoryBars(anaEls.categories, weekExpenses);
}


// ---------- 12. NOTIFICATIONS ----------
function addNotification(message) {
  notifications.unshift({ id: generateId(), message, time: Date.now(), read: false });
  notifications = notifications.slice(0, 30);
  saveToStorage(STORAGE_KEYS.notifications, notifications);
  renderNotifications();
}

function renderNotifications() {
  const unread = notifications.filter((n) => !n.read).length;
  shell.notifBadge.textContent = unread;
  shell.notifBadge.classList.toggle("hidden", unread === 0);

  shell.notifList.replaceChildren();
  if (notifications.length === 0) {
    shell.notifList.append(emptyState("You're all caught up."));
    return;
  }
  notifications.forEach((item) => {
    const li = el("li", "py-2 border-b text-sm");
    li.style.borderColor = "var(--border)";
    const when = new Date(item.time).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
    li.append(el("p", "", item.message), el("p", "text-xs muted mt-0.5", when));
    shell.notifList.append(li);
  });
}

function checkDeadlineReminders() {
  const today = todayISO();
  const tomorrow = toISODate(addDays(new Date(), 1));

  tasks.filter((t) => !t.completed && t.dueDate).forEach((task) => {
    let kind = null;
    if (task.dueDate < today) kind = "overdue";
    else if (task.dueDate === today) kind = "today";
    else if (task.dueDate === tomorrow) kind = "tomorrow";
    if (!kind) return;

    const key = `${task.id}:${kind}:${today}`; // remind once per task, per kind, per day
    if (remindedKeys.includes(key)) return;
    remindedKeys.push(key);

    const text = {
      overdue: `Overdue: "${task.title}" was due ${formatDate(task.dueDate)}`,
      today: `Due today: "${task.title}"`,
      tomorrow: `Due tomorrow: "${task.title}"`,
    }[kind];
    addNotification(text);
  });
  remindedKeys = remindedKeys.slice(-200);
  saveToStorage(STORAGE_KEYS.reminded, remindedKeys);
}

shell.notifBtn.addEventListener("click", () => {
  shell.notifPanel.classList.toggle("hidden");
  if (!shell.notifPanel.classList.contains("hidden")) {
    notifications.forEach((n) => { n.read = true; });
    saveToStorage(STORAGE_KEYS.notifications, notifications);
    renderNotifications();
  }
});

shell.notifClear.addEventListener("click", () => {
  notifications = [];
  saveToStorage(STORAGE_KEYS.notifications, notifications);
  renderNotifications();
});


// ---------- 13. GLOBAL SEARCH ----------
function runGlobalSearch() {
  const query = shell.search.value.trim().toLowerCase();
  shell.results.replaceChildren();
  if (!query) {
    shell.results.classList.add("hidden");
    return;
  }

  const sources = [
    { section: "tasks", label: "Task", items: tasks, title: (t) => t.title, text: (t) => t.title },
    { section: "notes", label: "Note", items: notes, title: (n) => n.title, text: (n) => `${n.title} ${n.body}` },
    { section: "expenses", label: "Expense", items: expenses, title: (e) => e.title, text: (e) => `${e.title} ${e.category}` },
    { section: "goals", label: "Goal", items: goals, title: (g) => g.title, text: (g) => g.title },
    { section: "calendar", label: "Event", items: events, title: (e) => e.title, text: (e) => e.title },
  ];

  const matches = sources.flatMap((source) =>
    source.items
      .filter((item) => source.text(item).toLowerCase().includes(query))
      .map((item) => ({ section: source.section, label: source.label, title: source.title(item) }))
  ).slice(0, 8);

  if (matches.length === 0) {
    shell.results.append(emptyState("No results found."));
  }
  matches.forEach((match) => {
    const button = el("button", "search-result", "");
    button.type = "button";
    button.dataset.section = match.section;
    button.append(el("span", "badge badge-low", match.label), el("span", "flex-1 text-left", match.title));
    shell.results.append(button);
  });
  shell.results.classList.remove("hidden");
}

shell.search.addEventListener("input", debounce(runGlobalSearch, 250));

shell.results.addEventListener("click", (event) => {
  const button = event.target.closest("[data-section]");
  if (!button) return;
  showSection(button.dataset.section);
  shell.search.value = "";
});

// Click outside closes the popups.
document.addEventListener("click", (event) => {
  if (!shell.searchWrap.contains(event.target)) shell.results.classList.add("hidden");
  if (!shell.notifWrap.contains(event.target)) shell.notifPanel.classList.add("hidden");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    shell.results.classList.add("hidden");
    shell.notifPanel.classList.add("hidden");
  }
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
  if (event.key === "/" && !typing) {
    event.preventDefault();
    shell.search.focus();
  }
});


// ---------- 14. API (async / await + fetch) ----------
const FALLBACK_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Small steps every day add up to big results.", author: "Unknown" },
];

async function loadQuote() {
  dash.quoteText.textContent = "Loading a quote…";
  dash.quoteAuthor.textContent = "";
  try {
    const response = await fetch("https://dummyjson.com/quotes/random");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    dash.quoteText.textContent = `“${data.quote}”`;
    dash.quoteAuthor.textContent = `— ${data.author}`;
  } catch (error) {
    console.error("Quote request failed:", error);
    const fallback = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    dash.quoteText.textContent = `“${fallback.quote}”`;
    dash.quoteAuthor.textContent = `— ${fallback.author}`;
  }
}

dash.newQuote.addEventListener("click", loadQuote);


// ---------- 15. INIT ----------
// One function that redraws everything from the current state.
function refreshAll() {
  checkDeadlineReminders();
  renderStats();
  renderActivity();
  renderTasks();
  renderNotes();
  renderTimer();
  renderExpenses();
  renderGoals();
  renderCalendar();
  renderAnalytics();
  renderNotifications();
}

function init() {
  applyTheme(loadTheme());
  updateDateTime();
  setInterval(updateDateTime, 1000);
  setInterval(checkDeadlineReminders, 30 * 60 * 1000);
  expenseEls.date.value = todayISO();
  calEls.date.value = selectedDate;
  refreshAll();
  showSection("dashboard");
  loadQuote();
}

init();