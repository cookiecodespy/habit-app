#!/usr/bin/env python3
"""Deprecated since Sprint A — the bundle no longer ships Babel.

Editing src/*.jsx now requires precompiling JSX→JS offline (the phone no
longer transpiles). rebuild.py would re-embed raw JSX into plain <script>
tags, which the browser can't run. Use build.py instead — it transpiles,
strips Babel and keeps the CSP. This shim delegates so old muscle memory
still produces a correct bundle.
"""
import runpy, sys
print('rebuild.py is deprecated since Sprint A → running build.py instead.', file=sys.stderr)
runpy.run_path('build.py', run_name='__main__')
