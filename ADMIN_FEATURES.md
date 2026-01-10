# Admin Features Implementation Guide

This document describes the newly implemented admin features for The Village platform.

## Overview

All admin features have been implemented to provide complete management capabilities for:
- Community creation and management
- Project approval workflows
- Compliance/KYC management
- Enhanced wallet connection

## New Admin Pages

### 1. Community Management (`/admin/communities`)

**Purpose**: View and manage all registered communities in the Registry Hub.

**Features**:
- List all registered communities
- View community configuration (all registry addresses)
- See community statistics
- Link to blockchain explorer for each community

**Access**: Admin only

### 2. Create Community (`/admin/communities/create`)

**Purpose**: Register a new community in the Registry Hub.

**Features**:
- Two-step process:
  1. Initialize Registry Hub (if not already initialized)
  2. Register community with all registry addresses
- Form validation for all required fields
- Transaction feedback with explorer links
- Error handling with actionable guidance

**Required Information**:
- Community ID (unique identifier)
- Members Registry Address
- Compliance Registry Address
- Treasury Address
- Pool Registry Address
- Fractional Shares Address
- Governance Address
- Token Admin Address
- Time Token Admin Address

**Access**: Admin only

### 3. Project Management (`/admin/projects`)

**Purpose**: Review and approve community project proposals.

**Features**:
- View all projects with status filtering
- Approve pending projects (one-click)
- Update project status
- Search projects by ID or borrower address
- Statistics dashboard (Total, Pending, Approved, Active)
- Direct links to project details

**Workflow**:
1. Projects are proposed by members (status: Proposed)
2. Admin reviews project details
3. Admin approves project (status: Approved → Active)
4. Admin can update status as needed (Active, Completed, Cancelled)

**Access**: Admin only

### 4. Compliance & KYC (`/admin/compliance`)

**Purpose**: Manage KYC verification and whitelist addresses.

**Features**:
- View all whitelisted addresses
- Whitelist new addresses (KYC verified)
- Check address whitelist status
- Search whitelisted addresses
- View your own compliance status
- Statistics dashboard

**Workflow**:
1. User completes off-chain KYC verification
2. Admin verifies KYC documents
3. Admin whitelists address on-chain
4. Address can now access financial features

**Access**: Admin only

## Enhanced Features

### Wallet Connection Improvements

**Changes**:
- Enhanced wallet detection in `WalletProvider`
- Multiple retry attempts (100ms, 500ms, 1000ms) for wallets that inject after page load
- Better initialization on page mount
- Improved error handling

**How it works**:
- Wallet detection runs immediately on provider mount
- Retries at intervals to catch wallets that inject later
- Works with Petra, Nightly, and Privy wallets

### Testing Utilities (`src/lib/test-utils.ts`)

**Purpose**: Provide utilities for testing and development.

**Features**:
- `generateTestAddress()`: Create random test addresses
- `generateMockMember()`: Generate mock member data
- `generateMockTimeBankRequest()`: Generate mock Time Bank requests
- `generateMockProject()`: Generate mock project data
- `generateMockProposal()`: Generate mock governance proposals
- `generateTestScenario()`: Create complete test scenarios
- `isValidAddress()`: Validate address format
- `simulateBlockchainDelay()`: Simulate network delays
- `mockBlockchainResponse()`: Mock blockchain responses

**Usage Example**:
```typescript
import { generateTestScenario, generateMockProject } from "@/lib/test-utils";

// Generate a complete test scenario
const scenario = generateTestScenario("Demo Scenario");

// Generate mock projects
const projects = generateMockItems(generateMockProject, 5);
```

## Navigation Updates

New admin menu items added:
- **Projects** (`/admin/projects`) - Project approval
- **Communities** (`/admin/communities`) - Community management

All admin pages are accessible from the sidebar navigation (admin-only visibility).

## Backend Integration

### Registry Hub Functions

Added to `src/lib/aptos.ts`:
- `getCommunityConfig()`: Fetch community configuration
- `buildInitializeHubTx()`: Initialize registry hub
- `buildRegisterCommunityTx()`: Register new community

### Project Functions

Added to `src/lib/aptos.ts`:
- `buildApproveProjectTx()`: Approve a project
- `buildUpdateProjectStatusTx()`: Update project status

### Hooks

New hooks in `src/hooks/`:
- `useRegistryHub.ts`: Community management hooks
- `useProjects.ts`: Project approval hooks (enhanced)

## User Journey

### Creating a New Community

1. **Admin navigates to** `/admin/communities`
2. **Clicks "Create Community"**
3. **Step 1**: Initialize Registry Hub (if not done)
   - Transaction submitted
   - Hub initialized at admin's address
4. **Step 2**: Register Community
   - Fill in community ID
   - Provide all registry addresses
   - Submit transaction
   - Community registered in hub
5. **View community** in communities list

### Approving a Project

1. **Admin navigates to** `/admin/projects`
2. **Views pending projects** (highlighted section)
3. **Reviews project details** (click "View Details")
4. **Clicks "Approve"** button
5. **Transaction submitted** with explorer link
6. **Project status updated** to Approved/Active

### Managing Compliance

1. **Admin navigates to** `/admin/compliance`
2. **Views whitelisted addresses**
3. **To whitelist new address**:
   - Click "Whitelist Address"
   - Enter address
   - Submit transaction
4. **To check status**:
   - Enter address in "Check Address Status"
   - Click "Check"
   - View result

## Testing

### Using Test Utilities

```typescript
import {
  generateTestScenario,
  generateMockProject,
  generateMockMember,
  isValidAddress,
} from "@/lib/test-utils";

// Create test data
const scenario = generateTestScenario("Test Community");
const projects = scenario.projects;
const members = scenario.members;

// Validate addresses
if (isValidAddress(userAddress)) {
  // Address is valid
}
```

### Test Scenarios

Test scenarios include:
- Multiple members with different roles
- Projects in various states
- Governance proposals
- Time Bank requests

## Error Handling

All admin pages include:
- Wallet connection checks
- Admin role verification
- Transaction error handling with actionable guidance
- Explorer links for successful transactions
- Loading states and feedback

## Next Steps

### Recommended Enhancements

1. **Community List Enhancement**:
   - Fetch actual communities from Registry Hub
   - Add pagination for many communities
   - Add community name/description fields

2. **Project Approval**:
   - Add project details modal
   - Show project metadata (IPFS CID)
   - Add bulk approval feature

3. **Compliance**:
   - Add bulk whitelist feature
   - Add whitelist removal capability
   - Add KYC document upload/viewing

4. **Testing**:
   - Add E2E tests for admin workflows
   - Add unit tests for hooks
   - Add integration tests for transactions

## Troubleshooting

### Wallet Connection Issues

If wallet doesn't connect on initial load:
1. Check browser console for errors
2. Ensure wallet extension is installed and enabled
3. Try refreshing the page
4. Check wallet network configuration (should be Movement Network)
5. Try using Privy wallet (email login) for best compatibility

### Transaction Failures

If transactions fail:
1. Check error message in toast notification
2. Verify you have sufficient balance for gas
3. Ensure you're an admin (check role)
4. Verify all required addresses are correct
5. Check transaction on explorer using provided link

### Community Registration Issues

If community registration fails:
1. Ensure Registry Hub is initialized first
2. Verify all registry addresses are valid
3. Check that community ID is unique
4. Ensure you're the hub admin
5. Verify all addresses exist on-chain

## Support

For issues or questions:
- Check the Help & FAQ page (`/help`)
- Review transaction details on blockchain explorer
- Contact community administrator
