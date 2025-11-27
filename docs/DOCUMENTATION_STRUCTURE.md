# Documentation Structure

> investment-app documentation organization (Vibecoding standards compliant)

---

## 📁 Current Structure

```
investment-app/
├── CLAUDE.md                    # Project-specific Claude protocol
├── README.md                    # Project overview
│
└── docs/
    ├── MASTER_PLAN.md           # Complete project vision & specifications
    ├── DESIGN_SYSTEM.md         # Visual design system & style guide
    ├── ROADMAP.md               # Future plans & phases
    ├── CHANGELOG.md             # Completed work log
    ├── FIXES.md                 # Bug fix records
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
        └── 2024-11/            # November implementations
            ├── EXPENSE_CHART_TYPE_*.md
            ├── EXPENSE_COMPOSITION_*.md
            └── EXPENSE_YEAR_MONTH_*.md
```

---

## 📖 Document Roles

### Root Level (2 files)
- **CLAUDE.md**: Project-specific instructions for Claude sessions
- **README.md**: Quick project overview & tech stack

### Active Docs (5 files)
- **MASTER_PLAN.md**: Complete project vision, 5-stage investment routine mapping, tech stack, 9-week roadmap
- **DESIGN_SYSTEM.md**: Gold+Emerald theme, OKLCH colors, 7 design trends, Tailwind config
- **ROADMAP.md**: Future phases & planned features
- **CHANGELOG.md**: Completed work records
- **FIXES.md**: Bug fix history

### Guides (3 files)
- **ECONOMIC_INDICATOR_GUIDE.md**: Reference for economic data
- **DOCUMENTATION_GUIDE.md**: How to document in this project
- **WEB-APP-EFFICIENCY-BOOST-PLAYBOOK.md**: Performance optimization guide

### Archive (33+ files)
- **2024-09/**: September implementations (categories, portfolio, security, indicators)
- **2024-11/**: November implementations (expense features)

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
2. Move detailed implementation doc to `archive/YYYY-MM/`
3. Update `ROADMAP.md` to remove completed items

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

**Last Updated**: 2025-11-27
**Total Active Docs**: 5 core + 3 guides = 8 files
**Archived Docs**: 33+ implementation records
**Compliance**: ✅ Vibecoding standards
