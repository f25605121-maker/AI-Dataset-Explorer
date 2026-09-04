/**
 * Cross-Domain Retrieval & Ranking Engine Verification Tests
 *
 * Tests the universal modality gate, task alignment matrix, and composite
 * scoring formula across three distinct problem spaces:
 *
 * 1. Audio: Speech Emotion Recognition
 *    — must reject robotics, image, text-only, medical imaging datasets
 *
 * 2. Medical: Coronary Artery CT Segmentation
 *    — must reject tabular health surveys, MRI brain, audio datasets
 *
 * 3. Automotive/Video: Driver Fatigue Detection
 *    — must reject medical ultrasound, static face recognition, tabular telematics
 *
 * CRITICAL RULE: No hardcoded if/else for specific datasets.
 * All rejections must come from the generalized matrix logic.
 */

import {
    checkModalityCompatibility,
    classifyModalityGroup,
    classifyQueryModalityGroup,
    ModalityGroup,
} from '../../src/server/search/modalityCompatibilityMatrix';
import {
    getTaskAlignmentScore,
    classifyTask,
    CanonicalTask,
} from '../../src/server/search/taskAlignmentMatrix';

// ── Test Harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
    if (condition) {
        console.log(`  ✓ ${label}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
        failed++;
    }
}

function assertModalityRejected(candidateBlob: string, queryText: string, label: string): void {
    const result = checkModalityCompatibility(candidateBlob, queryText);
    assert(
        result.compatibilityScore === 0,
        label,
        `Expected rejection but got [${result.candidateModalityGroup}] compatible with [${result.queryModalityGroup}]`
    );
}

function assertModalityPassed(candidateBlob: string, queryText: string, label: string): void {
    const result = checkModalityCompatibility(candidateBlob, queryText);
    assert(
        result.compatibilityScore === 1,
        label,
        `Expected pass but got rejected: ${result.rejectionReason}`
    );
}

function assertTaskClassification(text: string, expected: CanonicalTask | 'DISCOVERY', label: string): void {
    const result = classifyTask(text);
    assert(result === expected, label, `Expected ${expected} but got ${result}`);
}

function assertQueryModalityGroup(query: string, expected: ModalityGroup, label: string): void {
    const result = classifyQueryModalityGroup(query);
    assert(result === expected, label, `Expected ${expected} but got ${result}`);
}

// ── TEST 1: Audio — Speech Emotion Recognition ────────────────────────────────

console.log('\n═══ TEST 1: Audio — Speech Emotion Recognition ═══');
const audioQuery = 'speech emotion recognition audio dataset';

// Query should be classified as AUDIO modality
assertQueryModalityGroup(audioQuery, 'AUDIO', 'Query modality classified as AUDIO');

// Task classification
assertTaskClassification(audioQuery, 'EMOTION_RECOGNITION_AUDIO', 'Query task classified as EMOTION_RECOGNITION_AUDIO');

// ✓ SHOULD PASS: Genuine audio/speech datasets
assertModalityPassed(
    'speech emotion recognition IEMOCAP RAVDESS wav audio affective computing',
    audioQuery,
    'IEMOCAP speech corpus — should pass (audio)'
);
assertModalityPassed(
    'emotion speech dataset wav utterances label anger sadness neutral happiness',
    audioQuery,
    'Labeled emotion speech dataset — should pass (audio)'
);

// ✗ SHOULD REJECT: Robotics / robot manipulation
assertModalityRejected(
    'robot arm manipulation imitation learning lerobot proprioception joint angle sensor',
    audioQuery,
    'Robot manipulation dataset — must be rejected (ROBOTICS_SENSOR vs AUDIO)'
);

// ✗ SHOULD REJECT: Natural image / vision datasets
assertModalityRejected(
    'image classification rgb natural images imagenet resnet visual recognition',
    audioQuery,
    'ImageNet-style visual dataset — must be rejected (VISION_NATURAL vs AUDIO)'
);

// ✗ SHOULD REJECT: NLP / text-only datasets
assertModalityRejected(
    'sentiment analysis text classification NLP document opinion mining corpus',
    audioQuery,
    'Text sentiment NLP dataset — must be rejected (TEXT_NLP vs AUDIO)'
);

// ✗ SHOULD REJECT: Medical imaging (MRI, CT)
assertModalityRejected(
    'brain MRI neuroimaging alzheimer MCI ADNI longitudinal scan dicom nifti',
    audioQuery,
    'Brain MRI dataset — must be rejected (VISION_MEDICAL vs AUDIO)'
);

// ✗ SHOULD REJECT: Tabular health survey
assertModalityRejected(
    'health survey tabular CSV questionnaire nhanes brfss electronic health records',
    audioQuery,
    'Tabular health survey — must be rejected (TABULAR vs AUDIO)'
);

// Task alignment: audio emotion vs audio classification (sibling) — partial, not zero
const emotionVsClassification = getTaskAlignmentScore(
    'speech emotion recognition',
    'audio classification sound events'
);
assert(
    emotionVsClassification.score > 0.5 && emotionVsClassification.matchType === 'PARTIAL_OVERLAP',
    'Speech emotion vs audio classification — partial overlap (not orthogonal)',
    `Score: ${emotionVsClassification.score}, Type: ${emotionVsClassification.matchType}`
);

// Task alignment: audio emotion vs image classification (orthogonal) — near zero
const emotionVsImageClassif = getTaskAlignmentScore(
    'speech emotion recognition',
    'image classification visual recognition'
);
assert(
    emotionVsImageClassif.score <= 0.15 && emotionVsImageClassif.matchType === 'ORTHOGONAL',
    'Speech emotion vs image classification — orthogonal (score ≤ 0.15)',
    `Score: ${emotionVsImageClassif.score}, Type: ${emotionVsImageClassif.matchType}`
);

// ── TEST 2: Medical — Coronary Artery CT Segmentation ─────────────────────────

console.log('\n═══ TEST 2: Medical — Coronary Artery CT Segmentation ═══');
const medicalQuery = 'coronary artery CT angiography segmentation';

// Query should be classified as VISION_MEDICAL
assertQueryModalityGroup(medicalQuery, 'VISION_MEDICAL', 'Query modality classified as VISION_MEDICAL');

// Task classification
assertTaskClassification(
    'coronary artery segmentation CT',
    'MEDICAL_SEGMENTATION',
    'Coronary CT query classified as MEDICAL_SEGMENTATION'
);

// ✓ SHOULD PASS: CT cardiovascular datasets
assertModalityPassed(
    'coronary artery CT angiography segmentation CCTA vessel label 3D',
    medicalQuery,
    'Coronary CT angiography dataset — should pass (VISION_MEDICAL)'
);
assertModalityPassed(
    'cardiac CT computed tomography calcium scoring CAD dicom nifti',
    medicalQuery,
    'Cardiac CT calcium scoring dataset — should pass (VISION_MEDICAL)'
);

// ✗ SHOULD REJECT: Tabular health surveys / clinical trial data
assertModalityRejected(
    'tabular health survey questionnaire clinical trial data CSV NHANES cardiovascular risk',
    medicalQuery,
    'Tabular cardiovascular health survey — must be rejected (TABULAR vs VISION_MEDICAL)'
);

// ✗ SHOULD REJECT: Audio / speech datasets
assertModalityRejected(
    'speech emotion audio wav acoustic affective computing voice recognition',
    medicalQuery,
    'Audio speech dataset — must be rejected (AUDIO vs VISION_MEDICAL)'
);

// ✗ SHOULD REJECT: NLP text datasets (pure text, no imaging)
assertModalityRejected(
    'NLP text classification sentiment natural language processing corpus document',
    medicalQuery,
    'Clinical NLP text dataset — must be rejected (TEXT_NLP vs VISION_MEDICAL)'
);

// ✓ SHOULD PASS: MRI cardiac (same medical imaging family — not rejected)
assertModalityPassed(
    'cardiac MRI cine 4D flow magnetic resonance imaging cardiac segmentation',
    medicalQuery,
    'Cardiac MRI dataset — should pass (VISION_MEDICAL, same family)'
);

// Task alignment: medical segmentation vs medical classification (sibling)
const segVsClassif = getTaskAlignmentScore('coronary artery CT segmentation', 'disease classification medical imaging');
assert(
    segVsClassif.score >= 0.3 && segVsClassif.score < 0.7,
    'Medical segmentation vs medical classification — partial score (0.3-0.7)',
    `Score: ${segVsClassif.score}, Type: ${segVsClassif.matchType}`
);

// Task alignment: medical segmentation vs audio classification (orthogonal)
const segVsAudio = getTaskAlignmentScore('coronary segmentation', 'audio classification sound');
assert(
    segVsAudio.score <= 0.15 && segVsAudio.matchType === 'ORTHOGONAL',
    'Medical segmentation vs audio classification — orthogonal',
    `Score: ${segVsAudio.score}, Type: ${segVsAudio.matchType}`
);

// ── TEST 3: Automotive/Video — Driver Fatigue Detection ───────────────────────

console.log('\n═══ TEST 3: Automotive/Video — Driver Fatigue Detection ═══');
const automotiveQuery = 'driver fatigue detection video classification';

// Query should be classified as VIDEO_NATURAL
assertQueryModalityGroup(automotiveQuery, 'VIDEO_NATURAL', 'Query modality classified as VIDEO_NATURAL');

// Task classification
assertTaskClassification(
    'driver fatigue detection video classification',
    'VIDEO_CLASSIFICATION',
    'Driver fatigue query classified as VIDEO_CLASSIFICATION'
);

// ✓ SHOULD PASS: Video surveillance / driving datasets
assertModalityPassed(
    'driver drowsiness detection video dashboard camera eye closure yawn',
    automotiveQuery,
    'Driver drowsiness video dataset — should pass (VIDEO_NATURAL)'
);
assertModalityPassed(
    'facial action video surveillance CCTV classification action recognition',
    automotiveQuery,
    'Video surveillance facial action dataset — should pass (VIDEO_NATURAL)'
);

// ✗ SHOULD REJECT: Medical ultrasound
assertModalityRejected(
    'ultrasound echocardiography medical imaging cardiac sonography probe',
    automotiveQuery,
    'Medical ultrasound dataset — must be rejected (MEDICAL_ACOUSTIC vs VIDEO_NATURAL)'
);

// ✗ SHOULD REJECT: Medical MRI/CT
assertModalityRejected(
    'brain MRI scan dicom nifti cerebral neuroimaging magnetic resonance',
    automotiveQuery,
    'Brain MRI dataset — must be rejected (VISION_MEDICAL vs VIDEO_NATURAL)'
);

// ✗ SHOULD REJECT: Tabular telematics data
assertModalityRejected(
    'tabular telematics driving sensor CSV accelerometer speed throttle GPS logs',
    automotiveQuery,
    'Tabular telematics dataset — must be rejected (TABULAR vs VIDEO_NATURAL)'
);

// ✗ SHOULD REJECT: Audio-only datasets
assertModalityRejected(
    'speech audio wav acoustic recognition voice classification emotion',
    automotiveQuery,
    'Audio speech dataset — must be rejected (AUDIO vs VIDEO_NATURAL)'
);

// ✗ SHOULD REJECT: NLP text
assertModalityRejected(
    'text classification sentiment NLP document corpus tokenize',
    automotiveQuery,
    'NLP text dataset — must be rejected (TEXT_NLP vs VIDEO_NATURAL)'
);

// Task alignment: video classification vs image classification (sibling, different sub-task)
const videoVsImage = getTaskAlignmentScore(
    'driver fatigue video classification',
    'image classification static face recognition'
);
assert(
    videoVsImage.score < 0.80 && videoVsImage.score > 0.40,
    'Video classification vs image classification — partial overlap (not exact match)',
    `Score: ${videoVsImage.score}, Type: ${videoVsImage.matchType}`
);

// Task alignment: video classification vs action recognition (near-exact overlap)
const videoVsAction = getTaskAlignmentScore(
    'driver fatigue video classification',
    'action recognition activity detection'
);
assert(
    videoVsAction.score >= 0.65,
    'Video classification vs action recognition — high overlap (≥ 0.65)',
    `Score: ${videoVsAction.score}, Type: ${videoVsAction.matchType}`
);

// ── SUMMARY ────────────────────────────────────────────────────────────────────

console.log('\n═══ VERIFICATION SUMMARY ═══');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed > 0) {
    console.error('\n❌ SOME TESTS FAILED — review modality gate or task alignment matrix.');
    process.exit(1);
} else {
    console.log('\n✅ ALL TESTS PASSED — generalized retrieval and ranking engine verified.');
}
