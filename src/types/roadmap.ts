/**
 * Roadmap & Engineering Specification Domain Types for AI Dataset Explorer
 */

import { Dataset, PretrainedModel, Paper } from './assets';
import { HardwareProfile } from './search';

export interface EngineeringPhase {
  id: string;
  phaseNumber: number;
  phaseName: string;
  title: string;
  timeEstimate: string;
  summary: string;
  deliverables: string[];
  recommendedTools: string[];
  domainCodeSnippet: string;
  technicalDetails: string;
}

export interface StarterCodeHubTemplates {
  setupScript: string;
  datasetLoader: string;
  trainScript: string;
  inferenceApi: string;
}

export interface TradeOffSynthesis {
  rapidPrototyping: {
    title: string;
    description: string;
    recommendedCombo: string;
  };
  sotaAccuracy: {
    title: string;
    description: string;
    recommendedCombo: string;
  };
  criticalPitfalls: string[];
}

export interface ImplementationSpecs {
  domain: string;
  category: string;
  targetModality: string;
  classBalanceIndicator?: string;
  annotationType?: string;
  compatibleFormats?: string[];
  hardwareProfile: HardwareProfile;
  tradeOffSynthesis?: TradeOffSynthesis;
  roadmapPhases: EngineeringPhase[];
  starterCode: StarterCodeHubTemplates;
}

export interface DomainTemplate extends ImplementationSpecs {
  id: string;
  title: string;
  icon: string;
  query: string;
  description: string;
  datasets: Dataset[];
  models: PretrainedModel[];
  papers: Paper[];
}
