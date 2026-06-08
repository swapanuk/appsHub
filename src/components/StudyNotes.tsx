/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, AlertCircle, FileText, HelpCircle, ArrowRight, ShieldCheck, Minimize2 } from "lucide-react";
import { ADIBand } from "../types";

export function StudyNotes() {
  const [activeTab, setActiveTab] = useState<ADIBand>(ADIBand.Band1);

  const notesData: Record<ADIBand, { title: string; subtitle: string; summary: string; points: string[] }[]> = {
    [ADIBand.Band1]: [
      {
        title: "Highway Code & Safety Margins",
        subtitle: "Primary safety gaps and distances",
        summary: "The official spacing required to avoid rear-end collisions and maintain complete control.",
        points: [
          "The Two-Second Rule: Represents the minimum gap for dry, clear asphalt. Always measure using a stationary roadside landmark.",
          "Wet Asphalt: Double the gap (at least 4 seconds) due to dramatically reduced tyre grip.",
          "Icy Conditions: Multiply by ten (up to 20 seconds) as deceleration takes up to 10 times longer on packed ice.",
          "Tailgating represents a principal cause of freeway pile-ups and is classed as driving without due care and attention."
        ]
      },
      {
        title: "Motorway Procedures & Lane Discipline",
        subtitle: "Regulations for highway overtaking",
        summary: "Important motorway behaviors required when coaching advanced pupils.",
        points: [
          "Rule 268 (Overtaking on the left): Overtaking on the left is strictly prohibited except during slow-moving congested lanes, when the lane to your left is moving more rapidly than the lane to your right.",
          "Hard Shoulder: Never pull into or stop on the hard shoulder except in emergency breakdowns or directed by light signals.",
          "Smart Motorways: A red 'X' displayed above a lane indicates the lane is closed; driving in it is highly dangerous and legally prohibited.",
          "Active Traffic Management: Speed limits in red rings inside smart gantries are legally mandatory."
        ]
      },
      {
        title: "Junctions & Roundabout Priorities",
        subtitle: "Intersections and vulnerable road users",
        summary: "How to safely navigate junctions and protect pedestrians or cyclists.",
        points: [
          "Unmarked Crossroads: No one has automatic priority. Drivers must yield first and communicate safely before crossing.",
          "Roundabout positioning: Cyclists, horse riders, and horse-drawn vehicles are permitted to stay in the outside (left) lane of a roundabout even when traveling all the way around.",
          "Pedestrian Crossings: Pedestrians already crossing at junctions have complete priority. Always prepare pupils to yield safely."
        ]
      }
    ],
    [ADIBand.Band2]: [
      {
        title: "Sign Shapes and Meanings",
        subtitle: "How to quickly decode road signs",
        summary: "Regulatory versus informational road sign characteristics.",
        points: [
          "Red Rings: Inform you of things you must NOT do (prohibitions, e.g., No Entry, Speed Limits).",
          "Blue Circles: Issue positive or mandatory instructions (e.g., Turn Left Ahead, Minimum Speed, Cycle Lane).",
          "Triangles: Alert you to immediate hazards or warnings (e.g., Double Bend, Steep Hill, Road Narrows).",
          "Rectangles: Supply directions or information (e.g., blue for motorways, green for primary routes, white for local routes)."
        ]
      },
      {
        title: "Road Markings & Clearances",
        subtitle: "Legal implications of white/yellow lines",
        summary: "Standard highway paint rules.",
        points: [
          "Double Yellow Lines: Parking is strictly prohibited at all times (unless loading exemptions apply or a disabled blue badge is active).",
          "Double Continuous White Lines: You must not cross or straddle them unless turning into an off-road premises, or overtaking a horse, cycle, or road work vehicle traveling under 10 mph.",
          "Zig-zag lines (Yellow/White): Absolute prohibition of parking or stopping at school entrances or pedestrian crosswalk regions."
        ]
      }
    ],
    [ADIBand.Band3]: [
      {
        title: "Driver Licences & Supervision Laws",
        subtitle: "Mandatory conditions for learner practice",
        summary: "Crucial regulatory frameworks governing trainee and full driving instructors.",
        points: [
          "Supervision criteria: To legally supervise a learner privately, you must be at least 21 years old and have held a full Category B UK driving licence for at least 3 years.",
          "ADI Registration: To remain active on the register, an ADI is required to renew their registration every 4 years and pass a 'fit and proper person' background check.",
          "Standard Category B Licence: Entitles the driver to tow trailers of up to 3,500 kg Maximum Authorised Mass (MAM).",
          "Insurance: Any private vehicle used for learner practice must carry a policy that explicitly covers third-party learner tuition."
        ]
      },
      {
        title: "Disability Awareness & Adaptations",
        subtitle: "Adapting tuition for physical needs",
        summary: "How to approach teaching pupils with physical or sensory limitations.",
        points: [
          "Candidate Vehicles: Pupils with severe motor disabilities are legally permitted to take tests using their own modified vehicle (hand controls, adapted pedals, steering knobs).",
          "Examiner role: Practical examiners evaluate how safely and confidently the candidate commands the vehicle using active adaptations.",
          "Learning adaptations must fit comfortably within a client-centered feedback plan, ensuring dignity and encouraging maximum spatial independence."
        ]
      }
    ],
    [ADIBand.Band4]: [
      {
        title: "The GDE Matrix (Goals for Driver Education)",
        subtitle: "Framework for driver psychology and coaching",
        summary: "The 4-level structure used globally for analyzing and safe-guarding driver attitudes.",
        points: [
          "Level 1: Vehicle Control - Physical manipulation (turning the wheel, using mechanical gears, braking).",
          "Level 2: Traffic Situations - Navigating environments, obeying regulatory rules, turning at busy junctions.",
          "Level 3: Goals and Context of Driving - The trip purpose (e.g., night driving, driving under fatigue, route planning).",
          "Level 4: Goals for Life and Skills for Living - Cognitive styles, values, and lifestyle factors (risk-seeking, peer pressure)."
        ]
      },
      {
        title: "Client-Centred Learning (CCL)",
        subtitle: "Coordinating a responsive tuition partnership",
        summary: "Core practices for modern, coaching-focused driving lessons.",
        points: [
          "Shared Lesson Plans: Refuse to dictate what occurs. Collaborate with the pupil to agree on concrete, realistic learning goals.",
          "Effective Feedback: Move from telling your pupil what to do, towards asking open-ended questions (e.g. 'How did that approach to the roundabout feel?').",
          "Active Risk Management: Share safety dual-responsibilities. Make sure who has the mechanical controls is always understood (instructor intervention vs pupil autonomy)."
        ]
      },
      {
        title: "Reflective Practice & Lesson Evaluation",
        subtitle: "Refining the lesson outcomes",
        summary: "How instructors continuously improve safe driving behaviors.",
        points: [
          "The Reflective Cycle: Encourages the student to self-gauge progress and summarize what worked and what didn't.",
          "Standards Check Prep: The DVSA evaluates lessons based on: Lesson Planning, Risk Management, and Teaching/Learning Strategies.",
          "Encourage ownership: Effective coaching guides pupils to take personal self-assessments, building lifelong safe driving habits."
        ]
      }
    ]
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 shadow-sm" id="adi-handbook-container">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            ADI Part 1 Syllabus & Study Notes
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review DVSA learning objectives to solidify your theory understanding.
          </p>
        </div>
        <div className="flex overflow-x-auto gap-1 p-1 bg-slate-100 rounded-lg max-w-full">
          {Object.values(ADIBand).map((band, idx) => (
            <button
              key={band}
              onClick={() => setActiveTab(band)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                activeTab === band
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              id={`tab-btn-${idx}`}
            >
              Band {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
        {/* Topic highlights for the selected Band */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-2">
            <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-600" />
              Syllabus Guidelines: {activeTab}
            </h3>
            <p className="text-xs text-blue-750 mt-1 leading-relaxed">
              Trainees must maintain high-degree competency here. The theory exam demands a minimum of 85% overall combined with at least 80% (20 out of 25) in each individual band.
            </p>
          </div>

          <div className="space-y-6">
            {notesData[activeTab]?.map((note, index) => (
              <div key={index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs" id={`note-card-${index}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{note.title}</h4>
                    <p className="text-xs text-blue-600 mt-0.5 font-medium">{note.subtitle}</p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                    Syllabus Key
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-lg flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{note.summary}</span>
                </p>
                <ul className="mt-4 space-y-2.5 pl-1">
                  {note.points.map((point, pIdx) => (
                    <li key={pIdx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quick helper sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-xl text-white shadow-sm">
            <h4 className="text-xs font-semibold text-blue-350 uppercase tracking-widest">
              Pass Standards
            </h4>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-200">
                  <span>Overall Minimum</span>
                  <span className="font-semibold text-white">85 / 100</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mt-1.5">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-200">
                  <span>Band Cut-off</span>
                  <span className="font-semibold text-white">20 / 25 (80%)</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full mt-1.5">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "80%" }} />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 mt-4 leading-relaxed">
              If you score 92% overall but get 19 in any single band (e.g. Traffic Signs), you will fail the test. Practice evenly across all categories!
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2.5">
              Core GDE Matrix Levels
            </h4>
            <div className="space-y-2">
              {[
                { level: "4", name: "Life Goals & Context", desc: "Values, social pressure, lifestyle" },
                { level: "3", name: "Journey Context", desc: "Fatigue, night driving, route choice" },
                { level: "2", name: "Traffic Situations", desc: "Junction procedures, dynamic hazards" },
                { level: "1", name: "Vehicle Control", desc: "Gears, clutch, steering proficiency" }
              ].map((g, gi) => (
                <div key={gi} className="p-2.5 bg-slate-55 hover:bg-blue-50/40 rounded transition-colors border border-slate-150 flex gap-2">
                  <div className="w-5 h-5 bg-blue-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                    {g.level}
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-slate-800 leading-tight">{g.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{g.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
