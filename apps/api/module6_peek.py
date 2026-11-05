with open('C:/Users/user/Downloads/mbms-specs/module6_full.txt', encoding='utf-8') as f:
    c = f.read()
for k in ['Mobilization', 'Site Diary', 'GRN', 'Variation', 'Handover', 'Work Permit']:
    print(k, c.count(k))
