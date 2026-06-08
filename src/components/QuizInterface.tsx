/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Flag, HelpCircle, RefreshCw, Timer, ChevronRight, Bookmark } from "lucide-react";
import { ADIBand, ADIQuestion, ADIDifficulty, QuizSession } from "../types";

interface QuizInterfaceProps {
  mode: "quick" | "exam" | "weak" | "gde" | "instructional" | "topic";
  initialBand?: ADIBand;
  gdeLevelFilter?: string;
  instructionalFilter?: string;
  weakQuestionIds: string[];
  onBackToHome: () => void;
  onQuizComplete: (result: {
    mode: string;
    questions: ADIQuestion[];
    selectedAnswers: Record<string, "A" | "B" | "C" | "D">;
    durationSeconds: number;
    score: number;
    passed: boolean;
    bandScores: Record<ADIBand, number>;
  }) => void;
}

export function QuizInterface({
  mode,
  initialBand,
  gdeLevelFilter,
  instructionalFilter,
  weakQuestionIds,
  onBackToHome,
  onQuizComplete
}: QuizInterfaceProps) {
  const [questions, setQuestions] = useState<ADIQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz active state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  
  // Instant feedback tracking (for Quick Practice / Topic practice only)
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(mode === "exam" ? 5400 : 600); // 90 mins for Exam, 10 mins for Quick
  const [startTime] = useState(Date.now());
  const [timerRunning, setTimerRunning] = useState(true);
  const [source, setSource] = useState<string>("local");

  // Fetch questions from Express backend on mount
  useEffect(() => {
    let active = true;
    async function loadQuizQuestions() {
      try {
        setLoading(true);
        setError(null);
        
        let count = 10;
        if (mode === "exam") count = 100;

        const response = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            count,
            band: initialBand,
            gdeLevel: gdeLevelFilter,
            instructionalTopic: instructionalFilter,
            weakQuestionIds: weakQuestionIds
          })
        });

        if (!response.ok) {
          throw new Error("Unable to retrieve driving theory questions.");
        }

        const data = await response.json();
        if (active) {
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            setSource(data.source || "local");
          } else {
            throw new Error("No qualifying questions found in database.");
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "An issue occurred while loading questions.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadQuizQuestions();
    return () => {
      active = false;
    };
  }, [mode, initialBand, gdeLevelFilter, instructionalFilter, weakQuestionIds]);

  // Handle countdown timer
  useEffect(() => {
    if (!timerRunning || loading || questions.length === 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, loading, questions]);

  const currentQuestion = questions[currentIndex];

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optKey: "A" | "B" | "C" | "D") => {
    if (!currentQuestion) return;
    
    // In Instant Feedback Mode, block re-selecting once an option has been checked
    if (mode !== "exam" && showExplanation) return;

    setSelectedOptions((prev) => ({
      ...prev,
      [currentQuestion.id]: optKey
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(false);
    }
  };

  const handleToggleFlag = () => {
    if (!currentQuestion) return;
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const checkAnswer = () => {
    if (!selectedOptions[currentQuestion?.id]) return;
    setShowExplanation(true);
  };

  const calculateResults = () => {
    let score = 0;
    const bandScores: Record<ADIBand, number> = {
      [ADIBand.Band1]: 0,
      [ADIBand.Band2]: 0,
      [ADIBand.Band3]: 0,
      [ADIBand.Band4]: 0
    };

    questions.forEach((q) => {
      const selected = selectedOptions[q.id];
      if (selected === q.correct_answer) {
        score++;
        bandScores[q.band] = (bandScores[q.band] || 0) + 1;
      }
    });

    // Pass rules: Exam Mode is 100 questions.
    // Must achieve: Min 85 correct overall AND min 20 / 25 in each individual band!
    let passed = false;
    if (mode === "exam") {
      const b1Pass = bandScores[ADIBand.Band1] >= 20;
      const b2Pass = bandScores[ADIBand.Band2] >= 20;
      const b3Pass = bandScores[ADIBand.Band3] >= 20;
      const b4Pass = bandScores[ADIBand.Band4] >= 20;
      passed = score >= 85 && b1Pass && b2Pass && b3Pass && b4Pass;
    } else {
      // Non-exam modes are simple success rate check (>80%)
      passed = (score / questions.length) >= 0.8;
    }

    return { score, passed, bandScores };
  };

  const handleSubmitQuiz = () => {
    setTimerRunning(false);
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    const { score, passed, bandScores } = calculateResults();

    onQuizComplete({
      mode,
      questions,
      selectedAnswers: selectedOptions,
      durationSeconds,
      score,
      passed,
      bandScores
    });
  };

  // UI state for loading
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center" id="quiz-loading">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
        <h3 className="font-semibold text-slate-900 text-lg">Assembling ADI Practice Questions...</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Generating original, DVSA-aligned test files covering your specific syllabus topics.
        </p>
      </div>
    );
  }

  // UI state for error
  if (error || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center" id="quiz-error">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-900 text-lg">Failed to Start Study Module</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error || "No questions could be yielded."}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onBackToHome} className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition cursor-pointer">
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const selectedAnswer = selectedOptions[currentQuestion.id];
  const answeredCount = Object.keys(selectedOptions).length;

  return (
    <div className="space-y-6" id="active-quiz-panel">
      {/* Quiz Dashboard Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
                onBackToHome();
              }
            }}
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
              {mode === "exam" ? "ADI Mock Test Simulator" : "Coaching Practice"}
            </span>
            <h3 className="text-sm font-semibold capitalize tracking-tight" id="quiz-mode-title">
              {mode} Practice Mode
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {source === "gemini" && (
            <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded text-[11px] font-medium border border-emerald-400/20">
              Gemini AI Active
            </span>
          )}
          
          <div className="bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium text-slate-200">
            <Timer className="w-4.5 h-4.5 text-blue-300" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400">Total Progress</p>
            <p className="font-medium text-slate-200">
              {answeredCount} / {questions.length} Answered
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs" id="question-card">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  currentQuestion.difficulty === "Easy" ? "bg-emerald-100 text-emerald-800" :
                  currentQuestion.difficulty === "Medium" ? "bg-yellow-105 text-yellow-800" :
                  "bg-rose-100 text-rose-800"
                }`}>
                  {currentQuestion.difficulty}
                </span>
                <button
                  onClick={handleToggleFlag}
                  className={`p-1.5 rounded-lg border transition duration-150 cursor-pointer ${
                    flaggedQuestions[currentQuestion.id]
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "text-slate-400 hover:text-slate-600 border-slate-200"
                  }`}
                  title="Flag for review"
                  id="flag-question-btn"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>

            <p className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mb-2">
              {currentQuestion.band}
            </p>
            <h2 className="text-lg font-semibold text-slate-900 leading-snug mb-6" id="question-text">
              {currentQuestion.question}
            </h2>

            {/* Answer Options Grid */}
            <div className="space-y-3" id="options-grid">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const isSelected = selectedAnswer === key;
                const optText = currentQuestion.options[key];
                
                // Styling depends on mode and checked state
                let optionStyle = "border-slate-200 hover:bg-slate-50 text-slate-800 hover:border-slate-300";
                let badgeStyle = "bg-slate-100 text-slate-700";

                if (isSelected) {
                  optionStyle = "bg-blue-50/70 border-blue-500 text-blue-950";
                  badgeStyle = "bg-blue-600 text-white";
                }

                if (mode !== "exam" && showExplanation) {
                  const isCorrect = currentQuestion.correct_answer === key;
                  if (isCorrect) {
                    optionStyle = "bg-emerald-50 border-emerald-300 text-emerald-950";
                    badgeStyle = "bg-emerald-600 text-white";
                  } else if (isSelected) {
                    optionStyle = "bg-rose-50 border-rose-300 text-rose-950";
                    badgeStyle = "bg-rose-600 text-white";
                  }
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full text-left p-4.5 rounded-xl border flex items-center gap-3 transition-all duration-150 cursor-pointer group ${optionStyle}`}
                    id={`opt-btn-${key}`}
                  >
                    <span className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center transition ${badgeStyle}`}>
                      {key}
                    </span>
                    <span className="text-xs leading-relaxed font-normal">{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Micro Buttons Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 mt-6 pt-5">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-4 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Check Answer button (Only for non-exam mode and if not checked yet) */}
              {mode !== "exam" && !showExplanation && (
                <button
                  onClick={checkAnswer}
                  disabled={!selectedAnswer}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Answer
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="px-4 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          {/* Explanation Overlay: Instantly visible in practice mode */}
          {mode !== "exam" && showExplanation && (
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-sm leading-relaxed" id="explanation-box">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1.5 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                Expert ADI Explanation (Topic: {currentQuestion.topic})
              </h4>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Question Navigation Grid (Simulates actual driving test) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-1">Question Index Grid</h4>
            <p className="text-[11px] text-slate-500">
              Review flagged items or jump to any question easily.
            </p>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 lg:grid-cols-5 gap-1.5 overflow-y-auto max-h-76 p-1 bg-slate-50 rounded-xl" id="question-nums-grid">
            {questions.map((q, idx) => {
              const isAnswered = !!selectedOptions[q.id];
              const isFlagged = !!flaggedQuestions[q.id];
              const isCurrent = idx === currentIndex;

              // Compute color bands
              let blockStyle = "bg-white hover:bg-slate-100 border-slate-200 text-slate-600";
              if (isAnswered) blockStyle = "bg-blue-50 text-blue-100/60 border-blue-200 text-blue-800 font-medium";
              if (isFlagged) blockStyle = "bg-amber-105 bg-amber-50 border-amber-300 text-amber-800 font-medium";
              if (isCurrent) blockStyle = "ring-2 ring-blue-600 border-blue-600 font-bold bg-blue-50/50 text-blue-950";

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowExplanation(false);
                  }}
                  className={`h-8 rounded-lg text-xs border text-center transition flex items-center justify-center relative cursor-pointer ${blockStyle}`}
                  id={`jump-btn-${idx}`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Total Unanswered</span>
              <span className="font-bold text-slate-800">
                {questions.length - answeredCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Flagged Questions</span>
              <span className="font-bold text-slate-800">
                {Object.values(flaggedQuestions).filter(Boolean).length}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={handleSubmitQuiz}
              disabled={answeredCount === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              id="submit-quiz-btn"
            >
              Submit and Finish Test
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
