import {
    getUserSearchHistory,
    addUserSearch,
    removeUserSearch,
    clearUserSearchHistory,
} from '@/server/history/searchHistoryStore';

async function runHistoryIsolationTests() {
    console.log('=== TEST USER SEARCH HISTORY ACCOUNT ISOLATION ===');

    const userA = 'test-user-A-' + Date.now();
    const userB = 'test-user-B-' + Date.now();

    // 1. User A adds searches
    const searchA1 = await addUserSearch(userA, 'Quantum Computing with PyTorch');
    const searchA2 = await addUserSearch(userA, 'Chest X-ray Pneumonia Detection');
    if (!searchA1 || !searchA2) throw new Error('Failed to create User A searches');

    // 2. User B adds searches
    const searchB1 = await addUserSearch(userB, 'Autonomous Drone Navigation YOLO');
    if (!searchB1) throw new Error('Failed to create User B search');

    // 3. Verify User A history contains only User A's searches
    const historyA = await getUserSearchHistory(userA);
    console.log('User A history count:', historyA.length);
    if (historyA.length !== 2) throw new Error(`Expected 2 items for User A, got ${historyA.length}`);
    if (historyA.some((item) => item.userId !== userA)) {
        throw new Error('Leak detected: User A history contains items from another user!');
    }
    if (!historyA.some((item) => item.query === 'Quantum Computing with PyTorch')) {
        throw new Error('User A missing expected search');
    }

    // 4. Verify User B history contains only User B's searches
    const historyB = await getUserSearchHistory(userB);
    console.log('User B history count:', historyB.length);
    if (historyB.length !== 1) throw new Error(`Expected 1 item for User B, got ${historyB.length}`);
    if (historyB.some((item) => item.userId !== userB)) {
        throw new Error('Leak detected: User B history contains items from another user!');
    }
    if (historyB[0].query !== 'Autonomous Drone Navigation YOLO') {
        throw new Error('User B missing expected search');
    }

    // 5. Ownership Verification: User B tries to delete User A's search
    const unauthorizedDelete = await removeUserSearch(userB, searchA1.id);
    console.log('User B attempted to delete User A item (should be false):', unauthorizedDelete);
    if (unauthorizedDelete) {
        throw new Error('Security violation: User B was able to delete User A search record!');
    }

    // 6. User A deletes their own item
    const authorizedDelete = await removeUserSearch(userA, searchA1.id);
    console.log('User A deletes own item (should be true):', authorizedDelete);
    if (!authorizedDelete) throw new Error('User A failed to delete own item');

    // 7. Clear User A history: ensure User B history is completely untouched
    await clearUserSearchHistory(userA);
    const historyAAfterClear = await getUserSearchHistory(userA);
    const historyBAfterClear = await getUserSearchHistory(userB);

    if (historyAAfterClear.length !== 0) throw new Error('User A history not cleared');
    if (historyBAfterClear.length !== 1) throw new Error('User B history was corrupted by User A clear!');

    // Clean up test User B
    await clearUserSearchHistory(userB);

    console.log('✅ ALL SEARCH HISTORY ISOLATION TESTS PASSED CLEANLY');
}

runHistoryIsolationTests()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Test failed:', err);
        process.exit(1);
    });
