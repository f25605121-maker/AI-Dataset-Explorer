# SearchBar

**File:** `src\components\explore\SearchBar.tsx`

## Description
No description provided.

## Signature
```typescript
function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  searchProgress,
  searchStage,
  placeholder = "Describe your project, AI problem, or dataset needs (e.g., 'Real-time vehicle detection in CCTV video' or 'Coronary artery segmentation CT dataset')...",
  presetQueries = [
    "Coronary artery CT segmentation",
    "Vehicle tracking in CCTV video",
    "Chest X-ray pneumonia classification",
    "Explain backpropagation vs Adam optimizer",
  ],
}: SearchBarProps): void
```
