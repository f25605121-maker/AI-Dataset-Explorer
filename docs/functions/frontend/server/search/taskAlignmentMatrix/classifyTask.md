# classifyTask

**File:** `src\server\search\taskAlignmentMatrix.ts`

## Description
Task Alignment Matrix — Hierarchical Task Taxonomy & Sub-Task Differentiation
Defines a domain-agnostic task ontology with explicit compatibility and
incompatibility relationships between sub-tasks.
Usage in scoring:
  const score = getTaskAlignmentScore(queryTask, candidateTask);
  // 1.0 = exact match, 0.5 = parent-level match, 0.0 = orthogonal/incompatible
Rule: Sub-task mismatches apply a score PENALTY — they do not cause zero-kill
(that is the job of the modality gate). However, severe mismatches (orthogonal
tasks) reduce the task score to near zero.
/

// ── Canonical Task IDs ────────────────────────────────────────────────────────

export type CanonicalTask =
    // Vision sub-tasks
    | 'IMAGE_CLASSIFICATION'
    | 'OBJECT_DETECTION'
    | 'INSTANCE_SEGMENTATION'
    | 'SEMANTIC_SEGMENTATION'
    | 'KEYPOINT_POSE_ESTIMATION'
    | 'DEPTH_ESTIMATION'
    | 'IMAGE_GENERATION'
    | 'IMAGE_CAPTIONING'
    | 'VIDEO_CLASSIFICATION'
    | 'VIDEO_OBJECT_TRACKING'
    | 'ACTION_RECOGNITION'
    | 'OPTICAL_FLOW'
    // Audio sub-tasks
    | 'AUTOMATIC_SPEECH_RECOGNITION'
    | 'AUDIO_CLASSIFICATION'
    | 'ACOUSTIC_EVENT_DETECTION'
    | 'SPEAKER_DIARIZATION'
    | 'SPEECH_SYNTHESIS'
    | 'AUDIO_GENERATION'
    | 'EMOTION_RECOGNITION_AUDIO'
    // Medical imaging sub-tasks
    | 'MEDICAL_SEGMENTATION'
    | 'MEDICAL_CLASSIFICATION'
    | 'MEDICAL_DETECTION'
    | 'MEDICAL_RECONSTRUCTION'
    | 'MEDICAL_REGISTRATION'
    | 'MEDICAL_LOCALIZATION'
    // NLP sub-tasks
    | 'TEXT_CLASSIFICATION'
    | 'NAMED_ENTITY_RECOGNITION'
    | 'QUESTION_ANSWERING'
    | 'SUMMARIZATION'
    | 'TRANSLATION'
    | 'SENTIMENT_ANALYSIS'
    | 'LANGUAGE_MODELING'
    // Tabular / Time-series
    | 'TABULAR_CLASSIFICATION'
    | 'TABULAR_REGRESSION'
    | 'TIME_SERIES_FORECASTING'
    | 'ANOMALY_DETECTION'
    // Robotics
    | 'ROBOTIC_MANIPULATION'
    | 'IMITATION_LEARNING'
    | 'REINFORCEMENT_LEARNING'
    // General
    | 'RECONSTRUCTION'
    | 'REGRESSION'
    | 'CLUSTERING'
    | 'RETRIEVAL'
    | 'DISCOVERY';

// ── Task Hierarchy: Parent → Children ─────────────────────────────────────────
//
// Tasks within the same parent group are "siblings" — they share a domain
// but differ in outputs. Siblings get a partial penalty (not full zero).
// Tasks from different parent groups get a full penalty.

const TASK_PARENT: Partial<Record<CanonicalTask, string>> = {
    IMAGE_CLASSIFICATION:      'VISION',
    OBJECT_DETECTION:          'VISION',
    INSTANCE_SEGMENTATION:     'VISION',
    SEMANTIC_SEGMENTATION:     'VISION',
    KEYPOINT_POSE_ESTIMATION:  'VISION',
    DEPTH_ESTIMATION:          'VISION',
    IMAGE_GENERATION:          'VISION',
    IMAGE_CAPTIONING:          'VISION',
    VIDEO_CLASSIFICATION:      'VIDEO',
    VIDEO_OBJECT_TRACKING:     'VIDEO',
    ACTION_RECOGNITION:        'VIDEO',
    OPTICAL_FLOW:              'VIDEO',
    AUTOMATIC_SPEECH_RECOGNITION: 'AUDIO',
    AUDIO_CLASSIFICATION:      'AUDIO',
    ACOUSTIC_EVENT_DETECTION:  'AUDIO',
    SPEAKER_DIARIZATION:       'AUDIO',
    SPEECH_SYNTHESIS:          'AUDIO',
    AUDIO_GENERATION:          'AUDIO',
    EMOTION_RECOGNITION_AUDIO: 'AUDIO',
    MEDICAL_SEGMENTATION:      'MEDICAL',
    MEDICAL_CLASSIFICATION:    'MEDICAL',
    MEDICAL_DETECTION:         'MEDICAL',
    MEDICAL_RECONSTRUCTION:    'MEDICAL',
    MEDICAL_REGISTRATION:      'MEDICAL',
    MEDICAL_LOCALIZATION:      'MEDICAL',
    TEXT_CLASSIFICATION:       'NLP',
    NAMED_ENTITY_RECOGNITION:  'NLP',
    QUESTION_ANSWERING:        'NLP',
    SUMMARIZATION:             'NLP',
    TRANSLATION:               'NLP',
    SENTIMENT_ANALYSIS:        'NLP',
    LANGUAGE_MODELING:         'NLP',
    TABULAR_CLASSIFICATION:    'TABULAR',
    TABULAR_REGRESSION:        'TABULAR',
    TIME_SERIES_FORECASTING:   'TIME_SERIES',
    ANOMALY_DETECTION:         'TIME_SERIES',
    ROBOTIC_MANIPULATION:      'ROBOTICS',
    IMITATION_LEARNING:        'ROBOTICS',
    REINFORCEMENT_LEARNING:    'ROBOTICS',
};

// ── Task Overlap Scores ───────────────────────────────────────────────────────
//
// Overrides for partially-compatible task pairs that span parent groups.
// E.g., IMAGE_CLASSIFICATION and VIDEO_CLASSIFICATION are different tasks
// but share "classification" as a common operation — partial compatibility.

const TASK_PARTIAL_OVERLAPS: Partial<Record<string, number>> = {
    'IMAGE_CLASSIFICATION::VIDEO_CLASSIFICATION': 0.55,
    'VIDEO_CLASSIFICATION::IMAGE_CLASSIFICATION': 0.55,
    'OBJECT_DETECTION::INSTANCE_SEGMENTATION': 0.60,
    'INSTANCE_SEGMENTATION::OBJECT_DETECTION': 0.60,
    'SEMANTIC_SEGMENTATION::INSTANCE_SEGMENTATION': 0.65,
    'INSTANCE_SEGMENTATION::SEMANTIC_SEGMENTATION': 0.65,
    'SEMANTIC_SEGMENTATION::MEDICAL_SEGMENTATION': 0.50,
    'MEDICAL_SEGMENTATION::SEMANTIC_SEGMENTATION': 0.50,
    'MEDICAL_CLASSIFICATION::IMAGE_CLASSIFICATION': 0.45,
    'IMAGE_CLASSIFICATION::MEDICAL_CLASSIFICATION': 0.45,
    'MEDICAL_DETECTION::OBJECT_DETECTION': 0.45,
    'OBJECT_DETECTION::MEDICAL_DETECTION': 0.45,
    'AUDIO_CLASSIFICATION::EMOTION_RECOGNITION_AUDIO': 0.70,
    'EMOTION_RECOGNITION_AUDIO::AUDIO_CLASSIFICATION': 0.70,
    'ACOUSTIC_EVENT_DETECTION::AUDIO_CLASSIFICATION': 0.60,
    'AUDIO_CLASSIFICATION::ACOUSTIC_EVENT_DETECTION': 0.60,
    'TEXT_CLASSIFICATION::SENTIMENT_ANALYSIS': 0.65,
    'SENTIMENT_ANALYSIS::TEXT_CLASSIFICATION': 0.65,
    'TABULAR_CLASSIFICATION::ANOMALY_DETECTION': 0.40,
    'ANOMALY_DETECTION::TABULAR_CLASSIFICATION': 0.40,
    'ROBOTIC_MANIPULATION::IMITATION_LEARNING': 0.80,
    'IMITATION_LEARNING::ROBOTIC_MANIPULATION': 0.80,
    // Action recognition and video classification share "temporal visual event understanding"
    'ACTION_RECOGNITION::VIDEO_CLASSIFICATION': 0.75,
    'VIDEO_CLASSIFICATION::ACTION_RECOGNITION': 0.75,
    // Medical segmentation and classification share the medical imaging domain
    'MEDICAL_SEGMENTATION::MEDICAL_CLASSIFICATION': 0.45,
    'MEDICAL_CLASSIFICATION::MEDICAL_SEGMENTATION': 0.45,
    'MEDICAL_SEGMENTATION::MEDICAL_DETECTION': 0.55,
    'MEDICAL_DETECTION::MEDICAL_SEGMENTATION': 0.55,
};

// ── Text Pattern → CanonicalTask Mapping ─────────────────────────────────────

const TASK_SIGNALS: [RegExp, CanonicalTask][] = [
    // Audio tasks (check before generic vision)
    [/speech\s*(?:emotion|affect)|emotion\s*(?:recogni|classif|detect)\s*(?:from\s*)?(?:speech|audio|voice)/i, 'EMOTION_RECOGNITION_AUDIO'],
    [/automatic\s*speech\s*recogni|asr\b|speech.to.text|transcri/i, 'AUTOMATIC_SPEECH_RECOGNITION'],
    [/speaker\s*diariz/i, 'SPEAKER_DIARIZATION'],
    [/audio\s*classif|sound\s*classif/i, 'AUDIO_CLASSIFICATION'],
    [/acoustic\s*event\s*detect|sound\s*event\s*detect/i, 'ACOUSTIC_EVENT_DETECTION'],
    [/text.to.speech|speech\s*synth|tts\b/i, 'SPEECH_SYNTHESIS'],
    // Medical tasks — broad pattern: any anatomical/clinical segmentation
    [/medic(?:al)?\s*segment|organ\s*segment|tumor\s*segment|coronary\s*segment|coronary.*(?:ct|cta|artery).*segment|(?:ct|mri|cta)\s*segment|vessel\s*segment|artery\s*segment|cardiac\s*segment|lung\s*segment|prostate\s*segment|liver\s*segment/i, 'MEDICAL_SEGMENTATION'],
    [/medic(?:al)?\s*classif|disease\s*classif|pathol\s*classif/i, 'MEDICAL_CLASSIFICATION'],
    [/medic(?:al)?\s*detect|lesion\s*detect|nodule\s*detect/i, 'MEDICAL_DETECTION'],
    [/medic(?:al)?\s*reconstruct|mri\s*reconstruct|ct\s*reconstruct/i, 'MEDICAL_RECONSTRUCTION'],
    [/image\s*registrat|spatial\s*alignment|deformable\s*registrat/i, 'MEDICAL_REGISTRATION'],
    [/lesion\s*localiz|tumor\s*localiz|medic.*localiz/i, 'MEDICAL_LOCALIZATION'],
    // Vision tasks
    [/keypoint|pose\s*estimat|skeleton\s*detect|human\s*pose/i, 'KEYPOINT_POSE_ESTIMATION'],
    [/instance\s*segment/i, 'INSTANCE_SEGMENTATION'],
    [/semantic\s*segment|panoptic\s*segment/i, 'SEMANTIC_SEGMENTATION'],
    [/object\s*detect|bounding\s*box|locali[sz](?:ation)/i, 'OBJECT_DETECTION'],
    [/depth\s*estimat/i, 'DEPTH_ESTIMATION'],
    [/image\s*generat|image\s*synthes/i, 'IMAGE_GENERATION'],
    [/image\s*caption/i, 'IMAGE_CAPTIONING'],
    // Video tasks — must come BEFORE generic IMAGE_CLASSIFICATION to prevent 'recognition' capture
    [/action\s*recogni|activity\s*recogni/i, 'ACTION_RECOGNITION'],
    [/optical\s*flow/i, 'OPTICAL_FLOW'],
    [/object\s*track|multi.object\s*track|mot\b/i, 'VIDEO_OBJECT_TRACKING'],
    [/video\s*classif/i, 'VIDEO_CLASSIFICATION'],
    // Generic image classification — must NOT match 'action recognition' or 'activity recognition'
    [/image\s*classif|photo\s*classif|visual\s*classif|(?<!action\s*)(?<!activity\s*)recognition(?!\s*audio)/i, 'IMAGE_CLASSIFICATION'],

    // NLP tasks
    [/sentiment\s*analys|opinion\s*mining/i, 'SENTIMENT_ANALYSIS'],
    [/named\s*entity|ner\b/i, 'NAMED_ENTITY_RECOGNITION'],
    [/question\s*answer|qa\b/i, 'QUESTION_ANSWERING'],
    [/summar(?:ize|ization)/i, 'SUMMARIZATION'],
    [/translat(?:ion|e)/i, 'TRANSLATION'],
    [/text\s*classif|document\s*classif|sentence\s*classif/i, 'TEXT_CLASSIFICATION'],
    [/language\s*model|fill.mask|text\s*generat/i, 'LANGUAGE_MODELING'],
    // Tabular / Time-series
    [/time.?series\s*(?:forecast|predict)/i, 'TIME_SERIES_FORECASTING'],
    [/anomaly\s*detect/i, 'ANOMALY_DETECTION'],
    [/tabular\s*classif/i, 'TABULAR_CLASSIFICATION'],
    [/tabular\s*regress/i, 'TABULAR_REGRESSION'],
    // Robotics
    [/imitation\s*learn|behavior\s*clon/i, 'IMITATION_LEARNING'],
    [/robotic\s*manipul|pick.and.place|grasp|robot\s*arm/i, 'ROBOTIC_MANIPULATION'],
    [/reinforce(?:ment)?\s*learn|policy\s*gradient/i, 'REINFORCEMENT_LEARNING'],
    // General
    [/reconstruct(?:ion)?/i, 'RECONSTRUCTION'],
    [/regress(?:ion)?/i, 'REGRESSION'],
    [/cluster(?:ing)?/i, 'CLUSTERING'],
    [/retriev(?:al|e)|search/i, 'RETRIEVAL'],
];

// ── HuggingFace pipeline_tag → CanonicalTask ─────────────────────────────────

const HF_PIPELINE_TAG_MAP: Record<string, CanonicalTask> = {
    'audio-classification':       'AUDIO_CLASSIFICATION',
    'automatic-speech-recognition': 'AUTOMATIC_SPEECH_RECOGNITION',
    'text-to-speech':             'SPEECH_SYNTHESIS',
    'audio-to-audio':             'AUDIO_CLASSIFICATION',
    'image-classification':       'IMAGE_CLASSIFICATION',
    'object-detection':           'OBJECT_DETECTION',
    'image-segmentation':         'SEMANTIC_SEGMENTATION',
    'instance-segmentation':      'INSTANCE_SEGMENTATION',
    'keypoint-detection':         'KEYPOINT_POSE_ESTIMATION',
    'depth-estimation':           'DEPTH_ESTIMATION',
    'image-to-image':             'IMAGE_GENERATION',
    'video-classification':       'VIDEO_CLASSIFICATION',
    'text-classification':        'TEXT_CLASSIFICATION',
    'token-classification':       'NAMED_ENTITY_RECOGNITION',
    'question-answering':         'QUESTION_ANSWERING',
    'summarization':              'SUMMARIZATION',
    'translation':                'TRANSLATION',
    'fill-mask':                  'LANGUAGE_MODELING',
    'text-generation':            'LANGUAGE_MODELING',
    'feature-extraction':         'RETRIEVAL',
    'tabular-classification':     'TABULAR_CLASSIFICATION',
    'tabular-regression':         'TABULAR_REGRESSION',
    'time-series-forecasting':    'TIME_SERIES_FORECASTING',
    'robotics':                   'ROBOTIC_MANIPULATION',
    'reinforcement-learning':     'REINFORCEMENT_LEARNING',
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
Classify a text snippet (query or candidate metadata blob) into a CanonicalTask.
Returns 'DISCOVERY' if no specific task can be determined.

## Signature
```typescript
function classifyTask(text: string): CanonicalTask | 'DISCOVERY'
```
