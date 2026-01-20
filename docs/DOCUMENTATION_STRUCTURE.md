# Documentation Structure

> investment-app documentation organization (Vibecoding standards compliant)

---

## 📁 Current Structure (SSOT 중심)

```
investment-app/
├── CLAUDE.md                    # Project-specific Claude protocol
├── README.md                    # Project overview
│
└── docs/
    ├── MASTER_PLAN.md           # Project vision & specifications (SSOT)
    ├── DESIGN_SYSTEM.md         # Visual design system (SSOT)
    ├── ROADMAP.md               # Future plans & phases (SSOT)
    ├── CHANGELOG.md             # Completed work log (SSOT)
    ├── FIXES.md                 # Bug fix records (SSOT)
    ├── CYCLE_SYSTEM_ARCHITECTURE.md  # Master cycle SSOT
    ├── REGIME_PATTERNS_SYSTEM.md     # Regime rules SSOT
    ├── CRAWLING_KNOWN_ISSUES.md      # Crawling issues SSOT
    ├── CYCLE_REFINEMENT_PLAN.md      # Active cycle plan
    │
    ├── guides/                  # Active reference guides
    │   ├── ECONOMIC_INDICATOR_GUIDE.md
    │   ├── DOCUMENTATION_GUIDE.md
    │   └── WEB-APP-EFFICIENCY-BOOST-PLAYBOOK.md
    │
    └── archive/                 # Completed implementation docs
        ├── 2024-09/            # September implementations
        │   ├── 2TIER_CATEGORY_*.md
        │   ├── PORTFOLIO_*.md
        │   ├── USER_AUTHENTICATION_*.md
        │   └── [30+ implementation docs]
        │
        ├── 2024-11/            # November implementations
        ├── 2025-12/            # 2025-12 session docs
        └── 2026-01/            # 2026-01 session docs
```

---

## 📖 Document Roles

### Root Level (2 files)
- **CLAUDE.md**: Project-specific instructions for Claude sessions
- **README.md**: Quick project overview & tech stack

### Active SSOT Docs
- **MASTER_PLAN.md**: Project vision and core specs
- **DESIGN_SYSTEM.md**: UI system and style guide
- **ROADMAP.md**: Future phases & planned features
- **CHANGELOG.md**: Completed work records
- **FIXES.md**: Bug fix history
- **CYCLE_SYSTEM_ARCHITECTURE.md**: Master cycle SSOT
- **REGIME_PATTERNS_SYSTEM.md**: Regime tag rules
- **CRAWLING_KNOWN_ISSUES.md**: Known crawler failures and 대응
- **CYCLE_REFINEMENT_PLAN.md**: Active cycle improvement plan

### Guides (3 files)
- **ECONOMIC_INDICATOR_GUIDE.md**: Reference for economic data
- **DOCUMENTATION_GUIDE.md**: How to document in this project
- **WEB-APP-EFFICIENCY-BOOST-PLAYBOOK.md**: Performance optimization guide

### Archive (Session/Implementation Logs)
- **2024-09/**: September implementations
- **2024-11/**: November implementations
- **2025-12/**: December sessions and completion logs
- **2026-01/**: January sessions and completion logs

---

## 🔄 Workflow

### When Starting New Work
1. Read `MASTER_PLAN.md` for project vision
2. Read `DESIGN_SYSTEM.md` for design specs
3. Check `ROADMAP.md` for planned features
4. Update `CHANGELOG.md` when work is completed

### When Fixing Bugs
1. Check `FIXES.md` for similar issues
2. Fix the bug
3. Document in `FIXES.md`

### When Completing Implementation
1. Update `CHANGELOG.md` with completion
2. Move dated/session docs to `archive/YYYY-MM/`
3. Update `ROADMAP.md` to remove completed items (if applicable)

---

## 📝 Documentation Standards

### File Naming
- Active plans: `MASTER_PLAN.md`, `DESIGN_SYSTEM.md`
- Guides: `<TOPIC>_GUIDE.md`
- Implementation logs: `<FEATURE>_IMPLEMENTATION.md` (goes to archive after completion)
- Fixes: `<BUG>_FIX_RESOLUTION.md` (goes to archive after fix)

### When to Archive
- Implementation is completed
- Bug is fixed
- Feature is shipped to production
- Document is no longer actively referenced

---

## 🗂️ Archive Organization

Files organized by completion month:
- `2024-09/`: Sept implementations
- `2024-10/`: Oct implementations
- `2024-11/`: Nov implementations
- etc.

---

**Last Updated**: 2026-01-20
**Compliance**: ✅ Vibecoding standards
