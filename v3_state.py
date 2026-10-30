with open('apps/api/prisma/schema.prisma', encoding='utf-8') as f:
    schema = f.read()

checks = {
    'v3_audit_envelope': 'authorizingMandateId' in schema and 'actionTimestamp' in schema,
    'delegation_mandate_relation': 'DelegationMandate' in schema,
    'acting_authority_relation': 'ActingAuthority' in schema,
    'project_exception_relation': 'ProjectException' in schema,
    'protected_audit_relation': 'ProtectedAuditCase' in schema,
    'module1_routes': 'conversationsRouter' in open('apps/api/src/app.ts').read(),
    'module2_routes': 'planningRouter' in open('apps/api/src/app.ts').read(),
    'module3_routes': 'acceptanceRouter' in open('apps/api/src/app.ts').read(),
}

for k,v in checks.items():
    print(f'{k}: {"OK" if v else "MISSING/PARTIAL"}')
