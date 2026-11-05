with open('prisma/schema.prisma','rb') as f:
    data=f.read()
idx=data.find(b'Priority')
if idx>=0:
    print(data[idx:idx+60])
else:
    print('not found')
