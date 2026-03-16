import re

def check_tags(filepath):
    content = open(filepath, 'r', encoding='utf-8').read()
    # Find all <div, <div>, </div
    tags = re.findall(r'<(div|/div)', content)
    stack = []
    for i, tag in enumerate(tags):
        if tag == 'div':
            stack.append(i)
        else:
            if stack:
                stack.pop()
            else:
                print(f"Extra closing tag at index {i}")
    
    print(f"Unclosed tags count: {len(stack)}")
    # If len(stack) > 0, we can try to guess where they are
    # But for 8 tags, it's better to just see the stack.

check_tags('src/App.tsx')
