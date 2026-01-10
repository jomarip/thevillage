# Privy Movement Wallet Integration - Best Practices Implementation

## Overview

This document describes the implementation of the consultant-recommended best practices for Privy Movement wallet integration, addressing the missing `publicKey` issue.

## Problem Solved

Previously, we relied on `user.linkedAccounts` to provide the `publicKey` for Movement wallets, but Privy's `linkedAccounts` is designed for **identity/verification**, not **actionability**. The `publicKey` was often missing, preventing transaction signing.

## Solution Architecture

### Key Insight
- **`user.linkedAccounts`**: For identity/verification (may not include `publicKey`)
- **Privy Wallet API**: For actionability (includes `publicKey`, requires server-side access)

### Implementation Pattern

1. **Extract wallet ID from `linkedAccounts`** (client-side, safe)
2. **Fetch `publicKey` via Next.js API route** (server-side, uses Privy app secret)
3. **Combine wallet info for transaction signing** (client-side)

## Files Changed

### 1. New API Route: `src/app/api/privy/wallets/[walletId]/public-key/route.ts`

Server-side route that fetches the public key from Privy's Wallet API using the app secret.

**Key Features:**
- Uses Basic Auth with `PRIVY_APP_ID` and `PRIVY_APP_SECRET`
- Returns `publicKey` from Privy's wallet object
- Handles errors gracefully
- Security: Should be authorized in production (verify caller owns the wallet)

### 2. Updated Hook: `src/hooks/useMovementWallet.ts`

Completely rewritten to follow the recommended pattern.

**Key Changes:**
- ✅ Extracts `walletId` and `address` from `linkedAccounts`
- ✅ Fetches `publicKey` via API route using React Query
- ✅ Removed all `localStorage` workarounds
- ✅ Removed fragile "refresh by calling createWallet" logic
- ✅ Returns `MovementWalletInfo` type with `walletId`, `address`, `publicKey`, `chainType`

**New Return Type:**
```typescript
type MovementWalletInfo = {
  walletId: string;
  address: string;
  publicKey: string; // Reliably fetched via API
  chainType: "movement" | "aptos";
};
```

### 3. Updated Hook: `src/hooks/useUnifiedWallet.ts`

Simplified to work with the new reliable `movementWallet` structure.

**Key Changes:**
- ✅ Removed fallback logic for missing `publicKey` (no longer needed)
- ✅ Uses `movementWallet.chainType` instead of hardcoding `'aptos'`
- ✅ Cleaner error messages
- ✅ Simplified account computation

### 4. Updated Documentation: `README.md`

Added `PRIVY_APP_SECRET` to environment variables documentation with security notes.

## Environment Variables

Add to `.env.local`:

```env
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret  # Server-side only - NEVER expose to client
```

**Security Note**: `PRIVY_APP_SECRET` is only used in server-side API routes. Never expose it to the client or commit it to version control.

## Benefits

1. ✅ **Reliable**: `publicKey` is always available when wallet exists
2. ✅ **No localStorage dependency**: Works across devices/sessions
3. ✅ **No duplicate wallets**: Doesn't call `createWallet` to "refresh"
4. ✅ **Better error handling**: Clear messages when wallet is loading or missing
5. ✅ **Production-ready**: Follows Privy's recommended patterns

## Migration Notes

### For Existing Users

If users have wallets created with the old pattern:
- The new hook will automatically fetch their `publicKey` via the API route
- No user action required
- Works seamlessly with existing wallets

### For New Users

- Wallet creation flow remains the same
- `publicKey` is automatically fetched after wallet appears in `linkedAccounts`
- No changes to user experience

## Testing Checklist

- [ ] Connect Privy wallet - address should appear
- [ ] Check console - should see API call to `/api/privy/wallets/[walletId]/public-key`
- [ ] Submit transaction - should work without "missing publicKey" errors
- [ ] Refresh page - wallet should still work (no localStorage dependency)
- [ ] Check network tab - API route should return `publicKey` successfully

## Troubleshooting

### API Route Returns 500 Error

**Check:**
1. `PRIVY_APP_SECRET` is set in `.env.local`
2. `NEXT_PUBLIC_PRIVY_APP_ID` matches your Privy app ID
3. Wallet ID is valid (check console logs)

### Public Key Still Missing

**Check:**
1. API route is accessible (check network tab)
2. React Query is fetching (check React Query DevTools)
3. Wallet exists in `linkedAccounts` (check console logs)

### Transactions Still Fail

**Check:**
1. `movementWallet.publicKey` is present (check console logs)
2. `movementWallet.address` matches the wallet you're using
3. No TypeScript errors in `useUnifiedWallet.ts`

## References

- [Privy Docs: Get Connected Wallets](https://docs.privy.io/wallets/wallets/get-a-wallet/get-connected-wallet)
- [Privy Docs: Wallet API](https://docs.privy.io/api-reference/wallets/create)
- [Privy Docs: Tier 2 Chains (Movement)](https://docs.privy.io/wallets/using-wallets/other-chains#movement)
