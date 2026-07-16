import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  Home,
  Users,
  LayoutGrid,
  Plus,
  Calendar,
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  Trash2,
  Play,
  Pause,
  PlusCircle,
  MinusCircle,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/study-goals")({
  head: () => ({
    meta: [
      { title: "Study Goals — The Flow" },
      { name: "description", content: "Set, track, and complete your learning goals." },
    ],
  }),
  component: StudyGoalsPage,
});

interface Goal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  status: "active" | "completed" | "paused";
  category: "time" | "sessions" | "books" | "days" | "exams" | "custom";
}

const initialGoals: Goal[] = [
  { id: "1", title: "Study Time", description: "Study for 10 hours this week", current: 7.5, target: 10, unit: "hours", status: "active", category: "time" },
  { id: "2", title: "Focus Sessions", description: "Complete 15 focus sessions", current: 10, target: 15, unit: "sessions", status: "active", category: "sessions" },
  { id: "3", title: "Consistency", description: "Study 5 days in a row", current: 3, target: 5, unit: "days", status: "active", category: "days" },
  { id: "4", title: "Read 2 Books", description: "Read 2 books this month", current: 2, target: 2, unit: "books", status: "completed", category: "books" },
  { id: "5", title: "No Phone Study", description: "Study 20 hours without phone", current: 8, target: 20, unit: "hours", status: "paused", category: "time" },
  { id: "6", title: "Exam Prep", description: "Prepare for 3 exams", current: 1, target: 3, unit: "exams", status: "paused", category: "exams" },
];

function AiTutorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function StudyGoalsPage() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);

  // Local Storage hydration
  useEffect(() => {
    const saved = localStorage.getItem("flow_study_goals");
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch (e) {
        setGoals(initialGoals);
      }
    } else {
      setGoals(initialGoals);
      localStorage.setItem("flow_study_goals", JSON.stringify(initialGoals));
    }
  }, []);

  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem("flow_study_goals", JSON.stringify(newGoals));
  };

  // Stats calculation
  const activeCount = goals.filter((g) => g.status === "active").length;
  const completedCount = goals.filter((g) => g.status === "completed").length;
  const pausedCount = goals.filter((g) => g.status === "paused").length;

  // New Goal Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState(10);
  const [newUnit, setNewUnit] = useState("hours");
  const [newCategory, setNewCategory] = useState<Goal["category"]>("time");

  // Edit Goal Drawer state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Bottom Navigation
  const navItems = [
    { icon: <Home className="h-5 w-5" strokeWidth={1.5} />, label: "Home", to: "/home" },
    { icon: <svg className="h-5 w-5" strokeWidth={1.5} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>, label: "Library", to: "/library" },
    { icon: <AiTutorIcon className="h-5 w-5" />, label: "AI Tutor", to: "/chat" },
    { icon: <Users className="h-5 w-5" strokeWidth={1.5} />, label: "Collab", to: "/collab" },
    { icon: <LayoutGrid className="h-5 w-5" strokeWidth={1.5} />, label: "More", to: "/more", active: true },
  ];

  // Icon mapping
  const getGoalIcon = (goal: Goal) => {
    const isCompleted = goal.status === "completed";
    if (isCompleted) {
      return (
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
        </div>
      );
    }

    let iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (goal.status === "paused") {
      iconColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    } else if (goal.category === "sessions") {
      iconColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
    } else if (goal.category === "days") {
      iconColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
    } else if (goal.category === "exams") {
      iconColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    }

    const baseClass = `h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconColor}`;

    switch (goal.category) {
      case "time":
        return <div className={baseClass}><Clock className="h-5 w-5" strokeWidth={1.5} /></div>;
      case "sessions":
        return <div className={baseClass}><BookOpen className="h-5 w-5" strokeWidth={1.5} /></div>;
      case "days":
        return <div className={baseClass}><Calendar className="h-5 w-5" strokeWidth={1.5} /></div>;
      case "exams":
      case "custom":
      default:
        return <div className={baseClass}><Target className="h-5 w-5" strokeWidth={1.5} /></div>;
    }
  };

  // Color bar mapping
  const getGoalColorClass = (goal: Goal) => {
    if (goal.status === "completed") return "bg-emerald-500";
    if (goal.status === "paused") return "bg-amber-500";
    if (goal.category === "sessions") return "bg-blue-500";
    if (goal.category === "days") return "bg-purple-500";
    return "bg-emerald-500"; // default time
  };

  const getGoalTextColorClass = (goal: Goal) => {
    if (goal.status === "completed") return "text-emerald-400";
    if (goal.status === "paused") return "text-amber-500";
    if (goal.category === "sessions") return "text-blue-400";
    if (goal.category === "days") return "text-purple-400";
    return "text-emerald-400"; // default time
  };

  // Actions
  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc || `${newTitle} goal`,
      current: 0,
      target: Number(newTarget),
      unit: newUnit,
      status: "active",
      category: newCategory,
    };

    saveGoals([...goals, newGoal]);
    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewTarget(10);
    setNewUnit("hours");
    setNewCategory("time");
  };

  const handleUpdateProgress = (goalId: string, increment: boolean) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        let newCurrent = increment ? g.current + 1 : g.current - 1;
        if (newCurrent < 0) newCurrent = 0;
        
        let newStatus = g.status;
        if (newCurrent >= g.target) {
          newCurrent = g.target;
          newStatus = "completed";
        } else if (g.status === "completed" && newCurrent < g.target) {
          newStatus = "active";
        }

        return { ...g, current: newCurrent, status: newStatus };
      }
      return g;
    });
    saveGoals(updated);
    // Sync with selectedGoal if currently open
    const currentGoal = updated.find((g) => g.id === goalId);
    if (currentGoal) setSelectedGoal(currentGoal);
  };

  const handleToggleStatus = (goalId: string) => {
    const updated = goals.map((g) => {
      if (g.id === goalId) {
        if (g.status === "completed") return g; // Completed stays completed
        const nextStatus = g.status === "active" ? "paused" : "active";
        return { ...g, status: nextStatus };
      }
      return g;
    });
    saveGoals(updated);
    const currentGoal = updated.find((g) => g.id === goalId);
    if (currentGoal) setSelectedGoal(currentGoal);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = goals.filter((g) => g.id !== goalId);
    saveGoals(updated);
    setSelectedGoal(null);
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex overflow-hidden page-transition">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <header className="flex items-center px-6 pt-6 pb-4 flex-shrink-0 bg-black">
          <button
            onClick={() => navigate({ to: "/more" })}
            className="text-white/60 hover:text-white mr-4 transition-colors p-1"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={1.8} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Study Goals</h1>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-28 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          {/* Top Banner Card */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-5 flex items-center gap-5 mb-6">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" stroke="currentColor" fill="currentColor" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">Stay focused, hit your goals.</p>
              <p className="text-xs text-white/45 mt-1">Set goals and track your progress.</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 grid grid-cols-3 divide-x divide-white/[0.06] mb-8">
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-emerald-400">{activeCount}</span>
              <span className="text-[10px] text-white/40 font-medium">Active</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-emerald-400">{completedCount}</span>
              <span className="text-[10px] text-white/40 font-medium">Completed</span>
            </div>
            <div className="flex flex-col items-center gap-1 px-2">
              <span className="text-2xl font-bold text-indigo-400">{pausedCount}</span>
              <span className="text-[10px] text-white/40 font-medium">Paused</span>
            </div>
          </div>

          {/* Goals List Sections */}
          
          {/* Active Goals */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wider text-[11px]">Active Goals</p>
            <div className="space-y-3">
              {goals.filter(g => g.status === "active").length === 0 ? (
                <div className="text-xs text-white/30 text-center py-4 border border-dashed border-white/10 rounded-2xl">No active goals. Add one below!</div>
              ) : (
                goals.filter(g => g.status === "active").map((goal) => {
                  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className="w-full rounded-2xl bg-white/[0.04] border border-white/5 p-4 flex flex-col hover:bg-white/[0.06] transition-colors text-left"
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className="flex items-center gap-4">
                          {getGoalIcon(goal)}
                          <div>
                            <p className="text-sm font-semibold text-white leading-tight">{goal.title}</p>
                            <p className="text-xs text-white/40 mt-1">{goal.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className={`text-sm font-bold ${getGoalTextColorClass(goal)}`}>{goal.current}</span>
                            <span className="text-[10px] text-white/30"> / {goal.target} {goal.unit}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/20 ml-1" />
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getGoalColorClass(goal)} transition-all duration-300`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Completed Goals */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wider text-[11px]">Completed Goals</p>
            <div className="space-y-3">
              {goals.filter(g => g.status === "completed").length === 0 ? (
                <div className="text-xs text-white/30 text-center py-4 border border-dashed border-white/10 rounded-2xl">No completed goals yet. Keep going!</div>
              ) : (
                goals.filter(g => g.status === "completed").map((goal) => {
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className="w-full rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex flex-col hover:bg-white/[0.05] transition-colors text-left opacity-80"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          {getGoalIcon(goal)}
                          <div>
                            <p className="text-sm font-semibold text-white leading-tight line-through opacity-60">{goal.title}</p>
                            <p className="text-xs text-white/40 mt-1">{goal.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-400">{goal.current}</span>
                            <span className="text-[10px] text-white/30"> / {goal.target} {goal.unit}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/20 ml-1" />
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Paused Goals */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wider text-[11px]">Paused Goals</p>
            <div className="space-y-3">
              {goals.filter(g => g.status === "paused").length === 0 ? (
                <div className="text-xs text-white/30 text-center py-4 border border-dashed border-white/10 rounded-2xl">No paused goals.</div>
              ) : (
                goals.filter(g => g.status === "paused").map((goal) => {
                  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className="w-full rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 flex flex-col hover:bg-white/[0.04] transition-colors text-left opacity-70"
                    >
                      <div className="flex items-center justify-between w-full mb-3">
                        <div className="flex items-center gap-4">
                          {getGoalIcon(goal)}
                          <div>
                            <p className="text-sm font-semibold text-white leading-tight">{goal.title}</p>
                            <p className="text-xs text-white/40 mt-1">{goal.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-sm font-bold text-amber-500">{goal.current}</span>
                            <span className="text-[10px] text-white/30"> / {goal.target} {goal.unit}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-white/20 ml-1" />
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500/50 transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Create Goal Action */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full py-4 border border-white/10 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold mb-6"
          >
            <Plus className="h-5 w-5" />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* Pinned Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-white/[0.06] px-2 pb-6 pt-3 flex items-center justify-around z-40">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex flex-col items-center gap-1.5 px-3 ${
                item.active ? "text-white" : "text-white/35 hover:text-white/60"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.active && <div className="h-0.5 w-4 bg-white rounded-full -mt-0.5" />}
            </Link>
          ))}
        </div>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Create New Goal</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Goal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Coding, Biology Review"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Write code for 2 hours every day"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Target Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newTarget}
                      onChange={(e) => setNewTarget(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Unit</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. hours, sessions, books"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as Goal["category"];
                      setNewCategory(cat);
                      // Auto-fill unit
                      if (cat === "time") setNewUnit("hours");
                      else if (cat === "sessions") setNewUnit("sessions");
                      else if (cat === "days") setNewUnit("days");
                      else if (cat === "books") setNewUnit("books");
                      else if (cat === "exams") setNewUnit("exams");
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10 text-white focus:outline-none focus:border-emerald-500/50 text-sm"
                  >
                    <option value="time">Study Time (hours)</option>
                    <option value="sessions">Focus Sessions</option>
                    <option value="days">Consistency (days)</option>
                    <option value="books">Reading (books)</option>
                    <option value="exams">Exam Prep (exams)</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 border border-white/10 rounded-xl text-white/70 hover:bg-white/[0.04] active:scale-[0.98] transition-all text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all text-black rounded-xl text-sm font-bold"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Goal Edit Drawer */}
        {selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl animate-in slide-in-from-bottom duration-250 sm:zoom-in-95">
              <div className="flex justify-center mb-4 sm:hidden">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedGoal.title}</h3>
                  <p className="text-xs text-white/50 mt-1">{selectedGoal.description}</p>
                </div>
                <button onClick={() => setSelectedGoal(null)} className="text-white/40 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Tracker Slider & Controls */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Log Progress</span>
                  <span className="text-sm font-bold text-white">{selectedGoal.current} / {selectedGoal.target} {selectedGoal.unit}</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-5">
                  <div
                    className={`h-full rounded-full ${getGoalColorClass(selectedGoal)} transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.round((selectedGoal.current / selectedGoal.target) * 100))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, false)}
                    disabled={selectedGoal.current <= 0}
                    className="flex-1 py-2.5 border border-white/10 rounded-xl flex items-center justify-center gap-1.5 text-xs text-white/80 hover:bg-white/[0.04] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                  >
                    <MinusCircle className="h-4 w-4" />
                    <span>Decrease</span>
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(selectedGoal.id, true)}
                    disabled={selectedGoal.status === "completed"}
                    className="flex-1 py-2.5 bg-white text-black rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-white/90 disabled:opacity-30 disabled:hover:bg-white transition-all"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Increase</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {selectedGoal.status !== "completed" && (
                  <button
                    onClick={() => handleToggleStatus(selectedGoal.id)}
                    className="w-full py-3.5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-white/[0.04] transition-all"
                  >
                    {selectedGoal.status === "active" ? (
                      <>
                        <Pause className="h-4 w-4 text-amber-500" />
                        <span>Pause Goal</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 text-emerald-400" />
                        <span>Resume Goal</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this study goal?")) {
                      handleDeleteGoal(selectedGoal.id);
                    }
                  }}
                  className="w-full py-3.5 border border-red-500/20 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Goal</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
