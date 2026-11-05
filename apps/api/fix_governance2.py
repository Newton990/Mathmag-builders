path = 'src/services/governance.service.ts'
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

# replace all cases
s2 = s.replace("projectId: a.projectId || null", "projectId: a.projectId || undefined")
s2 = s2.replace("projectId: e.projectId || null", "projectId: e.projectId || undefined")
s2 = s2.replace("projectId: l.projectId || null", "projectId: l.projectId || undefined")
s2 = s2.replace("projectId: r.projectId || null", "projectId: r.projectId || undefined")
s2 = s2.replace("projectId: data.projectId || null", "projectId: data.projectId || undefined")

with open(path, 'w', encoding='utf-8') as f:
    f.write(s2)
print('done')
