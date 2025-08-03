FROM php:8.2-cli

# Installer les extensions PHP nécessaires
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    zip \
    libzip-dev \
    && docker-php-ext-install pdo pdo_mysql zip \
    && rm -rf /var/lib/apt/lists/*

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Créer le dossier de travail
WORKDIR /var/www/html

# Copier les fichiers composer en premier pour tirer parti du cache Docker
COPY composer.json composer.lock ./

RUN composer install --no-dev --no-scripts --optimize-autoloader

# Copier tous les fichiers restants du projet
COPY . .

# Créer les dossiers nécessaires avec les bonnes permissions
RUN mkdir -p bootstrap/cache storage/logs storage/framework/{cache,sessions,views} \
    && chmod -R 775 bootstrap/cache storage

# Générer l'autoloader avec les scripts Laravel
RUN composer dump-autoload --optimize

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
