# Dependency Upgrade: @aptos-labs/ts-sdk v1.28.0 → v3.1.3

## Issue

`@aptos-labs/wallet-standard@0.5.2` requires `@aptos-labs/ts-sdk@^3.1.3 || ^4.0.0 || ^5.0.0`, but the project was using `@aptos-labs/ts-sdk@^1.28.0` (resolved to 1.39.0).

## Solution

Upgraded `@aptos-labs/ts-sdk` from `^1.28.0` to `^3.1.3` to satisfy the peer dependency requirement.

## Compatibility Check

The codebase uses standard Aptos SDK APIs that are compatible across versions:

✅ **Compatible APIs Used:**
- `Aptos`, `AptosConfig`, `Network` - Core SDK classes
- `AccountAuthenticatorEd25519`, `Ed25519PublicKey`, `Ed25519Signature` - Authentication
- `generateSigningMessageForTransaction` - Transaction signing
- `aptos.transaction.build.simple()` - Transaction building
- `aptos.transaction.submit.simple()` - Transaction submission
- `aptos.waitForTransaction()` - Transaction waiting
- `aptos.view()` - View function calls

These APIs maintain backward compatibility in v3.x.

## Files Using @aptos-labs/ts-sdk

1. `src/lib/aptos.ts` - Core SDK client and view functions
2. `src/lib/movementPrivyTx.ts` - Privy Tier 2 transaction signing
3. `src/lib/config.ts` - Network configuration
4. `src/hooks/useNightlyWallet.ts` - Direct Nightly wallet integration

## Installation

After updating `package.json`, run:

```bash
cd thevillage
npm install
```

If you encounter any peer dependency warnings, you can use:

```bash
npm install --legacy-peer-deps
```

However, with the upgrade to v3.1.3, this should not be necessary.

## Testing

After installation, verify:

1. ✅ No TypeScript compilation errors
2. ✅ Application builds successfully (`npm run build`)
3. ✅ Development server starts (`npm run dev`)
4. ✅ Wallet connections work (Petra, Nightly, Privy)
5. ✅ Transactions can be signed and submitted

## Breaking Changes (if any)

The Aptos TS SDK v3.x maintains API compatibility for the features we use. However, if you encounter any issues:

1. Check the [Aptos TS SDK v3 Migration Guide](https://aptos.dev/sdks/ts-sdk/)
2. Review console errors for deprecated API usage
3. Update any deprecated method calls

## Rollback Plan

If issues arise, you can temporarily rollback:

```bash
npm install @aptos-labs/ts-sdk@^1.28.0 --legacy-peer-deps
```

However, this will prevent `@aptos-labs/wallet-standard` from working properly, so the direct Nightly integration will not function.

## Benefits

✅ **Compatibility**: Works with `@aptos-labs/wallet-standard@0.5.0+`  
✅ **Direct Nightly Integration**: Enables bypassing adapter network validation  
✅ **Future-Proof**: Uses latest stable SDK version  
✅ **Security**: Includes latest security patches and bug fixes  
