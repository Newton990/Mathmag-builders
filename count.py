with open('C:/Users/user/Downloads/mbms-specs/master_arch_full.txt') as f:
    c = f.read()
print(c.count('MAST-UAT'), c.count('DelegationMandate'), c.count('ActingAuthority'))
