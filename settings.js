//. settings.js
exports.auth0_callback_url = 'http://localhost:8080/callback';
exports.auth0_client_id = '';
exports.auth0_client_secret = '';
exports.auth0_domain = '';

exports.auth0_authorization_url = 'https://' + exports.auth0_domain + '/authorize';
exports.auth0_token_url = 'https://' + exports.auth0_domain + '/oauth/token';
exports.auth0_scope = 'openid profile email';
