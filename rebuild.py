#!/usr/bin/env python3
"""Rebuild index.html from modified src/ files."""
import json, gzip, base64, re, sys, os

# UUID → filename map (from original bundle)
FILE_MAP = {
    'c57f4190': 'tweaks-panel.jsx',
    'be47ab82': 'lifeos-app.jsx',
    'e046e335': 'lifeos-icons.jsx',
    '94356eee': 'lifeos-notify.jsx',
    '6df78439': 'lifeos-user.jsx',
    '962a73b9': 'lifeos-timeline.jsx',
    '24adc1ba': 'lifeos-data.jsx',
    'a53417c0': 'lifeos-screens.jsx',
    '54484e02': 'lifeos-extras.jsx',
}

def encode(content_bytes):
    compressed = gzip.compress(content_bytes, compresslevel=9)
    return base64.b64encode(compressed).decode('ascii')

def rebuild():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    manifest_match = re.search(r'(<script type="__bundler/manifest">)(.*?)(</script>)', html, re.DOTALL)
    if not manifest_match:
        print('ERROR: manifest not found', file=sys.stderr)
        sys.exit(1)

    manifest = json.loads(manifest_match.group(2))
    changed = []

    for uuid, entry in manifest.items():
        short = uuid[:8]
        if short not in FILE_MAP:
            continue
        fname = FILE_MAP[short]
        src_path = f'src/{fname}'
        if not os.path.exists(src_path):
            continue
        with open(src_path, 'rb') as f:
            new_content = f.read()
        new_data = encode(new_content)
        if new_data != entry['data']:
            manifest[uuid] = {**entry, 'data': new_data, 'compressed': True}
            changed.append(fname)

    if not changed:
        print('No changes detected.')
        return

    new_manifest = json.dumps(manifest, separators=(',', ':'))
    html = html[:manifest_match.start(2)] + new_manifest + html[manifest_match.end(2):]

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'Rebuilt index.html — updated: {", ".join(changed)}')

if __name__ == '__main__':
    rebuild()
