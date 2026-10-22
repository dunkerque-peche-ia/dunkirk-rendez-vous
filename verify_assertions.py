with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

assert 'openNewAppointmentForm' in html, 'Missing openNewAppointmentForm'
assert 'isEditingMode = false' in html, 'Missing isEditingMode'
assert 'window.__appointments = local' in html, 'Missing cache update'
assert 'idInput.value = ""' in html, 'Missing edit-rdv-id clear'
assert 'new-rdv-alert-modal' in html, 'Missing new-rdv-alert-modal'
assert 'showAppointmentAlert' in html, 'Missing showAppointmentAlert'
assert 'closeAppointmentAlert' in html, 'Missing closeAppointmentAlert'
assert 'triggerSystemNotification' in html, 'Missing triggerSystemNotification'
assert 'alert-modal-card' in html, 'Missing alert-modal-card in styles'

with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

assert 'showAppointmentAlert' in js, 'Missing showAppointmentAlert in app.js'
assert 'triggerSystemNotification' in js, 'Missing triggerSystemNotification in app.js'
assert 'showAppointmentAlert(targetAppt' in js, 'Missing showAppointmentAlert invocation in app.js'

print('All frontend logic & alert assertions PASSED in index.html and app.js!')
