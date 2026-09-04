import { classifyPaperRelationship } from '@/server/papers/paperClassifier';
import { scorePaper } from '@/server/papers/paperScorer';
import { parseQuery } from '@/server/query-understanding/queryParser';

function runClassificationTests() {
    console.log('=== TEST RELATIONSHIP CLASSIFIER & SCORER ===');
    const qu = parseQuery('Project-IRA/TPSoSe2026_Dataset_Collection_LeRobot_SO101');

    // Case 1: Paper with exact repository identifier in abstract
    const exactPaper = {
        title: 'Imitation Learning on SO-101 Arms using TPSoSe2026 Dataset Collection',
        abstract: 'We present experiments with Project-IRA/TPSoSe2026_Dataset_Collection_LeRobot_SO101 collected using LeRobot teleoperation.',
        year: 2026,
        sources: ['arXiv'],
    };
    const rel1 = classifyPaperRelationship(exactPaper as any, {
        queryUnderstanding: qu,
        allDatasets: [{ id: 'Project-IRA/TPSoSe2026_Dataset_Collection_LeRobot_SO101' }],
    });
    console.log('Case 1 (Exact Dataset Mention):', rel1);
    if (rel1.relationship !== 'EXACT_DATASET') {
        throw new Error(`Expected EXACT_DATASET but got ${rel1.relationship}`);
    }

    // Case 2: Paper with same robot platform and task
    const directlyRelatedPaper = {
        title: 'Vision-Language-Action Models for SO-101 Robot Arm Manipulation',
        abstract: 'We benchmark imitation learning algorithms on the low-cost SO-101 open-source robotic arm.',
        year: 2025,
        sources: ['arXiv'],
    };
    const rel2 = classifyPaperRelationship(directlyRelatedPaper as any, {
        queryUnderstanding: qu,
    });
    console.log('Case 2 (Platform Match):', rel2);
    if (rel2.relationship !== 'DIRECTLY_RELATED') {
        throw new Error(`Expected DIRECTLY_RELATED but got ${rel2.relationship}`);
    }

    // Case 3: Paper without explicit evidence (should never be labeled exact)
    const generalPaper = {
        title: 'Advances in Deep Reinforcement Learning for Robotic Control',
        abstract: 'A survey of policy gradient methods and model-free RL for robotic arms.',
        year: 2024,
        sources: ['Semantic Scholar'],
    };
    const rel3 = classifyPaperRelationship(generalPaper as any, {
        queryUnderstanding: qu,
    });
    console.log('Case 3 (General Research):', rel3);
    if (rel3.relationship !== 'RELATED_RESEARCH') {
        throw new Error(`Expected RELATED_RESEARCH but got ${rel3.relationship}`);
    }

    // Test Scorer
    const scored = scorePaper(
        {
            ...exactPaper,
            id: 'arxiv:2601.12345',
            venue: 'arXiv',
            citationCount: 5,
            openAccess: true,
            isPreprint: true,
            authors: ['Researcher A', 'Researcher B'],
            relationship: rel1.relationship,
            relationshipEvidence: rel1.evidence,
        } as any,
        {
            queryUnderstanding: qu,
            allDatasets: [{ id: 'Project-IRA/TPSoSe2026_Dataset_Collection_LeRobot_SO101' }],
        }
    );

    console.log('AI Relevance Score Calculation:', {
        relevanceScore: scored.relevanceScore,
        breakdown: scored.scoreBreakdown,
        whyRelevant: scored.whyRelevant,
    });

    if (scored.relevanceScore < 70) {
        throw new Error(`Expected high relevance score for exact paper, got ${scored.relevanceScore}`);
    }

    console.log('=== CLASSIFICATION & SCORING TESTS PASSED ===');
}

runClassificationTests();
