import re

def extract_keys(locale, content):
    # Find the start of the locale's map
    start_pattern = f"'{locale}': {{"
    start_index = content.find(start_pattern)
    if start_index == -1:
        return set()
    
    # Find the matching closing brace
    brace_count = 0
    end_index = -1
    for i in range(start_index + len(start_pattern) - 1, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_index = i
                break
    
    if end_index == -1:
        return set()
    
    keys_content = content[start_index + len(start_pattern):end_index]
    # Extract keys like 'key_name':
    keys = re.findall(r"['\"](\w+)['\"]\s*:", keys_content)
    return set(keys)

with open(r'd:\1911\Borewell-Motor-Automation\FRONTEND\App\end_user\lib\core\localization\app_translations.dart', 'r', encoding='utf-8') as f:
    content = f.read()

en_keys = extract_keys('en_US', content)
hi_keys = extract_keys('hi_IN', content)
te_keys = extract_keys('te_IN', content)

print('EN_US total keys:', len(en_keys))
print('HI_IN total keys:', len(hi_keys))
print('TE_IN total keys:', len(te_keys))

print('Missing in hi_IN:', sorted(list(en_keys - hi_keys)))
print('Missing in te_IN:', sorted(list(en_keys - te_keys)))
