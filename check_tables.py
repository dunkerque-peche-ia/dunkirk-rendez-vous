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
try:
    with urllib.request.urlopen(req, context=ctx) as r:
        jwt_token = json.loads(r.read().decode('utf-8'))['token']
        print('JWT Auth successful')
        
    req_apps = urllib.request.Request('https://baserow.fr.nocodespacelab.com/api/applications/', headers={'Authorization': f'JWT {jwt_token}'})
    with urllib.request.urlopen(req_apps, context=ctx) as r_apps:
        apps = json.loads(r_apps.read().decode('utf-8'))
        print('Applications/Databases count:', len(apps))
        for app in apps:
            print(f"Database: {app.get('name')} (id={app.get('id')})")
            for tbl in app.get('tables', []):
                print(f"   -> Table: {tbl.get('name')} (id={tbl.get('id')})")
except Exception as e:
    print('Error:', e)

