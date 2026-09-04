import pytest
from backend.app.services.retrieval.dense_search import DenseSearchEngine
from backend.app.services.retrieval.bm25_search import BM25SearchEngine
from backend.app.services.retrieval.rrf import ReciprocalRankFusion
from backend.app.services.ranking.cross_linker import CrossLinker


@pytest.mark.asyncio
async def test_hybrid_retrieval_and_rrf():
    dense = DenseSearchEngine()
    bm25 = BM25SearchEngine()
    rrf = ReciprocalRankFusion(k=60)

    candidates = [
        {"id": "c1", "name": "MoNuSeg Microscopy Nuclei", "description": "nuclei segmentation in fluorescence"},
        {"id": "c2", "name": "ISIC Melanoma Lesion", "description": "skin lesion classification in dermatology"},
        {"id": "c3", "name": "Audio Emotion Speech", "description": "speech audio classification"},
    ]

    query = "fluorescence microscopy nuclei segmentation"

    dense_res = await dense.search(query, candidates, top_k=3)
    bm25_res = bm25.search(query, candidates, top_k=3)
    fused = rrf.fuse([dense_res, bm25_res], top_k=3)

    assert len(fused) == 3
    # c1 should be the top match in both dense and sparse
    assert fused[0][0]["id"] == "c1"


def test_cross_linker_relationship_boost():
    cross_linker = CrossLinker()

    datasets = [
        ({"id": "ds_1", "name": "MoNuSeg", "title": "MoNuSeg Dataset"}, 0.70),
        ({"id": "ds_2", "name": "OtherDS", "title": "Other Dataset"}, 0.75),
    ]
    models = [
        ({"id": "mdl_1", "name": "StarDist", "title": "StarDist Segmenter"}, 0.65),
    ]
    papers = [
        ({"id": "ppr_1", "title": "StarDist on MoNuSeg Benchmark", "abstract": "We evaluate StarDist on MoNuSeg."}, 0.60),
    ]

    new_ds, new_mdl, new_ppr, rels = cross_linker.link_and_boost(datasets, models, papers)

    # ds_1 was mentioned in ppr_1, so it should receive relationship boost
    assert new_ds[0][0]["id"] == "ds_1"
    assert len(rels) >= 1
    assert rels[0]["type"] == "PAPER_EVALUATES_DATASET"
