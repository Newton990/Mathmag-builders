path = 'src/routes/planning.ts'
with open(path) as f:
    s = f.read()
s2 = s.replace('req.user!.id', 'req.user!.sub')
with open(path, 'w') as f:
    f.write(s2)
print('done')
