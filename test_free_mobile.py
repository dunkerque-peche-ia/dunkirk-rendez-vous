import urllib.request
import urllib.parse

def test_fm(user, key, label):
    msg = f"Test connexion Dunkirk Agenda pour {label}"
    url = f"https://smsapi.free-mobile.fr/sendmsg?user={urllib.parse.quote(user)}&pass={urllib.parse.quote(key)}&msg={urllib.parse.quote(msg)}"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"[{label}] SUCCESS: HTTP {resp.status}")
    except Exception as e:
        print(f"[{label}] ERROR: {e}")

# test_fm("54107087", "TdJ5hdJv4O0fwo", "Christophe")
# test_fm("57421695", "oGRj0xaMTxZp9u", "Dorianne")
print("Script pret mais on ne spamme pas de SMS reel sans raison.")

