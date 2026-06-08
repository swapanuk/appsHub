/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ADIBand {
  Band1 = "Band 1 – Road Procedure",
  Band2 = "Band 2 – Traffic Signs and Signals",
  Band3 = "Band 3 – Driving Test, Disabilities, Law and Documents",
  Band4 = "Band 4 – Instructional Techniques"
}

export type ADIDifficulty = "Easy" | "Medium" | "Hard";

export interface ADIQuestion {
  id: string; // generated ID for tracking
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: "A" | "B" | "C" | "D";
  explanation: string;
  topic: string;
  difficulty: ADIDifficulty;
  band: ADIBand;
}

export interface QuizSession {
  id: string;
  mode: "quick" | "exam" | "weak" | "gde" | "instructional" | "topic";
  questions: ADIQuestion[];
  currentQuestionIndex: number;
  selectedAnswers: Record<string, "A" | "B" | "C" | "D">; // Question ID -> Selected Option
  startTime: number;
  endTime?: number;
  isCompleted: boolean;
}

export interface MockTestHistoryItem {
  id: string;
  date: string;
  score: number; // overall count correct (out of 100)
  passed: boolean;
  bandScores: {
    [ADIBand.Band1]: number; // out of 25
    [ADIBand.Band2]: number; // out of 25
    [ADIBand.Band3]: number; // out of 25
    [ADIBand.Band4]: number; // out of 25
  };
  durationSeconds: number;
}

export interface ADIStats {
  totalAttempted: number;
  totalCorrect: number;
  history: MockTestHistoryItem[];
  incorrectQuestionIds: string[]; // for weak area mode and retries
  // Key value storage for question correctness tracking: questionId -> { attempts: number, correct: number }
  questionStats: Record<string, { attempts: number; correct: number }>;
}

export interface StudyNoteSection {
  title: string;
  band: ADIBand;
  iconName: string;
  content: {
    subtitle: string;
    bullets: string[];
  }[];
}
