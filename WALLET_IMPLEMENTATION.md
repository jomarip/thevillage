# Wallet Implementation Guide

## Overview

This application supports multiple wallet types for transactions on Movement Network:
- **Petra Wallet** (browser extension)
- **Nightly Wallet** (browser extension)
- **Privy Wallet** (embedded wallet via email/social login)

All wallets are unified through the `useUnifiedWallet` hook, providing a consistent API regardless of wallet type.

## Architecture

### Wallet Provider (`WalletProvider.tsx`)

- Wraps the app with `AptosWalletAdapterProvider` for Petra/Nightly support
- **Key Design Decision**: Does NOT pass network configuration to the adapter
  - Reason: Aptos wallet adapter validates networks and rejects custom networks like Movement
  - Solution: Let wallets handle their own network settings
  - Users must configure Petra/Nightly to use Movement Network manually in wallet settings
  - Privy natively supports Movement Network and doesn't require manual configuration

### Unified Wallet Hook (`useUnifiedWallet.ts`)

Provides a single interface for all wallet types:

```typescript
const { account, connected, signAndSubmitTransaction } = useUnifiedWallet();
```

**Wallet Detection Priority:**
1. Aptos adapter (Petra/Nightly) - if connected
2. Privy embedded wallet - if authenticated and Movement wallet exists

**Transaction Signing:**
- **Petra/Nightly**: Uses wallet adapter's `signAndSubmitTransaction` (Tier 3 - fully abstracted)
- **Privy**: Uses Tier 2 pattern:
  1. Build transaction using Aptos TS SDK
  2. Sign raw hash using Privy's `useSignRawHash`
  3. Submit transaction using Aptos TS SDK

**Error Handling:**
- Provides helpful error messages for network configuration issues
- Suggests using Privy if Petra/Nightly network configuration fails

### Movement Wallet Hook (`useMovementWallet.ts`)

Manages Privy embedded Movement wallets:
- Checks for existing Movement wallet in user's linked accounts
- Creates Movement wallet if needed
- Temporarily stores wallet until Privy user object updates

## Usage Examples

### Basic Transaction (Works with All Wallets)

```typescript
import { useUnifiedWallet } from "@/hooks";
import { buildWhitelistAddressTx } from "@/lib/aptos";

function MyComponent() {
  const { signAndSubmitTransaction, connected } = useUnifiedWallet();
  
  const handleWhitelist = async (address: string) => {
    if (!connected) {
      alert("Please connect a wallet");
      return;
    }
    
    try {
      const payload = buildWhitelistAddressTx(address);
      const result = await signAndSubmitTransaction({
        data: payload,
      });
      console.log("Transaction hash:", result.hash);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };
}
```

### Checking Wallet Type

```typescript
const { walletType, account } = useUnifiedWallet();

if (walletType === "aptos") {
  // Using Petra or Nightly
} else if (walletType === "privy") {
  // Using Privy embedded wallet
}
```

## Network Configuration

### For Petra/Nightly Users

Users must manually configure their wallets to use Movement Network:

1. **Petra Wallet:**
   - Open Petra extension
   - Go to Settings → Networks
   - Add custom network:
     - Name: Movement Testnet
     - RPC URL: `https://testnet.movementnetwork.xyz/v1`
     - Chain ID: 250 (Bardock Testnet)

2. **Nightly Wallet:**
   - Open Nightly extension
   - Go to Settings → Networks
   - Add custom network with Movement Network details

### For Privy Users

No manual configuration needed - Privy natively supports Movement Network.

## Performance Optimizations

1. **Removed Excessive Logging:**
   - Removed console.logs from `useUnifiedWallet` that fired on every render
   - Removed console.logs from `useMovementWallet` that fired on every render
   - Removed debug logging from `WalletConnectModal`
   - Only error logging remains (necessary for debugging)

2. **Network Error Filtering:**
   - Network validation errors are filtered to avoid console spam
   - Only non-network errors are logged for debugging

3. **Memoization:**
   - Wallet type detection uses `useMemo` to prevent unnecessary recalculations
   - Account information is memoized based on wallet state

## Extensibility

### Adding a New Wallet Type

1. **Update `useUnifiedWallet.ts`:**
   ```typescript
   const walletType = useMemo<"aptos" | "privy" | "newWallet" | null>(() => {
     // Add detection logic for new wallet
     if (newWallet.connected) {
       return "newWallet";
     }
     // ... existing logic
   }, [/* dependencies */]);
   ```

2. **Add Transaction Signing:**
   ```typescript
   const signAndSubmitTransaction = async (payload) => {
     if (walletType === "newWallet") {
       // Implement signing logic for new wallet
       return await newWallet.signTransaction(payload);
     }
     // ... existing logic
   };
   ```

3. **Update WalletProvider if needed:**
   - If the new wallet uses Aptos adapter, no changes needed
   - If it's a separate provider, add it to the provider tree

## Error Messages

The implementation provides helpful error messages:

- **Network Configuration Error**: "Network configuration error. Please ensure your wallet (Petra/Nightly) is configured to use Movement Network. You may need to add Movement Network manually in your wallet settings, or use Privy wallet instead."
- **No Wallet Connected**: "No wallet connected. Please connect a wallet (Petra, Nightly, or Privy) to continue."

## Best Practices

1. **Always use `useUnifiedWallet`** instead of directly accessing wallet adapters
2. **Check `connected` status** before attempting transactions
3. **Handle errors gracefully** - show user-friendly messages
4. **Use transaction builders** from `@/lib/aptos` for consistent payload format
5. **Invalidate queries** after successful transactions to refresh data

## Troubleshooting

### "Invalid network" Error

- **Cause**: Petra/Nightly not configured for Movement Network
- **Solution**: Configure wallet for Movement Network (see Network Configuration above) or use Privy

### "No wallet connected" Error

- **Cause**: No wallet is connected
- **Solution**: User must connect a wallet via `WalletConnectModal`

### Transaction Fails with Petra/Nightly

- **Check**: Is wallet configured for Movement Network?
- **Alternative**: Try using Privy wallet (no configuration needed)

### Privy Wallet Not Created

- **Check**: Is user authenticated with Privy?
- **Solution**: User must login with Privy first, then Movement wallet is created automatically
