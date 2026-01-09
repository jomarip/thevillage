# Privy Tier 2 Implementation for Movement Network

This document describes the implementation of Privy's Tier 2 support for Movement Network (Aptos-compatible) transactions.

## Overview

Privy supports Movement Network as a **Tier 2 chain**, which means:
- ✅ Embedded wallets can be created
- ✅ Raw hash signing is available
- ⚠️ You must build and broadcast transactions yourself using the Aptos SDK

This is different from Tier 3 chains (Ethereum, Solana) which have fully abstracted transaction hooks.

## Implementation Details

### 1. Core Transaction Signing (`src/lib/movementPrivyTx.ts`)

The `signAndSubmitMovementEntryFunction` function implements Privy's Tier 2 pattern:

1. **Build transaction** using Aptos TS SDK
2. **Sign hash** using Privy's `useSignRawHash` hook
3. **Submit transaction** using Aptos TS SDK

### 2. Movement Wallet Hook (`src/hooks/useMovementWallet.ts`)

Provides utilities to:
- Check if user has a Movement wallet
- Create a Movement wallet on-demand
- Get the active Movement wallet account

### 3. Unified Wallet Hook (`src/hooks/useUnifiedWallet.ts`)

Unified interface that supports both:
- **Aptos wallet adapter** (Petra, etc.) - Tier 3 support
- **Privy embedded Movement wallets** - Tier 2 support

Automatically detects which wallet type is active and uses the appropriate signing method.

### 4. Village Transaction Registry (`src/lib/villageTx.ts`)

Clean, one-liner transaction functions for all Village platform operations:

```typescript
const villageTx = new VillageTx({ senderAddress, senderPublicKeyHex, signRawHash });

// Examples:
await villageTx.recordHours({ recipient, hours });
await villageTx.depositToTreasury({ amountInMove });
await villageTx.voteOnProposal({ proposalId, choice });
```

## Installation

Install the required dependency:

```bash
npm install viem
```

## Usage

### Basic Usage with Unified Wallet

The existing hooks (`useTreasury`, `useMember`, etc.) will automatically work with Privy wallets through `useUnifiedWallet`:

```typescript
// In any component
const { deposit } = useTreasury();
// This will work with both Aptos wallet adapter and Privy wallets
await deposit(10); // Deposit 10 MOV
```

### Advanced Usage with Village Transaction Registry

For more control, use the transaction registry directly:

```typescript
import { useUnifiedWallet } from '@/hooks';
import { useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { VillageTx } from '@/lib/villageTx';

function MyComponent() {
  const { account, walletType } = useUnifiedWallet();
  const { signRawHash } = useSignRawHash();

  if (!account) return <div>Connect wallet first</div>;

  const villageTx = new VillageTx({
    senderAddress: account.address,
    senderPublicKeyHex: account.publicKey,
    signRawHash,
  });

  const handleAction = async () => {
    const txHash = await villageTx.createTimeBankRequest(5, 1);
    console.log('Transaction hash:', txHash);
  };

  return <button onClick={handleAction}>Record Hours</button>;
}
```

### Creating Movement Wallets

Movement wallets are created automatically when users log in with Privy, or you can create them manually:

```typescript
import { useMovementWallet } from '@/hooks';

function CreateWalletButton() {
  const { hasMovementWallet, createMovementWallet } = useMovementWallet();

  return (
    <button onClick={createMovementWallet} disabled={hasMovementWallet}>
      {hasMovementWallet ? 'Wallet Ready' : 'Create Movement Wallet'}
    </button>
  );
}
```

## Wallet Connection Flow

1. User clicks "Connect Wallet"
2. User chooses "Privy Wallet" (email login)
3. User authenticates with email OTP
4. Movement wallet is automatically created (if not exists)
5. User can now sign transactions

## Transaction Flow (Privy Tier 2)

1. **Build**: Aptos SDK builds the transaction
2. **Sign**: Privy signs the transaction hash (raw signing)
3. **Submit**: Aptos SDK submits the signed transaction
4. **Wait**: Aptos SDK waits for confirmation

## Environment Variables

Ensure these are set in `.env.local`:

```env
NEXT_PUBLIC_PRIVY_APP_ID=cmk4lgdrw00bejm0c787048ac
NEXT_PUBLIC_PRIVY_CLIENT_ID=client-WY6UwjAGzG31cKZbQD2ZSMK8Sat2L56nNsJYw3nKe1Vau
NEXT_PUBLIC_MOVEMENT_RPC_URL=https://testnet.movementnetwork.xyz/v1
```

## Social Login Configuration

### Enable Social Logins in Privy Dashboard

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Navigate to **User Management** → **Authentication** → **Socials** tab
3. Enable the social providers you want:
   - Google
   - Apple
   - Twitter/X
   - Discord
   - GitHub
   - LinkedIn
   - TikTok
   - Spotify
   - Instagram
   - LINE

### Using Default vs Custom OAuth Credentials

**Default Credentials (Quick Start):**
- Privy provides default OAuth credentials
- Works immediately after enabling in dashboard
- Good for development/testing

**Custom Credentials (Production):**
- Your app's branding appears on social login screens
- Enhanced security and control
- Dedicated rate limits
- Better reliability

To use custom credentials, follow Privy's [OAuth setup guide](https://docs.privy.io/authentication/user-authentication/login-methods/oauth) for each provider.

### Available Social Login Methods

The following social login methods are available in the code:

- `"email"` - Email with OTP
- `"google"` - Google Sign-In
- `"apple"` - Apple Sign-In
- `"twitter"` - Twitter/X Sign-In
- `"discord"` - Discord Sign-In
- `"github"` - GitHub Sign-In
- `"linkedin"` - LinkedIn Sign-In
- `"tiktok"` - TikTok Sign-In
- `"spotify"` - Spotify Sign-In
- `"instagram"` - Instagram Sign-In
- `"line"` - LINE Sign-In
- `"wallet"` - External wallet connection

To add/remove social logins, update the `loginMethods` array in `src/providers/PrivyProvider.tsx`.

## Key Differences from Tier 3 Chains

| Feature | Tier 3 (Ethereum/Solana) | Tier 2 (Movement/Aptos) |
|---------|---------------------------|-------------------------|
| Wallet Creation | Automatic on login | Manual via `useCreateWallet` |
| Transaction Signing | `useSendTransaction` hook | `useSignRawHash` + Aptos SDK |
| Transaction Building | Handled by Privy | You build with Aptos SDK |
| Transaction Broadcasting | Handled by Privy | You broadcast with Aptos SDK |

## References

- [Privy Tier 2 Documentation](https://docs.privy.io/recipes/use-tier-2)
- [Privy Extended Chains](https://docs.privy.io/wallets/using-wallets/other-chains)
- [Aptos TS SDK](https://aptos.dev/sdks/ts-sdk/)

## Testing

To test the implementation:

1. Start the dev server: `npm run dev`
2. Click "Connect Wallet" → "Privy Wallet"
3. Log in with email
4. Movement wallet should be created automatically
5. Try a simple transaction (e.g., deposit to treasury)

## Troubleshooting

### "No Movement wallet found"
- Ensure user is authenticated with Privy
- Check that `useCreateWallet` is being called
- Verify Privy dashboard has Movement chain enabled

### "Transaction signing failed"
- Verify the wallet has sufficient balance for gas
- Check that the function ID and arguments are correct
- Ensure the transaction is being built correctly with Aptos SDK

### "useSignRawHash is not a function"
- Ensure you're importing from `@privy-io/react-auth/extended-chains`
- Check that Privy provider is properly configured
