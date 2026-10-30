with open('prisma/schema.prisma') as f:
    for i,l in enumerate(f):
        if 'ProjectException' in l or 'ProtectedAuditCase' in l or 'DelegationMandate' in l or 'ActingAuthority' in l or 'MandateAction' in l:
            print(i+1,l.rstrip())
            if i>350: break
