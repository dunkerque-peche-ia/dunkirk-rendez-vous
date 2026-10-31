with open('index.html', encoding='utf-8') as f:
    c = f.read()

with open('funcs_notif.txt', 'w', encoding='utf-8') as out:
    for kw in ['function triggerSystemNotification', 'function dispatchSmsGateway', 'function buildAppointmentSmsText']:
        idx = c.find(kw)
        if idx != -1:
            out.write(f"\n\n==================== {kw} ====================\n")
            out.write(c[idx:idx+1500])
        else:
            out.write(f"\n\n==================== {kw} NOT FOUND ====================\n")

