path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()
s2 = s.replace(': actorId: actorId || null', ': actorId')
with open(path, 'w') as f:
    f.write(s2)
print('done')
