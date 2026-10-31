with open('index.html', encoding='utf-8') as f:
    c = f.read()

with open('notifs_dump.txt', 'w', encoding='utf-8') as out:
    for kw in ['triggerAppointmentSmsNotification', 'requestPermission', 'sendSms']:
        idx = 0
        while True:
            idx = c.find(kw, idx)
            if idx == -1:
                break
            out.write(f"\n\n==================== FOUND '{kw}' AT {idx} ====================\n")
            out.write(c[max(0, idx - 100): min(len(c), idx + 1200)])
            idx += len(kw)
