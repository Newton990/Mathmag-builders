path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()
# add actorId null check style
s2 = s.replace('actorId,', 'actorId: actorId || null,')
with open(path, 'w') as f:
    f.write(s2)
print('done')
