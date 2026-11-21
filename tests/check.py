#!/usr/bin/env python3
"""Static checks for the plugin. Run: python3 tests/check.py

No PHP needed. If the tree-sitter PHP grammar is importable (pip install
tree-sitter tree-sitter-php), every .php file is also parsed for syntax
errors. This is not a substitute for `php -l` on a real PHP install.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
fails = []
def ok(cond, msg):
    if not cond: fails.append(msg)

main = (ROOT / 'wp-sauna-timer.php').read_text()
readme = (ROOT / 'readme.txt').read_text()
block = json.loads((ROOT / 'blocks/sauna-timer/block.json').read_text())

# 1. readme.txt header, as the WordPress.org readme standard describes it
head = readme.split('== Description ==')[0]
fields = dict(re.findall(r'^([A-Za-z ]+):\s*(.+)$', head, re.M))
for k in ['Contributors', 'Tags', 'Requires at least', 'Tested up to', 'Stable tag', 'Requires PHP', 'License', 'License URI']:
    ok(k in fields, 'readme.txt is missing ' + k)
tags = [t.strip() for t in fields.get('Tags', '').split(',') if t.strip()]
ok(1 <= len(tags) <= 5, 'readme.txt: 1 to 5 tags, got %d' % len(tags))
ok(re.fullmatch(r'\d+\.\d+', fields.get('Tested up to', '')), 'Tested up to must be a major version like 7.1')
short = [l for l in head.strip().splitlines() if l.strip()][-1]
ok(':' not in short.split(' ')[0] and len(short) <= 150, 'short description must be the last header line and <= 150 chars (%d)' % len(short))
for sec in ['== Description ==', '== Installation ==', '== Frequently Asked Questions ==', '== Changelog ==']:
    ok(sec in readme, 'readme.txt missing ' + sec)

# 2. One version everywhere
ver = re.search(r'^\s*\*\s*Version:\s*(\S+)', main, re.M).group(1)
ok(fields.get('Stable tag') == ver, 'Stable tag %s != plugin Version %s' % (fields.get('Stable tag'), ver))
ok("define( 'WPST_VERSION', '%s' )" % ver in main, 'WPST_VERSION differs from Version')
ok(block.get('version') == ver, 'block.json version differs')
ok(re.search(r'Requires at least:\s*' + re.escape(fields.get('Requires at least', '?')), main), 'Requires at least differs between readme and plugin header')
ok(re.search(r'Requires PHP:\s*' + re.escape(fields.get('Requires PHP', '?')), main), 'Requires PHP differs between readme and plugin header')
ok(re.search(r"Text Domain:\s*(\S+)", main).group(1) == block.get('textdomain'), 'text domain differs')

# 3. Output escaping: every echo prints an esc_* / absint / translated-escaped value
for i, line in enumerate(main.splitlines(), 1):
    for m in re.finditer(r'\becho\s+([^;]+);', line):
        expr = m.group(1).strip()
        ok(re.match(r'(esc_(html|attr|url)(__|_e)?|absint|wp_kses)\s*\(', expr), 'line %d: unescaped echo: %s' % (i, expr))
ok('settings_fields(' in main, 'settings form must print the Settings API nonce')
ok(main.count("current_user_can( 'manage_options' )") >= 1, 'settings page must check manage_options')
ok("defined( 'ABSPATH' )" in main, 'direct access guard missing')
ok("WP_UNINSTALL_PLUGIN" in (ROOT / 'uninstall.php').read_text(), 'uninstall guard missing')
ok('esc_attr( $heading )' in main and 'absint( $rounds )' in main, 'timer attributes must be escaped')

# 4. No external requests: no remote URLs in code that runs, no fetch/XHR, no CDN
for f in [ROOT / 'assets/sauna-timer.iife.js', ROOT / 'blocks/sauna-timer/editor.js']:
    src = f.read_text()
    code = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
    ok(not re.search(r'\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|importScripts', code), f.name + ' makes network calls')
ok(not re.search(r"wp_remote_|curl_|file_get_contents\s*\(\s*'http", main), 'PHP makes remote requests')
ok(not re.search(r"wp_(enqueue|register)_script\([^)]*https?://", main, re.S), 'script from a CDN')

# 5. Credit link is opt-in (WordPress.org guideline 10)
ok("$out['credit'] = ! empty( $input['credit'] );" in main and "credit=\"off\"" in main, 'credit must be off unless opted in')

# 6. Optional real syntax parse
try:
    import tree_sitter_php as tsp
    from tree_sitter import Language, Parser
    parser = Parser(Language(tsp.language_php()))
    for f in sorted(ROOT.glob('*.php')):
        tree = parser.parse(f.read_bytes())
        stack, bad = [tree.root_node], []
        while stack:
            n = stack.pop()
            if n.type == 'ERROR' or n.is_missing: bad.append(n.start_point[0] + 1)
            stack.extend(n.children)
        ok(not bad, '%s: syntax error near line(s) %s' % (f.name, bad[:5]))
    print('PHP syntax: parsed with tree-sitter-php')
except ImportError:
    print('PHP syntax: tree-sitter-php not installed, skipped')

if fails:
    print('FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
print('all checks passed')
