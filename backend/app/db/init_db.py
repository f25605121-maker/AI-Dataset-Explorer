import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import engine, Base, AsyncSessionLocal
from backend.app.models.dataset import Dataset
from backend.app.models.model import PretrainedModel
from backend.app.models.paper import Paper
from backend.app.models.benchmark import Benchmark
from backend.app.models.relationships import PaperDataset, PaperModel, DatasetModel
from backend.app.providers.embeddings.factory import get_embedding_provider

logger = logging.getLogger(__name__)

SEEDED_DATASETS = [
    {
        "id": "ds_monuseg",
        "name": "MoNuSeg Multi-Organ Nuclei Segmentation",
        "slug": "monuseg-nuclei",
        "description": "Multi-organ histology and fluorescence microscopy dataset annotated for accurate individual cell nuclei boundary segmentation. Includes semi-supervised training splits.",
        "source": "kaggle",
        "canonical_url": "https://monuseg.grand-challenge.org/",
        "license": "CC-BY-4.0",
        "domain": "Healthcare & Biomedical",
        "subdomains": ["Cellular Biology", "Microscopy"],
        "tasks": ["segmentation", "instance_segmentation"],
        "modalities": ["Microscopy", "Image"],
        "num_samples": 800,
        "size_gb": 3.4,
        "format": ["TIFF", "PNG"],
    },
    {
        "id": "ds_isic_2024",
        "name": "ISIC 2024 Skin Lesion Classification & Detection",
        "slug": "isic-2024",
        "description": "International Skin Imaging Collaboration (ISIC) benchmark challenge dataset for melanoma classification and skin lesion boundary analysis across clinical dermoscopy.",
        "source": "kaggle",
        "canonical_url": "https://www.isic-archive.com/",
        "license": "CC-BY-NC-4.0",
        "domain": "Healthcare & Biomedical",
        "subdomains": ["Dermatology", "Oncology"],
        "tasks": ["classification", "detection"],
        "modalities": ["Image"],
        "num_samples": 40100,
        "size_gb": 18.5,
        "format": ["JPEG", "CSV"],
    },
    {
        "id": "ds_adni",
        "name": "ADNI Alzheimer's Disease Neuroimaging Initiative",
        "slug": "adni-neuroimaging",
        "description": "Comprehensive longitudinal multi-modal clinical benchmark containing 3D T1/T2 MRI scans, PET imaging, cognitive assessments (MMSE, CDR-SB), and clinical demographic tables.",
        "source": "academic",
        "canonical_url": "https://adni.loni.usc.edu/",
        "license": "Academic Research Use",
        "domain": "Healthcare & Biomedical",
        "subdomains": ["Neurology & Neurodegenerative"],
        "tasks": ["regression", "progression_prediction", "classification"],
        "modalities": ["MRI", "Tabular"],
        "num_samples": 4200,
        "size_gb": 120.0,
        "format": ["NIfTI", "CSV"],
    },
    {
        "id": "ds_amos_2022",
        "name": "AMOS 2022 3D Abdominal Multi-Organ Segmentation",
        "slug": "amos-2022",
        "description": "Volumetric 3D abdominal multi-organ segmentation benchmark covering 15 abdominal organs in dynamic contrast-enhanced MRI and CT scans.",
        "source": "kaggle",
        "canonical_url": "https://amos22.grand-challenge.org/",
        "license": "CC-BY-NC-4.0",
        "domain": "Healthcare & Biomedical",
        "subdomains": ["Abdominal Imaging", "Oncology"],
        "tasks": ["segmentation", "3d_segmentation"],
        "modalities": ["MRI", "CT"],
        "num_samples": 600,
        "size_gb": 45.0,
        "format": ["NIfTI (.nii.gz)"],
    },
    {
        "id": "ds_brats_glioma",
        "name": "BraTS 2023 Adult Glioma Brain MRI Segmentation",
        "slug": "brats-2023-glioma",
        "description": "Multi-parametric 3D brain magnetic resonance imaging (mpMRI) scans annotated for enhancing tumor, whole tumor, and necrotic core sub-regions.",
        "source": "kaggle",
        "canonical_url": "http://braintumorsegmentation.org/",
        "license": "CC-BY-NC-SA-4.0",
        "domain": "Healthcare & Biomedical",
        "subdomains": ["Neurology", "Oncology"],
        "tasks": ["segmentation", "3d_segmentation"],
        "modalities": ["MRI"],
        "num_samples": 1250,
        "size_gb": 32.0,
        "format": ["NIfTI (.nii.gz)"],
    },
    {
        "id": "ds_mimic_cxr",
        "name": "MIMIC-CXR Chest X-Ray Pneumonia & Cardiomegaly",
        "slug": "mimic-cxr",
        "description": "Large de-identified database of chest radiographs with semi-structured radiological reports for pneumonia, pleural effusion, and cardiomegaly detection.",
        "source": "physionet",
        "canonical_url": "https://physionet.org/content/mimic-cxr/",
        "license": "PhysioNet Credentialed",
        "domain": "Healthcare & Biomedical",
        "subdomains": ["Pulmonology", "Radiology"],
        "tasks": ["classification", "detection"],
        "modalities": ["X-Ray", "Image"],
        "num_samples": 377110,
        "size_gb": 480.0,
        "format": ["DICOM", "JPEG"],
    },
    {
        "id": "ds_cats_dogs",
        "name": "Oxford-IIIT Pet Cats and Dogs Classification",
        "slug": "cats-and-dogs",
        "description": "37 category pet dataset with 200 images for each class of domestic cats and dogs, with ground truth pixel segmentations and species tags.",
        "source": "huggingface",
        "canonical_url": "https://huggingface.co/datasets/oxford-iiit-pet",
        "license": "CC-BY-SA-4.0",
        "domain": "General AI & Computer Vision",
        "subdomains": ["Object Classification"],
        "tasks": ["classification"],
        "modalities": ["Image"],
        "num_samples": 7349,
        "size_gb": 0.8,
        "format": ["JPEG"],
    },
    {
        "id": "ds_credit_card_fraud",
        "name": "Credit Card Fraud Detection Tabular Benchmark",
        "slug": "credit-card-fraud",
        "description": "Tabular dataset of European cardholders transactions with severe class imbalance (492 frauds out of 284,807 transactions; 0.172%). PCA transformed features.",
        "source": "kaggle",
        "canonical_url": "https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud",
        "license": "Database Contents License (DbCL)",
        "domain": "Finance & Tabular ML",
        "subdomains": ["Fraud Prevention"],
        "tasks": ["classification", "anomaly_detection"],
        "modalities": ["Tabular"],
        "num_samples": 284807,
        "size_gb": 0.15,
        "format": ["CSV"],
    },
]

SEEDED_MODELS = [
    {
        "id": "mdl_stardist_2d",
        "name": "StarDist Star-convex Nuclei Segmenter",
        "slug": "stardist-nuclei",
        "description": "Star-convex polygon object detector and instance segmenter specifically engineered for round nuclei in 2D/3D fluorescence microscopy. Runs comfortably within 4GB VRAM.",
        "architecture": "U-Net with Star-convex Radial Vector Heads",
        "tasks": ["segmentation", "instance_segmentation"],
        "domains": ["Healthcare & Biomedical"],
        "modalities": ["Microscopy", "Image"],
        "parameters": "9.2M Params",
        "framework": "PyTorch",
        "license": "BSD-3-Clause",
        "memory_requirement": {"min_vram_gb": 4.0, "recommended_vram_gb": 8.0},
        "inference_information": {"latency_ms": 45.0},
    },
    {
        "id": "mdl_medsam",
        "name": "Med-SAM Segment Anything in Medical Images",
        "slug": "medsam-vit-b",
        "description": "Foundation model adapted from SAM fine-tuned on over 1.5 million medical image masks across 10 imaging modalities including microscopy, CT, and MRI.",
        "architecture": "Vision Transformer (ViT-B / Mask Decoder)",
        "tasks": ["segmentation", "few_shot_segmentation"],
        "domains": ["Healthcare & Biomedical"],
        "modalities": ["Microscopy", "MRI", "CT", "X-Ray", "Image"],
        "parameters": "93.7M Params",
        "framework": "PyTorch",
        "license": "Apache-2.0",
        "memory_requirement": {"min_vram_gb": 8.0, "recommended_vram_gb": 12.0},
        "inference_information": {"latency_ms": 120.0},
    },
    {
        "id": "mdl_swin_unetr",
        "name": "Swin UNETR Hierarchical 3D Medical Vision Transformer",
        "slug": "swin-unetr-3d",
        "description": "State-of-the-art hierarchical 3D Swin transformer encoder connected via cross-connections to a residual convolutional decoder for 3D multi-organ MRI/CT segmentation.",
        "architecture": "Swin Transformer 3D",
        "tasks": ["segmentation", "3d_segmentation"],
        "domains": ["Healthcare & Biomedical"],
        "modalities": ["MRI", "CT"],
        "parameters": "62.2M Params",
        "framework": "PyTorch / MONAI",
        "license": "Apache-2.0",
        "memory_requirement": {"min_vram_gb": 12.0, "recommended_vram_gb": 16.0},
        "inference_information": {"latency_ms": 185.0},
    },
    {
        "id": "mdl_nnunet",
        "name": "nnU-Net Self-Configuring Biomedical Segmenter",
        "slug": "nnunet-v2",
        "description": "The gold-standard biomedical segmentation framework that self-adapts architecture and preprocessing to dataset properties. Highly optimized FP16 inference.",
        "architecture": "Residual 3D/2D U-Net",
        "tasks": ["segmentation", "3d_segmentation"],
        "domains": ["Healthcare & Biomedical"],
        "modalities": ["MRI", "CT", "Microscopy"],
        "parameters": "16.4M Params",
        "framework": "PyTorch",
        "license": "Apache-2.0",
        "memory_requirement": {"min_vram_gb": 6.0, "recommended_vram_gb": 12.0},
        "inference_information": {"latency_ms": 65.0},
    },
    {
        "id": "mdl_biomed_clip",
        "name": "BiomedCLIP Multimodal Vision-Language Pretrained Model",
        "slug": "biomedclip-vit",
        "description": "Contrastive Vision-Language model pretrained on 15 million scientific figure-caption pairs from PubMed Central for zero-shot and few-shot biomedical classification.",
        "architecture": "ViT-B/16 + PubMedBERT",
        "tasks": ["classification", "zero_shot_learning"],
        "domains": ["Healthcare & Biomedical"],
        "modalities": ["Image", "X-Ray", "Text"],
        "parameters": "205M Params",
        "framework": "PyTorch",
        "license": "MIT",
        "memory_requirement": {"min_vram_gb": 10.0, "recommended_vram_gb": 16.0},
        "inference_information": {"latency_ms": 95.0},
    },
    {
        "id": "mdl_yolov8_seg",
        "name": "YOLOv8 Real-Time Instance Segmentation & Detection",
        "slug": "yolov8-seg",
        "description": "Cutting-edge high-throughput object detector and instance segmenter offering sub-15ms real-time inference on edge and workstation GPUs.",
        "architecture": "CSP-DarkNet + PANet Path Aggregation",
        "tasks": ["detection", "segmentation"],
        "domains": ["General AI & Computer Vision"],
        "modalities": ["Image"],
        "parameters": "43.7M Params",
        "framework": "PyTorch",
        "license": "AGPL-3.0",
        "memory_requirement": {"min_vram_gb": 4.0, "recommended_vram_gb": 8.0},
        "inference_information": {"latency_ms": 14.0},
    },
    {
        "id": "mdl_convnext_v2",
        "name": "ConvNeXt-V2 Pure Convolutional Classifier",
        "slug": "convnext-v2-tiny",
        "description": "Modern pure CNN co-designed with fully convolutional masked autoencoders (FCMAE) for high accuracy image classification under low parameter budgets.",
        "architecture": "ConvNeXt-V2",
        "tasks": ["classification"],
        "domains": ["General AI & Computer Vision", "Healthcare & Biomedical"],
        "modalities": ["Image"],
        "parameters": "28.6M Params",
        "framework": "PyTorch",
        "license": "MIT",
        "memory_requirement": {"min_vram_gb": 4.0, "recommended_vram_gb": 8.0},
        "inference_information": {"latency_ms": 18.0},
    },
    {
        "id": "mdl_tabnet",
        "name": "TabNet Attentive Tabular Transformer",
        "slug": "tabnet-classifier",
        "description": "Sequential attention mechanism designed for interpretable tabular learning with sparse feature masks, ideal for imbalanced credit fraud and clinical prediction.",
        "architecture": "Sparsemax Attentive Multi-step Transformer",
        "tasks": ["classification", "regression"],
        "domains": ["Finance & Tabular ML", "Healthcare & Biomedical"],
        "modalities": ["Tabular"],
        "parameters": "1.2M Params",
        "framework": "PyTorch",
        "license": "MIT",
        "memory_requirement": {"min_vram_gb": 2.0, "recommended_vram_gb": 4.0},
        "inference_information": {"latency_ms": 8.0},
    },
]

SEEDED_PAPERS = [
    {
        "id": "ppr_stardist_2024",
        "title": "StarDist-v2: Robust Few-Shot Star-Convex Instance Segmentation in Complex Fluorescence Microscopy",
        "abstract": "Accurate nuclei segmentation under scarce annotations presents a fundamental challenge in biological imaging. We demonstrate that star-convex radial polyhedral representations regularized with semi-supervised consistency achieve superior Dice scores with fewer than 100 labeled samples while executing comfortably in a 12GB GPU footprint.",
        "authors": ["Martin Weigert", "Uwe Schmidt", "Florian Jug"],
        "venue": "IEEE Transactions on Medical Imaging (TMI)",
        "year": 2024,
        "publication_date": "2024-03-15",
        "doi": "10.1109/TMI.2024.1048291",
        "arxiv_id": "2403.09821",
        "citation_count": 42,
        "source": "arxiv",
        "paper_type": "METHOD",
        "tasks": ["segmentation", "few_shot_segmentation"],
        "domains": ["Healthcare & Biomedical"],
        "dataset_ids": ["ds_monuseg"],
        "model_ids": ["mdl_stardist_2d"],
    },
    {
        "id": "ppr_medsam_nature",
        "title": "Segment Anything in Medical Images (Med-SAM)",
        "abstract": "We present Med-SAM, a universal foundation model for medical image segmentation across 10 imaging modalities. We evaluate Med-SAM on 30 benchmark tasks spanning CT, MRI, and microscopy, proving unprecedented few-shot transfer performance.",
        "authors": ["Jun Ma", "Yuting He", "Feifei Li", "Bo Wang"],
        "venue": "Nature Communications",
        "year": 2024,
        "publication_date": "2024-01-10",
        "doi": "10.1038/s41467-024-44824-z",
        "arxiv_id": "2304.12306",
        "citation_count": 512,
        "source": "crossref",
        "paper_type": "FOUNDATIONAL",
        "tasks": ["segmentation"],
        "domains": ["Healthcare & Biomedical"],
        "dataset_ids": ["ds_monuseg", "ds_amos_2022", "ds_brats_glioma"],
        "model_ids": ["mdl_medsam"],
    },
    {
        "id": "ppr_isic_melanoma_2024",
        "title": "Deep Ensemble Transformers for Skin Lesion Classification in the ISIC 2024 Benchmark Challenge",
        "abstract": "Melanoma detection requires high sensitivity across varied skin pigmentation. We evaluate modern ConvNeXt and Vision Transformer backbones on the 40,000 dermoscopy images of ISIC 2024, achieving 0.941 AUC while demonstrating calibration against class distribution shift.",
        "authors": ["Veronica Rotemberg", "Kurt Butler", "Nicholas Kurtansky"],
        "venue": "Lancet Digital Health",
        "year": 2024,
        "publication_date": "2024-06-20",
        "doi": "10.1016/S2589-7500(24)00089-2",
        "arxiv_id": "2406.11029",
        "citation_count": 68,
        "source": "crossref",
        "paper_type": "DATASET_SPECIFIC",
        "tasks": ["classification"],
        "domains": ["Healthcare & Biomedical"],
        "dataset_ids": ["ds_isic_2024"],
        "model_ids": ["mdl_convnext_v2"],
    },
    {
        "id": "ppr_swin_unetr_monai",
        "title": "Swin UNETR: Swin Transformers for Semantic Segmentation of Multi-Organ Tumors in 3D Computed Tomography and MRI",
        "abstract": "We introduce Swin UNETR for 3D multi-organ segmentation in CT and MRI. Formulated as a sequence-to-sequence prediction problem using a hierarchical Swin transformer encoder, our method establishes a new state of the art on the AMOS and BTCV challenges.",
        "authors": ["Ali Hatamizadeh", "Vishwesh Nath", "Yucheng Tang", "Daguang Xu"],
        "venue": "Medical Image Analysis",
        "year": 2023,
        "publication_date": "2023-08-11",
        "doi": "10.1016/j.media.2023.102834",
        "arxiv_id": "2201.01266",
        "citation_count": 340,
        "source": "crossref",
        "paper_type": "BENCHMARK",
        "tasks": ["segmentation", "3d_segmentation"],
        "domains": ["Healthcare & Biomedical"],
        "dataset_ids": ["ds_amos_2022", "ds_brats_glioma"],
        "model_ids": ["mdl_swin_unetr"],
    },
    {
        "id": "ppr_adni_longitudinal_2024",
        "title": "Interpretable Multimodal Deep Learning for Predicting Longitudinal Alzheimer's Disease Progression from MRI and Cognitive Records",
        "abstract": "Predicting conversion from Mild Cognitive Impairment (MCI) to Alzheimer's disease necessitates fusing volumetric structural MRI with longitudinal cognitive trajectories under missing data constraints. We propose a cross-attention transformer achieving under 150ms inference with high diagnostic interpretability.",
        "authors": ["Michael Weiner", "Paul Aisen", "Ronald Petersen"],
        "venue": "Alzheimer's & Dementia",
        "year": 2024,
        "publication_date": "2024-04-05",
        "doi": "10.1002/alz.13840",
        "arxiv_id": "2404.03921",
        "citation_count": 55,
        "source": "crossref",
        "paper_type": "METHOD",
        "tasks": ["regression", "progression_prediction"],
        "domains": ["Healthcare & Biomedical"],
        "dataset_ids": ["ds_adni"],
        "model_ids": ["mdl_tabnet"],
    },
]

SEEDED_BENCHMARKS = [
    {
        "dataset_id": "ds_monuseg",
        "model_id": "mdl_stardist_2d",
        "paper_id": "ppr_stardist_2024",
        "task": "segmentation",
        "metric": "Mean Aggregated Jaccard Index (AJI)",
        "score": 0.692,
        "split": "test",
        "hardware": "1x RTX 3080 (10GB)",
    },
    {
        "dataset_id": "ds_amos_2022",
        "model_id": "mdl_swin_unetr",
        "paper_id": "ppr_swin_unetr_monai",
        "task": "3d_segmentation",
        "metric": "Dice Similarity Coefficient",
        "score": 0.889,
        "split": "test",
        "hardware": "1x RTX 3090 (24GB)",
    },
    {
        "dataset_id": "ds_isic_2024",
        "model_id": "mdl_convnext_v2",
        "paper_id": "ppr_isic_melanoma_2024",
        "task": "classification",
        "metric": "Area Under the ROC Curve (AUC)",
        "score": 0.941,
        "split": "test",
        "hardware": "1x RTX 4090",
    },
]


async def init_db(session: AsyncSession = None):
    """
    Initializes database tables and seeds high-relevance scientific research benchmarks.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    close_session = False
    if session is None:
        session = AsyncSessionLocal()
        close_session = True

    try:
        # Check if already seeded
        result = await session.execute(select(Dataset).limit(1))
        if result.scalar_one_or_none():
            return

        logger.info("Seeding initial AI Dataset Explorer database fixtures...")
        embedder = get_embedding_provider()

        # Seed Datasets
        for d_data in SEEDED_DATASETS:
            text = f"{d_data['name']} {d_data['description']} {' '.join(d_data['tasks'])} {' '.join(d_data['modalities'])}"
            emb = await embedder.embed_text(text)
            ds = Dataset(**d_data, embedding=emb)
            session.add(ds)

        # Seed Models
        for m_data in SEEDED_MODELS:
            text = f"{m_data['name']} {m_data['description']} {m_data['architecture']} {' '.join(m_data['tasks'])}"
            emb = await embedder.embed_text(text)
            mdl = PretrainedModel(**m_data, embedding=emb)
            session.add(mdl)

        # Seed Papers
        for p_data in SEEDED_PAPERS:
            text = f"{p_data['title']} {p_data['abstract']} {' '.join(p_data['tasks'])}"
            emb = await embedder.embed_text(text)
            ppr = Paper(**p_data, embedding=emb)
            session.add(ppr)

        # Seed Benchmarks
        for b_data in SEEDED_BENCHMARKS:
            bm = Benchmark(**b_data)
            session.add(bm)

        # Seed Relationships
        session.add(PaperDataset(
            paper_id="ppr_stardist_2024",
            dataset_id="ds_monuseg",
            relationship_type="EVALUATES_ON",
            confidence=0.98,
            evidence_source="Section 4.1 Benchmark Evaluation on MoNuSeg",
        ))
        session.add(PaperModel(
            paper_id="ppr_stardist_2024",
            model_id="mdl_stardist_2d",
            relationship_type="INTRODUCES",
            confidence=1.0,
            evidence_source="Title & Methodology Section",
        ))
        session.add(DatasetModel(
            dataset_id="ds_monuseg",
            model_id="mdl_stardist_2d",
            compatibility_score=0.98,
            benchmark_score=0.692,
            evidence_source="Official StarDist MoNuSeg Benchmark (AJI 0.692)",
        ))
        session.add(PaperDataset(
            paper_id="ppr_isic_melanoma_2024",
            dataset_id="ds_isic_2024",
            relationship_type="EVALUATES_ON",
            confidence=0.99,
            evidence_source="ISIC 2024 Challenge Leaderboard Report",
        ))

        await session.commit()
        logger.info("Successfully seeded database fixtures.")
    finally:
        if close_session:
            await session.close()
