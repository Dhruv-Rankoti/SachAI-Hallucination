export type Verdict = 'FAITHFUL' | 'HALLUCINATED' | 'PARTIAL';
export type ClaimType = 'FAITHFUL' | 'EXTRAPOLATED' | 'FABRICATED' | 'CONTRADICTED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Claim {
  id: string;
  text: string;
  type: ClaimType;
  confidence: number;
  sourceRef?: string;
  nliScores: {
    entailment: number;
    contradiction: number;
    neutral: number;
  };
}

export interface SourceSegment {
  id: string;
  text: string;
  matchedClaims: string[];
}

export interface AnalysisResult {
  verdict: Verdict;
  trustScore: number;
  riskIndex: number;
  riskLevel: RiskLevel;
  claims: Claim[];
  sourceSegments: SourceSegment[];
  alignmentMatrix: number[][];
  taxonomy: {
    faithful: number;
    extrapolated: number;
    fabricated: number;
    contradicted: number;
  };
  processingTime: number;
  modelUsed: string;
}

export interface DashboardData {
  sourceText: string;
  aiResponse: string;
  analysis: AnalysisResult;
}

export interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  claim: string;
  source: string;
}
