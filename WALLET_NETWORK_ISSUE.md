# Wallet Network Configuration Issue

## Problem

The Aptos wallet adapter validates networks during transaction signing, not just during connection. Even if you configure Petra/Nightly wallets to use Movement Network in their settings, the adapter may still reject transactions because it checks against its own network configuration.

**Error Message:**
```
Invalid network, custom network not supported with Aptos wallet adapter to prevent user from using an unexpected network.
```

## Root Cause

1. **Aptos Wallet Adapter Limitation**: The adapter validates networks and only allows standard Aptos networks (Mainnet, Testnet, Devnet)
2. **Movement Network is Custom**: Movement Network is a custom network, not a standard Aptos network
3. **Validation Happens During Signing**: The adapter checks the network when you call `signAndSubmitTransaction`, not just when connecting

## Solutions

### Solution 1: Use Privy Wallet (Recommended) ✅

**Privy natively supports Movement Network** and doesn't require any configuration:

1. Disconnect from Petra/Nightly
2. Click "Connect Wallet" → Select "Privy Wallet"
3. Login with email (or social login)
4. Privy will automatically create a Movement wallet
5. All transactions will work seamlessly

**Advantages:**
- No network configuration needed
- Works out of the box
- Automatic fallback is implemented (if Petra/Nightly fails, Privy is used automatically if logged in)

### Solution 2: Automatic Fallback (Implemented)

The system now **automatically falls back to Privy** if:
- You're using Petra/Nightly and get a network error
- You're already logged in with Privy
- You have a Privy Movement wallet created

**How it works:**
1. Try transaction with Petra/Nightly
2. If network error occurs → automatically try Privy
3. If Privy succeeds → transaction completes
4. If Privy not available → show helpful error message

### Solution 3: Configure Petra/Nightly (Advanced)

**Note**: This may still not work due to adapter validation, but you can try:

1. **Petra Wallet:**
   - Open Petra extension
   - Settings → Networks → Add Custom Network
   - Name: Movement Testnet
   - RPC URL: `https://testnet.movementnetwork.xyz/v1`
   - Chain ID: 250

2. **Nightly Wallet:**
   - Open Nightly extension
   - Settings → Networks → Add Custom Network
   - Configure Movement Network details

**Limitation**: Even with this configuration, the adapter may still reject transactions during signing.

## Current Implementation

### Automatic Fallback Logic

```typescript
// In useUnifiedWallet.ts
if (walletType === "aptos") {
  try {
    // Try Petra/Nightly first
    return await aptosWallet.signAndSubmitTransaction(payload);
  } catch (error) {
    if (isNetworkError && privy.authenticated && movementWallet) {
      // Automatic fallback to Privy
      // Falls through to Privy implementation
    }
  }
}

// Privy implementation (primary or fallback)
if (walletType === "privy" || (fallback condition)) {
  // Use Privy Tier 2 pattern
}
```

### Error Messages

The system provides clear error messages:
- If Privy is available but not authenticated: "Please use Privy wallet instead..."
- If Privy is authenticated but no Movement wallet: "Please disconnect and reconnect with Privy..."
- If no Privy available: "Please use Privy wallet instead..."

## Best Practice Recommendation

**For Movement Network, use Privy Wallet** - it's the most reliable option because:
1. ✅ Native Movement Network support
2. ✅ No manual configuration needed
3. ✅ Works out of the box
4. ✅ Automatic fallback implemented
5. ✅ Better user experience (email login)

## Testing

To test the automatic fallback:
1. Connect with Nightly/Petra
2. Login with Privy (don't disconnect Nightly/Petra)
3. Try a transaction (whitelist, etc.)
4. If Nightly/Petra fails → should automatically use Privy
5. Transaction should succeed

## Future Improvements

1. **Detect Network Configuration**: Check if wallet is configured for Movement before attempting transaction
2. **Smart Wallet Selection**: Automatically prefer Privy for Movement Network transactions
3. **Better UX**: Show wallet recommendation based on network compatibility
