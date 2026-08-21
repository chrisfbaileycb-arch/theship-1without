export type TabType = "overview" | "discern" | "skills" | "audit" | "registry" | "defense";

export type IntakeModality = "text" | "video_url" | "webpage_url" | "document_pdf" | "pwa_source" | "book_chapter";

export type ProcessingMode = "evaluate" | "teach" | "operationalize" | "build_skill" | "evaluate_and_build";

export type ClaimClassification =
  | "Supported by Evidence"
  | "Reasonable but Unverified"
  | "Missing Material Context / Prerequisites"
  | "Conflicting Evidence"
  | "Outcome Appears Atypical"
  | "Unable to Determine";

export interface ClaimEvaluation {
  id: string;
  quotedText: string;
  classification: ClaimClassification;
  heuristicConcern: string;
  evidenceReasoning: string;
  prerequisitesMissing?: string[];
  saferRewrite: string;
}

export interface SandboxTestPlan {
  title: string;
  budgetLimit: string;
  timeframe: string;
  hypothesis: string;
  steps: string[];
  killCriteria: string[];
  successSignal: string;
}

export interface DiscernmentReport {
  id: string;
  title: string;
  sourceType: IntakeModality;
  sourceUrl?: string;
  summary: string;
  overallScore: number;
  evidenceIndex: string;
  claims: ClaimEvaluation[];
  sandboxTestPlan: SandboxTestPlan;
  createdAt: string;
}

export type ActionType =
  | "browser_action"
  | "api_action"
  | "human_action"
  | "decision_gate"
  | "verification"
  | "stop_condition";

export type AgentRoleType =
  | "DOM_BROWSER_AGENT"
  | "API_ORCHESTRATOR"
  | "HUMAN_GATEKEEPER"
  | "SCHEMA_VERIFIER"
  | "SECURITY_SENTINEL"
  | "PWA_WORKER_ENGINE";

export interface WorkflowStep {
  id: string;
  order: number; // strictly 1 to 10
  title: string;
  actionType: ActionType;
  assignedAgentRole: AgentRoleType;
  agentCapabilitySummary: string;
  instruction: string;
  target: string;
  parameters?: string;
  errorHandling: string;
  verificationCheck: string;
  rollbackAction?: string;
}

export interface AgentSkillPackage {
  id: string;
  skillName: string;
  description: string;
  version: string;
  targetPlatform: string;
  sourceModality: IntakeModality;
  directivesCount: number; // 5 to 10
  dependencies: string[];
  steps: WorkflowStep[];
  skillMarkdown: string;
  playwrightScript: string;
  toolDefinitionsJson: string;
  pwaManifestJson?: string;
  createdAt: string;
}

export type PillarId = "security" | "infra" | "legal" | "claims" | "qa" | "maintenance";

export type CheckStatus = "PASSED" | "WARNING" | "FAILED" | "NOT_APPLICABLE";

export interface VerificationCheck {
  id: string;
  name: string;
  status: CheckStatus;
  description: string;
  recommendedFix: string;
  patchCode?: string;
  isCustomManualChecked?: boolean;
}

export interface PillarReport {
  pillarId: PillarId;
  name: string;
  score: number;
  summary: string;
  checks: VerificationCheck[];
}

export interface CadenceSchedule {
  day30Tasks: string[];
  day90Tasks: string[];
  day180Tasks: string[];
}

export interface AppAuditReport {
  id: string;
  appName: string;
  liveUrl?: string;
  repoUrl?: string;
  stackDescription?: string;
  launchReadinessScore: number;
  status: "READY_TO_SHIP" | "NEEDS_ATTENTION" | "LAUNCH_BLOCKED";
  pillars: PillarReport[];
  cadenceSchedule: CadenceSchedule;
  createdAt: string;
}

export interface AppRegistryItem {
  id: string;
  name: string;
  description: string;
  repoUrl?: string;
  liveUrl?: string;
  environment: "Production" | "Staging" | "Development";
  launchDate: string;
  readinessScore: number;
  status: "Live & Healthy" | "Maintenance Due" | "Pre-Flight Pending" | "Critical Alert";
  daysSinceLaunch: number;
  cadenceStatus: {
    day30Completed: boolean;
    day90Completed: boolean;
    day180Completed: boolean;
  };
  lastAuditId?: string;
  activeAlertsCount: number;
}

export interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  popular?: boolean;
  features: string[];
  buttonText: string;
}

// Defense-of-Break Protection Types
export type RestrictedCategory = "PERSONAL_DATA_PII" | "HEALTH_MEDICAL" | "UNAUTHORIZED_LEGAL" | "NONE";

export interface DefenseScanResult {
  isBlocked: boolean;
  category: RestrictedCategory;
  reason: string;
  detectedSnippets: string[];
  allowlistedProjectEligible: boolean; // e.g. legitimate Bankruptcy Restructuring or Corporate Archival
  suggestedAction: string;
}

export interface SecurityClearance {
  isCleared: boolean;
  passcodeUsed?: string;
  projectName?: string;
  timestamp?: string;
  authorizedScope?: string;
}
