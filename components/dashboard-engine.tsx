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
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  Code,
  Link,
  Check,
  Trash2,
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

interface AITaskDraft {
  title?: string;
  project?: string;
  priority?: string;
  dueDate?: string;
  notes?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const parseInlineMarkdown = (value: string) =>
  escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );

const renderMarkdownPreview = (markdown: string) => {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const closeList = () => {
    if (!inList) return;
    html.push("</ul>");
    inList = false;
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCodeBlock = false;
      } else {
        closeList();
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${parseInlineMarkdown(line.slice(2))}</h1>`);
      return;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${parseInlineMarkdown(line.slice(3))}</h2>`);
      return;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${parseInlineMarkdown(line.slice(2))}</li>`);
      return;
    }

    closeList();
    if (line.trim() === "") {
      html.push("<br />");
    } else {
      html.push(`<p>${parseInlineMarkdown(line)}</p>`);
    }
  });

  closeList();
  if (inCodeBlock) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }

  return html.join("");
};

const parseAITaskDraft = (value: string): AITaskDraft => {
  const withoutFence = value
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const jsonMatch = withoutFence.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not include a task JSON object.");
  }

  try {
    return JSON.parse(jsonMatch[0]) as AITaskDraft;
  } catch {
    const repairedJson = jsonMatch[0]
      .replace(/([{,]\s*)([A-Za-z_][\w-]*)(\s*:)/g, '$1"$2"$3')
      .replace(/'([^']*)'/g, '"$1"');

    try {
      return JSON.parse(repairedJson) as AITaskDraft;
    } catch {
      const readField = (field: string) => {
        const fieldMatch = jsonMatch[0].match(
          new RegExp(
            `${field}\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^,}\\n]+))`,
            "i",
          ),
        );

        return (
          fieldMatch?.[1] ||
          fieldMatch?.[2] ||
          fieldMatch?.[3]?.trim().replace(/^"|"$/g, "") ||
          ""
        );
      };

      return {
        title: readField("title"),
        project: readField("project"),
        priority: readField("priority"),
        dueDate: readField("dueDate"),
        notes: readField("notes"),
      };
    }
  }
};

const parseAIError = (value: string) => {
  try {
    const parsed = JSON.parse(value) as { error?: string };
    return parsed.error || "";
  } catch {
    return "";
  }
};

const normalizePriority = (priority?: string): Task["priority"] => {
  if (priority === "Urgent" || priority === "High" || priority === "Low") {
    return priority;
  }

  return "Medium";
};

export default function Dashboard() {
  // --- CORE ENGINE STATES ---
  const [currentView, setCurrentView] = useState<string>("Inbox"); // Tracks view context or active project selection
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | "Urgent" | "High" | "Medium"
  >("All");

  const [projects, setProjects] = useState<Project[]>([
    {
      id: "p1",
      name: "Backend",
      color: "bg-emerald-500 shadow-emerald-500/50",
    },
    { id: "p2", name: "Design", color: "bg-indigo-500 shadow-indigo-500/50" },
    {
      id: "p3",
      name: "Documentation",
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
      title: "Draft project setup notes",
      project: "Documentation",
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
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // UI Flow toggles
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAiModelOpen, setIsAiModelOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");
  const selectedTaskIdRef = useRef(selectedTaskId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync active task tracking reference when item hooks shift
  useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId;
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

    // Fallback assignment to ensure priority tracks precisely against currently chosen priority filter
    const determinedPriority =
      priorityFilter === "All" ? "Medium" : priorityFilter;

    // Assign project metadata intelligently based on current navigation location context
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
    const pickedColor = colors[projects.length % colors.length];

    const newProject: Project = {
      id: `p-${Date.now()}`,
      name: pName.trim(),
      color: pickedColor,
    };

    setProjects([...projects, newProject]);
    setCurrentView(newProject.name);
  };

  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stops system row item context highlights from triggering
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
    const activeId = selectedTaskIdRef.current;
    if (!activeId) return;

    setTasks((currentTasks) =>
      currentTasks.map((t) => (t.id === activeId ? { ...t, notes: val } : t)),
    );
  };

  const sendMessageToAI = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setAiError("Write a task description first.");
      return;
    }

    setIsAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/use-ai", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: trimmedMessage,
      });

      const rawResponse = await response.text();
      if (!response.ok) {
        throw new Error(
          parseAIError(rawResponse) ||
            "AI request failed. Check your API key and server log.",
        );
      }

      const draft = parseAITaskDraft(rawResponse);
      if (!draft.title?.trim()) {
        throw new Error(
          "AI did not return a task title. Try a more specific description.",
        );
      }

      const fallbackProject = projects.find((p) => p.name === currentView)
        ? currentView
        : "Inbox";

      const newTask: Task = {
        id: Date.now().toString(),
        title: draft.title.trim(),
        project: draft.project?.trim() || fallbackProject,
        priority: normalizePriority(draft.priority),
        dueDate: draft.dueDate?.trim() || "Today",
        completed: false,
        notes: draft.notes?.trim() || "",
      };

      setTasks((currentTasks) => [newTask, ...currentTasks]);
      setSelectedTaskId(newTask.id);
      setNewTaskTitle("");
      setAiPrompt("");
      setIsAiModelOpen(false);
    } catch (error) {
      setAiError(
        error instanceof Error
          ? error.message
          : "Something went wrong while formatting the task.",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- MARKDOWN FORMATTING WRAPPER ---
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
        replacement = `# ${selectedText || "Heading 1"}`;
        break;
      case "h2":
        replacement = `## ${selectedText || "Heading 2"}`;
        break;
      case "bullet":
        replacement = `- ${selectedText || "List item"}`;
        break;
      case "code":
        replacement = selectedText
          ? `\`\`\`\n${selectedText}\n\`\`\``
          : "```\ncode content\n```";
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

  // --- STATS LOGIC COMPUTATION ---
  const filteredTasks = tasks.filter((t) => {
    // 1. Search filter criteria
    if (
      searchQuery.trim() !== "" &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    // 2. Navigation View contextual sorting rules
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

    // 3. Priority matrix filter switch
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
    <div className="flex w-full h-screen bg-[#0f172a] text-[#f8fafc] font-sans overflow-hidden antialiased selection:bg-indigo-500/30">
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
            onClick={() => {
              alert(
                "TaskFlow Settings Configuration Engine v1.0.0 (Next.js/Supabase Instance Active)",
              );
            }}
            className="w-full flex items-center gap-2.5 text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 transition-all mb-2"
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
              type="button"
              onClick={() => {
                setAiError("");
                setAiPrompt(newTaskTitle);
                setIsAiModelOpen(true);
              }}
              className="absolute right-10 top-2.5 px-1 py-0.5 rounded-lg text-xs border border-slate-600 hover:bg-slate-800 transition-colors"
            >
              AI
            </button>
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
          C. RIGHT PANEL (Task Notes Toolbar)
          ======================================================== */}
      <aside className="w-[360px] bg-[#090d16] border-l border-slate-800/60 flex flex-col h-full flex-shrink-0">
        <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Task
              Notes
            </span>
            <span className="text-[9px] font-mono text-slate-500 truncate max-w-[150px]">
              {activeTask
                ? `Active ID: ${activeTask.id}`
                : "No active task selected"}
            </span>
          </div>

          {activeTask && (
            <div className="mb-3 border border-slate-800/70 bg-[#111927]/60 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-200 leading-snug">
                {activeTask.title}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                <span>{activeTask.project}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>{activeTask.priority}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <span>{activeTask.dueDate}</span>
                
              </div>
              </div>
              
            </div>
          )}

          <div className="flex items-center gap-1 p-1 bg-[#121926] rounded-lg border border-slate-800 mb-2">
            <button
              disabled={!activeTask}
              onClick={() => insertMarkdownSyntax("bold")}
              title="Bold"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!activeTask}
              onClick={() => insertMarkdownSyntax("italic")}
              title="Italic"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-1" />
            <button
              disabled={!activeTask}
              onClick={() => insertMarkdownSyntax("h1")}
              title="Heading 1"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!activeTask}
              onClick={() => insertMarkdownSyntax("h2")}
              title="Heading 2"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-3 bg-slate-800 mx-1" />
            <button
              disabled={!activeTask}
              onClick={() => insertMarkdownSyntax("bullet")}
              title="Bullet List"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!activeTask}
              onClick={() => insertMarkdownSyntax("code")}
              title="Code block"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!activeTask}
              onClick={() => insertMarkdownSyntax("link")}
              title="Insert Link"
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Link className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-[1.15] min-h-0 rounded-lg border border-slate-800/70 bg-[#0b121f] p-3 overflow-y-auto custom-scrollbar">
            {activeTask ? (
              <textarea
                ref={textareaRef}
                value={activeTask.notes}
                onChange={(e) => updateActiveTaskNotes(e.target.value)}
                placeholder="# Write raw Markdown here..."
                className="h-full min-h-[220px] w-full resize-none bg-transparent font-mono text-xs leading-relaxed text-slate-300 outline-none placeholder-slate-600"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-center text-xs text-slate-600">
                Select a task to start writing notes.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-[0.85] min-h-0 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Preview
              </span>
              <span className="text-[9px] text-slate-600">
                Live task document
              </span>
            </div>
            <div
              className="flex-1 overflow-y-auto rounded-lg border border-slate-800/70 bg-[#111927]/45 p-3 text-xs leading-relaxed text-slate-300 custom-scrollbar [&_a]:text-indigo-300 [&_a]:underline [&_code]:text-cyan-300 [&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-100 [&_p]:mb-2 [&_pre]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-slate-950 [&_pre]:p-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{
                __html: activeTask?.notes
                  ? renderMarkdownPreview(activeTask.notes)
                  : '<p class="text-slate-600">Nothing written yet.</p>',
              }}
            />
          </div>
        </div>
      </aside>
      <div>
        {isAiModelOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0f172a] p-6 rounded-lg shadow-lg w-[400px] max-w-full">
              <h2 className="text-lg font-bold text-white mb-4">AI Model</h2>
              <p className="text-sm text-slate-300 mb-4">
                Format the quick-add text into a project task.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isAiLoading}
                placeholder="Describe the task you want AI to format..."
                className="min-h-28 w-full resize-none rounded-lg border border-slate-800 bg-[#0b121f] p-3 text-xs leading-relaxed text-slate-300 outline-none placeholder-slate-600 focus:border-indigo-500/70 disabled:cursor-not-allowed disabled:opacity-60"
              />
              {aiError && (
                <p className="mt-3 text-xs text-rose-400">{aiError}</p>
              )}
              <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                  onClick={() => setIsAiModelOpen(false)}
                  disabled={isAiLoading}
                  className="px-4 py-2 border border-slate-700 text-slate-300 rounded hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              <button
                    type="button"
                  onClick={() => {
                    sendMessageToAI(aiPrompt);
                  }}
                  disabled={isAiLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition disabled:opacity-50"
              >
                  {isAiLoading ? "Formatting..." : "Generate Task"}
              </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
