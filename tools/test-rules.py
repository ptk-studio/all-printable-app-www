#!/usr/bin/env python3
"""Test the Firestore security rules against the Security Rules test API.

The property under test is the one the paid tier rests on: a signed-in browser
can read and write its own document and its own designs, but can never set the
fields that grant Pro. If that breaks, "paid tier" means nothing — anyone could
open devtools and write pro: true.

    python3 tools/test-rules.py              # test firestore.rules
    python3 tools/test-rules.py --deployed   # test what is actually live, and
                                             # report drift from firestore.rules
    python3 tools/test-rules.py --mutate     # prove the suite has teeth

Auth comes from the Firebase CLI's own credentials, so `firebase login` first.
Nothing is written to the database: the API evaluates rules against a request
context we supply. Exit status is non-zero if any case fails.
"""
import json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

PROJECT = 'ptk-studio-allprintable'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES_PATH = os.path.join(ROOT, 'firestore.rules')
CONFIGSTORE = os.path.expanduser('~/.config/configstore/firebase-tools.json')
# Public constants shipped inside firebase-tools; not secrets.
CLI_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
CLI_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'
DOC = '/databases/(default)/documents'


def access_token():
    try:
        tok = json.load(open(CONFIGSTORE))['tokens']
    except Exception:
        sys.exit('No Firebase CLI credentials found. Run: firebase login')
    if tok.get('expires_at', 0) > (time.time() + 60) * 1000:
        return tok['access_token']
    body = urllib.parse.urlencode({
        'refresh_token': tok['refresh_token'], 'client_id': CLI_ID,
        'client_secret': CLI_SECRET, 'grant_type': 'refresh_token'}).encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=body,
        headers={'Content-Type': 'application/x-www-form-urlencoded'})
    return json.load(urllib.request.urlopen(req))['access_token']


def api(path, token, data=None):
    req = urllib.request.Request('https://firebaserules.googleapis.com/v1/' + path,
        data=json.dumps(data).encode() if data else None,
        headers={'Authorization': 'Bearer ' + token,
                 'Content-Type': 'application/json'})
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        sys.exit('HTTP %d\n%s' % (e.code, e.read().decode()[:2000]))


def norm(source):
    """Comment- and whitespace-insensitive form, for comparing two rulesets.

    The console stores the rules on one line with the commentary stripped, so a
    plain string compare against firestore.rules always reports drift."""
    source = re.sub(r'/\*.*?\*/', ' ', source, flags=re.S)
    source = re.sub(r'//[^\n]*', ' ', source)
    # Also drop whitespace beside punctuation, so a line wrapped before
    # `.affectedKeys()` does not read as a change.
    source = re.sub(r'\s*([^\w\s])\s*', r'\1', source)
    return ' '.join(source.split())


def case(name, expect, method, path, uid=None, sends=None, stored=None):
    """One test case. `sends` is request.resource.data; `stored` is resource.data."""
    request = {'method': method, 'path': DOC + path, 'time': '2026-09-01T21:00:00Z',
               'auth': ({'uid': uid, 'token': {'sub': uid}} if uid else None)}
    if sends is not None:
        request['resource'] = {'data': sends}
    tc = {'expectation': expect, 'request': request, 'expressionReportLevel': 'VISITED'}
    if stored is not None:
        tc['resource'] = {'data': stored, '__name__': DOC + path}
    return name, tc


U = '/users/u1'
D = '/users/u1/designs/d1'
P = {'email': 'a@b.c', 'created': 1}          # a plain, free profile
PRO = dict(P, pro=True)                        # the same profile, entitled

CASES = [
    # The escalation attempts. Every one of these must be refused.
    case('CREATE own doc with pro:true',            'DENY',  'create', U, 'u1', dict(P, pro=True)),
    case('UPDATE own doc to add pro:true',          'DENY',  'update', U, 'u1', dict(P, pro=True), P),
    case('UPDATE own proSince',                     'DENY',  'update', U, 'u1', dict(P, proSince=1), P),
    case('UPDATE own proSource',                    'DENY',  'update', U, 'u1', dict(P, proSource='x'), P),
    case('UPDATE own stripeCustomerId',             'DENY',  'update', U, 'u1', dict(P, stripeCustomerId='cus_x'), P),
    case('UPDATE own proStatus',                    'DENY',  'update', U, 'u1', dict(P, proStatus='active'), P),
    case('UPDATE own proUpdatedAt',                 'DENY',  'update', U, 'u1', dict(P, proUpdatedAt=9), P),
    case('UPDATE own stripeSubscriptionId',         'DENY',  'update', U, 'u1', dict(P, stripeSubscriptionId='sub_x'), P),
    case('CREATE own doc carrying proStatus',       'DENY',  'create', U, 'u1', dict(P, proStatus='active')),

    # The custom sheet footer: the user's own text, bounded not forbidden.
    case('Set a short sheet footer',                'ALLOW', 'update', U, 'u1', dict(P, sheetFooter='Mrs Patel - Room 12'), P),
    case('Clear the sheet footer',                  'ALLOW', 'update', U, 'u1', dict(P, sheetFooter=''), dict(P, sheetFooter='x')),
    case('A 64-char footer is the limit',           'ALLOW', 'update', U, 'u1', dict(P, sheetFooter='x'*64), P),
    case('A 65-char footer is refused',             'DENY',  'update', U, 'u1', dict(P, sheetFooter='x'*65), P),
    case('A novel as a footer is refused',          'DENY',  'update', U, 'u1', dict(P, sheetFooter='x'*5000), P),
    case('A non-string footer is refused',          'DENY',  'update', U, 'u1', dict(P, sheetFooter=42), P),
    case('CREATE carrying an oversized footer',     'DENY',  'create', U, 'u1', dict(P, sheetFooter='x'*200)),
    case('Pro user revokes own pro',                'DENY',  'update', U, 'u1', dict(P, pro=False), PRO),
    # syncProfile() writes with setDoc and no merge when it believes the doc is
    # missing. Two tabs signing in at once can race, and the loser's write would
    # drop `pro` off an entitled profile. The rules must refuse that too.
    case('Profile overwrite that drops pro',        'DENY',  'update', U, 'u1', P, PRO),

    # The ordinary things that must keep working. Without these the suite
    # would pass just as well against a rule that denies everything.
    case('CREATE own doc, benign fields',           'ALLOW', 'create', U, 'u1', P),
    case('UPDATE own doc, benign field only',       'ALLOW', 'update', U, 'u1', dict(P, email='z@b.c'), P),
    case('Pro user edits benign field, pro intact', 'ALLOW', 'update', U, 'u1', dict(PRO, email='z@b.c'), PRO),
    case('READ own doc',                            'ALLOW', 'get',    U, 'u1', None, P),
    case('DELETE own doc',                          'ALLOW', 'delete', U, 'u1', None, P),
    case('WRITE own design',                        'ALLOW', 'create', D, 'u1', {'maker': 'calendar', 'name': 'n'}),
    case('READ own design',                         'ALLOW', 'get',    D, 'u1', None, {'maker': 'calendar'}),

    # Other people, and nobody at all.
    case('Another user READs u1 doc',               'DENY',  'get',    U, 'u2', None, P),
    case('Another user WRITEs u1 doc',              'DENY',  'update', U, 'u2', dict(P, email='z@b.c'), P),
    case('Another user READs u1 design',            'DENY',  'get',    D, 'u2', None, {'maker': 'calendar'}),
    case('Anonymous READs u1 doc',                  'DENY',  'get',    U, None, None, P),
    case('Anonymous WRITEs u1 doc',                 'DENY',  'create', U, None, P),
]


def run(source, token, label):
    out = api('projects/%s:test' % PROJECT, token, {
        'source': {'files': [{'name': 'firestore.rules', 'content': source}]},
        'testSuite': {'testCases': [tc for _, tc in CASES]}})
    fatal = [i for i in out.get('issues', []) if i.get('severity') == 'ERROR']
    if fatal:
        print(json.dumps(fatal, indent=2))
        return False
    for i in out.get('issues', []):
        print('note: %s (line %s)' % (i.get('description'),
              i.get('sourcePosition', {}).get('line')))

    results = out.get('testResults', [])
    print('\n%s' % label)
    print('%-46s %-6s %s' % ('CASE', 'WANT', 'GOT'))
    print('-' * 68)
    failed = 0
    for (name, tc), r in zip(CASES, results):
        want = tc['expectation']
        ok = r.get('state') == 'SUCCESS'
        got = want if ok else ('ALLOW' if want == 'DENY' else 'DENY')
        failed += 0 if ok else 1
        print('%-46s %-6s %-6s %s' % (name[:46], want, got, 'ok' if ok else '<<< FAIL'))
    print('-' * 68)
    print('%d/%d passed' % (len(results) - failed, len(results)))
    return failed == 0


def main():
    token = access_token()
    local = open(RULES_PATH).read()

    if '--mutate' in sys.argv:
        # Drop the locked-field guard. A suite worth trusting must fail here.
        mutant = local.replace(
            """      allow create: if signedInAs(uid)
                    && !request.resource.data.keys().hasAny(locked())
                    && footerOk();
      allow update: if signedInAs(uid)
                    && !request.resource.data.diff(resource.data)
                          .affectedKeys().hasAny(locked())
                    && footerOk();""",
            """      allow create: if signedInAs(uid) && footerOk();
      allow update: if signedInAs(uid) && footerOk();""")
        if mutant == local:
            sys.exit('Could not build the mutant: firestore.rules no longer '
                     'matches the text this check edits. Update --mutate.')
        ok = run(mutant, token, 'UNGUARDED rules (these failures are the point)')
        print('\nMutation check %s: removing the guard %s the suite.'
              % ('PASSED' if not ok else 'FAILED', 'broke' if not ok else 'did NOT break'))
        return 0 if not ok else 1

    if '--deployed' in sys.argv:
        rel = api('projects/%s/releases' % PROJECT, token)
        fs = [r for r in rel.get('releases', []) if r['name'].endswith('cloud.firestore')]
        if not fs:
            sys.exit('No cloud.firestore release found.')
        rs = api(fs[0]['rulesetName'].split('/v1/')[-1]
                 if '/v1/' in fs[0]['rulesetName'] else fs[0]['rulesetName'], token)
        source = rs['source']['files'][0]['content']
        print('deployed ruleset %s (updated %s)'
              % (rs['name'].split('/')[-1], fs[0].get('updateTime')))
        if norm(source) != norm(local):
            print('\n!! DRIFT: the deployed rules differ from firestore.rules.')
            print('   deployed: %s' % norm(source)[:160])
            print('   local:    %s' % norm(local)[:160])
        else:
            print('deployed rules match firestore.rules '
                  '(ignoring comments and whitespace)')
        return 0 if run(source, token, 'DEPLOYED rules') else 1

    return 0 if run(local, token, 'firestore.rules') else 1


if __name__ == '__main__':
    sys.exit(main())
