<?php
$databases = array();
$databases['default']['default'] = array(
  'driver' => 'mysql',
  'database' => 'clustermapping',
  'username' => 'hbs',
  'password' => 'hbspass1!',
  'host' => 'localhost',
);

$update_free_access = FALSE;
$drupal_hash_salt = '';
#$base_url = 'http://hbsvagrant.local';  // NO trailing slash!

ini_set('session.gc_probability', 1);
ini_set('session.gc_divisor', 100);
ini_set('session.gc_maxlifetime', 200000);
ini_set('session.cookie_lifetime', 2000000);

# $cookie_domain = '.example.com';

# $conf['reverse_proxy'] = TRUE;
# $conf['reverse_proxy_addresses'] = array('a.b.c.d', ...);
# $conf['reverse_proxy_header'] = 'HTTP_X_CLUSTER_CLIENT_IP';

# $conf['omit_vary_cookie'] = TRUE;

# $conf['css_gzip_compression'] = FALSE;
# $conf['js_gzip_compression'] = FALSE;

# $conf['locale_custom_strings_en'][''] = array(
#   'forum'      => 'Discussion board',
#   '@count min' => '@count minutes',
# );

$conf['404_fast_paths_exclude'] = '/\/(?:styles)\//';
$conf['404_fast_paths'] = '/\.(?:txt|png|gif|jpe?g|css|js|ico|swf|flv|cgi|bat|pl|dll|exe|asp)$/i';
$conf['404_fast_html'] = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL "@path" was not found on this server.</p></body></html>';

# drupal_fast_404();

# $conf['proxy_server'] = '';
# $conf['proxy_port'] = 8080;
# $conf['proxy_username'] = '';
# $conf['proxy_password'] = '';
# $conf['proxy_user_agent'] = '';
# $conf['proxy_exceptions'] = array('127.0.0.1', 'localhost');

# $conf['allow_authorize_operations'] = FALSE;

$conf['install_profile'] = 'clustermapping';
