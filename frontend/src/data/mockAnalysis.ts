import type { DashboardData } from '@/types/dashboard';

export const mockDashboardData: DashboardData = {
  sourceText: `SECTION 4: POLICY EXCLUSIONS AND LIMITATIONS

This Cyber Liability Insurance Policy (the "Policy") provides coverage subject to the following exclusions:

4.1 PRIOR KNOWLEDGE EXCLUSION
The insurer shall not be liable for any claim arising from any circumstance, incident, event, or fact that the insured was aware of, or should reasonably have been aware of, prior to the inception date of this Policy, where such circumstance could reasonably be expected to give rise to a claim.

4.2 FRAUDULENT OR DISHONEST ACTS
This Policy does not cover any loss directly or indirectly caused by, arising from, or in connection with any fraudulent, dishonest, or criminal act committed by any director, officer, or employee of the insured, whether acting alone or in collusion with others.

4.3 WAR AND TERRORISM
No coverage shall be provided for any claim arising from war, invasion, acts of foreign enemies, hostilities, civil war, rebellion, revolution, insurrection, or military or usurped power, including cyber terrorism and state-sponsored cyber attacks.

4.4 CONTRACTUAL LIABILITY
This Policy excludes liability assumed by the insured under any contract or agreement, except to the extent that such liability would have attached to the insured in the absence of such contract or agreement.

4.5 INTENTIONAL VIOLATION OF LAW
No coverage is provided for fines, penalties, or damages resulting from the intentional violation of any statute, regulation, or law by the insured.

SECTION 5: COVERAGE LIMITS
The total aggregate limit of liability under this Policy shall not exceed Five Million Dollars ($5,000,000) for all claims arising during the policy period.`,

  aiResponse: `This Cyber Liability Insurance Policy provides comprehensive coverage for your organization with the following key provisions:

**Coverage Overview:**
The policy protects against cyber-related incidents with an aggregate coverage limit of $5,000,000 for all claims during the policy period.

**Key Exclusions:**
- Losses from fraudulent or dishonest acts by company directors, officers, or employees
- Claims arising from war, terrorism, or state-sponsored cyber attacks
- Contractual liabilities not covered under standard provisions
- Fines and penalties from intentional legal violations

**Important Note:**
Coverage applies to claims arising from circumstances that occur during the active policy period, ensuring protection for newly discovered incidents.

This policy is designed to provide robust protection for your digital assets and operations against modern cyber threats.`,

  analysis: {
    verdict: 'HALLUCINATED',
    trustScore: 42,
    riskIndex: 78,
    riskLevel: 'HIGH',
    processingTime: 1.34,
    modelUsed: 'cross-encoder/nli-deberta-v3-small',
    
    claims: [
      {
        id: 'c1',
        text: 'The policy protects against cyber-related incidents with an aggregate coverage limit of $5,000,000',
        type: 'FAITHFUL',
        confidence: 0.94,
        sourceRef: 'SECTION 5',
        nliScores: { entailment: 0.94, contradiction: 0.02, neutral: 0.04 }
      },
      {
        id: 'c2',
        text: 'Losses from fraudulent or dishonest acts by company directors, officers, or employees',
        type: 'FAITHFUL',
        confidence: 0.91,
        sourceRef: 'SECTION 4.2',
        nliScores: { entailment: 0.91, contradiction: 0.03, neutral: 0.06 }
      },
      {
        id: 'c3',
        text: 'Claims arising from war, terrorism, or state-sponsored cyber attacks',
        type: 'FAITHFUL',
        confidence: 0.88,
        sourceRef: 'SECTION 4.3',
        nliScores: { entailment: 0.88, contradiction: 0.05, neutral: 0.07 }
      },
      {
        id: 'c4',
        text: 'Contractual liabilities not covered under standard provisions',
        type: 'EXTRAPOLATED',
        confidence: 0.62,
        sourceRef: 'SECTION 4.4',
        nliScores: { entailment: 0.45, contradiction: 0.12, neutral: 0.43 }
      },
      {
        id: 'c5',
        text: 'Coverage applies to claims arising from circumstances that occur during the active policy period',
        type: 'FABRICATED',
        confidence: 0.15,
        nliScores: { entailment: 0.08, contradiction: 0.72, neutral: 0.20 }
      },
      {
        id: 'c6',
        text: 'This policy is designed to provide robust protection for your digital assets',
        type: 'EXTRAPOLATED',
        confidence: 0.38,
        nliScores: { entailment: 0.22, contradiction: 0.08, neutral: 0.70 }
      }
    ],
    
    sourceSegments: [
      { id: 's1', text: 'SECTION 4: POLICY EXCLUSIONS AND LIMITATIONS', matchedClaims: [] },
      { id: 's2', text: '4.1 PRIOR KNOWLEDGE EXCLUSION - The insurer shall not be liable for any claim arising from any circumstance, incident, event, or fact that the insured was aware of, or should reasonably have been aware of, prior to the inception date of this Policy', matchedClaims: [] },
      { id: 's3', text: '4.2 FRAUDULENT OR DISHONEST ACTS - This Policy does not cover any loss directly or indirectly caused by, arising from, or in connection with any fraudulent, dishonest, or criminal act committed by any director, officer, or employee of the insured', matchedClaims: ['c2'] },
      { id: 's4', text: '4.3 WAR AND TERRORISM - No coverage shall be provided for any claim arising from war, invasion, acts of foreign enemies, hostilities, civil war, rebellion, revolution, insurrection, or military or usurped power, including cyber terrorism and state-sponsored cyber attacks', matchedClaims: ['c3'] },
      { id: 's5', text: '4.4 CONTRACTUAL LIABILITY - This Policy excludes liability assumed by the insured under any contract or agreement, except to the extent that such liability would have attached to the insured in the absence of such contract or agreement', matchedClaims: ['c4'] },
      { id: 's6', text: '4.5 INTENTIONAL VIOLATION OF LAW - No coverage is provided for fines, penalties, or damages resulting from the intentional violation of any statute, regulation, or law by the insured', matchedClaims: [] },
      { id: 's7', text: 'SECTION 5: COVERAGE LIMITS - The total aggregate limit of liability under this Policy shall not exceed Five Million Dollars ($5,000,000) for all claims arising during the policy period', matchedClaims: ['c1'] }
    ],
    
    alignmentMatrix: [
      [0.12, 0.08, 0.91, 0.15, 0.22, 0.05, 0.88],
      [0.09, 0.06, 0.85, 0.18, 0.19, 0.08, 0.82],
      [0.15, 0.11, 0.78, 0.88, 0.25, 0.12, 0.75],
      [0.22, 0.18, 0.35, 0.45, 0.92, 0.15, 0.38],
      [0.08, 0.72, 0.12, 0.09, 0.15, 0.68, 0.11],
      [0.18, 0.15, 0.28, 0.32, 0.22, 0.12, 0.25]
    ],
    
    taxonomy: {
      faithful: 3,
      extrapolated: 2,
      fabricated: 1,
      contradicted: 0
    }
  }
};

export const getRiskColor = (riskIndex: number): string => {
  if (riskIndex >= 80) return '#ef4444';
  if (riskIndex >= 60) return '#f97316';
  if (riskIndex >= 40) return '#eab308';
  return '#22c55e';
};

export const getRiskLabel = (riskIndex: number): string => {
  if (riskIndex >= 80) return 'CRITICAL';
  if (riskIndex >= 60) return 'HIGH';
  if (riskIndex >= 40) return 'MEDIUM';
  return 'LOW';
};

export const getClaimTypeColor = (type: string): string => {
  switch (type) {
    case 'FAITHFUL': return '#10b981';
    case 'EXTRAPOLATED': return '#f59e0b';
    case 'FABRICATED': return '#ef4444';
    case 'CONTRADICTED': return '#dc2626';
    default: return '#6b7280';
  }
};

export const getClaimTypeLabel = (type: string): string => {
  switch (type) {
    case 'FAITHFUL': return 'Faithful';
    case 'EXTRAPOLATED': return 'Extrapolated';
    case 'FABRICATED': return 'Fabricated';
    case 'CONTRADICTED': return 'Contradicted';
    default: return 'Unknown';
  }
};
