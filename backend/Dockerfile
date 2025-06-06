FROM php:8.4.7-apache

RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

COPY src/ /var/www/html/

RUN chmod go+rw /var
RUN chmod go+rw /var/www
RUN chmod go+rw /var/www/html
RUN chmod go+rw /var/www/html
RUN chmod go+rw /var/www/html/database
RUN chmod go+rw /var/www/html/database/db.sqlite