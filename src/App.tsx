/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BookOpen, BarChart3, Clock, AlertCircle, Sparkles, Trophy, CheckCircle, Award, ListTodo, HelpCircle, GraduationCap, ArrowRight, UserCheck, Play, RefreshCw, XCircle } from "lucide-react";
import { ADIBand, ADIQuestion, ADIStats } from "./types";
import { StudyNotes } from "./components/StudyNotes";
import { QuizInterface } from "./components/QuizInterface";
import { ReviewInterface } from "./components/ReviewInterface";
import { Dashboard } from "./components/Dashboard";

const DEFAULT_STATS: ADIStats = {
  totalAttempted: 0,
  totalCorrect: 0,
  history: [],
  incorrectQuestionIds: [],
  questionStats: {}
};

export default function App() {
  // Navigation tabs
  const [activeView, setActiveView] = useState<string>("home");
  const [stats, setStats] = useState<ADIStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  // Active quiz config
  const [quizMode, setQuizMode] = useState<"quick" | "exam" | "weak" | "gde" | "instructional" | "topic">("quick");
  const [selectedBand, setSelectedBand] = useState<ADIBand | undefined>(undefined);
  const [gdeFilter, setGdeFilter] = useState<string | undefined>(undefined);
  const [instFilter, setInstFilter] = useState<string | undefined>(undefined);

  // GDE matrix menu options
  const gdeLevels = [
    { key: "Level 1", name: "Level 1: Vehicle Control", desc: "Covers mechanical skills, physical gears, steering coordination, and dashboard indicators." },
    { key: "Level 2", name: "Level 2: Traffic Situations", desc: "Handles junction structures, roundabouts, overtaking, lanes, and dynamic roadside hurdles." },
    { key: "Level 3", name: "Level 3: Goals and Context of Driving", desc: "Explores trip reasons, highway route structures, driving tired, night driving, or under cargo." },
    { key: "Level 4", name: "Level 4: Goals for Life and Skills for Living", desc: "Analyzes social pressure, risk seeking, lifestyle variables, and trainee psychology." }
  ];

  // Coaching topics options
  const instructionalTopics = [
    { key: "Coaching", name: "Coaching Techniques", desc: "Active questioning, the GROW model, and facilitation skills used in modern driving tuition." },
    { key: "client-centred", name: "Client-Centred Learning (CCL)", desc: "Empowering pupils, shared ownership of goals, and learning styles adaptation." },
    { key: "Risk management", name: "Risk Management", desc: "Balancing dual responsibility, dual-controls intervention criteria, and examiner safety goals." },
    { key: "National Standards", name: "National Standard for Driver Training", desc: "Evaluating skills against official DVSA competence guidelines and standard metrics." },
    { key: "Reflective practice", name: "Reflective Practice & Lesson Planning", desc: "Encouraging self-evaluations, lesson summaries, logbook journaling, and self-reviews." }
  ];

  // Load stats from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("adi_part1_stats");
      if (saved) {
        setStats(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to restore previous study logs from storage:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save stats helper
  const saveStats = (updatedStats: ADIStats) => {
    setStats(updatedStats);
    try {
      localStorage.setItem("adi_part1_stats", JSON.stringify(updatedStats));
    } catch (e) {
      console.error("Failed to persist study logs to storage:", e);
    }
  };

  const handleClearStats = () => {
    saveStats(DEFAULT_STATS);
    alert("Stats database successfully reset. Start clean and build your progress!");
  };

  // Remove a question from incorrect list when successfully cleared
  const handleClearQuestionError = (qId: string) => {
    const nextIncorrects = stats.incorrectQuestionIds.filter((id) => id !== qId);
    saveStats({
      ...stats,
      incorrectQuestionIds: nextIncorrects
    });
  };

  // Process completed quiz
  const handleQuizComplete = (result: {
    mode: string;
    questions: ADIQuestion[];
    selectedAnswers: Record<string, "A" | "B" | "C" | "D">;
    durationSeconds: number;
    score: number;
    passed: boolean;
    bandScores: Record<ADIBand, number>;
  }) => {
    const nextAttempts = stats.totalAttempted + result.questions.length;
    
    // Calculate total correct
    let quizCorrect = 0;
    const nextQuestionStats = { ...stats.questionStats };
    const nextIncorrectIds = new Set<string>(stats.incorrectQuestionIds);

    result.questions.forEach((q) => {
      const selected = result.selectedAnswers[q.id];
      const isCorrect = selected === q.correct_answer;

      if (isCorrect) {
        quizCorrect++;
        nextIncorrectIds.delete(q.id); // clear from wrong errors if correct!
      } else {
        nextIncorrectIds.add(q.id); // otherwise queue as incorrect
      }

      // Track individual question performance
      const currQStat = nextQuestionStats[q.id] || { attempts: 0, correct: 0 };
      nextQuestionStats[q.id] = {
        attempts: currQStat.attempts + 1,
        correct: currQStat.correct + (isCorrect ? 1 : 0)
      };
    });

    const nextCorrect = stats.totalCorrect + quizCorrect;

    // Append history entry if full Mock Test
    const nextHistory = [...stats.history];
    if (result.mode === "exam") {
      nextHistory.unshift({
        id: `mock-${Date.now()}`,
        date: new Date().toISOString(),
        score: result.score,
        passed: result.passed,
        bandScores: {
          [ADIBand.Band1]: result.bandScores[ADIBand.Band1] || 0,
          [ADIBand.Band2]: result.bandScores[ADIBand.Band2] || 0,
          [ADIBand.Band3]: result.bandScores[ADIBand.Band3] || 0,
          [ADIBand.Band4]: result.bandScores[ADIBand.Band4] || 0
        },
        durationSeconds: result.durationSeconds
      });
    }

    saveStats({
      totalAttempted: nextAttempts,
      totalCorrect: nextCorrect,
      history: nextHistory,
      incorrectQuestionIds: Array.from(nextIncorrectIds),
      questionStats: nextQuestionStats
    });

    // Alert user and redirect back to Dashboard
    if (result.mode === "exam") {
      alert(result.passed 
        ? `CONGRATULATIONS! You PASSED the ADI Part 1 Mock Test with ${result.score}/100!` 
        : `Test Complete. Score: ${result.score}/100. Let's study weak areas and retry!`
      );
    } else {
      alert(`Practice Quiz Complete! Correct Answers: ${quizCorrect} out of ${result.questions.length}. Stats updated.`);
    }

    setActiveView("dashboard");
  };

  // Derived dashboard details
  const overallSuccessRate = stats.totalAttempted > 0 ? Math.round((stats.totalCorrect / stats.totalAttempted) * 100) : 0;
  const mockTestCount = stats.history.length;
  const passedMockCount = stats.history.filter((h) => h.passed).length;

  const handleStartPractice = (modeType: "quick" | "exam" | "weak" | "gde" | "instructional" | "topic", band?: ADIBand, gde?: string, inst?: string) => {
    setQuizMode(modeType);
    setSelectedBand(band);
    setGdeFilter(gde);
    setInstFilter(inst);
    setActiveView("quiz-active");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900" id="adi-app-root">
      
      {/* GLOBAL BANNER HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs" id="app-global-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView("home")}>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold italic tracking-tighter">
                ADI
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-0.5">
                  ADI Coach
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">
                  Part 1 Theory Test Preparation
                </p>
              </div>
            </div>

            {/* Top Right Info Badges */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex gap-3">
                <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-tight">
                  App Status: Legally Compliant
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-150 italic whitespace-nowrap">
                  Original DVSA Syllabus
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                {stats.totalAttempted > 0 ? "SU" : "JD"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SCROLLABLE TAB HEADER (Shows on mobile only) */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 flex md:hidden gap-1.5 overflow-x-auto justify-start border-t border-slate-50">
        {[
          { id: "home", label: "Study Area" },
          { id: "study", label: "Handbook Notes" },
          { id: "review", label: `Errors Review (${stats.incorrectQuestionIds.length})` },
          { id: "dashboard", label: "Analytics" }
        ].map((link) => {
          const isActive = activeView === link.id || (link.id === "home" && activeView === "quiz-active");
          return (
            <button
              key={link.id}
              onClick={() => {
                if (activeView === "quiz-active") {
                  if (!confirm("Are you sure you want to stop your current quiz? Progress will be lost.")) return;
                }
                setActiveView(link.id);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 whitespace-nowrap ${
                isActive ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-200"
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto">
        {/* DESKTOP INTEGRATED SIDEBAR */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col justify-between shrink-0" id="desktop-sidebar">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Main Menu</p>
              <div className="space-y-1">
                {[
                  { id: "home", label: "Dashboard / Study Area", icon: "📚" },
                  { id: "study", label: "Handbook Notes", icon: "📝" },
                  { id: "review", label: `Study Errors (${stats.incorrectQuestionIds.length})`, icon: "❌" },
                  { id: "dashboard", label: "Detailed Analytics", icon: "📊" }
                ].map((item) => {
                  const isActive = activeView === item.id || (item.id === "home" && activeView === "quiz-active");
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (activeView === "quiz-active") {
                          if (!confirm("Are you sure you want to stop your current quiz? Progress will be lost.")) return;
                        }
                        setActiveView(item.id);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg font-medium text-xs flex items-center gap-3 transition cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Syllabus Focus</p>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveView("home");
                    setTimeout(() => {
                      document.getElementById("gde-selection-panel")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="w-full text-left p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-md text-xs font-normal flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  GDE Matrix Mode
                </button>
                <button
                  onClick={() => {
                    setActiveView("home");
                    setTimeout(() => {
                      document.getElementById("instructional-selection-panel")?.scrollIntoView({ behavior: "smooth" });
                    }, 100);
                  }}
                  className="w-full text-left p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-md text-xs font-normal flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Instructional Tech
                </button>
                <button
                  onClick={() => {
                    setActiveView("review");
                  }}
                  className="w-full text-left p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-md text-xs font-normal flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Weak Areas Review
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-500 uppercase tracking-wide">Syllabus Align</p>
            <p className="leading-normal">Ready for exam standards check with fully modeled scenarios.</p>
          </div>
        </aside>

        {/* content area frame */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8" id="main-content-scroller">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center" id="stat-loading">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900">Loading Practice Statistics...</h3>
          </div>
        ) : (
          /* SECTION ROUTER CONTROLLER */
          <div className="space-y-6">
            
            {/* VIEW 1: HOME AREA (Quiz modules selection) */}
            {activeView === "home" && (
              <div className="space-y-8" id="home-view">
                
                {/* Professional Hero Banner */}
                <div className="bg-white rounded-2xl p-6 md:p-8 text-slate-900 border border-slate-200 shadow-xs hover:shadow transition flex flex-col md:flex-row items-center justify-between gap-6" id="app-hero-banner">
                  <div className="space-y-2.5 max-w-xl">
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">
                      DVSA Style Original Question Simulator
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                      Master your Approved Driving Instructor (ADI) Part 1 Exam
                    </h2>
                    <p className="text-xs text-slate-505 leading-relaxed font-normal">
                      Empowering ADI trainees with original DVSA structure mock tests. Spanning Road Procedures, Traffic Signs, Driving Law, and detailed Instructional coaching scenarios. Complete our modules to gauge your readiness score!
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center">
                    <button
                      onClick={() => handleStartPractice("exam")}
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition flex items-center gap-2 group cursor-pointer"
                      id="hero-exam-btn"
                    >
                      Take 100-Question Mock Test
                      <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition" />
                    </button>
                  </div>
                </div>

                {/* STUDY MODULES SECTION */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">Adaptive Study Frameworks</h3>
                    <p className="text-xs text-slate-500">Pick a module tailored specifically to your active study goals.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Mode 1: Quick Practice */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-350 shadow-xs transition flex flex-col justify-between" id="module-quick-practice">
                      <div className="space-y-2.5">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100">
                          10
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Quick Practice</h4>
                        <p className="text-[11px] text-slate-550 leading-relaxed">
                          Answer 10 random DVSA-style questions covering all bands with instant feedback on each choice. Perfect for slotting practice into busy schedules.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartPractice("quick")}
                        className="mt-5 w-full py-2.5 text-xs text-center font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                      >
                        Launch Practice Quiz
                      </button>
                    </div>

                    {/* Mode 2: Full Mock Exam */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-350 shadow-xs transition flex flex-col justify-between" id="module-exam-mode">
                      <div className="space-y-2.5">
                        <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-slate-200">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Exam Simulator Mode</h4>
                        <p className="text-[11px] text-slate-550 leading-relaxed">
                          Challenge yourself under strict conditions: 100 questions (25 per band) in 90 minutes. Requires 85% overall and 20% in each individual syllabus quadrant.
                        </p>
                      </div>
                      <button
                        onClick={() => handleStartPractice("exam")}
                        className="mt-5 w-full py-2.5 text-xs text-center font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                      >
                        Simulate Mock Test
                      </button>
                    </div>

                    {/* Mode 3: Weak Areas Practice */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-350 shadow-xs transition flex flex-col justify-between" id="module-weak-areas">
                      <div className="space-y-2.5">
                        <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center border border-rose-100">
                          <XCircle className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">Weak Areas Mode</h4>
                        <p className="text-[11px] text-slate-550 leading-relaxed">
                          Generate dynamic practice questions exclusively from questions you answered incorrectly in the past to quickly fix gaps.
                        </p>
                      </div>
                      <button
                        disabled={stats.incorrectQuestionIds.length === 0}
                        onClick={() => handleStartPractice("weak")}
                        className="mt-5 w-full py-2.5 text-xs text-center font-bold text-rose-750 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Target Weak Areas ({stats.incorrectQuestionIds.length})
                      </button>
                    </div>

                  </div>
                </div>

                {/* ADVANCED SELECTIONS: GDE MATRIX & COACHING TECHNIQUES */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                  
                  {/* Category Practice: GDE Matrix Mode */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4" id="gde-selection-panel">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">GDE Matrix Practice Mode</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Select a GDE Matrix tier to isolate questions addressing specific driver cognitive aspects.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {gdeLevels.map((gde) => (
                        <button
                          key={gde.key}
                          onClick={() => handleStartPractice("gde", undefined, gde.key)}
                          className="w-full text-left p-3.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-100 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-blue-900 transition">{gde.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 max-w-md">{gde.desc}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0 ml-3" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Practice: Instructional Techniques Mode */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-xs space-y-4" id="instructional-selection-panel">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Instructional Techniques Practice Mode</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        DVSA Standard Check metrics require high proficiency in client-centred coaching and lesson risks. Study these now.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {instructionalTopics.map((topic) => (
                        <button
                          key={topic.key}
                          onClick={() => handleStartPractice("instructional", undefined, undefined, topic.key)}
                          className="w-full text-left p-3.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-100 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-blue-900 transition">{topic.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 max-w-sm">{topic.desc}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition shrink-0 ml-3" />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                {/* BAND SPECIFIC TOPICS Practice selectors */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4" id="band-selection-panel">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Syllabus-Specific Practice</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Focus your practice strictly on one of the four official ADI Part 1 test bands.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.values(ADIBand).map((bandName, index) => (
                      <button
                        key={bandName}
                        onClick={() => handleStartPractice("topic", bandName)}
                        className="p-4 bg-slate-50 hover:bg-blue-50/40 border border-slate-205 rounded-xl text-left transition relative cursor-pointer group"
                      >
                        <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Band {index + 1}</span>
                        <h4 className="text-xs font-bold text-slate-950 mt-1 pb-1">{bandName.replace(/^Band \d+ – /, "")}</h4>
                        <div className="flex items-center gap-1 mt-4 text-[11px] text-slate-500 font-medium group-hover:text-blue-700 transition">
                          Practice Band
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 2: ACTIVE QUIZ WORKFLOW */}
            {activeView === "quiz-active" && (
              <QuizInterface
                mode={quizMode}
                initialBand={selectedBand}
                gdeLevelFilter={gdeFilter}
                instructionalFilter={instFilter}
                weakQuestionIds={stats.incorrectQuestionIds}
                onBackToHome={() => setActiveView("home")}
                onQuizComplete={handleQuizComplete}
              />
            )}

            {/* VIEW 3: STUDY HANDBOOK NOTES */}
            {activeView === "study" && (
              <StudyNotes />
            )}

            {/* VIEW 4: INCORRECT QUESTIONS LIST REVIEW */}
            {activeView === "review" && (
              <ReviewInterface
                stats={stats}
                onClearQuestionError={handleClearQuestionError}
                onSelectPracticeMode={() => handleStartPractice("quick")}
                onBackToHome={() => setActiveView("home")}
              />
            )}

            {/* VIEW 5: DASHBOARD ANALYTICS DETAILS */}
            {activeView === "dashboard" && (
              <Dashboard
                stats={stats}
                onClearStats={handleClearStats}
                onSelectTab={setActiveView}
              />
            )}

          </div>
        )}
      </main>
      </div>

      {/* REASSURING SYSTEM STATEMENT FOOTER */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12" id="app-global-footer">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-slate-400">
          <p className="text-[11px] font-medium leading-none">
            ADI Part 1 Practice App • DVSA Syllabus Compliant Learning Platform
          </p>
          <p className="text-[10px] leading-relaxed max-w-md mx-auto font-normal">
            All question pools are procedurally modeled and generated originally under guidance rules. No copyrighted materials or official commercial question banks are reproduced in this applet.
          </p>
        </div>
      </footer>
    </div>
  );
}
