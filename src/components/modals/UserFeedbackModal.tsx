"use client";

import React, { useState } from "react";

interface UserFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateTitle: string;
    candidateType: 'dataset' | 'model' | 'paper';
    searchQuery: string;
}

export default function UserFeedbackModal({
    isOpen,
    onClose,
    candidateId,
    candidateTitle,
    candidateType,
    searchQuery,
}: UserFeedbackModalProps) {
    const [rating, setRating] = useState<'positive' | 'negative'>('positive');
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const reasons = [
        { id: 'wrong_anatomy', label: 'Wrong Anatomy / Organ System' },
        { id: 'wrong_modality', label: 'Wrong Modality (e.g. CT instead of MRI)' },
        { id: 'wrong_task', label: 'Wrong ML Task (e.g. Classification vs Segmentation)' },
        { id: 'wrong_dimensionality', label: 'Wrong Dimensionality (2D slices instead of 3D volume)' },
        { id: 'poor_quality', label: 'Poor Dataset / Model Quality or Missing Files' },
        { id: 'irrelevant', label: 'Generally Irrelevant to Problem' },
    ];

    const toggleReason = (id: string) => {
        setSelectedReasons(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await fetch('/api/search/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery,
                    candidateId,
                    candidateType,
                    rating,
                    reasons: selectedReasons,
                    comment,
                }),
            });
            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
            }, 1200);
        } catch {
            // Close on error gracefully
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-md bg-card border border-strong rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-subtle pb-3">
                    <h3 className="font-bold text-primary text-base flex items-center gap-2">
                        <span>💬</span> Search Relevance Feedback
                    </h3>
                    <button onClick={onClose} className="text-muted hover:text-primary text-sm">✕</button>
                </div>

                {submitted ? (
                    <div className="py-8 text-center space-y-2">
                        <div className="text-3xl">✓</div>
                        <div className="font-bold text-emerald-400">Thank you for your feedback!</div>
                        <div className="text-xs text-muted">Your signal has been recorded for offline ranking optimization.</div>
                    </div>
                ) : (
                    <div className="space-y-4 text-xs">
                        <div>
                            <span className="text-muted block text-[11px]">Resource:</span>
                            <span className="font-semibold text-primary truncate block">{candidateTitle}</span>
                        </div>

                        {/* Thumbs selection */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setRating('positive')}
                                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                                    rating === 'positive'
                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-sm'
                                        : 'bg-card-subtle border-subtle text-muted hover:text-primary'
                                }`}
                            >
                                <span>👍</span> Relevant Match
                            </button>
                            <button
                                type="button"
                                onClick={() => setRating('negative')}
                                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
                                    rating === 'negative'
                                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-sm'
                                        : 'bg-card-subtle border-subtle text-muted hover:text-primary'
                                }`}
                            >
                                <span>👎</span> Not Relevant
                            </button>
                        </div>

                        {/* Error categories if negative */}
                        {rating === 'negative' && (
                            <div className="space-y-2 pt-1 border-t border-subtle">
                                <div className="font-semibold text-primary text-[11px]">Why was this result not suitable?</div>
                                <div className="space-y-1.5">
                                    {reasons.map(r => (
                                        <label key={r.id} className="flex items-center gap-2 p-1.5 rounded-lg bg-card-subtle hover:bg-card cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedReasons.includes(r.id)}
                                                onChange={() => toggleReason(r.id)}
                                                className="rounded border-subtle text-accent focus:ring-accent"
                                            />
                                            <span className="text-secondary text-[11px]">{r.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-lg text-muted hover:text-primary font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4 py-1.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Feedback"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
