import React, { useState } from "react";
import { AppRegistryItem } from "../types";
import { INITIAL_REGISTRY_APPS } from "../data/samples";
import {
  Layers,
  CalendarCheck,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  ExternalLink,
  GitBranch,
  RefreshCw,
  Trash2,
  Bell,
  Activity,
  Check,
  Smartphone,
} from "lucide-react";

interface RegistryViewProps {
  onRunAuditForApp: (appName: string, liveUrl?: string, repoUrl?: string) => void;
}

export const RegistryView: React.FC<RegistryViewProps> = ({
  onRunAuditForApp,
}) => {
  const [apps, setApps] = useState<AppRegistryItem[]>(() => {
    const saved = localStorage.getItem("1without_registered_apps");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_REGISTRY_APPS;
      }
    }
    return INITIAL_REGISTRY_APPS;
  });

  const [selectedApp, setSelectedApp] = useState<AppRegistryItem | null>(apps[0] || null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>("");
  const [newAppDesc, setNewAppDesc] = useState<string>("");
  const [newLiveUrl, setNewLiveUrl] = useState<string>("");
  const [newRepoUrl, setNewRepoUrl] = useState<string>("");
  const [newEnv, setNewEnv] = useState<"Production" | "Staging" | "Development">("Production");

  const saveApps = (newApps: AppRegistryItem[]) => {
    setApps(newApps);
    localStorage.setItem("1without_registered_apps", JSON.stringify(newApps));
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    const newApp: AppRegistryItem = {
      id: `app-${Date.now()}`,
      name: newAppName.trim(),
      description: newAppDesc.trim() || "Managed application in 1WithOut lifecycle registry.",
      liveUrl: newLiveUrl.trim() || undefined,
      repoUrl: newRepoUrl.trim() || undefined,
      environment: newEnv,
      launchDate: new Date().toISOString().split("T")[0],
      readinessScore: 88,
      status: "Pre-Flight Pending",
      daysSinceLaunch: 0,
      cadenceStatus: {
        day30Completed: false,
        day90Completed: false,
        day180Completed: false,
      },
      activeAlertsCount: 0,
    };

    const updated = [newApp, ...apps];
    saveApps(updated);
    setSelectedApp(newApp);
    setShowAddModal(false);
    setNewAppName("");
    setNewAppDesc("");
    setNewLiveUrl("");
    setNewRepoUrl("");
  };

  const toggleCadenceTask = (appId: string, milestone: "day30" | "day90" | "day180") => {
    const updated = apps.map((a) => {
      if (a.id === appId) {
        const nextStatus = { ...a.cadenceStatus };
        if (milestone === "day30") nextStatus.day30Completed = !nextStatus.day30Completed;
        if (milestone === "day90") nextStatus.day90Completed = !nextStatus.day90Completed;
        if (milestone === "day180") nextStatus.day180Completed = !nextStatus.day180Completed;

        return { ...a, cadenceStatus: nextStatus };
      }
      return a;
    });

    saveApps(updated);
    if (selectedApp && selectedApp.id === appId) {
      const current = updated.find((a) => a.id === appId) || null;
      setSelectedApp(current);
    }
  };

  const deleteApp = (appId: string) => {
    const updated = apps.filter((a) => a.id !== appId);
    saveApps(updated);
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(updated[0] || null);
    }
  };

  const getStatusBadge = (status: AppRegistryItem["status"]) => {
    switch (status) {
      case "Live & Healthy":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Maintenance Due":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Critical Alert":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "Pre-Flight Pending":
      default:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    }
  };

  return (
    <div id="registry-lifecycle-view" className="space-y-8 py-6 max-w-6xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              1WithOut App Lifecycle & Staging Audits
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track multi-app release health, automated 30d/90d/180d security timers, and continuous PWA compliance.
          </p>
        </div>

        <button
          id="register-new-app-btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register New App / PWA</span>
        </button>
      </div>

      {/* Main Grid: Left Apps List, Right Cadence Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Apps List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Tracked Applications ({apps.length})
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Live Health Sync
            </span>
          </div>

          <div className="space-y-2.5">
            {apps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  id={`app-registry-card-${app.id}`}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-slate-850 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {app.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Launched: {app.launchDate} (T+{app.daysSinceLaunch}d)
                      </span>
                    </div>

                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">
                    {app.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-emerald-400 font-bold">
                      {app.readinessScore}% Score
                    </span>
                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>
                        Cadence: {app.daysSinceLaunch < 30 ? "30d" : app.daysSinceLaunch < 90 ? "90d" : "180d"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected App Cadence & Milestone Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedApp ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedApp.environment}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(selectedApp.status)}`}>
                      {selectedApp.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedApp.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedApp.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onRunAuditForApp(
                        selectedApp.name,
                        selectedApp.liveUrl,
                        selectedApp.repoUrl
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Run 6-Pillar Scan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteApp(selectedApp.id)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Links and Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedApp.liveUrl && (
                  <a
                    href={selectedApp.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center justify-between font-mono"
                  >
                    <span>Live / PWA: {selectedApp.liveUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {selectedApp.repoUrl && (
                  <a
                    href={selectedApp.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all flex items-center justify-between font-mono"
                  >
                    <span>Repo: {selectedApp.repoUrl}</span>
                    <GitBranch className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* 30/90/180-Day Automated Maintenance Cadence Checklist */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-indigo-400" />
                    1WithOut Post-Launch Maintenance Cadence
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    T+{selectedApp.daysSinceLaunch} Days Elapsed
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Milestone 1: 30-Day Check */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`cadence-check-30d-${selectedApp.id}`}
                          checked={selectedApp.cadenceStatus.day30Completed}
                          onChange={() => toggleCadenceTask(selectedApp.id, "day30")}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`cadence-check-30d-${selectedApp.id}`}
                          className="text-xs font-bold text-slate-200 cursor-pointer"
                        >
                          30-Day Milestone: Early Error Triage & Funnel Review
                        </label>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          selectedApp.cadenceStatus.day30Completed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        }`}
                      >
                        {selectedApp.cadenceStatus.day30Completed ? "Completed" : "Action Needed (T+30)"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                      Inspect client crash logs, evaluate Stripe subscription billing disputes, and optimize any drop-off steps in the user onboarding funnel.
                    </p>
                  </div>

                  {/* Milestone 2: 90-Day Check */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`cadence-check-90d-${selectedApp.id}`}
                          checked={selectedApp.cadenceStatus.day90Completed}
                          onChange={() => toggleCadenceTask(selectedApp.id, "day90")}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`cadence-check-90d-${selectedApp.id}`}
                          className="text-xs font-bold text-slate-200 cursor-pointer"
                        >
                          90-Day Milestone: Dependency Upgrades & API Contract Audit
                        </label>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          selectedApp.cadenceStatus.day90Completed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {selectedApp.cadenceStatus.day90Completed ? "Completed" : "Scheduled (T+90)"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                      Run `npm audit`, update patch dependencies, test third-party webhook signature versions, and verify database index latency metrics.
                    </p>
                  </div>

                  {/* Milestone 3: 180-Day Check */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`cadence-check-180d-${selectedApp.id}`}
                          checked={selectedApp.cadenceStatus.day180Completed}
                          onChange={() => toggleCadenceTask(selectedApp.id, "day180")}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`cadence-check-180d-${selectedApp.id}`}
                          className="text-xs font-bold text-slate-200 cursor-pointer"
                        >
                          180-Day Milestone: Security Re-Scan & Secret Rotation
                        </label>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          selectedApp.cadenceStatus.day180Completed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        }`}
                      >
                        {selectedApp.cadenceStatus.day180Completed ? "Completed" : "Scheduled (T+180)"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                      Execute semi-annual production key rotation protocol, update Privacy Policy and Terms of Service, and audit database access permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
              <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                No Application Selected
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Select an application from the list or register a new one to view its lifecycle cadence.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Register Application / PWA
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateApp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  App / PWA Name *
                </label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. NextGen PWA Workflow Engine"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="Short description of the app or PWA"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Environment
                  </label>
                  <select
                    value={newEnv}
                    onChange={(e) => setNewEnv(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Development">Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Live / PWA URL
                  </label>
                  <input
                    type="text"
                    value={newLiveUrl}
                    onChange={(e) => setNewLiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Repo URL
                </label>
                <input
                  type="text"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
