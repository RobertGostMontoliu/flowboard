import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  Bell,
  Check,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  ListTodo,
  Moon,
  Plus,
  Search,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { initialTasks, projects } from "./data";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Project, Task, TaskPriority, TaskStatus } from "./types";
import "./index.css";

type View = "overview" | "board" | "my-tasks";
const columns: { id: TaskStatus; label: string; tone: string }[] = [
  { id: "todo", label: "To do", tone: "gray" },
  { id: "in-progress", label: "In progress", tone: "blue" },
  { id: "review", label: "In review", tone: "amber" },
  { id: "done", label: "Done", tone: "green" },
];
const priorities: TaskPriority[] = ["Urgent", "High", "Medium", "Low"];
const prettyDate = (date: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );

export default function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "flowboard.tasks.v1",
    initialTasks,
  );
  const [theme, setTheme] = useLocalStorage<"light" | "dark">(
    "flowboard.theme.v1",
    "light",
  );
  const [view, setView] = useState<View>("overview");
  const [activeProject, setActiveProject] = useState("all");
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const projectMatches =
          activeProject === "all" || task.projectId === activeProject;
        const viewMatches = view !== "my-tasks" || task.assignee === "You";
        const textMatches =
          `${task.title} ${task.labels.join(" ")} ${task.category}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return (
          projectMatches &&
          viewMatches &&
          textMatches &&
          (priorityFilter === "all" || task.priority === priorityFilter)
        );
      }),
    [activeProject, priorityFilter, query, tasks, view],
  );
  const projectName =
    projects.find((project) => project.id === activeProject)?.name ??
    "All projects";
  const completeRatio = tasks.length
    ? Math.round(
        (tasks.filter((task) => task.status === "done").length / tasks.length) *
          100,
      )
    : 0;

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function editTask(task: Task) {
    setEditing(task);
    setDialogOpen(true);
  }
  function moveTask(id: string, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
              progress: status === "done" ? 100 : task.progress,
            }
          : task,
      ),
    );
  }
  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const task: Task = {
      id: editing?.id ?? crypto.randomUUID(),
      title: String(form.get("title")).trim(),
      projectId: String(form.get("projectId")),
      status: String(form.get("status")) as TaskStatus,
      priority: String(form.get("priority")) as TaskPriority,
      category: String(form.get("category")).trim() || "General",
      labels: String(form.get("labels"))
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean),
      dueDate: String(form.get("dueDate")),
      assignee: editing?.assignee ?? "You",
      progress: editing?.progress ?? 0,
    };
    setTasks((current) =>
      editing
        ? current.map((item) => (item.id === task.id ? task : item))
        : [task, ...current],
    );
    setDialogOpen(false);
    setEditing(null);
  }

  return (
    <div className={`app-shell ${theme}`}>
      <aside className="sidebar">
        <a
          className="brand"
          href="#home"
          onClick={() => setView("overview")}
          aria-label="FlowBoard home"
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>flowboard</span>
          <span className="workspace-switch">
            AC <ChevronDown size={13} />
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          <button
            className={view === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => setView("overview")}
          >
            <LayoutDashboard size={17} />
            Overview
          </button>
          <button
            className={view === "my-tasks" ? "nav-item active" : "nav-item"}
            onClick={() => setView("my-tasks")}
          >
            <ListTodo size={17} />
            My tasks
            <span className="nav-count">
              {
                tasks.filter(
                  (task) => task.assignee === "You" && task.status !== "done",
                ).length
              }
            </span>
          </button>
          <button
            className={view === "board" ? "nav-item active" : "nav-item"}
            onClick={() => setView("board")}
          >
            <Activity size={17} />
            Board
          </button>
        </nav>
        <div className="section-heading">
          <span>YOUR PROJECTS</span>
          <button aria-label="Create task" onClick={openCreate}>
            <Plus size={15} />
          </button>
        </div>
        <div className="project-nav">
          <button
            className={
              activeProject === "all" ? "project-link selected" : "project-link"
            }
            onClick={() => {
              setActiveProject("all");
              setView("board");
            }}
          >
            <i className="project-dot all-dot" />
            All projects<span className="project-total">{tasks.length}</span>
          </button>
          {projects.map((project) => (
            <button
              key={project.id}
              className={
                activeProject === project.id
                  ? "project-link selected"
                  : "project-link"
              }
              onClick={() => {
                setActiveProject(project.id);
                setView("board");
              }}
            >
              <i
                className="project-dot"
                style={{ background: project.color }}
              />
              {project.name}
              <span className="project-total">
                {tasks.filter((task) => task.projectId === project.id).length}
              </span>
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="progress-note">
            <strong>
              <span>✳</span> A good week of work
            </strong>
            <p>Your team is making steady progress.</p>
            <div className="progress-track">
              <i style={{ width: `${completeRatio}%` }} />
            </div>
            <small>
              Weekly completion <b>{completeRatio}%</b>
            </small>
          </div>
          <button
            className="nav-item"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Settings2 size={17} />
            Appearance
          </button>
          <button
            className="nav-item"
            onClick={() =>
              window.alert("Tasks and preferences are saved in this browser.")
            }
          >
            <CircleHelp size={17} />
            Help & feedback
          </button>
          <div className="profile-row">
            <span className="avatar avatar-profile">JD</span>
            <span>
              <b>Jordan Davis</b>
              <small>Product team</small>
            </span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Acme Studio</span>
            <i>/</i>
            <b>
              {view === "overview"
                ? "Overview"
                : view === "my-tasks"
                  ? "My tasks"
                  : projectName}
            </b>
          </div>
          <div className="top-actions">
            <label className="search-box">
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search anything..."
                aria-label="Search tasks"
              />
            </label>
            <button
              className="icon-button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <button
              className="icon-button notification-button"
              onClick={() => window.alert("You are all caught up.")}
              aria-label="Notifications"
            >
              <Bell size={17} />
              <i />
            </button>
            <button
              className="avatar avatar-small"
              onClick={() => setView("my-tasks")}
              aria-label="Jordan Davis profile"
            >
              JD
            </button>
          </div>
        </header>

        <div className="content-wrap">
          {view === "overview" ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <i /> SATURDAY, NOVEMBER 7
                  </div>
                  <h1>
                    Good morning, Jordan <span>✳</span>
                  </h1>
                  <p>Here’s what’s happening across your workspace.</p>
                </div>
                <button className="primary-button" onClick={openCreate}>
                  <Plus size={17} />
                  New task
                </button>
              </section>
              <section className="metric-grid" aria-label="Workspace metrics">
                <Metric
                  title="Open tasks"
                  value={String(
                    tasks.filter((task) => task.status !== "done").length,
                  ).padStart(2, "0")}
                  note="Across all projects"
                  tint="violet"
                  symbol="◌"
                  trend="12%"
                />
                <Metric
                  title="Completed this week"
                  value="18"
                  note="vs. 14 last week"
                  tint="mint"
                  symbol="↗"
                  trend="28%"
                />
                <Metric
                  title="In progress"
                  value={String(
                    tasks.filter((task) => task.status === "in-progress")
                      .length,
                  ).padStart(2, "0")}
                  note="4 team members active"
                  tint="peach"
                  symbol="◷"
                  trend="Steady"
                />
                <Metric
                  title="On-time delivery"
                  value="94%"
                  note="Last 30 days"
                  tint="sky"
                  symbol="◎"
                  trend="+6.2%"
                />
              </section>
              <section className="overview-grid">
                <div className="panel momentum">
                  <div className="panel-heading">
                    <div>
                      <h2>Project momentum</h2>
                      <p>A steady rhythm across the team</p>
                    </div>
                    <span>This month</span>
                  </div>
                  <div className="chart-total">
                    <b>126</b>
                    <span>
                      tasks completed <strong>↑ 18.4%</strong>
                    </span>
                  </div>
                  <div
                    className="chart"
                    role="img"
                    aria-label="Weekly completed tasks chart"
                  >
                    <div className="chart-y">
                      <span>40</span>
                      <span>30</span>
                      <span>20</span>
                      <span>10</span>
                      <span>0</span>
                    </div>
                    <div className="chart-plot">
                      <div className="grid-lines">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                      <div className="bars">
                        {[22, 38, 29, 54, 43, 68, 51, 74, 59, 83, 66, 94].map(
                          (height, index) => (
                            <i
                              key={index}
                              className={index === 9 ? "highlight" : ""}
                              style={{ height: `${height}%` }}
                            />
                          ),
                        )}
                      </div>
                      <div className="chart-x">
                        <span>Wk 1</span>
                        <span>Wk 2</span>
                        <span>Wk 3</span>
                        <span>Wk 4</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="panel focus-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Focus time</h2>
                      <p>Team capacity this week</p>
                    </div>
                  </div>
                  <div className="focus-ring">
                    <div>
                      <b>76%</b>
                      <span>capacity used</span>
                    </div>
                  </div>
                  <div className="focus-legend">
                    <p>
                      <i />
                      Focused <b>30h 24m</b>
                    </p>
                    <p>
                      <i />
                      Available <b>9h 36m</b>
                    </p>
                  </div>
                  <div className="team-note">
                    <span>JD</span>
                    <span>AL</span>
                    <span>MK</span>
                    <span>+2</span>
                    <small>Team of 5</small>
                  </div>
                </div>
              </section>
              <section className="panel tasks-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Priority tasks</h2>
                    <p>The things that need your attention</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setView("board")}
                  >
                    View board <ChevronDown size={14} />
                  </button>
                </div>
                <TaskTable
                  tasks={tasks
                    .filter((task) => task.status !== "done")
                    .slice(0, 4)}
                  onEdit={editTask}
                  onDelete={(id) =>
                    setTasks((current) =>
                      current.filter((task) => task.id !== id),
                    )
                  }
                />
              </section>
            </>
          ) : (
            <>
              <section className="board-heading">
                <div>
                  <div className="eyebrow">
                    <i /> WORKSPACE /{" "}
                    {view === "my-tasks" ? "PERSONAL" : "PROJECTS"}
                  </div>
                  <h1>{view === "my-tasks" ? "My tasks" : projectName}</h1>
                  <p>
                    {view === "my-tasks"
                      ? "Your work, gathered in one place."
                      : "Plan, track, and ship great work together."}
                  </p>
                </div>
                <div className="board-actions">
                  <button
                    className="secondary-button"
                    aria-pressed={priorityFilter !== "all"}
                    onClick={() =>
                      setPriorityFilter(
                        priorityFilter === "all" ? "High" : "all",
                      )
                    }
                  >
                    Filter: {priorityFilter === "all" ? "All" : priorityFilter}
                    <ChevronDown size={13} />
                  </button>
                  <button className="primary-button" onClick={openCreate}>
                    <Plus size={17} />
                    Add task
                  </button>
                </div>
              </section>
              <div className="board-toolbar">
                <div className="board-tabs">
                  <button
                    className="tab-active"
                    onClick={() => setView("board")}
                  >
                    Board <span>{visibleTasks.length}</span>
                  </button>
                  <button onClick={() => setView("overview")}>Overview</button>
                </div>
                <div className="team-note board-team">
                  <span>JD</span>
                  <span>AL</span>
                  <span>MK</span>
                  <small>Team</small>
                </div>
              </div>
              <section className="kanban" aria-label="Kanban board">
                {columns.map((column) => {
                  const columnTasks = visibleTasks.filter(
                    (task) => task.status === column.id,
                  );
                  return (
                    <div
                      key={column.id}
                      className={`kanban-column column-${column.tone}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (draggedTask) moveTask(draggedTask, column.id);
                        setDraggedTask(null);
                      }}
                    >
                      <div className="column-heading">
                        <div>
                          <i />
                          <h2>{column.label}</h2>
                          <span>{columnTasks.length}</span>
                        </div>
                        <button
                          onClick={openCreate}
                          aria-label={`Add task to ${column.label}`}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="task-stack">
                        {columnTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            project={projects.find(
                              (item) => item.id === task.projectId,
                            )}
                            onEdit={editTask}
                            onDelete={(id) =>
                              setTasks((current) =>
                                current.filter((item) => item.id !== id),
                              )
                            }
                            onMove={moveTask}
                            onDragStart={setDraggedTask}
                          />
                        ))}
                        {columnTasks.length === 0 && (
                          <div className="empty-column">Nothing here yet</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </main>
      <AnimatePresence>
        {dialogOpen && (
          <TaskDialog
            task={editing}
            onClose={() => setDialogOpen(false)}
            onSave={saveTask}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Metric({
  title,
  value,
  note,
  tint,
  symbol,
  trend,
}: {
  title: string;
  value: string;
  note: string;
  tint: string;
  symbol: string;
  trend: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-label">
        {title}
        <span className={tint}>{symbol}</span>
      </div>
      <b className="metric-value">{value}</b>
      <div className="metric-note">
        {note}
        <strong className={trend === "Steady" ? "steady" : ""}>
          {trend === "Steady" ? trend : `↗ ${trend}`}
        </strong>
      </div>
    </article>
  );
}
function Priority({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`priority priority-${priority.toLowerCase()}`}>
      <i />
      {priority}
    </span>
  );
}
function TaskTable({
  tasks,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Project</th>
            <th>Priority</th>
            <th>Due date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <button className="table-title" onClick={() => onEdit(task)}>
                  <i />
                  {task.title}
                </button>
                <small>{task.category}</small>
              </td>
              <td>
                <span className="table-project">
                  <i
                    style={{
                      background: projects.find(
                        (project) => project.id === task.projectId,
                      )?.color,
                    }}
                  />
                  {
                    projects.find((project) => project.id === task.projectId)
                      ?.name
                  }
                </span>
              </td>
              <td>
                <Priority priority={task.priority} />
              </td>
              <td>{prettyDate(task.dueDate)}</td>
              <td>
                <button
                  className="delete-row"
                  aria-label={`Delete ${task.title}`}
                  onClick={() => onDelete(task.id)}
                >
                  <X size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function TaskCard({
  task,
  project,
  onEdit,
  onDelete,
  onMove,
  onDragStart,
}: {
  task: Task;
  project?: Project;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
  onDragStart: (id: string) => void;
}) {
  return (
    <motion.article
      layout
      className="task-card"
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={() => onDragStart("")}
    >
      <div className="card-meta">
        <span>
          <i style={{ background: project?.color }} />
          {project?.name}
        </span>
        <button
          onClick={() => onDelete(task.id)}
          aria-label={`Delete ${task.title}`}
        >
          <X size={14} />
        </button>
      </div>
      <button className="card-title" onClick={() => onEdit(task)}>
        {task.title}
      </button>
      <p>{task.category}</p>
      {task.progress > 0 && task.status !== "done" && (
        <div className="task-progress">
          <span>
            <i style={{ width: `${task.progress}%` }} />
          </span>
          <small>{task.progress}%</small>
        </div>
      )}
      <div className="card-labels">
        {task.labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="card-footer">
        <span className="due-date">
          <i />
          {prettyDate(task.dueDate)}
        </span>
        <div>
          <Priority priority={task.priority} />
          <span className="assignee">
            {task.assignee === "You"
              ? "JD"
              : task.assignee.slice(0, 2).toUpperCase()}
          </span>
        </div>
      </div>
      <label className="move-task">
        <span className="sr-only">Move {task.title} to</span>
        <select
          value={task.status}
          onChange={(event) =>
            onMove(task.id, event.target.value as TaskStatus)
          }
          aria-label={`Move ${task.title} to status`}
        >
          {columns.map((column) => (
            <option value={column.id} key={column.id}>
              {column.label}
            </option>
          ))}
        </select>
        <ChevronDown size={13} />
      </label>
    </motion.article>
  );
}
function TaskDialog({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <motion.div
      className="dialog-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="task-dialog"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
      >
        <div className="dialog-heading">
          <div>
            <span>TASK DETAILS</span>
            <h2 id="dialog-title">{task ? "Edit task" : "Create a task"}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={17} />
          </button>
        </div>
        <form onSubmit={onSave}>
          <label className="field-label">
            Task name
            <input
              name="title"
              required
              maxLength={100}
              defaultValue={task?.title ?? ""}
              placeholder="What needs to get done?"
              autoFocus
            />
          </label>
          <div className="form-two">
            <label className="field-label">
              Project
              <select
                name="projectId"
                defaultValue={task?.projectId ?? projects[0].id}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Status
              <select name="status" defaultValue={task?.status ?? "todo"}>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-two">
            <label className="field-label">
              Priority
              <select name="priority" defaultValue={task?.priority ?? "Medium"}>
                {priorities.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Due date
              <input
                name="dueDate"
                type="date"
                required
                defaultValue={task?.dueDate ?? "2026-11-14"}
              />
            </label>
          </div>
          <div className="form-two">
            <label className="field-label">
              Category
              <input
                name="category"
                defaultValue={task?.category ?? ""}
                placeholder="Design, Engineering..."
              />
            </label>
            <label className="field-label">
              Labels
              <input
                name="labels"
                defaultValue={task?.labels.join(", ") ?? ""}
                placeholder="Comma separated"
              />
            </label>
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <Check size={15} />
              {task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </motion.section>
    </motion.div>
  );
}
