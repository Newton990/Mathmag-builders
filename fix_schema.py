import re

path = 'C:\\Users\\user\\Documents\\mathmag-builders\\apps\\api\\prisma\\schema.prisma'
with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Replace all Json? with String?
content = content.replace('Json?', 'String?')
# Replace all Json (standalone type) with String
content = re.sub(r'\bJson\b', 'String', content)

# Remove enum blocks
lines = content.split('\n')
new_lines = []
in_enum = False
brace_depth = 0
for line in lines:
    stripped = line.strip()
    if stripped.startswith('enum ') and '{' in stripped:
        in_enum = True
        brace_depth = stripped.count('{') - stripped.count('}')
        continue
    elif in_enum:
        brace_depth += line.count('{') - line.count('}')
        if brace_depth <= 0:
            in_enum = False
        continue
    new_lines.append(line)

content = '\n'.join(new_lines)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Schema fixed: Json types replaced with String, enums removed')