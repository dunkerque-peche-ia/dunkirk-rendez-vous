with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

assert 'openNewAppointmentForm' in html, 'Missing openNewAppointmentForm'
assert 'isEditingMode = false' in html, 'Missing isEditingMode'
assert 'window.__appointments = local' in html, 'Missing cache update'
assert 'idInput.value = ""' in html, 'Missing edit-rdv-id clear'

print('All frontend logic assertions PASSED in index.html!')
