path = 'src/services/governance.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Use 'as any' for projectId in writeAudit calls that might fail
content = content.replace("projectId: data.projectId || undefined", "projectId: (data.projectId as any) || undefined")
content = content.replace("projectId: a.projectId || undefined", "projectId: (a.projectId as any) || undefined")
content = content.replace("projectId: e.projectId || undefined", "projectId: (e.projectId as any) || undefined")
content = content.replace("projectId: l.projectId || undefined", "projectId: (l.projectId as any) || undefined")
content = content.replace("projectId: r.projectId || undefined", "projectId: (r.projectId as any) || undefined")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
