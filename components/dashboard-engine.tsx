"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Inbox,
  Sun,
  Calendar,
  Settings,
  Search,
  Plus,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Code,
  Link,
  Send,
  AtSign,
  Hash,
  Check,
  FolderClosed,
  Trash2,
  LogOut,
  X,
} from "lucide-react";

// --- TYPE DEFINITIONS ---
interface Project {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  project: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  dueDate: string;
  completed: boolean;
  notes: string;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function Dashboard() {
  // --- CORE ENGINE STATES ---
  const [currentView, setCurrentView] = useState<string>("Inbox");
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | "Urgent" | "High" | "Medium"
  >("All");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false); // Modal control state

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "p1",
      name: "Backend",
      color: "bg-emerald-500 shadow-emerald-500/50",
    },
    { id: "p2", name: "Design", color: "bg-indigo-500 shadow-indigo-500/50" },
    {
      id: "p3",
      name: "AI Integration",
      color: "bg-purple-500 shadow-purple-500/50",
    },
    { id: "p4", name: "DevOps", color: "bg-amber-500 shadow-amber-500/50" },
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Implement Supabase auth hooks",
      project: "Backend",
      priority: "Urgent",
      dueDate: "Today",
      completed: false,
      notes: "# Database Implementation\nNeed to look into triggers.",
    },
    {
      id: "2",
      title: "Design high-fidelity dashboard layouts",
      project: "Design",
      priority: "High",
      dueDate: "Today",
      completed: false,
      notes: "Using Inter font and slate shades.",
    },
    {
      id: "3",
      title: "Refactor state context for AI streaming",
      project: "AI Integration",
      priority: "Medium",
      dueDate: "Tomorrow",
      completed: false,
      notes: "Using React hooks.",
    },
    {
      id: "4",
      title: "Setup Vercel staging environments",
      project: "DevOps",
      priority: "Low",
      dueDate: "Jul 15",
      completed: true,
      notes: "Done with initial configurations.",
    },
  ]);

  const [selectedTaskId, setSelectedTaskId] = useState<string>("1");
  const [newTaskTitle, setNewTaskTitle] = useState<string>(" ");
  const [searchQuery, setSearchQuery] = useState<string>(" ");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // AI State Engines
  const [aiInput, setAiInput] = useState<string>(" ");
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "ai",
      text: "Hello! Select a task and I can help you break down subtasks, draft implementation plans, or format notes.",
      timestamp: new Date(),
    },
  ]);

  // UI Flow toggles
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync active task tracking reference when item hooks shift
  useEffect(() => {
    const target = tasks.find((t) => t.id === selectedTaskId);
    if (target) {
      setActiveTask(target);
    } else if (tasks.length > 0) {
      setActiveTask(tasks[0]);
      setSelectedTaskId(tasks[0].id);
    } else {
      setActiveTask(null);
    }
  }, [selectedTaskId, tasks]);

  // --- ACTIONS ENGINE ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const determinedPriority =
      priorityFilter === "All" ? "Medium" : priorityFilter;
    const currentProjectMatch = projects.find((p) => p.name === currentView);
    const assignedProjectName = currentProjectMatch
      ? currentProjectMatch.name
      : "Inbox";

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      project: assignedProjectName,
      priority: determinedPriority,
      dueDate: "Today",
      completed: false,
      notes: "",
    };

    setTasks([newTask, ...tasks]);
    setSelectedTaskId(newTask.id);
    setNewTaskTitle("");
  };

  const handleCreateNewProject = () => {
    const pName = prompt("Enter new project title name:");
    if (!pName || !pName.trim()) return;

    const colors = [
      "bg-pink-500 shadow-pink-500/50",
      "bg-cyan-500 shadow-cyan-500/50",
      "bg-rose-500 shadow-rose-500/50",
      "bg-teal-500 shadow-teal-500/50",
      "bg-violet-500 shadow-violet-500/50",
    ];
    const pickedColor = colors[Math.floor(Math.random() * colors.length)];

    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: pName.trim(),
      color: pickedColor,
    };

    setProjects([...projects, newProject]);
    setCurrentView(newProject.name);
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTasks = tasks.filter((t) => t.id !== id);
    setTasks(updatedTasks);
  };

  const toggleTaskCompletion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const updateActiveTaskNotes = (val: string) => {
    if (!selectedTaskId) return;
    setTasks(
      tasks.map((t) => (t.id === selectedTaskId ? { ...t, notes: val } : t)),
    );
  };

  const handleLogout = () => {
    // Redirects browser view directly to the application authentication route endpoint structure
    window.location.href = "/auth/login";
  };

  // --- RICH TEXT FORMATTING WRAPPER ---
  const insertMarkdownSyntax = (
    syntaxType: "bold" | "italic" | "h1" | "h2" | "bullet" | "code" | "link",
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || !activeTask) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = activeTask.notes;
    const selectedText = currentText.substring(startPos, endPos);

    let replacement = "";
    switch (syntaxType) {
      case "bold":
        replacement = `**${selectedText || "bold text"}**`;
        break;
      case "italic":
        replacement = `*${selectedText || "italicized text"}*`;
        break;
      case "h1":
        replacement = `\n# ${selectedText || "Heading 1"}\n`;
        break;
      case "h2":
        replacement = `\n## ${selectedText || "Heading 2"}\n`;
        break;
      case "bullet":
        replacement = `\n- ${selectedText || "List item"}`;
        break;
      case "code":
        replacement = `\`\`\`\n${selectedText || "code content"}\n\`\`\``;
        break;
      case "link":
        replacement = `[${selectedText || "Link Title"}](https://example.com)`;
        break;
    }

    const updatedNotes =
      currentText.substring(0, startPos) +
      replacement +
      currentText.substring(endPos);
    updateActiveTaskNotes(updatedNotes);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        startPos + replacement.length,
        startPos + replacement.length,
      );
    }, 50);
  };

  // --- SIMULATED AI RESPONSE CONTEXT HANDLING ---
  const handleSendAiMessage = () => {
    if (!aiInput.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: aiInput,
      timestamp: new Date(),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    const currentInput = aiInput;
    setAiInput("");
    setIsAiTyping(true);

    setTimeout(() => {
      let aiText = `I've analyzed task **"${activeTask?.title || "Selected Action"} "**. Here is a strategic micro-breakdown: \n\n1. Check internal configuration files.\n2. Review runtime parameters.`;
      if (currentInput.toLowerCase().includes("break down")) {
        aiText = `### Subtask Action Items for "${activeTask?.title}":\n- [ ] **Phase 1: Setup** — Inspect dependency rules.\n- [ ] **Phase 2: Code integration** — Build clean abstract wrappers.\n- [ ] **Phase 3: Verify** — Run automated validation sequences.`;
      } else if (currentInput.toLowerCase().includes("note")) {
        aiText = `### Technical Note Specification Draft:\n*Generated automatically for implementation metrics.*\n\n\`\`\`typescript\n// Runtime architectural footprint blueprint\nexport const initTaskAction = (): boolean => {\n  return true;\n};\n\`\`\``;
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: aiText,
          timestamp: new Date(),
        },
      ]);
      setIsAiTyping(false);
    }, 1100);
  };

  // --- STATS LOGIC COMPUTATION ---
  const filteredTasks = tasks.filter((t) => {
    if (
      searchQuery.trim() !== "" &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    if (currentView === "Today") {
      if (t.dueDate !== "Today") return false;
    } else if (currentView === "Upcoming") {
      if (t.dueDate === "Today") return false;
    } else if (
      currentView !== "Inbox" &&
      currentView !== "Today" &&
      currentView !== "Upcoming"
    ) {
      if (t.project !== currentView) return false;
    }

    if (priorityFilter === "All") return true;
    return t.priority === priorityFilter;
  });

  const inProgressTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  const totalTasksCount = tasks.length;
  const doneCount = tasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter(
    (t) => !t.completed && t.dueDate === "Today",
  ).length;
  const progressPercentage =
    totalTasksCount > 0 ? (doneCount / totalTasksCount) * 100 : 0;

  return (
    <div className="flex w-full h-screen bg-[#0f172a] text-[#f8fafc] font-sans overflow-hidden antialiased selection:bg-indigo-500/30 relative">
      {/* ========================================================
          D. MODAL DIALOG COMPONENT ENGINE (Settings / Logout Overlay)
          ======================================================== */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-[#0b121f] border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
            {/* Modal Header Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" /> Account
                Workspace Settings
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  IE
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    Intern Engine Profile
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Active Node Session ID
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Are you sure you want to log out of TaskFlow? You will need to
                re-authenticate using your Supabase account parameters to access
                your dashboard metrics.
              </p>
            </div>

            <div className="flex items-center gap-2.5 mt-5 pt-3 border-t border-slate-800/60">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 text-xs font-medium py-2 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/20"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          A. LEFT SIDEBAR (Navigation) [220px]
          ======================================================== */}
      <aside className="w-[220px] bg-[#090d16] border-r border-slate-800/60 flex flex-col justify-between p-4 flex-shrink-0">
        <div>
          {/* Logo Heading updated tracking moniker label */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <span className="text-white text-xs font-black">T</span>
            </div>
            <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>

          {/* Fully Interactive Search Input Container */}
          <div className="relative mb-5 px-1">
            <Search
              className={`absolute left-3 top-2.5 w-3.5 h-3.5 ${isSearching ? "text-indigo-400" : "text-slate-500"}`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setIsSearching(false)}
              placeholder="Search tasks..."
              className="w-full bg-[#1e293b]/40 border border-slate-800 focus:border-indigo-500/50 text-xs rounded-lg pl-8 pr-8 py-2 text-slate-200 outline-none placeholder-slate-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-[10px] text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Main Core View Navigation Lists */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setCurrentView("Inbox");
                setPriorityFilter("All");
              }}
              className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                currentView === "Inbox"
                  ? "bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>My Inbox</span>
              </div>
              <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 font-bold">
                {tasks.filter((t) => !t.completed).length}
              </span>
            </button>

            <button
              onClick={() => setCurrentView("Today")}
              className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                currentView === "Today"
                  ? "bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-500/80" />
                <span>Today</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {
                  tasks.filter((t) => !t.completed && t.dueDate === "Today")
                    .length
                }
              </span>
            </button>

            <button
              onClick={() => setCurrentView("Upcoming")}
              className={`w-full flex items-center justify-between text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                currentView === "Upcoming"
                  ? "bg-gradient-to-r from-indigo-500/10 to-transparent border-l-2 border-indigo-500 text-indigo-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Upcoming</span>
              </div>
            </button>
          </nav>

          {/* Interactive Project Matrix Header Row with Dynamic Appending */}
          <div className="mt-8">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Projects
              </p>
              <button
                onClick={handleCreateNewProject}
                title="Create a new project workspace container"
                className="p-0.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-800/80 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5 max-h-[180px] overflow-y-auto custom-scrollbar">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setCurrentView(p.name)}
                  className={`w-full flex items-center justify-between text-xs px-3 py-1.5 rounded-lg transition-all group ${
                    currentView === p.name
                      ? "bg-slate-800/60 text-indigo-400 font-medium"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.color}`} />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Profile Footing and Fully Actionable Settings Interface */}
        <div className="pt-4 border-t border-slate-800/60">
          <button
            onClick={() => setIsSettingsOpen(true)} // Toggles the overlay configuration modal open
            className={`w-full flex items-center gap-2.5 text-xs px-2 py-1.5 rounded-lg transition-all mb-2 ${
              isSettingsOpen
                ? "bg-slate-800/80 text-white font-medium"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </button>
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white uppercase ring-1 ring-indigo-400/30 shadow-md">
              IE
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-300 truncate">
                Intern Engine
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                Next.js Framework
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================
          B. CENTER PANEL (To-Do-Lists Engine Room)
          ======================================================== */}
      <main className="flex-1 bg-[#0b121f] flex flex-col justify-between overflow-hidden relative">
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Main Engine Room Context Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                To-Do-Lists
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Viewing context folder:{" "}
                <span className="text-indigo-400 font-mono font-medium">
                  {currentView}
                </span>
              </p>
            </div>

            {/* Filter Selection Chips - Dictates insertion tracking logic priorities */}
            <div className="flex flex-col gap-1 items-end">
              <div className="flex items-center gap-1.5 bg-[#131d31] p-1 rounded-lg border border-slate-800/80">
                {(["All", "Urgent", "High", "Medium"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPriorityFilter(f)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                      priorityFilter === f
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-slate-600 pr-1">
                New tasks created inherit active filter priority marker
              </span>
            </div>
          </div>

          {/* Quick-add Input Pipeline Task Generator Box */}
          <form onSubmit={handleAddTask} className="mb-6 relative group">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder={`Add task into '${currentView}' with [${priorityFilter === "All" ? "Medium" : priorityFilter}] priority...`}
              className="w-full bg-[#111927] border border-slate-800 hover:border-slate-700/80 focus:border-indigo-500/80 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all shadow-inner pr-12 focus:shadow-[0_0_15px_rgba(99,102,241,0.15)]"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-2 bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-lg text-white transition-all shadow"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Main Reactive Dynamic Tasks Matrix Container Blocks */}
          <div className="space-y-6">
            {/* IN PROGRESS BLOCKS ROWS */}
            <div>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  In Progress ({inProgressTasks.length})
                </h3>
              </div>
              {inProgressTasks.length === 0 ? (
                <div className="border border-dashed border-slate-800/40 rounded-xl p-6 text-center text-xs text-slate-600">
                  No pending workflow items tracked inside this scope.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {inProgressTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all group/row relative ${
                        selectedTaskId === task.id
                          ? "bg-gradient-to-r from-indigo-500/10 to-transparent border-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.06)]"
                          : "bg-[#111927]/60 border-slate-800/80 hover:bg-[#111927] hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-12">
                        <button
                          onClick={(e) => toggleTaskCompletion(task.id, e)}
                          className="w-4 h-4 rounded border border-slate-600 hover:border-indigo-400 flex items-center justify-center flex-shrink-0 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-sm bg-transparent" />
                        </button>
                        <div className="truncate pr-2">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {task.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500">
                            {task.project}
                          </span>
                        </div>
                      </div>

                      {/* Controls and Tags segment wrapper */}
                      <div className="flex items-center gap-2 flex-shrink-0 group-hover/row:opacity-0 transition-opacity duration-150">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full border font-medium ${
                            task.priority === "Urgent"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : task.priority === "High"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                            task.dueDate === "Today"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "text-slate-500"
                          }`}
                        >
                          {task.dueDate}
                        </span>
                      </div>

                      {/* Hidden Delete Button Reveal Trigger Anchor on Hover State */}
                      <button
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="absolute right-3 top-4 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover/row:opacity-100 transition-all duration-150 z-10"
                        title="Permanently remove task"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPLETED WORKFLOW RECORDS ACCENTS */}
            <div>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Completed ({completedTasks.length})
                </h3>
              </div>
              {completedTasks.length === 0 ? (
                <div className="text-[11px] text-slate-600 pl-2 italic">
                  No compiled operations completed here yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer group/row relative transition-all ${
                        selectedTaskId === task.id
                          ? "bg-[#111927] border-emerald-500/60"
                          : "bg-[#111927]/40 border-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-12 opacity-60">
                        <button
                          onClick={(e) => toggleTaskCompletion(task.id, e)}
                          className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center flex-shrink-0"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                        </button>
                        <p className="text-xs font-medium text-slate-400 line-through truncate">
                          {task.title}
                        </p>
                      </div>

                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-500 font-medium flex-shrink-0 group-hover/row:opacity-0 transition-opacity">
                        Done
                      </span>

                      {/* Hidden Delete Button Reveal Trigger for Completed items on Hover State */}
                      <button
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="absolute right-3 top-2.5 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover/row:opacity-100 transition-all duration-150 z-10"
                        title="Permanently remove task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live System Synchronization Footer Stats panel elements */}
        <div className="bg-[#090e18] border-t border-slate-800/60 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex gap-4">
              <span>
                Total Indexed:{" "}
                <strong className="text-slate-200">{totalTasksCount}</strong>
              </span>
              <span>
                Done Today:{" "}
                <strong className="text-emerald-400">{doneCount}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span>
                Overdue Engine:{" "}
                <strong className="text-amber-500">{overdueCount}</strong>
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </main>

      {/* ========================================================
          C. RIGHT PANEL (The AI Assistant & Fully Functional Note Toolbar)
          ======================================================== */}
      <aside className="w-[360px] bg-[#090d16] border-l border-slate-800/60 flex flex-col h-full flex-shrink-0">
        {/* Top Half: Context Document / Active Document Rich Text Editor */}
        <div className="flex-1 flex flex-col min-h-[45%] border-b border-slate-800/60 p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Task
              Canvas Notes
            </span>
            <span className="text-[9px] font-mono text-slate-500 truncate max-w-[150px]">
              {activeTask
                ? `Active ID: ${activeTask.id}`
                : "No active task selected"}
            </span>
          </div>

          {/* Interactive Markdown Syntax Formatting Bar */}
          <div className="flex items-center gap-1 p-1 bg-[#121926] rounded-lg border border-slate-800 mb-2">
            <button
              onClick={() => insertMarkdownSyntax("bold")}
              title="Bold"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("italic")}
              title="Italic"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-1" />
            <button
              onClick={() => insertMarkdownSyntax("h1")}
              title="Heading 1"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("h2")}
              title="Heading 2"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-1" />
            <button
              onClick={() => insertMarkdownSyntax("bullet")}
              title="Bullet List"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("code")}
              title="Code block"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertMarkdownSyntax("link")}
              title="Insert Link"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all ml-auto"
            >
              <Link className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Area Note Engine with Reference Binding hooks */}
          <textarea
            ref={textareaRef}
            value={activeTask ? activeTask.notes : ""}
            disabled={!activeTask}
            onChange={(e) => updateActiveTaskNotes(e.target.value)}
            placeholder={
              activeTask
                ? "# Use tools above or write notes here...\nHighlight text and press a button above to format it instantly with Markdown tags."
                : "Select or create a task map row to activate writing canvas space."
            }
            className="w-full flex-1 bg-transparent border-0 resize-none outline-none text-xs text-slate-300 font-mono leading-relaxed placeholder-slate-600 focus:ring-0 p-1 disabled:cursor-not-allowed"
          />
        </div>

        {/* Bottom Half: Embedded Core AI Assistant Interface */}
        <div className="flex-1 flex flex-col min-h-[50%] bg-[#0b101b] overflow-hidden justify-between">
          <div className="px-4 py-3 bg-[#080d17] border-b border-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">
                Context AI Co-Pilot
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          </div>

          {/* Messages Feed History Streams */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar text-xs">
            {aiMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-2.5 rounded-xl max-w-[90%] leading-relaxed border ${
                    msg.sender === "user"
                      ? "bg-indigo-600/10 text-indigo-200 border-indigo-500/20 rounded-br-none"
                      : "bg-[#121926] text-slate-300 border-slate-800/80 rounded-bl-none"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex items-center gap-1.5 bg-[#121926] border border-slate-800/80 w-16 p-2 rounded-xl rounded-bl-none">
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            )}
          </div>

          {/* Quick Prefill Actions Chips */}
          <div className="px-3 pb-2 pt-1 flex gap-1.5 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <button
              onClick={() => setAiInput("Break down this task context details")}
              className="text-[10px] bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full border border-slate-800 transition-all flex-shrink-0"
            >
              ⚡ Break down task
            </button>
            <button
              onClick={() =>
                setAiInput("Draft technical notes implementation skeleton")
              }
              className="text-[10px] bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full border border-slate-800 transition-all flex-shrink-0"
            >
              📝 Draft technical notes
            </button>
          </div>

          {/* Interactive Input Prompt Entry Pipeline Box */}
          <div className="p-3 bg-[#080d17] border-t border-slate-800/60">
            <div className="relative flex flex-col bg-[#111927] border border-slate-800 focus-within:border-indigo-500/80 rounded-xl transition-all">
              <textarea
                rows={2}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAiMessage();
                  }
                }}
                placeholder="Ask AI to break down this task or draft notes..."
                className="w-full bg-transparent border-0 resize-none outline-none text-xs text-slate-200 placeholder-slate-600 p-2.5 pr-10 focus:ring-0"
              />

              <div className="flex items-center justify-between border-t border-slate-800/60 px-2.5 py-1.5">
                <div className="flex items-center gap-2 text-slate-500">
                  <button
                    onClick={() => setAiInput((p) => p + " @")}
                    title="Mention relative parameters"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAiInput((p) => p + " #")}
                    title="Tag context label references"
                    className="hover:text-indigo-400 transition-colors"
                  >
                    <Hash className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAiInput((p) => p + " /")}
                    title="Prompt actions list modifiers"
                    className="hover:text-indigo-400 font-mono text-[11px] leading-none px-0.5 transition-colors"
                  >
                    /
                  </button>
                </div>

                <button
                  onClick={handleSendAiMessage}
                  disabled={!aiInput.trim()}
                  className={`p-1.5 rounded-lg transition-all ${
                    aiInput.trim()
                      ? "bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
