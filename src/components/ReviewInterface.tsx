/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AlertCircle, ArrowLeft, CheckCircle, RefreshCw, Star, Trophy, ChevronRight, XCircle } from "lucide-react";
import { ADIQuestion, ADIStats } from "../types";

interface ReviewInterfaceProps {
  stats: ADIStats;
  onClearQuestionError: (qId: string) => void;
  onSelectPracticeMode: () => void;
  onBackToHome: () => void;
}

export function ReviewInterface({
  stats,
  onClearQuestionError,
  onSelectPracticeMode,
  onBackToHome
}: ReviewInterfaceProps) {
  const [questions, setQuestions] = useState<ADIQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Active review session state
  const [activeReviewQuiz, setActiveReviewQuiz] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [evaluated, setEvaluated] = useState(false);
  const [customScore, setCustomScore] = useState(0);

  const errorIds = stats.incorrectQuestionIds || [];

  // Load incorrect questions during review sessions
  useEffect(() => {
    if (errorIds.length === 0) {
      setQuestions([]);
      return;
    }

    async function loadIncorrectQuestions() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "weak",
            count: errorIds.length,
            weakQuestionIds: errorIds
          })
        });

        if (!response.ok) {
          throw new Error("Unable to fetch incorrect questions from server.");
        }

        const data = await response.json();
        if (data.questions) {
          setQuestions(data.questions);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load review bank.");
      } finally {
        setLoading(false);
      }
    }

    loadIncorrectQuestions();
  }, [errorIds.length]);

  const handleSelectOption = (opt: "A" | "B" | "C" | "D") => {
    if (evaluated) return;
    setSelectedOption(opt);
  };

  const handleCheck = () => {
    if (!selectedOption || !questions[currentIndex]) return;
    setEvaluated(true);
    
    const currentQ = questions[currentIndex];
    if (selectedOption === currentQ.correct_answer) {
      setCustomScore((prev) => prev + 1);
      // Let's remove this question from parents incorrect list since they cleared it!
      onClearQuestionError(currentQ.id);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setEvaluated(false);
    } else {
      // Finished all review items!
      alert(`Review complete! You successfully corrected ${customScore} out of ${questions.length} weak areas.`);
      setActiveReviewQuiz(false);
      setCurrentIndex(0);
      setSelectedOption(null);
      setEvaluated(false);
      onBackToHome();
    }
  };

  if (errorIds.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center" id="empty-review">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-slate-900 text-lg">Immaculate Study Record!</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          You currently have zero recorded incorrect practice questions. Fantastic job! Take a new practice quiz or mock test to continue testing yourself.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={onSelectPracticeMode}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            Start Practice Quiz
          </button>
          <button
            onClick={onBackToHome}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition cursor-pointer"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center" id="review-loading">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 text-sm">Collating Weak Syllabus Areas...</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving questions you previously answered incorrectly.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6" id="review-module">
      
      {/* Top Banner overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <XCircle className="w-5.5 h-5.5 text-rose-500" />
            Incorrect Questions Review
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Re-test yourself on {errorIds.length} categories you previously missed to clear them from your study errors.
          </p>
        </div>
        {!activeReviewQuiz && (
          <button
            onClick={() => setActiveReviewQuiz(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer flex items-center gap-2"
          >
            Start Remedial Test ({errorIds.length} items)
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {activeReviewQuiz && currentQuestion ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs max-w-3xl mx-auto" id="review-quiz-interactive">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-100">
              Clear Weakness {currentIndex + 1} of {questions.length}
            </span>
            <span className="text-[11px] text-slate-400">
              Score: {customScore} Cleared
            </span>
          </div>

          <p className="text-[11px] text-blue-600 font-medium uppercase tracking-wider mb-2">
            {currentQuestion.band}
          </p>
          <h3 className="text-md font-semibold text-slate-900 leading-snug mb-6">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {(["A", "B", "C", "D"] as const).map((key) => {
              const text = currentQuestion.options[key];
              const isSelected = selectedOption === key;
              
              let optStyle = "border-slate-200 hover:bg-slate-50 text-slate-800";
              let badgeStyle = "bg-slate-100 text-slate-600";

              if (isSelected) {
                optStyle = "bg-blue-50/70 border-blue-500 text-blue-950";
                badgeStyle = "bg-blue-600 text-white";
              }

              if (evaluated) {
                const isCorrect = currentQuestion.correct_answer === key;
                if (isCorrect) {
                  optStyle = "bg-emerald-50 border-emerald-300 text-emerald-900";
                  badgeStyle = "bg-emerald-600 text-white";
                } else if (isSelected) {
                  optStyle = "bg-rose-50 border-rose-300 text-rose-900";
                  badgeStyle = "bg-rose-600 text-white";
                }
              }

              return (
                <button
                  key={key}
                  disabled={evaluated}
                  onClick={() => handleSelectOption(key)}
                  className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition cursor-pointer ${optStyle}`}
                >
                  <span className={`w-6.5 h-6.5 text-[11px] font-bold rounded-md flex items-center justify-center shrink-0 ${badgeStyle}`}>
                    {key}
                  </span>
                  <span className="text-xs leading-normal">{text}</span>
                </button>
              );
            })}
          </div>

          {evaluated && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-5 mt-6 border border-slate-800" id="review-explanation">
              <h4 className="text-xs font-bold text-blue-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Syllabus Topic: {currentQuestion.topic}
              </h4>
              <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-100 mt-6 pt-5">
            <button
              onClick={() => {
                setActiveReviewQuiz(false);
                setCurrentIndex(0);
                setSelectedOption(null);
                setEvaluated(false);
              }}
              className="px-4 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-500 font-medium cursor-pointer"
            >
              Exit Review
            </button>
            
            {!evaluated ? (
              <button
                disabled={!selectedOption}
                onClick={handleCheck}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer"
              >
                Match Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
              >
                {currentIndex === questions.length - 1 ? "Finish Session" : "Next Weak Area"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-150 p-6 md:p-8" id="review-overview-list-mode">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">
            Question Review Bank Listing ({errorIds.length} items to address)
          </h3>
          <div className="space-y-3.5 max-h-120 overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] bg-rose-50 text-rose-800 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-widest font-bold">
                    {q.band.replace(/^Band \d+ – /, "")}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-900 leading-snug pt-1">
                    {q.question}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Syllabus Object: <span className="font-medium">{q.topic}</span> • Difficulty: {q.difficulty}
                  </p>
                </div>
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => {
                      setCurrentIndex(idx);
                      setActiveReviewQuiz(true);
                      setSelectedOption(null);
                      setEvaluated(false);
                    }}
                    className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-105 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-blue-100"
                  >
                    Solve Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
