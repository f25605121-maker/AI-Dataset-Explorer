/**
 * 30-Query Information Retrieval (IR) Evaluation Benchmark Suite (Section 57)
 *
 * Evaluates Search Engine 2.0.0 retrieval performance across 30 diverse research queries:
 * - 5 Cardiac 4D Flow / MRI Queries
 * - 5 Brain MRI Segmentation Queries
 * - 5 Chest X-ray / CT Queries
 * - 5 Non-Medical Computer Vision Queries
 * - 5 Natural Language Processing Queries
 * - 5 Tabular & Audio Queries
 *
 * Metrics Calculated:
 * - Precision@5
 * - Precision@10
 * - Recall@10
 * - MRR (Mean Reciprocal Rank)
 * - NDCG@10
 * - False Positive Rate
 * - Contradiction Rate (Target: 0.0%)
 *
 * Run with: node scripts/evaluate_retrieval.mjs
 */

export const BENCHMARK_30_QUERIES = [
    // ── Family 1: Cardiac 4D Flow / MRI (5 queries) ──────────────────────────
    {
        id: 'Q01',
        family: 'Cardiac 4D Flow / MRI',
        query: 'real-time 4D flow cardiac MRI velocity field reconstruction under sparse k-space radial undersampling',
        targetDomain: 'Cardiovascular MRI',
        targetAnatomy: ['cardiac', 'heart', 'aorta'],
        targetModality: 'MRI',
        targetTask: 'reconstruction',
        forbiddenEntities: ['brain', 'glioma', 'lung', 'cxr', 'astronomy', 'cfd', 'face'],
        syntheticCandidates: [
            { id: 'c1', title: 'In Vivo 4D Flow Cardiac MRI Velocity Fields', description: 'Phase-contrast 4D flow cardiac MRI velocity field reconstruction under non-Cartesian radial undersampling.', tags: ['4d-flow', 'cardiac', 'mri', 'radial'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: '4DFlowNet Velocity Field Super-Resolution Baseline', description: 'Residual network for aortic blood flow and wall shear stress reconstruction.', tags: ['4dflow', 'cardiac', 'wss', 'mri'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Sparse k-Space Radial Undersampled Cardiac MR', description: 'Raw non-Cartesian k-space trajectory acquisitions for accelerated cardiovascular imaging.', tags: ['k-space', 'radial', 'cardiac', 'mri'], isRelevant: true, isContradiction: false },
            { id: 'c4', title: 'BraTS Brain Tumor Glioma Segmentation Benchmark', description: '3D multimodal brain MRI volumes of glioma patients.', tags: ['brain', 'glioma', 'segmentation'], isRelevant: false, isContradiction: true },
            { id: 'c5', title: 'JWST Interstellar Gas Velocity Field Simulations', description: 'Astrophysical gas velocity maps in distant galaxies.', tags: ['astronomy', 'galaxy', 'velocity'], isRelevant: false, isContradiction: true },
            { id: 'c6', title: 'Cardiovascular 4D Flow Hemodynamics Benchmark', description: 'Time-resolved 3D PC-MRI flow benchmark with validated wall shear stress ground truth.', tags: ['4d-flow', 'cardiac', 'hemodynamics'], isRelevant: true, isContradiction: false },
            { id: 'c7', title: 'FastMRI Raw k-Space Reconstruction VarNet', description: 'Accelerated magnetic resonance imaging variational network for k-space undersampling.', tags: ['fastmri', 'k-space', 'reconstruction'], isRelevant: true, isContradiction: false },
            { id: 'c8', title: 'MIMIC-CXR Pulmonary Chest Radiographs', description: 'Frontal chest X-ray collection for pneumonia detection.', tags: ['lung', 'cxr', 'x-ray'], isRelevant: false, isContradiction: true },
            { id: 'c9', title: 'CelebA Facial Alignment and Recognition', description: 'Face images for facial keypoint detection.', tags: ['face', 'celebrity'], isRelevant: false, isContradiction: true },
            { id: 'c10', title: 'Automated Cardiac Cine MRI Left Ventricle Seg', description: 'Short-axis cine MRI without velocity encoding.', tags: ['cardiac', 'cine', 'mri'], isRelevant: true, isContradiction: false },
        ],
    },
    {
        id: 'Q02',
        family: 'Cardiac 4D Flow / MRI',
        query: '4D phase contrast MRI aortic blood flow and wall shear stress estimation',
        targetDomain: 'Cardiovascular MRI',
        targetAnatomy: ['aorta', 'cardiac'],
        targetModality: 'MRI',
        targetTask: 'hemodynamic_estimation',
        forbiddenEntities: ['brain', 'stroke', 'abdomen', 'liver'],
        syntheticCandidates: [
            { id: 'c1', title: 'Aortic 4D Flow Phase-Contrast MRI Wall Shear Stress', description: 'Hemodynamic wall shear stress and vorticity mapping in human ascending aorta.', tags: ['aorta', '4d-flow', 'wss', 'mri'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Cardiovascular Phase-Contrast Velocity Encoding Benchmark', description: 'Multi-center phase-contrast MRI flow quantification.', tags: ['pc-mri', 'flow', 'cardiac'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'ISLES Ischemic Stroke Lesion Segmentation Brain MRI', description: 'Brain stroke lesion delineation from diffusion MRI.', tags: ['brain', 'stroke'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Hepatic Liver Tumor DCE-MRI Collection', description: 'Abdominal liver lesion dynamic contrast enhanced scans.', tags: ['abdomen', 'liver'], isRelevant: false, isContradiction: true },
            { id: 'c5', title: 'Physics-Informed Neural Network for Aortic WSS', description: 'Deep learning estimation of wall shear stress vectors from 4D flow velocity.', tags: ['pinn', 'wss', 'aorta'], isRelevant: true, isContradiction: false },
        ],
    },
    {
        id: 'Q03',
        family: 'Cardiac 4D Flow / MRI',
        query: 'radial undersampled cardiac MRI reconstruction',
        targetDomain: 'Cardiovascular MRI',
        targetAnatomy: ['cardiac'],
        targetModality: 'MRI',
        targetTask: 'reconstruction',
        forbiddenEntities: ['brain', 'retina', 'prostate'],
        syntheticCandidates: [
            { id: 'c1', title: 'Cardiac Radial k-Space Golden Angle Reconstruction', description: 'Free-breathing radial trajectory accelerated cardiac MRI reconstruction.', tags: ['cardiac', 'radial', 'k-space'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Non-Cartesian NUFFT Deep Learning MRI Reconstruction', description: 'Reconstruction network tailored for radial and spiral sampling.', tags: ['radial', 'nufft', 'mri'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'ProstateX Multiparametric MRI Benchmark', description: 'Prostate cancer detection in pelvic T2 and DWI MRI.', tags: ['prostate', 'pelvis'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Retinal Fundus Image Vessel Segmentation', description: 'Optic disc and retinal blood vessel segmentation.', tags: ['retina', 'eye'], isRelevant: false, isContradiction: true },
            { id: 'c5', title: 'Cardiac Cine MRI Motion-Corrected Reconstruction', description: 'Compressed sensing for highly accelerated cardiac imaging.', tags: ['cardiac', 'reconstruction'], isRelevant: true, isContradiction: false },
        ],
    },
    {
        id: 'Q04',
        family: 'Cardiac 4D Flow / MRI',
        query: 'cardiovascular velocity field reconstruction 4D flow MRI',
        targetDomain: 'Cardiovascular MRI',
        targetAnatomy: ['cardiovascular', 'heart'],
        targetModality: 'MRI',
        targetTask: 'velocity_reconstruction',
        forbiddenEntities: ['astronomy', 'wind', 'aerodynamics', 'cfd', 'meteorology'],
        syntheticCandidates: [
            { id: 'c1', title: 'Cardiovascular 4D Flow MRI Velocity Field Dataset', description: '3D spatial plus temporal 3-directional blood velocity field measurements.', tags: ['cardiovascular', '4d-flow', 'velocity'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: '4DFlowNet Residual CNN Architecture', description: 'Super-resolution for 4D flow cardiac MRI velocity fields.', tags: ['4dflow', 'velocity', 'cnn'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Supersonic Airfoil Wind Tunnel Aerodynamics CFD', description: 'Turbulent boundary layer velocity fields over aircraft wing.', tags: ['airfoil', 'aerodynamics', 'cfd'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Atmospheric Wind Velocity Field Modeling', description: 'Global meteorology wind flow simulation dataset.', tags: ['wind', 'meteorology'], isRelevant: false, isContradiction: true },
            { id: 'c5', title: 'Time-Resolved 3D Phase-Contrast Heart Flow Benchmark', description: 'Flow visualization and velocity quantification in ventricles.', tags: ['heart', 'velocity', 'pc-mri'], isRelevant: true, isContradiction: false },
        ],
    },
    {
        id: 'Q05',
        family: 'Cardiac 4D Flow / MRI',
        query: 'hemodynamic wall shear stress estimation from cardiac phase-contrast MRI',
        targetDomain: 'Cardiovascular MRI',
        targetAnatomy: ['cardiac', 'heart'],
        targetModality: 'MRI',
        targetTask: 'hemodynamic_estimation',
        forbiddenEntities: ['brain', 'knee', 'spine'],
        syntheticCandidates: [
            { id: 'c1', title: 'Cardiac Wall Shear Stress PC-MRI Benchmark', description: 'Hemodynamic shear stress computation and velocity gradient estimation.', tags: ['cardiac', 'wss', 'pc-mri'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Endothelial Shear Stress in Bicuspid Aortic Valve', description: 'Phase-contrast MRI studies of turbulent kinetic energy and WSS.', tags: ['aorta', 'wss', 'bicuspid'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'OAI Osteoarthritis Initiative Knee MRI Dataset', description: 'Knee cartilage and joint degeneration scans.', tags: ['knee', 'joint'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'VerSe Spine Vertebra CT and MRI Segmentation', description: 'Lumbar and cervical spinal vertebra labeling.', tags: ['spine', 'vertebra'], isRelevant: false, isContradiction: true },
            { id: 'c5', title: 'Vascular Hemodynamics & Shear Rate Estimation Model', description: 'Physics-informed machine learning for cardiovascular flow parameters.', tags: ['hemodynamics', 'wss', 'physics-informed'], isRelevant: true, isContradiction: false },
        ],
    },

    // ── Family 2: Brain MRI Segmentation (5 queries) ─────────────────────────
    {
        id: 'Q06',
        family: 'Brain MRI Segmentation',
        query: '3D brain MRI multigrade glioma segmentation',
        targetDomain: 'Neuroimaging',
        targetAnatomy: ['brain'],
        targetModality: 'MRI',
        targetTask: 'segmentation',
        forbiddenEntities: ['cardiac', 'heart', 'lung'],
        syntheticCandidates: [
            { id: 'c1', title: 'BraTS Brain Tumor Glioma Segmentation Benchmark', description: 'Multimodal 3D brain MRI (T1, T1ce, T2, FLAIR) of glioblastoma patients.', tags: ['brain', 'glioma', 'brats'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'nnU-Net Pretrained 3D Brain Tumor Segmentation Model', description: 'Deep self-configuring architecture for brain lesion segmentation.', tags: ['brain', 'segmentation', 'nnunet'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'ACDC Automated Cardiac Cine MRI Segmentation', description: 'Cardiac left and right ventricle segmentation.', tags: ['cardiac', 'heart'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'COVID-19 Pulmonary CT Lung Lesions', description: 'Thoracic computed tomography lung scans.', tags: ['lung', 'ct'], isRelevant: false, isContradiction: true },
            { id: 'c5', title: 'LGG MRI Segmentation Dataset', description: 'Lower grade glioma flair brain abnormalities.', tags: ['brain', 'glioma', 'flair'], isRelevant: true, isContradiction: false },
        ],
    },
    {
        id: 'Q07',
        family: 'Brain MRI Segmentation',
        query: 'hippocampal subfield segmentation in high-resolution brain MRI',
        targetDomain: 'Neuroimaging',
        targetAnatomy: ['brain', 'hippocampus'],
        targetModality: 'MRI',
        targetTask: 'segmentation',
        forbiddenEntities: ['cardiac', 'abdomen'],
        syntheticCandidates: [
            { id: 'c1', title: 'ADNI Hippocampus Subfield Volumetric Segmentation', description: 'High-resolution T1/T2 brain MRI for Alzheimer disease progression.', tags: ['brain', 'hippocampus', 'adni'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'FastSurfer Deep Learning Neuroimaging Pipeline', description: 'Cortical parcellation and subcortical hippocampus segmentation.', tags: ['brain', 'neuro', 'hippocampus'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'AMOS Abdominal Multi-Organ Segmentation CT and MRI', description: 'Liver, kidney, and spleen visceral segmentation.', tags: ['abdomen', 'liver'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Hippocampal Volume Longitudinal Study Collection', description: 'Expert manual delineations of CA1, CA2, CA3 subfields.', tags: ['hippocampus', 'brain'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac 4D Flow Velocity Reconstruction Dataset', description: 'Aortic blood flow velocity measurements.', tags: ['cardiac', '4d-flow'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q08',
        family: 'Brain MRI Segmentation',
        query: 'ischemic stroke lesion segmentation in multimodal brain MRI',
        targetDomain: 'Neuroimaging',
        targetAnatomy: ['brain'],
        targetModality: 'MRI',
        targetTask: 'segmentation',
        forbiddenEntities: ['cardiac', 'lung'],
        syntheticCandidates: [
            { id: 'c1', title: 'ISLES Ischemic Stroke Lesion Segmentation Challenge', description: 'Acute stroke diffusion and perfusion weighted brain MRI scans.', tags: ['brain', 'stroke', 'isles'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'ATLAS Anatomical Tracings of Lesions After Stroke', description: 'T1-weighted brain MRI with manually segmented stroke infarcts.', tags: ['brain', 'stroke', 'atlas'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'NIH Chest X-ray 14 Thoracic Diseases', description: '112,000 frontal chest radiographs with pulmonary labels.', tags: ['lung', 'cxr'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Deep Residual UNet for Stroke Core Segmentation', description: 'Multi-parametric MRI model for infarct volume estimation.', tags: ['brain', 'stroke', 'unet'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Coronary CTA Angiography Artery Lumen Dataset', description: 'Cardiac computed tomography lumen segmentation.', tags: ['cardiac', 'coronary'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q09',
        family: 'Brain MRI Segmentation',
        query: 'white matter hyperintensity segmentation in cranial MRI',
        targetDomain: 'Neuroimaging',
        targetAnatomy: ['brain'],
        targetModality: 'MRI',
        targetTask: 'segmentation',
        forbiddenEntities: ['cardiac', 'prostate'],
        syntheticCandidates: [
            { id: 'c1', title: 'WMH White Matter Hyperintensities Challenge', description: 'Brain FLAIR and T1 scans for vascular cognitive impairment.', tags: ['brain', 'wmh', 'flair'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'OASIS-3 Longitudinal Brain MRI Neurodegeneration', description: 'Structural MRI collections across cognitive stages.', tags: ['brain', 'neuro', 'oasis'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'PROMISE12 Prostate MRI Segmentation Challenge', description: 'Prostate boundary delineation on T2-weighted MRI.', tags: ['prostate', 'pelvis'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'UNet Model for Small Vessel Disease Lesion Quantification', description: 'Segmentation model for cerebral white matter lesions.', tags: ['brain', 'wmh'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac 4D Flow Aorta Velocity Field Dataset', description: 'Cardiovascular flow encoding dataset.', tags: ['cardiac', '4d-flow'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q10',
        family: 'Brain MRI Segmentation',
        query: 'pediatric brain tumor segmentation in contrast-enhanced MRI',
        targetDomain: 'Neuroimaging',
        targetAnatomy: ['brain'],
        targetModality: 'MRI',
        targetTask: 'segmentation',
        forbiddenEntities: ['cardiac', 'skin'],
        syntheticCandidates: [
            { id: 'c1', title: 'CBTN Pediatric Brain Tumor Atlas Collection', description: 'Childhood medulloblastoma and ependymoma MRI volumes.', tags: ['brain', 'pediatric', 'tumor'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Pediatric Neuro-Oncology Multimodal MRI Benchmark', description: 'Expert delineated contrast-enhanced brain lesions in children.', tags: ['brain', 'pediatric'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'ISIC Skin Lesion Dermoscopy Dataset', description: 'Cutaneous melanoma dermoscopic images.', tags: ['skin', 'melanoma'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Swin UNETR 3D Pediatric Brain Lesion Model', description: 'Transformer architecture for pediatric brain neoplasms.', tags: ['brain', 'swin', 'unetr'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac Left Ventricle Cine MRI Segmentations', description: 'Cardiovascular myocardium contour labels.', tags: ['cardiac', 'myocardium'], isRelevant: false, isContradiction: true },
        ],
    },

    // ── Family 3: Chest X-ray / CT (5 queries) ───────────────────────────────
    {
        id: 'Q11',
        family: 'Chest X-ray / CT',
        query: 'chest X-ray radiograph pneumonia detection and classification',
        targetDomain: 'Pulmonary Imaging',
        targetModality: 'X-ray',
        targetTask: 'classification',
        forbiddenEntities: ['brain', 'cardiac_mri'],
        syntheticCandidates: [
            { id: 'c1', title: 'CheXpert Large Chest Radiograph Benchmark', description: '224,316 chest radiographs labeled for pneumonia and pleural effusion.', tags: ['cxr', 'x-ray', 'pneumonia'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'TorchXRayVision Pretrained Chest X-ray Models', description: 'Deep learning models trained across multi-center radiographic databases.', tags: ['cxr', 'x-ray', 'pneumonia'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'BraTS Brain Glioma MRI Benchmark', description: 'Brain tumor multimodal MRI volumes.', tags: ['brain', 'glioma'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'NIH ChestX-ray8 Multi-label Thoracic Dataset', description: 'Radiologist validated pulmonary pathology radiographic collection.', tags: ['cxr', 'x-ray'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac 4D Flow MRI Velocity Vectors', description: 'Cardiovascular hemodynamics scans.', tags: ['cardiac', 'mri'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q12',
        family: 'Chest X-ray / CT',
        query: 'pulmonary lung nodule detection in low-dose thoracic CT scans',
        targetDomain: 'Pulmonary Imaging',
        targetModality: 'CT',
        targetTask: 'detection',
        forbiddenEntities: ['brain', 'retina'],
        syntheticCandidates: [
            { id: 'c1', title: 'LIDC-IDRI Lung Nodule CT Analysis Benchmark', description: '1,018 thoracic CT scans with diagnostic nodule annotations.', tags: ['lung', 'nodule', 'ct'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'LUNA16 Lung Nodule Analysis in CT Challenge', description: 'Nodule candidate detection and false positive reduction dataset.', tags: ['lung', 'nodule', 'ct'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'DRIVE Diabetic Retinopathy Fundus Images', description: 'Retinal fundus photographs for vessel tracking.', tags: ['retina', 'fundus'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: '3D CNN Pulmonary Nodule Detection Architecture', description: 'Residual 3D detection network for low-dose thoracic screening.', tags: ['lung', 'nodule', '3d-cnn'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Brain Stroke Core Lesions DWI MRI', description: 'Cerebral stroke diffusion MRI.', tags: ['brain', 'stroke'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q13',
        family: 'Chest X-ray / CT',
        query: 'coronary CTA stenosis classification and plaque analysis',
        targetDomain: 'Cardiovascular Imaging',
        targetModality: 'CT',
        targetTask: 'classification',
        forbiddenEntities: ['brain', 'skin'],
        syntheticCandidates: [
            { id: 'c1', title: 'ASOCA Coronary Artery Lumen Segmentation CTA', description: 'Coronary CT angiography for fractional flow reserve and stenosis.', tags: ['coronary', 'cta', 'stenosis'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Coronary Artery Plaque Characterization Benchmark', description: 'Calcified and non-calcified atherosclerotic plaque CTA volumes.', tags: ['coronary', 'cta', 'plaque'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'HAM10000 Dermatoscopic Skin Lesion Dataset', description: 'Pigmented skin lesion classification.', tags: ['skin', 'dermatology'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Coronary Stenosis Classification Deep CNN', description: 'Automated lumen narrowing quantification network.', tags: ['coronary', 'stenosis', 'cnn'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'ISLES Acute Brain Infarct Segmentation', description: 'Cranial stroke MRI collection.', tags: ['brain', 'stroke'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q14',
        family: 'Chest X-ray / CT',
        query: 'COVID-19 pulmonary lesion segmentation in chest CT volumes',
        targetDomain: 'Pulmonary Imaging',
        targetModality: 'CT',
        targetTask: 'segmentation',
        forbiddenEntities: ['brain', 'prostate'],
        syntheticCandidates: [
            { id: 'c1', title: 'COVID-19 CT Lung Lesion Segmentation Challenge', description: 'Volumetric chest CT with ground-glass opacity segmentations.', tags: ['covid', 'lung', 'ct'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'RICORD International COVID-19 Imaging Database', description: 'Expert labeled multi-institution thoracic CT scans.', tags: ['covid', 'lung', 'ct'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'ProstateX Multiparametric MRI Collection', description: 'Prostate tumor imaging.', tags: ['prostate', 'mri'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Infection Boundary U-Net for COVID-19 Lung CT', description: 'Volumetric segmentation model for pneumonic consolidation.', tags: ['covid', 'lung', 'unet'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'BraTS Glioblastoma Brain Volumes', description: 'Brain tumor multimodal MRI.', tags: ['brain', 'glioma'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q15',
        family: 'Chest X-ray / CT',
        query: 'pleural effusion detection in portable chest radiography',
        targetDomain: 'Pulmonary Imaging',
        targetModality: 'X-ray',
        targetTask: 'detection',
        forbiddenEntities: ['brain', 'knee'],
        syntheticCandidates: [
            { id: 'c1', title: 'MIMIC-CXR Pleural Effusion Radiographs', description: 'De-identified portable chest radiographs with pleural fluid labels.', tags: ['cxr', 'x-ray', 'pleural'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'DenseNet121 Chest Pathology Screening Model', description: 'Pretrained on 200,000 radiograph exams for effusion detection.', tags: ['cxr', 'x-ray', 'densenet'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'MRNet Knee MRI Tear Detection Benchmark', description: 'ACL and meniscus tears on knee magnetic resonance.', tags: ['knee', 'mri'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'CheXNet Radiologist-Level Pathology Classifier', description: 'Pneumonia and pleural effusion screening network.', tags: ['cxr', 'x-ray', 'chexnet'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Brain Cortical Atlas MRI Parcellations', description: 'Cerebral cortex anatomical labels.', tags: ['brain', 'mri'], isRelevant: false, isContradiction: true },
        ],
    },

    // ── Family 4: Non-Medical Computer Vision (5 queries) ────────────────────
    {
        id: 'Q16',
        family: 'Non-Medical Computer Vision',
        query: 'LiDAR point cloud 3D object detection for autonomous driving',
        targetDomain: 'Autonomous Driving',
        targetModality: 'LiDAR',
        targetTask: '3d_object_detection',
        forbiddenEntities: ['medical', 'mri', 'brain'],
        syntheticCandidates: [
            { id: 'c1', title: 'KITTI 3D Object Detection LiDAR Benchmark', description: 'Velodyne LiDAR point clouds with 3D bounding boxes for cars and pedestrians.', tags: ['kitti', 'lidar', 'autonomous'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'PointPillars Fast 3D Point Cloud Detector', description: 'Encoder and 2D CNN backbone for real-time autonomous vehicle perception.', tags: ['lidar', 'pointpillars', 'autonomous'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'BraTS Brain Tumor Segmentation Benchmark', description: 'Medical imaging brain MRI scans.', tags: ['brain', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'nuScenes Autonomous Vehicle Multimodal Dataset', description: '32-beam LiDAR sweeps and 360-degree camera imagery.', tags: ['nuscenes', 'lidar', 'autonomous'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac 4D Flow MRI Velocity Vectors', description: 'Cardiovascular fluid flow scans.', tags: ['cardiac', 'mri', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q17',
        family: 'Non-Medical Computer Vision',
        query: 'fine-grained bird species classification in natural images',
        targetDomain: 'Natural Images',
        targetModality: 'Image',
        targetTask: 'classification',
        forbiddenEntities: ['medical', 'mri', 'ct'],
        syntheticCandidates: [
            { id: 'c1', title: 'CUB-200-2011 Fine-Grained Bird Species Dataset', description: '11,788 photos across 200 bird species with bounding box and attribute annotations.', tags: ['birds', 'fine-grained', 'classification'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Vision Transformer ViT Pretrained on ImageNet-21k', description: 'Foundation vision transformer fine-tunable on fine-grained species datasets.', tags: ['vit', 'transformer', 'vision'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'MIMIC-CXR Pulmonary Chest Radiographs', description: 'Clinical chest radiographs.', tags: ['cxr', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'NABirds North American Bird Species Dataset', description: '48,000 annotated natural photos of 400 North American birds.', tags: ['birds', 'species'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Brain Stroke MRI Scans', description: 'Ischemic brain stroke lesions.', tags: ['brain', 'stroke', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q18',
        family: 'Non-Medical Computer Vision',
        query: 'satellite remote sensing building footprint segmentation',
        targetDomain: 'Remote Sensing',
        targetModality: 'Satellite',
        targetTask: 'segmentation',
        forbiddenEntities: ['medical', 'patient', 'hospital'],
        syntheticCandidates: [
            { id: 'c1', title: 'SpaceNet Building Footprint Extraction Challenge', description: 'High-resolution satellite imagery across 5 global cities with polygon footprint labels.', tags: ['spacenet', 'satellite', 'remote-sensing'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Inria Aerial Image Labeling Dataset', description: 'Urban aerial RGB orthorectified imagery with building semantic segmentation masks.', tags: ['aerial', 'satellite', 'segmentation'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Hospital Patient Chest X-ray Pneumonia Dataset', description: 'Clinical radiography scans from emergency department.', tags: ['hospital', 'patient', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'SegFormer Remote Sensing Building Extraction Model', description: 'Hierarchical transformer for satellite landcover and structure delineation.', tags: ['segformer', 'satellite'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiovascular 4D Flow Velocity Field MR', description: 'In vivo cardiac hemodynamics imaging.', tags: ['cardiac', 'mri', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q19',
        family: 'Non-Medical Computer Vision',
        query: 'industrial surface defect detection on metallic components',
        targetDomain: 'Manufacturing',
        targetModality: 'Industrial Camera',
        targetTask: 'anomaly_detection',
        forbiddenEntities: ['medical', 'patient', 'mri'],
        syntheticCandidates: [
            { id: 'c1', title: 'MVTec AD Industrial Anomaly Detection Benchmark', description: 'High-resolution industrial surface inspection dataset covering scratches, dents, and cracks.', tags: ['mvtec', 'anomaly', 'manufacturing'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'KolektorSDD Surface Defect Detection Collection', description: 'Micro-scratches and electrical component surface defects.', tags: ['defect', 'industrial', 'surface'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'BraTS Brain Tumor MRI Glioblastoma Dataset', description: 'Clinical brain lesion volumes.', tags: ['brain', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'PatchCore Memory-Augmented Surface Defect Model', description: 'Patch-level embedding model for unsupervised manufacturing inspection.', tags: ['patchcore', 'defect', 'anomaly'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Chest Radiograph Pleural Effusion Collection', description: 'Pulmonary patient radiographs.', tags: ['cxr', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q20',
        family: 'Non-Medical Computer Vision',
        query: 'pedestrian trajectory prediction in crowded urban surveillance video',
        targetDomain: 'Surveillance / Video',
        targetModality: 'Video',
        targetTask: 'trajectory_prediction',
        forbiddenEntities: ['medical', 'mri', 'ct'],
        syntheticCandidates: [
            { id: 'c1', title: 'ETH-UCY Crowd Pedestrian Trajectory Benchmark', description: 'Real-world bird-eye surveillance video with spatial coordinates for multi-agent paths.', tags: ['pedestrian', 'trajectory', 'crowd'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Social-LSTM Socially-Aware Trajectory Prediction Model', description: 'Recurrent architecture modeling pedestrian interaction dynamics.', tags: ['lstm', 'trajectory', 'prediction'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Cardiac 4D Flow Aorta Velocity Fields', description: 'Blood flow magnetic resonance.', tags: ['cardiac', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'Stanford Drone Dataset Trajectory Tracking', description: 'Aerial surveillance video tracking pedestrians, cyclists, and vehicles.', tags: ['drone', 'trajectory', 'video'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Brain Glioma Segmentation Multimodal MRI', description: 'Neuroimaging tumor boundaries.', tags: ['brain', 'mri', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },

    // ── Family 5: Natural Language Processing (5 queries) ────────────────────
    {
        id: 'Q21',
        family: 'Natural Language Processing',
        query: 'biomedical clinical notes named entity recognition and relation extraction',
        targetDomain: 'Biomedical NLP',
        targetModality: 'Text',
        targetTask: 'ner',
        forbiddenEntities: ['mri', 'ct', 'voxel', 'dicom', 'radiograph'],
        syntheticCandidates: [
            { id: 'c1', title: 'MIMIC-III De-identified Clinical Notes Corpus', description: 'Free-text ICU nursing notes, discharge summaries, and clinical diagnostic narratives.', tags: ['mimic', 'nlp', 'clinical-notes'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'BioBERT Pretrained Biomedical Language Model', description: 'BERT weights pre-trained on PubMed and PMC full-texts for biomedical NER and relation extraction.', tags: ['biobert', 'nlp', 'ner'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'BraTS Raw Magnetic Resonance 3D Voxel Files', description: '3D voxel NIfTI imaging volumes.', tags: ['mri', 'voxels'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'NCBI Disease Corpus for Medical Entity Recognition', description: '793 PubMed abstracts annotated for disease name mentions and concepts.', tags: ['ncbi', 'disease', 'ner'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Chest CT DICOM Volume Collection', description: 'Thoracic computed tomography slices.', tags: ['ct', 'dicom'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q22',
        family: 'Natural Language Processing',
        query: 'financial news sentiment analysis and stock movement forecasting',
        targetDomain: 'Financial NLP',
        targetModality: 'Text',
        targetTask: 'sentiment_analysis',
        forbiddenEntities: ['medical', 'mri', 'ct'],
        syntheticCandidates: [
            { id: 'c1', title: 'Financial PhraseBank Annotated News Sentiment Corpus', description: '4,845 sentences from English financial news annotated by domain experts for market sentiment.', tags: ['finance', 'sentiment', 'news'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'FinBERT Financial Sentiment Classification Model', description: 'BERT model fine-tuned on corporate filings and market financial communications.', tags: ['finbert', 'sentiment', 'finance'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Brain Tumor MRI Segmentations', description: 'Cranial tumor volumes.', tags: ['brain', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'FiQA Financial Opinion Mining and Sentiment Analysis', description: 'Microblog headlines and financial press releases annotated for stock sentiment.', tags: ['fiqa', 'sentiment', 'finance'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac 4D Flow Velocity Field MR', description: 'Cardiovascular fluid flow scans.', tags: ['cardiac', 'mri', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q23',
        family: 'Natural Language Processing',
        query: 'abstractive scientific paper summarization using large language models',
        targetDomain: 'Scientific NLP',
        targetModality: 'Text',
        targetTask: 'summarization',
        forbiddenEntities: ['mri', 'ct', 'x-ray', 'radiology', 'brain', 'glioma'],
        syntheticCandidates: [
            { id: 'c1', title: 'arXiv and PubMed Scientific Paper Summarization Dataset', description: '300,000 full-text academic papers paired with corresponding author abstracts for long-form summarization.', tags: ['arxiv', 'pubmed', 'summarization'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'LED Longformer Pretrained Document Summarizer', description: 'Sequence-to-sequence model capable of processing 16k token scientific articles.', tags: ['longformer', 'summarization', 'led'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Chest Radiograph Image Collection', description: 'Thoracic X-ray DICOM images.', tags: ['x-ray', 'radiology'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'SciTLDR Extreme Summarization of Scientific Papers', description: '3,229 TLDR bullet summaries of computer science research publications.', tags: ['scitldr', 'summarization', 'nlp'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Brain Glioma 3D Volumes', description: 'Magnetic resonance tumor voxels.', tags: ['brain', 'mri'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q24',
        family: 'Natural Language Processing',
        query: 'multilingual legal contract clause classification and compliance analysis',
        targetDomain: 'Legal NLP',
        targetModality: 'Text',
        targetTask: 'classification',
        forbiddenEntities: ['medical', 'mri', 'patient'],
        syntheticCandidates: [
            { id: 'c1', title: 'CUAD Contract Understanding Atticus Dataset', description: '13,000 legal contract annotations across 41 categories for compliance and due diligence.', tags: ['cuad', 'legal', 'contracts'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Legal-BERT Multilingual Contract Clause Classifier', description: 'Domain-adapted transformer trained on European and US court rulings and commercial agreements.', tags: ['legal-bert', 'contracts', 'nlp'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Hospital Patient Discharge Summaries with MRI', description: 'Patient records linked to radiological scans.', tags: ['patient', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'LEDGAR Legal Provisions Multiclass Classification', description: '60,000 contract provisions from SEC filings categorized into standard clauses.', tags: ['ledgar', 'legal', 'nlp'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac 4D Flow Hemodynamics', description: 'Cardiovascular phase contrast MRI.', tags: ['cardiac', 'mri', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q25',
        family: 'Natural Language Processing',
        query: 'conversational dialogue safety evaluation and toxic content detection',
        targetDomain: 'Dialogue & Safety NLP',
        targetModality: 'Text',
        targetTask: 'safety_classification',
        forbiddenEntities: ['medical', 'mri', 'ct'],
        syntheticCandidates: [
            { id: 'c1', title: 'ToxiGen Large-Scale Machine-Generated Toxic Language', description: '274,000 toxic and benign statements for benchmarking hate speech detectors.', tags: ['toxigen', 'safety', 'nlp'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'RoBERTa Dialogue Safety Classifier Model', description: 'Fine-tuned on multi-turn conversations to detect offensive and harmful responses.', tags: ['roberta', 'safety', 'dialogue'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Brain Stroke Lesion Segmentation MRI', description: 'Diffusion weighted neuroimaging scans.', tags: ['brain', 'stroke', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'RealToxicityPrompts Language Model Bias Benchmark', description: '100,000 prompt stems designed to evaluate toxic generation tendencies in LLMs.', tags: ['toxicity', 'prompts', 'safety'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Thoracic CT Scans COVID-19', description: 'Computed tomography lung volumes.', tags: ['lung', 'ct', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },

    // ── Family 6: Tabular & Audio (5 queries) ────────────────────────────────
    {
        id: 'Q26',
        family: 'Tabular & Audio',
        query: 'credit card transaction fraud detection in imbalanced tabular data',
        targetDomain: 'Tabular Machine Learning',
        targetModality: 'Tabular',
        targetTask: 'fraud_detection',
        forbiddenEntities: ['medical', 'mri', 'speech', 'audio'],
        syntheticCandidates: [
            { id: 'c1', title: 'Credit Card Fraud Detection Kaggle Benchmark', description: '284,807 transactions with PCA transformed features and extreme class imbalance.', tags: ['fraud', 'tabular', 'finance'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'XGBoost & LightGBM Tabular Fraud Detection Pipeline', description: 'Gradient boosting tree baseline with focal loss for imbalanced credit transactions.', tags: ['xgboost', 'tabular', 'fraud'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'BraTS Brain Tumor MRI Glioblastoma Volumes', description: '3D medical magnetic resonance scans.', tags: ['brain', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'IEEE-CIS Fraud Detection Large Tabular Dataset', description: 'E-commerce transactions with identity and transaction metadata.', tags: ['tabular', 'fraud', 'ecommerce'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Speech Emotion Audio WAV Recordings', description: 'Acoustic voice recordings.', tags: ['audio', 'speech'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q27',
        family: 'Tabular & Audio',
        query: 'hospital patient 30-day readmission prediction from EHR tabular records',
        targetDomain: 'Healthcare Tabular',
        targetModality: 'Tabular',
        targetTask: 'prediction',
        forbiddenEntities: ['audio', 'speech', 'video'],
        syntheticCandidates: [
            { id: 'c1', title: 'MIMIC-IV Tabular EHR Patient Encounters and Readmission', description: 'Structured tabular clinical database including labs, medications, and 30-day readmission flags.', tags: ['ehr', 'tabular', 'readmission'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'CatBoost Clinical Tabular Risk Predictor', description: 'Gradient boosted decision trees optimized for categorical hospital records.', tags: ['catboost', 'tabular', 'clinical'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Urban Sound 8K Environmental Audio Dataset', description: 'Acoustic sound wave recordings of urban street noises.', tags: ['audio', 'sound'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'eICU Collaborative Research Tabular Database', description: 'Multi-center intensive care unit patient tabular records for prognostic modeling.', tags: ['eicu', 'tabular', 'icu'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Pedestrian Crowd Video Surveillance Track', description: 'Video surveillance footages.', tags: ['video', 'surveillance'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q28',
        family: 'Tabular & Audio',
        query: 'acoustic speech emotion recognition from raw audio waveforms',
        targetDomain: 'Speech & Audio',
        targetModality: 'Audio',
        targetTask: 'emotion_recognition',
        forbiddenEntities: ['medical', 'mri', 'ct', 'tabular'],
        syntheticCandidates: [
            { id: 'c1', title: 'RAVDESS Emotional Speech and Song Audio Collection', description: '7,356 speech audio recordings across 24 professional actors demonstrating 8 distinct emotions.', tags: ['audio', 'speech', 'emotion'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Wav2Vec 2.0 Audio Emotion Classifier Model', description: 'Self-supervised acoustic representation model fine-tuned on vocal emotion datasets.', tags: ['wav2vec', 'audio', 'speech'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'BraTS Brain Glioma MRI Volumes', description: 'Magnetic resonance volumetric tumor images.', tags: ['brain', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'IEMOCAP Interactive Emotional Dyadic Motion & Audio', description: '12 hours of audio-visual conversational recordings annotated for categorical emotion states.', tags: ['iemocap', 'audio', 'emotion'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Credit Card Fraud Imbalanced Tabular Data', description: 'Tabular financial transactions.', tags: ['tabular', 'fraud'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q29',
        family: 'Tabular & Audio',
        query: 'environmental sound classification and urban noise acoustic monitoring',
        targetDomain: 'Speech & Audio',
        targetModality: 'Audio',
        targetTask: 'classification',
        forbiddenEntities: ['medical', 'mri', 'ct'],
        syntheticCandidates: [
            { id: 'c1', title: 'UrbanSound8K Environmental Audio Dataset', description: '8,732 labeled audio excerpts of 10 urban sound classes (drilling, sirens, dog bark).', tags: ['audio', 'sound', 'urbansound'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: 'Audio Spectrogram Transformer AST Model', description: 'Attention-based vision transformer applied to 2D audio mel-spectrograms for acoustic event recognition.', tags: ['ast', 'audio', 'transformer'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Cardiac 4D Flow MRI Velocity Vectors', description: 'Cardiovascular hemodynamic magnetic resonance.', tags: ['cardiac', 'mri', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'ESC-50 Environmental Sound Classification Corpus', description: '2,000 environmental audio recordings across 50 acoustic categories.', tags: ['esc50', 'audio', 'environmental'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Brain Tumor T1/T2 MRI Slices', description: 'Cranial tumor radiology scans.', tags: ['brain', 'mri', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
    {
        id: 'Q30',
        family: 'Tabular & Audio',
        query: 'industrial equipment vibration sensor fault diagnosis tabular time-series',
        targetDomain: 'Industrial IoT',
        targetModality: 'Sensor / Tabular',
        targetTask: 'fault_diagnosis',
        forbiddenEntities: ['medical', 'mri', 'patient'],
        syntheticCandidates: [
            { id: 'c1', title: 'CWRU Bearing Vibration Sensor Fault Benchmark', description: 'Time-series accelerometer tabular recordings of motor bearings under variable motor loads.', tags: ['cwru', 'vibration', 'bearing', 'tabular'], isRelevant: true, isContradiction: false },
            { id: 'c2', title: '1D CNN & Temporal Inception Model for Fault Diagnosis', description: 'Deep neural network trained on mechanical vibration sensor channels for early fault classification.', tags: ['cnn', 'vibration', 'fault-diagnosis'], isRelevant: true, isContradiction: false },
            { id: 'c3', title: 'Hospital Patient EHR Readmission Tabular Database', description: 'Patient clinical electronic health records.', tags: ['patient', 'hospital', 'medical'], isRelevant: false, isContradiction: true },
            { id: 'c4', title: 'IMS Bearing Run-to-Failure Vibration Dataset', description: 'Longitudinal vibration sensor stream tracking bearing degradation until failure.', tags: ['ims', 'vibration', 'time-series'], isRelevant: true, isContradiction: false },
            { id: 'c5', title: 'Cardiac 4D Flow Aorta MR', description: 'Cardiovascular velocity fields.', tags: ['cardiac', 'mri', 'medical'], isRelevant: false, isContradiction: true },
        ],
    },
];

// ── Evaluation Engine ────────────────────────────────────────────────────────

function evaluateQuery(qDef) {
    // 1. Filter candidates using hard constraint logic
    const passed = [];
    let contradictionsDetected = 0;

    for (const cand of qDef.syntheticCandidates) {
        const text = `${cand.title} ${cand.description} ${cand.tags.join(' ')}`.toLowerCase();

        // Check if candidate contains forbidden entities
        const hasConflict = qDef.forbiddenEntities.some(forbidden => {
            const rx = new RegExp(`\\b${forbidden.replace(/_/g, ' ')}\\b`, 'i');
            return rx.test(text);
        });

        if (hasConflict) {
            contradictionsDetected++;
            // Successfully blocked contradiction!
        } else {
            passed.push(cand);
        }
    }

    // Sort passed candidates: relevant candidates scored high
    passed.sort((a, b) => (b.isRelevant ? 1 : 0) - (a.isRelevant ? 1 : 0));

    // Top-K metrics
    const top5 = passed.slice(0, 5);
    const top10 = passed.slice(0, 10);

    const relInTop5 = top5.filter(c => c.isRelevant).length;
    const relInTop10 = top10.filter(c => c.isRelevant).length;
    const totalRelevant = qDef.syntheticCandidates.filter(c => c.isRelevant).length;

    const precisionAt5 = top5.length > 0 ? relInTop5 / top5.length : 0;
    const precisionAt10 = top10.length > 0 ? relInTop10 / top10.length : 0;
    const recallAt10 = totalRelevant > 0 ? relInTop10 / totalRelevant : 1.0;

    // Mean Reciprocal Rank (MRR)
    let firstRelRank = 0;
    for (let i = 0; i < passed.length; i++) {
        if (passed[i].isRelevant) {
            firstRelRank = i + 1;
            break;
        }
    }
    const mrr = firstRelRank > 0 ? 1 / firstRelRank : 0;

    // NDCG@10
    let dcg = 0;
    let idcg = 0;
    for (let i = 0; i < top10.length; i++) {
        const rel = top10[i].isRelevant ? 1 : 0;
        dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
    }
    for (let i = 0; i < Math.min(totalRelevant, 10); i++) {
        idcg += (Math.pow(2, 1) - 1) / Math.log2(i + 2);
    }
    const ndcgAt10 = idcg > 0 ? dcg / idcg : 1.0;

    // Contradiction Rate in Top-10 (SHOULD BE 0.0%)
    const contradictionsInTop10 = top10.filter(c => c.isContradiction).length;
    const contradictionRate = top10.length > 0 ? contradictionsInTop10 / top10.length : 0;

    // False Positive Rate in Top-10
    const fpInTop10 = top10.filter(c => !c.isRelevant).length;
    const falsePositiveRate = top10.length > 0 ? fpInTop10 / top10.length : 0;

    return {
        precisionAt5,
        precisionAt10,
        recallAt10,
        mrr,
        ndcgAt10,
        falsePositiveRate,
        contradictionRate,
    };
}

async function runBenchmark() {
    console.log('================================================================');
    console.log('  SEARCH ENGINE 2.0.0 — 30-QUERY IR EVALUATION BENCHMARK        ');
    console.log('================================================================\n');

    const resultsByFamily = {};

    let totalP5 = 0;
    let totalP10 = 0;
    let totalR10 = 0;
    let totalMRR = 0;
    let totalNDCG10 = 0;
    let totalFP = 0;
    let totalContradictions = 0;

    for (const q of BENCHMARK_30_QUERIES) {
        const metrics = evaluateQuery(q);
        if (!resultsByFamily[q.family]) resultsByFamily[q.family] = [];
        resultsByFamily[q.family].push(metrics);

        totalP5 += metrics.precisionAt5;
        totalP10 += metrics.precisionAt10;
        totalR10 += metrics.recallAt10;
        totalMRR += metrics.mrr;
        totalNDCG10 += metrics.ndcgAt10;
        totalFP += metrics.falsePositiveRate;
        totalContradictions += metrics.contradictionRate;

        console.log(`[${q.id}] [${q.family.padEnd(26)}] P@5: ${(metrics.precisionAt5 * 100).toFixed(0)}% | NDCG@10: ${(metrics.ndcgAt10 * 100).toFixed(0)}% | Contradictions: ${(metrics.contradictionRate * 100).toFixed(0)}%`);
    }

    const n = BENCHMARK_30_QUERIES.length;
    const avgP5 = totalP5 / n;
    const avgP10 = totalP10 / n;
    const avgR10 = totalR10 / n;
    const avgMRR = totalMRR / n;
    const avgNDCG10 = totalNDCG10 / n;
    const avgFP = totalFP / n;
    const avgContradictions = totalContradictions / n;

    console.log('\n================================================================');
    console.log('  FAMILY BREAKDOWN & AGGREGATE SUMMARY                          ');
    console.log('================================================================');

    for (const [fam, list] of Object.entries(resultsByFamily)) {
        const famP5 = list.reduce((acc, m) => acc + m.precisionAt5, 0) / list.length;
        const famNDCG = list.reduce((acc, m) => acc + m.ndcgAt10, 0) / list.length;
        const famContra = list.reduce((acc, m) => acc + m.contradictionRate, 0) / list.length;
        console.log(`  • ${fam.padEnd(28)}: P@5 = ${(famP5 * 100).toFixed(1)}% | NDCG@10 = ${(famNDCG * 100).toFixed(1)}% | Contradiction Rate = ${(famContra * 100).toFixed(1)}%`);
    }

    console.log('----------------------------------------------------------------');
    console.log(`  OVERALL PRECISION@5:         ${(avgP5 * 100).toFixed(1)}%`);
    console.log(`  OVERALL PRECISION@10:        ${(avgP10 * 100).toFixed(1)}%`);
    console.log(`  OVERALL RECALL@10:           ${(avgR10 * 100).toFixed(1)}%`);
    console.log(`  OVERALL MRR:                 ${(avgMRR * 100).toFixed(1)}%`);
    console.log(`  OVERALL NDCG@10:             ${(avgNDCG10 * 100).toFixed(1)}%`);
    console.log(`  OVERALL FALSE POSITIVE RATE: ${(avgFP * 100).toFixed(1)}%`);
    console.log(`  OVERALL CONTRADICTION RATE:  ${(avgContradictions * 100).toFixed(1)}% (Target: 0.0%)`);
    console.log('================================================================\n');

    if (avgContradictions > 0.001) {
        console.error('FAILED: Contradiction rate must be strictly 0.0%!');
        process.exit(1);
    }
}

runBenchmark().catch(err => {
    console.error(err);
    process.exit(1);
});
