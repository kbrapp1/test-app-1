# Generate Domain File Structure Prompt

Use this prompt to generate a complete file directory for any domain folder in your DDD architecture.

## Prompt Template

```
Please generate a complete file structure for the {args} domain.

Steps:
1. First delete any existing file in the docs/structures/{args}-structure.md
2. Generate the file structure using: `find "lib/{args}" -type f > "docs/structures/{args}-structure.md"`

if you get an error like this "Error: /usr/bin/bash: line 1: C:UsersownerAppDataLocalTemp/*: No such file or directory"
- just ignore it. It has nothing to do with the this request

Example command for chatbot-widget domain:
```bash
`find "lib/{chatbot-widget}" -type f > "docs/structures/{chatbot-widget}-structure.md"`
```

The output should show the complete domain structure following DDD patterns:
- domain/ (entities, value-objects, services, repositories, errors)
- application/ (use-cases, services, dto, commands, queries)
- infrastructure/ (persistence, providers, composition)
- presentation/ (components, hooks, actions, types)
```

## Usage Examples

### For any domain:
Replace `{args}` with your target domain:

- `chatbot-widget`
- `dam` (Digital Asset Management)
- `image-generator`
- `tts` (Text-to-Speech)
- `auth`
- `monitoring`

### Sample Commands:

```bash
#/structure dam
`find "lib/{dam}" -type f > "docs/structures/{dam}-structure.md"`

#/structure image-generator
`find "lib/{image-generator}" -type f > "docs/structures/{image-generator}-structure.md"`

#/structure TTS
`find "lib/{TTS}" -type f > "docs/structures/{TTS}-structure.md"`
```