import React, { useState } from "react";
import { TabType, AppAuditReport, SecurityClearance } from "./types";
import { SAMPLE_SCENARIOS } from "./data/samples";
import { Navbar } from "./components/Navbar";
import { OverviewView } from "./components/OverviewView";
import { DiscernView } from "./components/DiscernView";
import { SkillBuilderView } from "./components/SkillBuilderView";
import { PreFlightAuditView } from "./components/PreFlightAuditView";
import { RegistryView } from "./components/RegistryView";
import { DefenseGateView } from "./components/DefenseGateView";
import { ModalCheckout } from "./components/ModalCheckout";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle,
  Lock,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [currentTier, setCurrentTier] = useState<string>("pro");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [isDefenseModalOpen, setIsDefenseModalOpen] = useState<boolean>(false);

  // Security Clearance State
  const [securityClearance, setSecurityClearance] = useState<SecurityClearance | null>(null);

  // Cross-module states
  const [discernContent, setDiscernContent] = useState<string>("");
  const [skillTutorialContent, setSkillTutorialContent] = useState<string>("");
  const [skillNameTarget, setSkillNameTarget] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSelectSampleScenario = (scenarioId: string) => {
    const sample = SAMPLE_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sample) return;

    if (sample.suggestedMode === "build_skill") {
      setSkillNameTarget(sample.title);
      setSkillTutorialContent(sample.fullContent);
      setActiveTab("skills");
      showToast(`Loaded ${sample.title} into 1WithOut Skill Builder`);
    } else if (sample.suggestedMode === "operationalize") {
      setActiveTab("audit");
      showToast(`Loaded ${sample.title} into 6-Pillar Matrix`);
    } else {
      setDiscernContent(sample.fullContent);
      setActiveTab("discern");
      showToast(`Loaded ${sample.title} into Claims Discernment`);
    }
  };

  const handleSendToSkillBuilder = (text: string, title: string) => {
    setSkillTutorialContent(text);
    setSkillNameTarget(`${title} Skill`);
    setActiveTab("skills");
    showToast("Transferred verified steps to 1WithOut Agent Skill Builder");
  };

  const handleRunAuditForApp = (appName: string, liveUrl?: string, repoUrl?: string) => {
    setActiveTab("audit");
    showToast(`Loaded ${appName} for 1WithOut 6-Pillar Scan`);
  };

  const handleRegisterAuditedApp = (report: AppAuditReport) => {
    const saved = localStorage.getItem("1without_registered_apps");
    const existingApps = saved ? JSON.parse(saved) : [];
    const newApp = {
      id: `app-${Date.now()}`,
      name: report.appName,
      description: `6-Pillar verified with score ${report.launchReadinessScore}%.`,
      liveUrl: report.liveUrl,
      repoUrl: report.repoUrl,
      environment: "Production",
      launchDate: new Date().toISOString().split("T")[0],
      readinessScore: report.launchReadinessScore,
      status: report.status === "READY_TO_SHIP" ? "Live & Healthy" : "Pre-Flight Pending",
      daysSinceLaunch: 0,
      cadenceStatus: {
        day30Completed: false,
        day90Completed: false,
        day180Completed: false,
      },
      activeAlertsCount: report.status === "READY_TO_SHIP" ? 0 : 1,
    };
    const updated = [newApp, ...existingApps];
    localStorage.setItem("1without_registered_apps", JSON.stringify(updated));
    setActiveTab("registry");
    showToast(`Registered ${report.appName} in 1WithOut Lifecycle Manager`);
  };

  return (
    <div id="1without-app-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onOpenDefenseGate={() => setActiveTab("defense")}
        currentTier={currentTier}
        securityClearance={securityClearance}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === "overview" && (
          <OverviewView
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectSample={handleSelectSampleScenario}
            onSelectTier={(tierId) => {
              setCurrentTier(tierId);
              setIsUpgradeModalOpen(true);
            }}
          />
        )}

        {activeTab === "discern" && (
          <DiscernView
            initialContent={discernContent}
            onSendToSkillBuilder={handleSendToSkillBuilder}
            securityClearance={securityClearance}
            onOpenDefenseModal={() => setActiveTab("defense")}
          />
        )}

        {activeTab === "skills" && (
          <SkillBuilderView
            initialTutorialContent={skillTutorialContent}
            initialSkillName={skillNameTarget}
            securityClearance={securityClearance}
            onOpenDefenseModal={() => setActiveTab("defense")}
          />
        )}

        {activeTab === "audit" && (
          <PreFlightAuditView
            onRegisterApp={handleRegisterAuditedApp}
          />
        )}

        {activeTab === "registry" && (
          <RegistryView
            onRunAuditForApp={handleRunAuditForApp}
          />
        )}

        {activeTab === "defense" && (
          <DefenseGateView
            securityClearance={securityClearance}
            onClearanceUpdated={(clearance) => {
              setSecurityClearance(clearance);
              if (clearance) {
                showToast(`Defense-of-Break Unlocked for ${clearance.projectScope}`);
              } else {
                showToast("Defense-of-Break Locked.");
              }
            }}
          />
        )}
      </main>

      {/* Persistent Footer */}
      <footer id="1without-footer" className="bg-slate-950 border-t border-slate-800/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-bold text-[10px]">
              1W
            </span>
            <span className="font-semibold text-slate-300">1WithOut Engine</span>
            <span>—</span>
            <span>Knowledge-to-Execution to a PWA Lifecycle Matrix</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Defense-of-Break Guarded</span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
              <Cpu className="w-3.5 h-3.5" />
              <span>5-10 Typed Directives</span>
            </span>
            <span className="text-slate-400 font-mono">
              Port 3000 Ingress Verified
            </span>
          </div>
        </div>
      </footer>

      {/* Commercial Upgrade Modal */}
      <ModalCheckout
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentTier={currentTier}
        onSelectTier={(t) => setCurrentTier(t)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
