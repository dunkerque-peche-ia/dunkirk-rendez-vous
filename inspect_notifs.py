with open('index.html', encoding='utf-8') as f:
    c = f.read()

def inspect_around(keyword, radius=1000):
    idx = c.find(keyword)
    if idx >= 0:
        print(f"=== FOUND '{keyword}' AT {idx} ===")
        print(c[max(0, idx - 100): min(len(c), idx + radius)])
    else:
        print(f"=== NOT FOUND: '{keyword}' ===")

inspect_around('triggerAppointmentSmsNotification', 1500)
inspect_around('requestPermission', 1000)
