path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()
s2 = s.replace('new AppError(', 'httpError(')
s2 = s2.replace('audit.write(', 'writeAudit(')
with open(path, 'w') as f:
    f.write(s2)
print('done')
