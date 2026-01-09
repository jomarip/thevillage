# Understanding Privy Wallet Creation for Movement Network

## What You're Seeing

When you connect with Privy, you'll see several console messages. Here's what they mean:

### Expected Behavior

1. **"Failed to add embedded wallet connector: Wallet proxy not initialized"**
   - This is a **warning**, not an error
   - Privy tries to set up Ethereum wallet connectors by default
   - Since we're using Movement (Tier 2), we don't need Ethereum connectors
   - **This warning can be safely ignored**

2. **POST to `/api/v1/wallets`**
   - ✅ This means your **Movement wallet is being created successfully**
   - This is the correct behavior

3. **POST to `/api/v1/sessions`**
   - ✅ This means your **Privy session is being created**
   - This authenticates you with Privy

4. **"eth_accounts for privy: Array(1)"**
   - This shows Privy found your embedded wallet
   - The "eth_accounts" name is misleading - it's actually your Movement wallet

### What's Happening

1. **User logs in** → Privy authenticates (email, Google, etc.)
2. **Movement wallet is created** → Via `useCreateWallet({ chainType: 'movement' })`
3. **Wallet is linked to account** → Stored in Privy's system
4. **User can now sign transactions** → Using the Movement wallet

## Why Ethereum Wallets Appear in Console

Privy's SDK checks for injected Ethereum wallets (MetaMask, Nightly, etc.) by default. This is normal behavior and doesn't affect Movement wallet functionality.

## Verification

To verify your Movement wallet is working:

1. **Check the console** for:
   ```
   Creating Movement wallet...
   Movement wallet created: { address: '0x...', publicKey: '0x...' }
   ```

2. **Check your wallet connection** - You should see your Movement wallet address displayed

3. **Try a transaction** - The wallet should be able to sign Movement transactions

## Configuration

We've configured Privy to:
- ✅ **Disable automatic Ethereum wallet creation** (`createOnLogin: 'off'`)
- ✅ **Create Movement wallets on-demand** (via `useCreateWallet` hook)
- ✅ **Support social logins** (Google, Apple, Twitter, etc.)

## Troubleshooting

### "No Movement wallet found"
- Make sure you've logged in with Privy first
- Check that `createMovementWallet()` was called
- Verify in console that wallet creation succeeded

### "Transaction signing failed"
- Ensure Movement wallet was created successfully
- Check that you have sufficient balance for gas fees
- Verify the transaction payload is correct

### Ethereum wallet warnings
- These are harmless - Privy checks for Ethereum wallets by default
- They don't affect Movement wallet functionality
- Can be safely ignored

## Next Steps

1. ✅ Login with Privy (email or social)
2. ✅ Movement wallet is created automatically
3. ✅ Wallet address is displayed in UI
4. ✅ Ready to sign transactions!
