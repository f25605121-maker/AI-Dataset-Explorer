from typing import List, Dict, Any, Tuple


class CrossLinker:
    """
    Discovers and boosts coherent resource triples (Paper <-> Dataset <-> Model) per Section 20-24.
    """

    def link_and_boost(
        self,
        datasets: List[Tuple[Dict[str, Any], float]],
        models: List[Tuple[Dict[str, Any], float]],
        papers: List[Tuple[Dict[str, Any], float]],
    ) -> Tuple[
        List[Tuple[Dict[str, Any], float]],
        List[Tuple[Dict[str, Any], float]],
        List[Tuple[Dict[str, Any], float]],
        List[Dict[str, Any]],
    ]:
        relationships: List[Dict[str, Any]] = []

        # Maps for quick lookups
        ds_ids = {d.get("id"): d for d, _ in datasets if d.get("id")}
        ds_names = {d.get("name", "").lower(): d.get("id") for d, _ in datasets if d.get("name")}
        mdl_ids = {m.get("id"): m for m, _ in models if m.get("id")}
        mdl_names = {m.get("name", "").lower(): m.get("id") for m, _ in models if m.get("name")}

        boosted_ds: Dict[str, float] = {d.get("id", ""): score for d, score in datasets}
        boosted_mdl: Dict[str, float] = {m.get("id", ""): score for m, score in models}
        boosted_ppr: Dict[str, float] = {p.get("id", ""): score for p, score in papers}

        # Cross-linking check
        for p, _ in papers:
            p_id = p.get("id", "")
            p_title = (p.get("title") or "").lower()
            p_abstract = (p.get("abstract") or "").lower()
            p_text = f"{p_title} {p_abstract}"

            # Check dataset mention in paper
            linked_ds_id = None
            for d_name, d_id in ds_names.items():
                if len(d_name) > 3 and (d_name in p_text or d_name.replace("-", " ") in p_text):
                    linked_ds_id = d_id
                    rel = {
                        "type": "PAPER_EVALUATES_DATASET",
                        "source_id": p_id,
                        "source_type": "paper",
                        "target_id": d_id,
                        "target_type": "dataset",
                        "confidence": 0.95,
                        "evidence": f"Paper discusses or benchmarks dataset '{d_name}'",
                    }
                    relationships.append(rel)
                    boosted_ds[d_id] = boosted_ds.get(d_id, 0.0) + 0.15
                    boosted_ppr[p_id] = boosted_ppr.get(p_id, 0.0) + 0.12
                    p.setdefault("dataset_ids", []).append(d_id)
                    p["relationship"] = "EXACT_DATASET"
                    break

            # Check model mention in paper
            for m_name, m_id in mdl_names.items():
                if len(m_name) > 3 and (m_name in p_text or m_name.replace("-", " ") in p_text):
                    rel = {
                        "type": "PAPER_EVALUATES_MODEL",
                        "source_id": p_id,
                        "source_type": "paper",
                        "target_id": m_id,
                        "target_type": "model",
                        "confidence": 0.90,
                        "evidence": f"Paper investigates model architecture '{m_name}'",
                    }
                    relationships.append(rel)
                    boosted_mdl[m_id] = boosted_mdl.get(m_id, 0.0) + 0.15
                    boosted_ppr[p_id] = boosted_ppr.get(p_id, 0.0) + 0.10
                    p.setdefault("model_ids", []).append(m_id)
                    if not p.get("relationship"):
                        p["relationship"] = "EXACT_MODEL"
                    break

        # Reconstruct boosted ranked lists
        new_ds = [(d, boosted_ds.get(d.get("id", ""), score)) for d, score in datasets]
        new_mdl = [(m, boosted_mdl.get(m.get("id", ""), score)) for m, score in models]
        new_ppr = [(p, boosted_ppr.get(p.get("id", ""), score)) for p, score in papers]

        new_ds.sort(key=lambda x: x[1], reverse=True)
        new_mdl.sort(key=lambda x: x[1], reverse=True)
        new_ppr.sort(key=lambda x: x[1], reverse=True)

        return new_ds, new_mdl, new_ppr, relationships
