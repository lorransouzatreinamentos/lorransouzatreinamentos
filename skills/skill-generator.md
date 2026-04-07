---
name: skill-generator
description: "Meta-prompt para gerar pacotes completos de skills do Claude Code com todos os arquivos necessários, dados de exemplo e documentação. Use para criar skills de forma automatizada."
---

# Claude Skills Generator - Meta Prompt

Use this prompt to automatically generate complete Claude Skills packages with all necessary files, sample data, and documentation.

## SKILL NAMING RULES (CRITICAL)
- Skill name MUST use lowercase letters, numbers, and hyphens ONLY
- WRONG: "Sales Data Analyzer", "Email_Campaign_Tool", "PDF Generator"
- CORRECT: "sales-data-analyzer", "email-campaign-tool", "pdf-generator"
- The name field in SKILL.md frontmatter must follow this format exactly

## OUTPUT STRUCTURE

For each skill requested, you will create:

1. **SKILL.md** - The main skill definition file
2. **demo-prompt.txt** - Short, clear prompt showing how to invoke the skill
3. **SETUP.md** - Installation and usage instructions
4. **Sample data files** - Realistic CSV/Excel/text files for testing
5. **File structure summary** - Clear list of all files created

## SKILL.md TEMPLATE

```yaml
---
name: {skill-name-lowercase-with-hyphens}
description: {What this skill does AND when Claude should use it. Include specific keywords users would mention. Be specific about file types, use cases, and triggers.}
---

# {Skill Display Name}

## What This Skill Does

{1-2 paragraph overview of the skill's purpose and capabilities}

## When to Use

Invoke this skill when the user:
- {Specific trigger situation 1}
- {Specific trigger situation 2}
- {Specific trigger situation 3}
- {Keywords or phrases that should trigger this skill}

## How It Works

### Step 1: {Action Name}

```python
# Python code example showing the first major step
import {required_libraries}

# Clear, well-commented code
# Show realistic variable names and data structures
```

### Step 2: {Action Name}

```python
# Next step in the workflow
# Include error handling if relevant
# Show data transformations clearly
```

### Step 3: {Output Generation}

```python
# Final step - usually file creation
# Excel (.xlsx), PowerPoint (.pptx), Word (.docx), PDF, or CSV
# Include proper formatting and styling code
```

## Required Libraries

- {library1} - {what it's used for}
- {library2} - {what it's used for}

## Example Usage

**User prompt**: "{Exact example of what user would say}"

**Claude will**:
1. {What Claude does step 1}
2. {What Claude does step 2}
3. {What Claude does step 3}

**Output files**:
- `{filename.ext}` - {Description of output}

## Tips for Best Results

- {Tip about data format or structure}
- {Tip about required columns or fields}
- {Tip about optional parameters}
```

## DEMO-PROMPT.TXT TEMPLATE

```
SKILL: {skill-name-lowercase}

HOW TO USE:

"{Short, natural prompt that demonstrates invoking this skill. Should be 1-3 sentences maximum and sound like something a real user would type.}"

EXAMPLE:

"Hey Claude—I just added the '{skill-name}' skill. {Specific task request with context}."

WHAT YOU'LL GET:
- {Output file 1}
- {Output file 2}
- {Output file 3}
```

## SETUP.MD TEMPLATE

```markdown
# {Skill Display Name} - Setup Guide

## Installation

**For Claude Code**
```bash
# Copy to personal skills directory
cp -r {skill-folder-name} ~/.claude/skills/

# Or add to project
cp -r {skill-folder-name} .claude/skills/
```

## What's Included

- `SKILL.md` - Main skill definition
- `{sample-data-file}` - Example data for testing
- `demo-prompt.txt` - Quick reference for how to use

## Quick Start

1. Install the skill using one of the methods above
2. Upload the sample data file: `{sample-data-file}`
3. Use this prompt: "{example prompt from demo-prompt.txt}"

## Sample Data

The included `{sample-data-file}` contains {description of sample data}.
Use this to test the skill, or replace with your own data in the same format.

## Required Format

Your data should include:
- {Column/field 1}: {description}
- {Column/field 2}: {description}
- {Column/field 3}: {description}
```

## SAMPLE DATA GUIDELINES

When creating sample data files:

1. **Make it realistic** - Use believable company names, dates, amounts
2. **Include variety** - Show different situations and edge cases
3. **Size appropriately** - 20-100 rows for CSV, 10-50 entries for JSON
4. **Use proper formatting** - Dates in YYYY-MM-DD, currency with decimals
5. **Include headers** - Always have descriptive column names

## USER INPUT VARIABLES

At the end of your request, specify:

**REQUIRED:**
- `SKILL_TYPE`: {Brief description of what skill to create}

**OPTIONAL:**
- `NUM_SKILLS`: {Number of related skills to generate, default: 1}
- `COMPANY_CONTEXT`: {Your company/industry context for customization}
- `BRAND_COLORS`: {Hex codes for styling outputs, e.g., #1E40AF, #10B981}
- `SPECIFIC_REQUIREMENTS`: {Any special requirements like specific libraries, file formats, or constraints}

## QUALITY CHECKLIST

Before outputting, verify:
- Skill name uses lowercase-with-hyphens format
- Description includes WHAT it does AND WHEN to use it
- Python code is complete and runnable
- Sample data is realistic and properly formatted
- demo-prompt.txt is short and clear
- SETUP.md has installation for all platforms
- All required libraries are listed
- File structure is complete
