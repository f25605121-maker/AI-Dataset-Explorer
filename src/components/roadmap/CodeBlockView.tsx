"use client";

import React from "react";
import StarterCodeHub from "@/components/roadmap/StarterCodeHub";
import { Dataset, PretrainedModel } from "@/types/assets";
import { StarterCodeHubTemplates } from "@/types/roadmap";

export interface CodeBlockViewProps {
  dataset: Dataset;
  model: PretrainedModel;
  templateTitle?: string;
  targetModality?: string;
  templateId?: string;
  starterCode: StarterCodeHubTemplates;
  onDownloadNotebook?: () => void;
}

export function CodeBlockView(props: CodeBlockViewProps) {
  return <StarterCodeHub {...(props as any)} />;
}

export default CodeBlockView;
