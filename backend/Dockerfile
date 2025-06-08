FROM php:8.4.7-apache

ENV JWT_SECRET="Secret key xD"

RUN mv "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

RUN apt update && apt install -y git && apt install -y 7zip

RUN mkdir temp && cd temp
RUN curl -sS https://getcomposer.org/installer -o composer-setup.php
RUN php composer-setup.php --install-dir=/usr/local/bin --filename=composer
RUN composer require firebase/php-jwt
RUN cd .. && rm -rf temp

COPY src/ /var/www/html/

RUN chmod go+rw /var
RUN chmod go+rw /var/www
RUN chmod go+rw /var/www/html
RUN chmod go+rw /var/www/html
RUN chmod go+rw /var/www/html/database
RUN chmod go+rw /var/www/html/database/db.sqlite