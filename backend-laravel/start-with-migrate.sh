#!/bin/sh
composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs
php artisan migrate --force
/start.sh
