import urllib.request
import json
import ssl

ctx = ssl.create_default_context()

token_url = 'https://baserow.fr.nocodespacelab.com/api/user/token-auth/'
data = {
    'username': 'christophe.gontier.nocode@gmail.com',
    'password': 'Christophegontier75!'
}
req = urllib.request.Request(token_url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req, context=ctx) as response:
    jwt_token = json.loads(response.read().decode('utf-8'))['token']

table_id = 1246

# Récupérer champs existants
req_f = urllib.request.Request(f'https://baserow.fr.nocodespacelab.com/api/database/fields/table/{table_id}/', headers={'Authorization': f'JWT {jwt_token}'})
with urllib.request.urlopen(req_f, context=ctx) as r:
    fields = json.loads(r.read().decode('utf-8'))
    print('Initial fields:', [(f['id'], f['name']) for f in fields])

# Renommer le premier champ 'Name' en 'Titre'
first_field_id = fields[0]['id']
patch_req = urllib.request.Request(f'https://baserow.fr.nocodespacelab.com/api/database/fields/{first_field_id}/', data=json.dumps({
    'name': 'Titre'
}).encode('utf-8'), headers={'Authorization': f'JWT {jwt_token}', 'Content-Type': 'application/json'}, method='PATCH')
try:
    urllib.request.urlopen(patch_req, context=ctx)
    print('Renamed first field to Titre')
except Exception as e:
    print('Error renaming first field:', e)

# Champs à créer
fields_to_add = [
    {'name': 'Utilisateur', 'type': 'text'},
    {'name': 'Categorie', 'type': 'text'},
    {'name': 'Date', 'type': 'text'},
    {'name': 'Heure', 'type': 'text'},
    {'name': 'Adresse', 'type': 'text'},
    {'name': 'Latitude', 'type': 'number', 'number_decimal_places': 6},
    {'name': 'Longitude', 'type': 'number', 'number_decimal_places': 6},
    {'name': 'Contact', 'type': 'text'},
    {'name': 'Telephone', 'type': 'text'},
    {'name': 'AlerteMinutes', 'type': 'number', 'number_decimal_places': 0},
]

for f in fields_to_add:
    req_add = urllib.request.Request(f'https://baserow.fr.nocodespacelab.com/api/database/fields/table/{table_id}/', data=json.dumps(f).encode('utf-8'), headers={'Authorization': f'JWT {jwt_token}', 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req_add, context=ctx) as r_add:
            res = json.loads(r_add.read().decode('utf-8'))
            print('Added field:', res['name'])
    except Exception as e:
        print('Field already exists or error:', f['name'], e)

# Ajouter 2 exemples concrets pour Dorianne et Christophe
req_token_auth = urllib.request.Request('https://baserow.fr.nocodespacelab.com/api/database/rows/table/1246/?user_field_names=true', headers={
    'Authorization': 'Token lgWHdzUYXFcvB3A7sbzXWPl337c7qlEY',
    'Content-Type': 'application/json'
}, data=json.dumps({
    'Titre': 'Co-transportage Gare de Dunkerque',
    'Utilisateur': 'Christophe',
    'Categorie': 'Co-transportage',
    'Date': '2026-10-14',
    'Heure': '14:30',
    'Adresse': 'Gare de Dunkerque, Place de la Gare, 59140 Dunkerque',
    'Latitude': 51.0319,
    'Longitude': 2.3698,
    'Contact': 'Marc Legrand',
    'Telephone': '06 12 34 56 78',
    'AlerteMinutes': 30,
    'Notes': 'Arrivée TGV Voie 2. Bagages dans le coffre.'
}).encode('utf-8'))

try:
    urllib.request.urlopen(req_token_auth, context=ctx)
    print('Row 1 added successfully!')
except Exception as e:
    print('Error row 1:', e)

req_token_auth2 = urllib.request.Request('https://baserow.fr.nocodespacelab.com/api/database/rows/table/1246/?user_field_names=true', headers={
    'Authorization': 'Token lgWHdzUYXFcvB3A7sbzXWPl337c7qlEY',
    'Content-Type': 'application/json'
}, data=json.dumps({
    'Titre': 'Rendez-vous Coiffeur Malo',
    'Utilisateur': 'Dorianne',
    'Categorie': 'Coiffeur',
    'Date': '2026-10-14',
    'Heure': '16:00',
    'Adresse': 'Digue des Alliés, 59240 Malo-les-Bains, Dunkerque',
    'Latitude': 51.0505,
    'Longitude': 2.3995,
    'Contact': 'Salon L’Élégance',
    'Telephone': '03 28 00 11 22',
    'AlerteMinutes': 30,
    'Notes': 'Coupe et brushing avec Sophie.'
}).encode('utf-8'))

try:
    urllib.request.urlopen(req_token_auth2, context=ctx)
    print('Row 2 added successfully!')
except Exception as e:
    print('Error row 2:', e)
