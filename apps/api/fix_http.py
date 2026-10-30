path = 'src/services/planning.service.ts'
with open(path) as f:
    s = f.read()

replacements = [
    ("throw httpError(404, 'TASK_NOT_FOUND', 'Design task not found')", "throw httpError('Design task not found', 404, 'TASK_NOT_FOUND')"),
    ("throw httpError(404, 'PROJECT_NOT_FOUND', 'Project not found')", "throw httpError('Project not found', 404, 'PROJECT_NOT_FOUND')"),
    ("throw httpError(400, 'PACKAGES_ALREADY_EXIST', 'Design packages already initialized')", "throw httpError('Design packages already initialized', 400, 'PACKAGES_ALREADY_EXIST')"),
    ("throw httpError(400, 'TWO_D_NOT_APPROVED', 'Cannot create 3D task until client approves exact 2D version')", "throw httpError('Cannot create 3D task until client approves exact 2D version', 400, 'TWO_D_NOT_APPROVED')"),
    ("throw httpError(400, 'PREDECESSOR_PACKAGES_NOT_RELEASED', 'QS cannot start until Architecture, Structural, MEP, Electrical are released')", "throw httpError('QS cannot start until Architecture, Structural, MEP, Electrical are released', 400, 'PREDECESSOR_PACKAGES_NOT_RELEASED')"),
    ("throw httpError(404, 'APPROVAL_NOT_FOUND', 'Design approval not found')", "throw httpError('Design approval not found', 404, 'APPROVAL_NOT_FOUND')"),
    ("throw httpError(404, 'ISSUE_NOT_FOUND', 'Coordination issue not found')", "throw httpError('Coordination issue not found', 404, 'ISSUE_NOT_FOUND')"),
    ("throw httpError(404, 'ESTIMATE_NOT_FOUND', 'Cost estimate not found')", "throw httpError('Cost estimate not found', 404, 'ESTIMATE_NOT_FOUND')"),
    ("throw httpError(404, 'CHANGE_NOT_FOUND', 'Design change not found')", "throw httpError('Design change not found', 404, 'CHANGE_NOT_FOUND')"),
]

for old, new in replacements:
    s = s.replace(old, new)

s2 = s.replace("throw httpError(400, 'INVALID_TRANSITION', transition.reason!)", "throw httpError(transition.reason || 'Invalid transition', 400, 'INVALID_TRANSITION')")

with open(path, 'w') as f:
    f.write(s2)

print('done')
