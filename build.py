#!/usr/bin/env python3
"""Sprint A build — precompile JSX→JS, drop in-browser Babel, add CSP.

Produces a bundle that no longer ships @babel/standalone (~3.1 MB) nor
transpiles on the phone at every launch. JSX is compiled offline with
@babel/core (see transpile.js). React/ReactDOM are already production builds
and are left untouched. A Content-Security-Policy is added to the served
outer document — without 'unsafe-eval', which only Babel needed.

Run after editing src/*.jsx (replaces rebuild.py for production builds):
    python3 build.py
"""
import json, gzip, base64, re, sys, os, subprocess

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
BABEL_SHORT = '5ff4000e'   # @babel/standalone manifest entry — to be removed

CSP = ("default-src 'self' blob: data:; "
       "script-src 'self' blob: 'unsafe-inline'; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       "img-src 'self' data: blob:; "
       "font-src 'self' data: blob: https://fonts.gstatic.com; "
       "connect-src 'self' blob:; "
       "object-src 'none'; base-uri 'self'")

def enc(b):
    return base64.b64encode(gzip.compress(b, 9)).decode('ascii')

def transpile_file(path):
    r = subprocess.run(['node', 'transpile.js', path], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'babel failed on {path}:\n{r.stderr}')
    return r.stdout

def transpile_code(code):
    r = subprocess.run(['node', 'transpile.js', '--code', code], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f'babel failed on inline script:\n{r.stderr}')
    return r.stdout

def main():
    html = open('index.html', encoding='utf-8').read()

    man_m = re.search(r'(<script type="__bundler/manifest">)(.*?)(</script>)', html, re.DOTALL)
    tpl_m = re.search(r'(<script type="__bundler/template">)(.*?)(</script>)', html, re.DOTALL)
    manifest = json.loads(man_m.group(2))
    template = json.loads(tpl_m.group(2))

    short_to_full = {k[:8]: k for k in manifest}

    # 1. Recompile each source file → plain JS, mime text/javascript
    for short, fname in FILE_MAP.items():
        uuid = short_to_full[short]
        js = transpile_file(f'src/{fname}')
        manifest[uuid] = {**manifest[uuid], 'data': enc(js.encode('utf-8')),
                          'mime': 'text/javascript', 'compressed': True}

    # 2. Drop the Babel standalone blob entirely (idempotent — already gone after
    #    the first Sprint A build, so only remove it if it's still present).
    babel_uuid = short_to_full.get(BABEL_SHORT)
    if babel_uuid:
        del manifest[babel_uuid]

    # 3. Template: remove Babel <script>, de-babel the file scripts,
    #    transpile the inline bootstrap script.
    template = re.sub(r'<script[^>]*src="' + re.escape(BABEL_SHORT) + r'[^"]*"[^>]*>\s*</script>', '', template)
    template = template.replace(' type="text/babel"', '')   # file scripts → plain JS
    # The previously-inline app script (was type="text/babel") is now <script>JSX</script>;
    # find it by its JSX render call and transpile in place.
    def transpile_inline(m):
        body = m.group(1)
        if 'createRoot' in body or 'render(' in body or 'PureApp' in body:
            return '<script>' + transpile_code(body) + '</script>'
        return m.group(0)
    template = re.sub(r'<script>(.*?)</script>', transpile_inline, template, flags=re.DOTALL)

    # 4. Re-embed manifest + template
    new_man = json.dumps(manifest, separators=(',', ':'))
    new_tpl = json.dumps(template).replace('</script', '<\\/script')
    html = (html[:man_m.start(2)] + new_man + html[man_m.end(2):])
    # template moved (offsets changed) — re-find it
    tpl_m = re.search(r'(<script type="__bundler/template">)(.*?)(</script>)', html, re.DOTALL)
    html = html[:tpl_m.start(2)] + new_tpl + html[tpl_m.end(2):]

    # 5. CSP in the served outer <head> (survives the loader's documentElement swap)
    if 'Content-Security-Policy' not in html:
        html = html.replace('<meta charset="utf-8">',
                            '<meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="' + CSP + '">',
                            1)

    open('index.html', 'w', encoding='utf-8').write(html)
    print('Built: precompiled 9 files%s, CSP ok.' % (', removed Babel' if babel_uuid else ''))

if __name__ == '__main__':
    main()
