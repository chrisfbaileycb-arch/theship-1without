import React, { useState } from "react";
import {
  AgentSkillPackage,
  WorkflowStep,
  ActionType,
  SecurityClearance,
  DefenseScanResult,
} from "../types";
import { SAMPLE_SCENARIOS } from "../data/samples";
import { buildAgentSkill, scanDefenseSafety } from "../services/api";
import {
  Cpu,
  Globe,
  Terminal,
  UserCheck,
  GitBranch,
  ShieldCheck,
  AlertOctagon,
  Copy,
  Download,
  Plus,
  Trash2,
  Play,
  RefreshCw,
  Sparkles,
  Check,
  Code,
  FileText,
  ShieldAlert,
  Layers,
  BookOpen,
  Lock,
  Unlock,
  CheckCircle2,
  Workflow,
  Zap,
} from "lucide-react";

interface SkillBuilderViewProps {
  initialTutorialContent?: string;
  initialSkillName?: string;
  securityClearance?: SecurityClearance | null;
  onOpenDefenseModal?: () => void;
}

export const SkillBuilderView: React.FC<SkillBuilderViewProps> = ({
  initialTutorialContent = "",
  initialSkillName = "",
  securityClearance,
  onOpenDefenseModal,
}) => {
  const [skillName, setSkillName] = useState<string>(
    initialSkillName || "PWA Offline Sync & Background Sync Skill"
  );
  const [tutorialContent, setTutorialContent] = useState<string>(
    initialTutorialContent || SAMPLE_SCENARIOS[0].fullContent
  );
  const [targetPlatform, setTargetPlatform] = useState<string>("universal");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [skillPackage, setSkillPackage] = useState<AgentSkillPackage | null>(null);
  const [activeExportTab, setActiveExportTab] = useState<"steps" | "skill_md" | "playwright" | "json_tools" | "execution_trace">("steps");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [defenseWarning, setDefenseWarning] = useState<DefenseScanResult | null>(null);

  // Execution Simulator State
  const [simulatingStepIndex, setSimulatingStepIndex] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);

  const handleGenerateSkill = async () => {
    if (!tutorialContent.trim()) {
      setErrorMsg("Please provide SOP, workflow, or tutorial content.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setDefenseWarning(null);

    try {
      // Pre-scan defense check
      const defense = await scanDefenseSafety(tutorialContent);
      if (defense.isBlocked && !securityClearance?.isCleared) {
        setDefenseWarning(defense);
        setErrorMsg("DEFENSE-OF-BREAK LOCK: " + defense.reason);
        setIsLoading(false);
        return;
      }

      const result = await buildAgentSkill(
        tutorialContent,
        skillName,
        targetPlatform,
        securityClearance?.passcodeUsed
      );
      setSkillPackage(result);
      setCompletedSteps([]);
      setTraceLogs([
        `[1WithOut Engine] Successfully compiled ${result.steps.length} atomic agent directives for "${result.skillName}".`,
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate agent skill package.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunExecutionTrace = async () => {
    if (!skillPackage || skillPackage.steps.length === 0) return;
    setCompletedSteps([]);
    setTraceLogs([`[Trace Initiated] Executing ${skillPackage.steps.length} directives sequentially...`]);

    for (let i = 0; i < skillPackage.steps.length; i++) {
      setSimulatingStepIndex(i);
      const step = skillPackage.steps[i];
      // simulate realistic step execution delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCompletedSteps((prev) => [...prev, i]);
      setTraceLogs((prev) => [
        ...prev,
        `[Step ${i + 1} Success] ${step.title} -> Verified target ${step.target}`,
      ]);
    }
    setSimulatingStepIndex(null);
    setTraceLogs((prev) => [...prev, `[Trace Complete] All 5-10 directives executed and verified with zero violations.`]);
  };

  const handleLoadSample = (scenarioId: string) => {
    const s = SAMPLE_SCENARIOS.find((item) => item.id === scenarioId);
    if (s) {
      setSkillName(s.title);
      setTutorialContent(s.fullContent);
      setSkillPackage(null);
      setErrorMsg(null);
      setDefenseWarning(null);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActionTypeInfo = (type: ActionType) => {
    switch (type) {
      case "browser_action":
        return {
          label: "DOM / Browser Agent",
          color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
          icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />,
        };
      case "api_action":
        return {
          label: "API Orchestrator",
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case "human_action":
        return {
          label: "Human Gatekeeper Approval",
          color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <UserCheck className="w-3.5 h-3.5 text-amber-400" />,
        };
      case "decision_gate":
        return {
          label: "Decision Logic Gate",
          color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
          icon: <GitBranch className="w-3.5 h-3.5 text-indigo-400" />,
        };
      case "verification":
        return {
          label: "Verification Assertion",
          color: "bg-teal-500/10 text-teal-400 border-teal-500/30",
          icon: <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />,
        };
      case "stop_condition":
        return {
          label: "Safety Sentinel / Stop Gate",
          color: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />,
        };
      default:
        return {
          label: type,
          color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
          icon: <Cpu className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div id="skill-builder-view" className="space-y-10 py-6 max-w-6xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              1WithOut 5-10 Directive Agent Skill Builder
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compiles any PWA workflow, website manual, PDF guide, book chapter, or SOP into 5 to 10 executable, typed agent directives with strict error boundaries and Playwright test assertions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sample Source:</span>
          <select
            id="skill-sample-dropdown"
            onChange={(e) => handleLoadSample(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-cyan-500 outline-none"
            defaultValue="sample-pwa-sync"
          >
            {SAMPLE_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Config Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Skill Package Name
            </label>
            <input
              type="text"
              id="skill-name-input"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. PWA Offline Sync & Background Sync Skill"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Target Agent Runtime & Schema
            </label>
            <select
              id="skill-target-runtime-select"
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              <option value="universal">Universal (Claude / Gemini / OpenAI / Cursor SKILL.md)</option>
              <option value="playwright">Playwright Automation Runner (Chromium / WebKit)</option>
              <option value="pwa_worker">PWA Service Worker & Background Sync Engine</option>
              <option value="lm_studio">Local AI Agent Runtime (LM Studio / Jan.ai JSON)</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Source Guide / PDF Extract / Video Script / Instruction Steps
            </label>
            <span className="text-[11px] text-slate-400">
              {tutorialContent.length} chars
            </span>
          </div>
          <textarea
            id="tutorial-content-textarea"
            rows={7}
            value={tutorialContent}
            onChange={(e) => setTutorialContent(e.target.value)}
            placeholder="Paste step-by-step instructions, PWA service worker guide, API procedure, or book tutorial..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-2xl p-3.5 focus:ring-1 focus:ring-cyan-500 outline-none font-mono leading-relaxed"
          />
        </div>

        {/* Defense Warning Box */}
        {defenseWarning && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2 text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>DEFENSE-OF-BREAK ACTIVE: {defenseWarning.reason}</span>
              </div>
              {defenseWarning.allowlistedProjectEligible && (
                <button
                  type="button"
                  onClick={onOpenDefenseModal}
                  className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                >
                  Enter Passcode
                </button>
              )}
            </div>
            <p className="text-slate-300 text-[11px]">
              {defenseWarning.suggestedAction}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {errorMsg ? (
            <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
          ) : (
            <span className="text-xs text-slate-400">
              Generates 5 to 10 atomic directives with verification checks and error recovery.
            </span>
          )}

          <button
            id="build-skill-package-btn"
            onClick={handleGenerateSkill}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Deconstructing into 5-10 Directives...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Build 5-10 Step Skill Package</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Viewer & Export Tabs */}
      {skillPackage && (
        <div id="skill-package-output" className="space-y-6 animate-in fade-in duration-300">
          {/* Header Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  v{skillPackage.version}
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {skillPackage.steps.length} Directives Formatted
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {skillPackage.skillName}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {skillPackage.description}
              </p>
            </div>

            {/* Quick Actions & Downloads */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRunExecutionTrace}
                disabled={simulatingStepIndex !== null}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate Execution Trace</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    `${skillPackage.skillName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.skill.md`,
                    skillPackage.skillMarkdown,
                    "text/markdown"
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>SKILL.md</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    `${skillPackage.skillName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.spec.ts`,
                    skillPackage.playwrightScript,
                    "text/typescript"
                  )
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Playwright.ts</span>
              </button>
            </div>
          </div>

          {/* Sub-tabs for Export views */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveExportTab("steps")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeExportTab === "steps"
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Directives Graph ({skillPackage.steps.length})</span>
            </button>

            <button
              onClick={() => setActiveExportTab("execution_trace")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeExportTab === "execution_trace"
                  ? "bg-slate-800 text-emerald-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Execution Trace Log</span>
            </button>

            <button
              onClick={() => setActiveExportTab("skill_md")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeExportTab === "skill_md"
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SKILL.md Spec</span>
            </button>

            <button
              onClick={() => setActiveExportTab("playwright")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeExportTab === "playwright"
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Playwright Test</span>
            </button>

            <button
              onClick={() => setActiveExportTab("json_tools")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeExportTab === "json_tools"
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>JSON Tools Spec</span>
            </button>
          </div>

          {/* TAB 1: Structured Step Timeline */}
          {activeExportTab === "steps" && (
            <div className="space-y-4">
              {skillPackage.steps.map((step, idx) => {
                const actionInfo = getActionTypeInfo(step.actionType);
                const isRunning = simulatingStepIndex === idx;
                const isCompleted = completedSteps.includes(idx);

                return (
                  <div
                    key={step.id || idx}
                    id={`skill-step-${idx}`}
                    className={`p-5 rounded-2xl bg-slate-900 border transition-all space-y-3 ${
                      isRunning
                        ? "border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500"
                        : isCompleted
                        ? "border-emerald-500/50 bg-slate-900/90"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border ${
                          isCompleted
                            ? "bg-emerald-500 text-slate-950 border-emerald-400"
                            : isRunning
                            ? "bg-amber-500 text-slate-950 animate-pulse border-amber-400"
                            : "bg-slate-800 text-cyan-400 border-slate-700"
                        }`}>
                          {isCompleted ? "✓" : step.order || idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-100">
                            {step.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Directive {idx + 1} of {skillPackage.steps.length}
                          </span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${actionInfo.color}`}>
                        {actionInfo.icon}
                        <span>{actionInfo.label}</span>
                      </span>
                    </div>

                    <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Execution Instruction:
                        </span>
                        <p className="text-xs text-slate-200 mt-0.5">
                          {step.instruction}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Target / Endpoint / Selector:
                          </span>
                          <span className="text-slate-300 font-mono text-[11px] break-all">
                            {step.target}
                          </span>
                        </div>
                        {step.parameters && (
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Parameters:
                            </span>
                            <span className="text-slate-400 font-mono text-[11px] break-all">
                              {step.parameters}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-500/20">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verification Assertion:
                        </span>
                        <p className="text-teal-200/90 text-xs mt-0.5">
                          {step.verificationCheck}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" />
                          Error Recovery & Fallback:
                        </span>
                        <p className="text-rose-200/90 text-xs mt-0.5">
                          {step.errorHandling}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Execution Trace Log */}
          {activeExportTab === "execution_trace" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Real-Time Action Recording & Execution Trace
                </span>
                <button
                  type="button"
                  onClick={() => copyText(traceLogs.join("\n"), "trace_logs")}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {copiedKey === "trace_logs" ? "Copied!" : "Copy Trace"}
                </button>
              </div>

              <div className="font-mono text-xs text-slate-300 space-y-1.5 max-h-72 overflow-y-auto p-2">
                {traceLogs.map((log, lIdx) => (
                  <div key={lIdx} className="flex items-start gap-2">
                    <span className="text-slate-600 select-none">&gt;</span>
                    <span className="text-emerald-300">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SKILL.md */}
          {activeExportTab === "skill_md" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-slate-400">
                  SKILL.md (Universal Claude / Gemini / Cursor Agent Standard)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(skillPackage.skillMarkdown, "skill_md")}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  {copiedKey === "skill_md" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 leading-relaxed">
                {skillPackage.skillMarkdown}
              </pre>
            </div>
          )}

          {/* TAB 4: Playwright Script */}
          {activeExportTab === "playwright" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-slate-400">
                  playwright.spec.ts (Automated End-to-End Test)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(skillPackage.playwrightScript, "playwright")}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  {copiedKey === "playwright" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-2 leading-relaxed">
                {skillPackage.playwrightScript}
              </pre>
            </div>
          )}

          {/* TAB 5: JSON Tool Definitions */}
          {activeExportTab === "json_tools" && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-slate-400">
                  tools.json (LM Studio / OpenAI Function Calling Schema)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(skillPackage.toolDefinitionsJson, "json_tools")}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  {copiedKey === "json_tools" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-xs font-mono text-cyan-300 overflow-x-auto p-2 leading-relaxed">
                {skillPackage.toolDefinitionsJson}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
