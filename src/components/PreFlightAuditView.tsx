import React, { useState } from "react";
import {
  AppAuditReport,
  PillarReport,
  VerificationCheck,
  CheckStatus,
} from "../types";
import { runPreFlightScan } from "../services/api";
import confetti from "canvas-confetti";
import {
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Flame,
  Activity,
  CalendarCheck,
  AlertTriangle,
  XCircle,
  Copy,
  Download,
  Sparkles,
  RefreshCw,
  Check,
  Code,
  Terminal,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface PreFlightAuditViewProps {
  onRegisterApp?: (report: AppAuditReport) => void;
}

export const PreFlightAuditView: React.FC<PreFlightAuditViewProps> = ({
  onRegisterApp,
}) => {
  const [appName, setAppName] = useState<string>("1WithOut PWA & Cloud Sentinel");
  const [liveUrl, setLiveUrl] = useState<string>("https://1without.app");
  const [repoUrl, setRepoUrl] = useState<string>("https://github.com/1without/pwa-engine");
  const [stackDescription, setStackDescription] = useState<string>("React 19, Tailwind CSS, Vite, Node.js 22, Express, Service Worker PWA, Stripe");
  const [codeSnippets, setCodeSnippets] = useState<string>(`// server.ts snippet
import express from 'express';
const app = express();
app.use(express.json());
// Stripe webhook
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // raw signature validation
});
app.listen(3000, '0.0.0.0');`);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AppAuditReport | null>(null);
  const [activePillarTab, setActivePillarTab] = useState<string>("security");
  const [copiedPatchId, setCopiedPatchId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunScan = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await runPreFlightScan(
        appName,
        stackDescription,
        liveUrl,
        repoUrl,
        codeSnippets
      );
      setReport(result);
      if (result.launchReadinessScore >= 85) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to complete pre-flight launch scan.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyPatch = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPatchId(id);
    setTimeout(() => setCopiedPatchId(null), 2000);
  };

  const toggleCheck = (pillarId: string, checkId: string) => {
    if (!report) return;
    const updatedPillars = report.pillars.map((p) => {
      if (p.pillarId === pillarId) {
        const updatedChecks = p.checks.map((c) => {
          if (c.id === checkId) {
            const nextStatus: CheckStatus = c.status === "PASSED" ? "WARNING" : "PASSED";
            return { ...c, status: nextStatus, isCustomManualChecked: true };
          }
          return c;
        });
        // recompute score
        const passedCount = updatedChecks.filter((c) => c.status === "PASSED").length;
        const newScore = Math.round((passedCount / updatedChecks.length) * 100);
        return { ...p, checks: updatedChecks, score: newScore };
      }
      return p;
    });

    const totalScore = Math.round(
      updatedPillars.reduce((acc, p) => acc + p.score, 0) / updatedPillars.length
    );

    setReport({
      ...report,
      pillars: updatedPillars,
      launchReadinessScore: totalScore,
      status: totalScore >= 85 ? "READY_TO_SHIP" : totalScore >= 70 ? "NEEDS_ATTENTION" : "LAUNCH_BLOCKED",
    });
  };

  const downloadReportMarkdown = () => {
    if (!report) return;
    let md = `# 1WithOut Pre-Flight Launch Verification Audit\n`;
    md += `**App Name:** ${report.appName}\n`;
    md += `**Readiness Score:** ${report.launchReadinessScore}/100 (${report.status})\n`;
    md += `**Date:** ${new Date(report.createdAt).toUTCString()}\n\n`;
    md += `## 6-Pillar Scorecard\n\n`;

    report.pillars.forEach((p) => {
      md += `### ${p.name} - Score: ${p.score}/100\n`;
      md += `${p.summary}\n\n`;
      p.checks.forEach((c) => {
        md += `- [${c.status === "PASSED" ? "x" : " "}] **${c.name}** (${c.status}): ${c.description}\n`;
        if (c.recommendedFix) md += `  - *Fix:* ${c.recommendedFix}\n`;
      });
      md += `\n`;
    });

    md += `## Post-Launch Maintenance Cadence\n`;
    md += `### 30-Day Tasks\n` + report.cadenceSchedule.day30Tasks.map((t) => `- ${t}`).join("\n") + "\n\n";
    md += `### 90-Day Tasks\n` + report.cadenceSchedule.day90Tasks.map((t) => `- ${t}`).join("\n") + "\n\n";
    md += `### 180-Day Tasks\n` + report.cadenceSchedule.day180Tasks.map((t) => `- ${t}`).join("\n") + "\n";

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.appName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-preflight-audit.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPillarIcon = (pillarId: string) => {
    switch (pillarId) {
      case "security":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case "infra":
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case "legal":
        return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
      case "claims":
        return <Flame className="w-4 h-4 text-rose-400" />;
      case "qa":
        return <Activity className="w-4 h-4 text-teal-400" />;
      case "maintenance":
      default:
        return <CalendarCheck className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getStatusBadge = (status: CheckStatus) => {
    switch (status) {
      case "PASSED":
        return {
          label: "PASSED",
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "WARNING":
        return {
          label: "WARNING",
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "FAILED":
        return {
          label: "FAILED",
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: <XCircle className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: "N/A",
          bg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
    }
  };

  return (
    <div id="preflight-audit-matrix-view" className="space-y-10 py-6 max-w-6xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              1WithOut 6-Pillar Launch Verification Matrix
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated compliance scanner for Security, Cloud Ingress, Billing/Legal, Marketing Copy, Interface QA, and Post-Launch 180-Day Cadence.
          </p>
        </div>

        <button
          id="preflight-demo-scan-btn"
          onClick={handleRunScan}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Scanning All 6 Pillars...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run Live Launch Audit</span>
            </>
          )}
        </button>
      </div>

      {/* Target Application Config Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Target Release Context
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              App / PWA Name
            </label>
            <input
              type="text"
              id="audit-app-name-input"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Live Production URL / PWA Scope
            </label>
            <input
              type="text"
              id="audit-live-url-input"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Git Repository
            </label>
            <input
              type="text"
              id="audit-repo-url-input"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Architecture, Tech Stack & Infrastructure
          </label>
          <input
            type="text"
            id="audit-stack-input"
            value={stackDescription}
            onChange={(e) => setStackDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Server Ingress, Headers, or Config Snippet (Optional)
          </label>
          <textarea
            id="audit-code-snippet-textarea"
            rows={3}
            value={codeSnippets}
            onChange={(e) => setCodeSnippets(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-2xl p-3 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
          />
        </div>

        {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
      </div>

      {/* Audit Matrix Report Display */}
      {report && (
        <div id="preflight-report-results" className="space-y-8 animate-in fade-in duration-300">
          {/* Executive Readiness Score Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    report.status === "READY_TO_SHIP"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : report.status === "NEEDS_ATTENTION"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {report.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {report.appName}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Launch Verification Matrix Scorecard
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Audited against 6 continuous pillars. Items can be toggled manually upon completing verification in your environment.
              </p>
            </div>

            {/* Launch Readiness Score Ring */}
            <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 shrink-0">
              <div className="text-center">
                <div
                  className={`text-4xl font-extrabold ${
                    report.launchReadinessScore >= 85
                      ? "text-emerald-400"
                      : report.launchReadinessScore >= 70
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {report.launchReadinessScore}%
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                  Launch Readiness
                </p>
              </div>

              <div className="h-10 w-[1px] bg-slate-800" />

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={downloadReportMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Report</span>
                </button>

                {onRegisterApp && (
                  <button
                    type="button"
                    onClick={() => onRegisterApp(report)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 transition-all cursor-pointer"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Track in Registry</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 6 Pillars Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {report.pillars.map((pillar) => {
              const isActive = activePillarTab === pillar.pillarId;
              return (
                <button
                  key={pillar.pillarId}
                  id={`pillar-tab-${pillar.pillarId}`}
                  onClick={() => setActivePillarTab(pillar.pillarId)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? "bg-slate-800 border-emerald-500 text-white shadow-md"
                      : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    {getPillarIcon(pillar.pillarId)}
                    <span
                      className={`text-xs font-bold ${
                        pillar.score >= 85 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {pillar.score}%
                    </span>
                  </div>
                  <span className="text-xs font-bold truncate">
                    {pillar.name.split(",")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Checks Details */}
          {report.pillars
            .filter((p) => p.pillarId === activePillarTab)
            .map((pillar) => (
              <div
                key={pillar.pillarId}
                id={`active-pillar-card-${pillar.pillarId}`}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {getPillarIcon(pillar.pillarId)}
                      {pillar.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{pillar.summary}</p>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-emerald-400">
                    Pillar Score: {pillar.score}%
                  </span>
                </div>

                {/* Checks List */}
                <div className="space-y-4">
                  {pillar.checks.map((check) => {
                    const badge = getStatusBadge(check.status);
                    return (
                      <div
                        key={check.id}
                        id={`check-row-${check.id}`}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`check-box-${check.id}`}
                              checked={check.status === "PASSED"}
                              onChange={() => toggleCheck(pillar.pillarId, check.id)}
                              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                            <label
                              htmlFor={`check-box-${check.id}`}
                              className="text-xs font-bold text-slate-200 cursor-pointer"
                            >
                              {check.name}
                            </label>
                          </div>

                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                            {badge.icon}
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 pl-7 leading-relaxed">
                          {check.description}
                        </p>

                        <div className="pl-7 pt-1 flex flex-col gap-2">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                              Recommended Mitigation / Standard:
                            </span>
                            {check.recommendedFix}
                          </div>

                          {check.patchCode && (
                            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold flex items-center gap-1">
                                  <Code className="w-3 h-3" />
                                  Automated Config / Code Patch:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyPatch(check.patchCode!, check.id)}
                                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedPatchId === check.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied Patch</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Patch</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="text-[11px] font-mono text-emerald-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
                                {check.patchCode}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Post-Launch Maintenance Cadence Engine Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <CalendarCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Post-Launch Maintenance Cadence Schedule
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automated review milestones to prevent silent security decay, API contract drift, and forgotten credential rotations.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 30-Day Check */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    30-Day Check
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">T+30 Days</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Early Error Triage & Funnel Conversion Audit
                </p>
                <ul className="text-xs text-slate-300 space-y-2 pl-4 list-disc">
                  {report.cadenceSchedule.day30Tasks.map((t, idx) => (
                    <li key={idx} className="leading-relaxed">{t}</li>
                  ))}
                </ul>
              </div>

              {/* 90-Day Check */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    90-Day Check
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">T+90 Days</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dependency Upgrades & API Contract Verification
                </p>
                <ul className="text-xs text-slate-300 space-y-2 pl-4 list-disc">
                  {report.cadenceSchedule.day90Tasks.map((t, idx) => (
                    <li key={idx} className="leading-relaxed">{t}</li>
                  ))}
                </ul>
              </div>

              {/* 180-Day Check */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    180-Day Check
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">T+180 Days</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Security Re-Scan, Secret Rotation & Legal Refresh
                </p>
                <ul className="text-xs text-slate-300 space-y-2 pl-4 list-disc">
                  {report.cadenceSchedule.day180Tasks.map((t, idx) => (
                    <li key={idx} className="leading-relaxed">{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
