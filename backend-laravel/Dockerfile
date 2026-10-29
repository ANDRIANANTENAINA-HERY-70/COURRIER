FROM richarvey/nginx-php-fpm:latest

COPY . .

ENV WEBROOT=/var/www/html/public
ENV PHP_ERRORS_STDERR=1
ENV RUN_SCRIPTS=1
ENV REAL_IP_HEADER=1

# Installer les dépendances PHP pendant le build, pas au démarrage
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs

COPY start-with-migrate.sh /start-with-migrate.sh
RUN chmod +x /start-with-migrate.sh

CMD ["/start-with-migrate.sh"]
