# Direct Nightly Wallet Integration for Movement Network

## Overview

This implementation provides **direct Nightly wallet integration** that bypasses the Aptos wallet adapter's network validation, allowing Nightly to work seamlessly with Movement Network.

## Problem Solved

The Aptos wallet adapter validates networks and rejects custom networks like Movement during transaction signing. Even when Nightly is configured for Movement Network, the adapter blocks transactions.

**Solution**: Use Nightly's adapter directly via `@aptos-labs/wallet-standard`, connecting with `Network.CUSTOM` and the Movement chainId.

## Implementation

### 1. Direct Nightly Hook (`useNightlyWallet.ts`)

This hook:
- Detects Nightly wallet using `getAptosWallets()` from `@aptos-labs/wallet-standard`
- Connects with Movement Network configuration:
  ```typescript
  const networkInfo: NetworkInfo = {
    chainId: 250, // Bardock Testnet (126 for Mainnet)
    name: Network.CUSTOM,
  };
  ```
- Uses Nightly's adapter features directly for signing transactions
- Bypasses the AptosWalletAdapterProvider's network validation

### 2. Integration with Unified Wallet

The `useUnifiedWallet` hook now:
- **Prioritizes direct Nightly** over adapter-based wallets
- Automatically uses direct Nightly if available
- Falls back to Petra (via adapter) or Privy if needed

### 3. Wallet Connect Modal

The modal now:
- Shows Nightly with "(Direct)" indicator when connected
- Uses direct Nightly connection instead of adapter connection
- Provides clear feedback about connection status

## Usage

### For Users

1. **Install Nightly Wallet** extension
2. **Click "Connect Wallet"** → Select "Nightly Wallet"
3. **Nightly connects with Movement Network** automatically (chainId: 250 for testnet)
4. **All transactions work** without network configuration errors

### For Developers

```typescript
import { useNightlyWallet } from "@/hooks";

function MyComponent() {
  const { 
    connected, 
    account, 
    connect, 
    disconnect, 
    signAndSubmitTransaction 
  } = useNightlyWallet();

  // Connect with Movement Network
  await connect();

  // Sign and submit transaction
  const result = await signAndSubmitTransaction({
    data: {
      function: "0x1::aptos_account::transfer_coins",
      functionArguments: [recipient, amount],
    },
  });
}
```

## Network Configuration

### Movement Testnet (Bardock)
- **Chain ID**: 250
- **RPC URL**: `https://testnet.movementnetwork.xyz/v1`
- **Auto-detected** from `MOVEMENT_REST_URL` config

### Movement Mainnet
- **Chain ID**: 126
- **RPC URL**: `https://full.mainnet.movementinfra.xyz/v1`
- **Auto-detected** from `MOVEMENT_REST_URL` config

## Key Differences from Adapter Approach

| Feature | Adapter Approach | Direct Integration |
|---------|-----------------|-------------------|
| Network Validation | ❌ Blocks custom networks | ✅ Allows custom networks |
| Connection | Via AptosWalletAdapterProvider | Direct via wallet-standard |
| Network Config | Must be set in wallet | Passed during connect |
| Transaction Signing | Validates network | No validation |
| Movement Support | ❌ Fails | ✅ Works |

## Technical Details

### Connection Flow

1. **Detect Nightly**: Use `getAptosWallets()` to find Nightly wallet
2. **Get Adapter**: Access `nightly.standardWallet` as `AptosWallet`
3. **Connect with Network**: Call `adapter.features['aptos:connect'].connect(false, networkInfo)`
4. **Store Account**: Save account address and public key

### Transaction Flow

1. **Build Transaction**: Use Aptos TS SDK with Movement config
2. **Sign & Submit**: Use `adapter.features['aptos:signAndSubmitTransaction']`
3. **Fallback**: If that fails, use `signTransaction` + `submit.simple` separately

## Benefits

✅ **No Network Validation Errors**: Bypasses adapter's network checks  
✅ **Native Movement Support**: Uses Nightly's built-in Movement support  
✅ **Seamless UX**: Works out of the box, no manual configuration  
✅ **Admin-Friendly**: Admins can use Nightly without workarounds  
✅ **Future-Proof**: Uses official Nightly documentation approach  

## Testing

To test the integration:

1. Install Nightly Wallet extension
2. Navigate to admin page
3. Click "Connect Wallet" → "Nightly Wallet"
4. Should connect with "(Direct)" indicator
5. Try whitelisting an address
6. Transaction should succeed without network errors

## Troubleshooting

### "Nightly wallet not detected"
- Ensure Nightly extension is installed
- Refresh the page
- Check browser console for errors

### "Failed to get account"
- Try disconnecting and reconnecting
- Check Nightly extension is unlocked
- Verify network configuration in Nightly settings

### Transaction Still Fails
- Check that you're using the direct Nightly connection (not adapter)
- Verify chainId matches your network (250 for testnet, 126 for mainnet)
- Check browser console for detailed error messages

## Dependencies

- `@aptos-labs/wallet-standard`: ^0.5.0 (for wallet detection)
- `@aptos-labs/ts-sdk`: ^1.28.0 (for transaction building)

## References

- [Nightly Movement Documentation](https://docs.nightly.app/wallets/nightly-extension/aptos-movement)
- [Nightly Source Code Example](https://github.com/nightly-labs/movement-web3-template/blob/main/app/components/StickyHeader.tsx)
