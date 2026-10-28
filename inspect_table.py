import urllib.request, json, ssl
ctx = ssl.create_default_context()

TOKEN = "lgWHdzUYXFcvB3A7sbzXWPl337c7qlEY"
TABLE_ID = 1246

# Get table fields
req = urllib.request.Request(
    f'https://baserow.fr.nocodespacelab.com/api/database/fields/table/{TABLE_ID}/',
    headers={'Authorization': f'Token {TOKEN}'}
)
with urllib.request.urlopen(req, context=ctx) as r:
    fields = json.loads(r.read().decode('utf-8'))

print("=== CHAMPS DE LA TABLE 1246 ===")
for f in fields:
    print(f"  id={f['id']} | name='{f['name']}' | type={f['type']}")

# Get rows
req2 = urllib.request.Request(
    f'https://baserow.fr.nocodespacelab.com/api/database/rows/table/{TABLE_ID}/?page_size=100&user_field_names=true',
    headers={'Authorization': f'Token {TOKEN}'}
)
with urllib.request.urlopen(req2, context=ctx) as r:
    data = json.loads(r.read().decode('utf-8'))

print(f"\n=== LIGNES ({data['count']} total) ===")
for row in data['results']:
    print(f"  ID {row['id']}: '{row.get('Titre')}' | user={row.get('Utilisateur')} | date={row.get('Date')}")

