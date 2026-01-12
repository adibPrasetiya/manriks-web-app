# Risk Management System - Database Schema

## Overview

Complete Prisma database schema for a multi-tenant risk management system with temporal versioning, full audit trail, and risk treatment tracking.

- **Database**: MySQL
- **ORM**: Prisma 6.x
- **Total Tables**: 21 (organized into 8 logical domains)

## Schema Structure

### Domain 1: Organization & Multi-Tenancy (1 table)
- `organizations` - Root entity for multi-tenant system

### Domain 2: Risk Context & Versioning (7 tables)
- `risk_contexts` - Core versioning entity with effective dates
- `likelihood_scales` - Likelihood levels per context
- `impact_categories` - Impact categories (Financial, Operational, etc.)
- `impact_scales` - Impact levels per category
- `risk_matrix_cells` - Likelihood × Impact = Risk Level mapping
- `risk_level_thresholds` - Risk level definitions (Low/Medium/High/Extreme)
- **`valuation_criteria`** - **FLEXIBLE asset valuation dimensions** (CIA or custom)

### Domain 3: Asset Management (3 tables)
- `assets` - Master asset registry
- `asset_snapshots` - Asset snapshot per risk context
- **`asset_valuation_scores`** - **Individual scores per flexible criteria**

### Domain 4: Risk Identification & Assessment (2 tables)
- `risks` - Identified risks
- `risk_assessments` - Risk analysis (inherent/residual)

### Domain 5: Control Management (2 tables)
- `controls` - Reusable control catalog
- `control_effectiveness` - Control effectiveness tracking

### Domain 6: Risk Treatment & Action Tracking (3 tables)
- `risk_treatments` - Treatment plans
- `treatment_actions` - Specific action items
- `action_updates` - Progress timeline

### Domain 7: Audit & Compliance (2 tables)
- `audit_logs` - Comprehensive audit trail with before/after values
- `risk_reviews` - Periodic review cycles

### Domain 8: Reference Data (1 table)
- `reference_data` - Generic lookup/reference data

## Key Features

✅ **Flexible Asset Valuation** (NOT limited to CIA)
   - Define custom valuation criteria per risk context
   - Examples: CIA for info security, Physical Security criteria, Personnel criteria
   - Weighted scoring with rationale and evidence

✅ **Temporal Versioning**
   - Effective date snapshots (no destructive updates)
   - Historical data preservation

✅ **Full Audit Trail**
   - Before/after values for all changes
   - User tracking, IP address, context data

✅ **Multi-Tenant**
   - Organization-level isolation
   - Shared reference data support

## Files Created

### Core Schema Files
```
prisma/
├── schema.prisma       # Complete schema with 21 models
├── seed.js            # Sample data seeder
└── migrations/        # (Created after first migration)

.env                   # Database connection string
prisma.config.ts       # Prisma configuration
```

### Utility Files
```
src/
└── utils/
    ├── prisma.js      # Prisma client singleton
    └── audit.js       # Audit trail helpers
```

## Next Steps

### 1. Set Up Your MySQL Database

Update `.env` with your actual MySQL connection:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/risk_management_db"
```

### 2. Create Database and Run Migration

```bash
# Create the initial migration
npx prisma migrate dev --name init_risk_management_schema

# This will:
# - Create the database if it doesn't exist
# - Generate all 21 tables
# - Apply indexes and constraints
```

### 3. Seed Sample Data

```bash
# Run the seeder to populate sample data
npx prisma db seed

# This creates:
# - 1 Organization (ACME Corporation)
# - 1 Risk Context (2024 InfoSec)
# - 5 Likelihood scales
# - 4 Impact categories with scales
# - 4 Risk level thresholds
# - 3 Valuation criteria (CIA)
# - 13 Reference data entries
```

### 4. Explore with Prisma Studio

```bash
# Launch Prisma Studio (visual database browser)
npx prisma studio
```

### 5. Use in Your Application

```javascript
// Import the Prisma client singleton
const prisma = require('./src/utils/prisma');

// Example: Create an organization
const org = await prisma.organization.create({
  data: {
    code: 'MY-ORG',
    name: 'My Organization',
    status: 'active',
    created_by: userUuid,
    updated_by: userUuid,
  },
});

// Example: Create custom valuation criteria (Physical Security)
await prisma.valuationCriteria.createMany({
  data: [
    {
      risk_context_id: contextId,
      code: 'PHYS_PROT',
      name: 'Physical Protection',
      description: 'Level of physical barriers',
      scale_min: 1,
      scale_max: 5,
      weight: 0.4,
      display_order: 1,
      created_by: userUuid,
      updated_by: userUuid,
    },
    {
      risk_context_id: contextId,
      code: 'ACCESS_CTRL',
      name: 'Access Control',
      description: 'Quality of access systems',
      scale_min: 1,
      scale_max: 5,
      weight: 0.35,
      display_order: 2,
      created_by: userUuid,
      updated_by: userUuid,
    },
    // ... more criteria
  ],
});

// Example: Use audit trail
const { createAuditLog } = require('./src/utils/audit');

await createAuditLog({
  organization_id: 1,
  entity_type: 'risks',
  entity_id: riskId,
  action: 'UPDATE',
  old_values: { status: 'identified' },
  new_values: { status: 'assessed' },
  created_by: userUuid,
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});
```

## Valuation Criteria Examples

### Information Security (CIA)
```javascript
{
  code: 'CONF', name: 'Confidentiality',
  code: 'INTG', name: 'Integrity',
  code: 'AVAIL', name: 'Availability',
}
```

### Physical Security
```javascript
{
  code: 'PHYS_PROT', name: 'Physical Protection',
  code: 'ACCESS_CTRL', name: 'Access Control',
  code: 'ENVIRON', name: 'Environmental Controls',
}
```

### Personnel Security
```javascript
{
  code: 'PERS_RISK', name: 'Personnel Risk',
  code: 'TRAINING', name: 'Training Level',
  code: 'CLEARANCE', name: 'Security Clearance',
}
```

## Schema Verification

After migration, verify tables were created:

```bash
# Connect to MySQL
mysql -u USER -p risk_management_db

# Show all tables
SHOW TABLES;

# Should see 21 tables:
# organizations
# risk_contexts
# likelihood_scales
# impact_categories
# impact_scales
# risk_matrix_cells
# risk_level_thresholds
# valuation_criteria        ← NEW: Flexible criteria
# assets
# asset_snapshots
# asset_valuation_scores    ← NEW: Flexible scoring
# risks
# risk_assessments
# controls
# control_effectiveness
# risk_treatments
# treatment_actions
# action_updates
# audit_logs
# risk_reviews
# reference_data
```

## Support

For detailed schema design and rationale, see:
`C:\Users\madib\.claude\plans\fizzy-hopping-puddle.md`

---

**Database Implementation**: Complete ✅
**Ready for**: Application development and API implementation
