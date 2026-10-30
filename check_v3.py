import os, json

# Check schema
with open('apps/api/prisma/schema.prisma', encoding='utf-8') as f:
    schema = f.read()

models = ['DesignPackage', 'DesignTask', 'DesignTaskReview', 'WorkingFileVersion', 
          'DesignApproval', 'CoordinationIssue', 'CostEstimate', 'DesignChange',
          'ProposalSnapshot', 'ProposalDocument', 'ClientReview', 'ClientAcceptance',
          'ClientPayment', 'PaymentException', 'ModuleRelease']
print('=== Models in schema ===')
for m in models:
    print(f'  {m}:', 'OK' if f'model {m}' in schema else 'MISSING')

# Check routes
routes = ['planning.ts', 'acceptance.ts']
print('\n=== Routes ===')
for r in routes:
    print(f'  {r}:', 'OK' if os.path.exists(f'apps/api/src/routes/{r}') else 'MISSING')

# Check services
services = ['planning.service.ts', 'acceptance.service.ts']
print('\n=== Services ===')
for s in services:
    print(f'  {s}:', 'OK' if os.path.exists(f'apps/api/src/services/{s}') else 'MISSING')

# Check app.ts
with open('apps/api/src/app.ts') as f:
    app = f.read()
print('\n=== App wiring ===')
print('  planningRouter:', 'OK' if 'planningRouter' in app else 'MISSING')
print('  acceptanceRouter:', 'OK' if 'acceptanceRouter' in app else 'MISSING')
