with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

assert 'openNewAppointmentForm' in html, 'Missing openNewAppointmentForm'
assert 'isEditingMode = false' in html, 'Missing isEditingMode'
assert 'window.__appointments = local' in html, 'Missing cache update'
assert 'idInput.value = ""' in html, 'Missing edit-rdv-id clear'
assert 'new-rdv-alert-modal' in html, 'Missing new-rdv-alert-modal'
assert 'planning-badge-count' in html, 'Missing planning-badge-count in index.html'
assert 'Rendez-vous ajouté avec succès !' in html, 'Missing Rendez-vous ajouté avec succès ! in index.html'
assert 'notifyNewAppointmentFromOtherUser' in html, 'Missing notifyNewAppointmentFromOtherUser in index.html'
assert 'showAppointmentAlert' in html, 'Missing showAppointmentAlert'
assert 'closeAppointmentAlert' in html, 'Missing closeAppointmentAlert'
assert 'triggerSystemNotification' in html, 'Missing triggerSystemNotification'
assert 'alert-modal-card' in html, 'Missing alert-modal-card in styles'

# Baserow Users assertions in index.html
assert 'USERS_TABLE_ID = 1273' in html, 'Missing USERS_TABLE_ID = 1273 in index.html'
assert 'PASSWORD_FIELD_ID = 11950' in html, 'Missing PASSWORD_FIELD_ID = 11950 in index.html'
assert 'fetchBaserowUsers' in html, 'Missing fetchBaserowUsers in index.html'
assert 'verifyBaserowPassword' in html, 'Missing verifyBaserowPassword in index.html'
assert 'updateBaserowPassword' in html, 'Missing updateBaserowPassword in index.html'
assert 'admin-baserow-status-badge' in html, 'Missing admin-baserow-status-badge in index.html'
assert 'btn-sync-baserow-users' in html, 'Missing btn-sync-baserow-users in index.html'
assert 'Users Agenda Dorianne et Christophe' in html, 'Missing table name in index.html'

# Enterprise search assertions in index.html
assert 'recherche-entreprises.api.gouv.fr' in html, 'Missing recherche-entreprises in index.html'
assert '🏢 Entreprise' in html, 'Missing 🏢 Entreprise in index.html'
assert '.addr-badge.enterprise' in html, 'Missing .addr-badge.enterprise in index.html'
assert 'geocodeAddressFallback' in html, 'Missing geocodeAddressFallback in index.html'

with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

assert 'showAppointmentAlert' in js, 'Missing showAppointmentAlert in app.js'
assert 'triggerSystemNotification' in js, 'Missing triggerSystemNotification in app.js'
assert 'Rendez-vous ajouté avec succès !' in js, 'Missing toast message in app.js'
assert 'notifyNewAppointmentFromOtherUser' in js, 'Missing notifyNewAppointmentFromOtherUser in app.js'
assert 'planning-badge-count' in js, 'Missing planning badge update in app.js'
assert 'syncChannel' in js, 'Missing syncChannel in app.js'

# Email authentication & SMS notifications assertions in index.html
assert 'auth-email-input' in html, 'Missing auth-email-input in index.html'
assert 'christophe.gontier@outlook.fr' in html, 'Missing Christophe email in index.html'
assert 'dorianne.dbe@free.fr' in html, 'Missing Dorianne email in index.html'
assert '0783141740' in html, 'Missing Christophe phone in index.html'
assert '0651631615' in html, 'Missing Dorianne phone in index.html'
assert 'triggerAppointmentSmsNotification' in html, 'Missing triggerAppointmentSmsNotification in index.html'
assert 'dispatchSmsGateway' in html, 'Missing dispatchSmsGateway in index.html'
assert 'alert-modal-btn-sms' in html, 'Missing alert-modal-btn-sms in index.html'
assert 'btn-test-sms-christophe' in html, 'Missing btn-test-sms-christophe in index.html'
assert 'btn-test-sms-dorianne' in html, 'Missing btn-test-sms-dorianne in index.html'
assert 'admin-freemobile-user' in html, 'Missing admin-freemobile-user in index.html'
assert 'btn-save-freemobile' in html, 'Missing btn-save-freemobile in index.html'
assert 'smsapi.free-mobile.fr' in html, 'Missing Free Mobile API in index.html'
assert 'smsapi.free-mobile.fr' in js, 'Missing Free Mobile API in js/app.js'

# Baserow Users assertions in js/app.js
assert 'USERS_TABLE_ID' in js, 'Missing USERS_TABLE_ID in js/app.js'
assert 'PASSWORD_FIELD_ID' in js, 'Missing PASSWORD_FIELD_ID in js/app.js'
assert 'fetchBaserowUsers' in js, 'Missing fetchBaserowUsers in js/app.js'
assert 'verifyBaserowPassword' in js, 'Missing verifyBaserowPassword in js/app.js'
assert 'updateBaserowPassword' in js, 'Missing updateBaserowPassword in js/app.js'
assert 'btn-sync-baserow-users' in js, 'Missing btn-sync-baserow-users in js/app.js'
assert 'christophe.gontier@outlook.fr' in js, 'Missing Christophe email in js/app.js'
assert 'dorianne.dbe@free.fr' in js, 'Missing Dorianne email in js/app.js'
assert 'triggerAppointmentSmsNotification' in js, 'Missing triggerAppointmentSmsNotification in js/app.js'
assert 'dispatchSmsGateway' in js, 'Missing dispatchSmsGateway in js/app.js'

# Enterprise search assertions in js/app.js
assert 'recherche-entreprises.api.gouv.fr' in js, 'Missing recherche-entreprises in js/app.js'
assert '🏢 Entreprise' in js, 'Missing 🏢 Entreprise in js/app.js'
assert 'type: "enterprise"' in js, 'Missing type: "enterprise" in js/app.js'
assert 'geocodeAddressFallback' in js, 'Missing geocodeAddressFallback in js/app.js'

with open('js/config.js', 'r', encoding='utf-8') as f:
    cfg = f.read()

assert 'USERS_TABLE_ID = 1273' in cfg, 'Missing USERS_TABLE_ID = 1273 in config.js'
assert 'PASSWORD_FIELD_ID = 11950' in cfg, 'Missing PASSWORD_FIELD_ID = 11950 in config.js'

with open('css/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

assert '.addr-badge.enterprise' in css, 'Missing .addr-badge.enterprise in css/styles.css'
assert '.btn-sms' in css, 'Missing .btn-sms in css/styles.css'

print('All frontend logic, alerts, Baserow Users, Email Auth & SMS Assertions PASSED!')
