# COMMANDES LARAVEL - AUDIT COMPLET DU PROJET DRIV'N COOK

## 1. STRUCTURE GÉNÉRALE DU PROJET
# Voir tous les modèles créés
find app/Models -name "*.php" | sort

# Voir tous les contrôleurs
find app/Http/Controllers -name "*.php" | sort

# Voir toutes les migrations
ls -la database/migrations/

# Voir tous les seeders
ls -la database/seeders/

## 2. AUDIT DES TABLES ET MIGRATIONS
# Lister toutes les tables de la base de données
php artisan tinker
Schema::getTableNames();
exit

# Voir le status des migrations
php artisan migrate:status

# Voir la structure d'une table spécifique
php artisan tinker
try { print_r(Schema::getColumnListing('users')); } catch(Exception $e) { echo "Table users non trouvée\n"; }
try { print_r(Schema::getColumnListing('franchisees')); } catch(Exception $e) { echo "Table franchisees non trouvée\n"; }
try { print_r(Schema::getColumnListing('franchise_contracts')); } catch(Exception $e) { echo "Table franchise_contracts non trouvée\n"; }
try { print_r(Schema::getColumnListing('transactions')); } catch(Exception $e) { echo "Table transactions non trouvée\n"; }
try { print_r(Schema::getColumnListing('warehouses')); } catch(Exception $e) { echo "Table warehouses non trouvée\n"; }
try { print_r(Schema::getColumnListing('products')); } catch(Exception $e) { echo "Table products non trouvée\n"; }
try { print_r(Schema::getColumnListing('franchise_orders')); } catch(Exception $e) { echo "Table franchise_orders non trouvée\n"; }
exit

## 3. AUDIT DES MODÈLES ET RELATIONS
# Tester les relations d'un modèle User
php artisan tinker
$user = User::first();
$user->franchisee ?? 'Pas de relation franchisee';
$user->franchiseContracts ?? 'Pas de relation contracts';
$user->transactions ?? 'Pas de relation transactions';
$user->franchiseOrders ?? 'Pas de relation orders';
exit

# Vérifier les modèles de paiement
php artisan tinker
Transaction::count();
FranchiseContract::count();
FranchiseeAccount::count();
PaymentSchedule::count();
exit

# Vérifier les modèles d'entrepôts
php artisan tinker
Warehouse::count();
Product::count();
ProductCategory::count();
WarehouseStock::count();
FranchiseOrder::count();
exit

## 4. AUDIT DES ROUTES API
# Voir toutes les routes API
php artisan route:list --path=api

# Voir spécifiquement les routes de paiement
php artisan route:list --path=api/payments

# Voir les routes d'administration
php artisan route:list --path=api/admin

# Voir les routes de warehouse
php artisan route:list --path=api/warehouses

# Voir les routes de commandes
php artisan route:list --path=api/orders

## 5. AUDIT DES CONTRÔLEURS
# Voir les méthodes d'un contrôleur spécifique
php artisan tinker
$reflection = new ReflectionClass(App\Http\Controllers\Api\PaymentController::class);
collect($reflection->getMethods())->filter(function($method) {
    return $method->class === App\Http\Controllers\Api\PaymentController::class;
})->pluck('name');
exit

## 6. AUDIT DES DONNÉES EXISTANTES
# Compter les enregistrements par table
php artisan tinker
echo "Users: " . User::count() . "\n";
echo "Franchisees: " . Franchisee::count() . "\n";
echo "Contracts: " . FranchiseContract::count() . "\n";
echo "Transactions: " . Transaction::count() . "\n";
echo "Warehouses: " . Warehouse::count() . "\n";
echo "Products: " . Product::count() . "\n";
echo "Categories: " . ProductCategory::count() . "\n";
echo "Stocks: " . WarehouseStock::count() . "\n";
echo "Orders: " . FranchiseOrder::count() . "\n";
exit

# Voir un exemple de chaque type d'enregistrement
php artisan tinker
User::first();
Franchisee::first();
FranchiseContract::first();
Transaction::first();
Warehouse::first();
Product::first();
exit

## 7. AUDIT DES JOBS ET SERVICES
# Voir les jobs créés
ls -la app/Jobs/

# Voir les services créés
ls -la app/Services/

## 8. AUDIT DE LA CONFIGURATION
# Voir les variables d'environnement importantes
php artisan tinker
echo "APP_ENV: " . env('APP_ENV') . "\n";
echo "DB_CONNECTION: " . env('DB_CONNECTION') . "\n";
echo "STRIPE_PUBLIC_KEY: " . (env('STRIPE_PUBLIC_KEY') ? 'Configuré' : 'Non configuré') . "\n";
echo "STRIPE_SECRET: " . (env('STRIPE_SECRET') ? 'Configuré' : 'Non configuré') . "\n";
echo "MAIL_MAILER: " . env('MAIL_MAILER') . "\n";
exit

## 9. AUDIT DES MIDDLEWARES
# Voir les middlewares configurés
php artisan route:list --columns=name,method,uri,middleware

## 10. COMMANDE COMPLÈTE - RAPPORT D'ÉTAT DU PROJET (VERSION CORRIGÉE)
php artisan tinker

echo "=== RAPPORT D'ÉTAT PROJET DRIV'N COOK ===\n\n";

echo "📊 COMPTEURS GÉNÉRAUX:\n";
try { echo "- Users: " . User::count() . "\n"; } catch(Exception $e) { echo "- Users: Erreur\n"; }
try { echo "- Franchisees: " . Franchisee::count() . "\n"; } catch(Exception $e) { echo "- Franchisees: Non créé\n"; }
try { echo "- Contracts: " . FranchiseContract::count() . "\n"; } catch(Exception $e) { echo "- Contracts: Non créé\n"; }
try { echo "- Transactions: " . Transaction::count() . "\n"; } catch(Exception $e) { echo "- Transactions: Non créé\n"; }
try { echo "- Warehouses: " . Warehouse::count() . "\n"; } catch(Exception $e) { echo "- Warehouses: Non créé\n"; }
try { echo "- Products: " . Product::count() . "\n"; } catch(Exception $e) { echo "- Products: Non créé\n"; }
try { echo "- Product Categories: " . ProductCategory::count() . "\n"; } catch(Exception $e) { echo "- Product Categories: Non créé\n"; }
try { echo "- Warehouse Stocks: " . WarehouseStock::count() . "\n"; } catch(Exception $e) { echo "- Warehouse Stocks: Non créé\n"; }
try { echo "- Franchise Orders: " . FranchiseOrder::count() . "\n"; } catch(Exception $e) { echo "- Franchise Orders: Non créé\n"; }

echo "\n💰 SYSTÈME DE PAIEMENT:\n";
try { echo "- Payment Types: " . PaymentType::count() . "\n"; } catch(Exception $e) { echo "- Payment Types: Non créé\n"; }
try { echo "- Payment Schedules: " . PaymentSchedule::count() . "\n"; } catch(Exception $e) { echo "- Payment Schedules: Non créé\n"; }
try { echo "- Franchisee Accounts: " . FranchiseeAccount::count() . "\n"; } catch(Exception $e) { echo "- Franchisee Accounts: Non créé\n"; }
try { echo "- Account Movements: " . AccountMovement::count() . "\n"; } catch(Exception $e) { echo "- Account Movements: Non créé\n"; }

echo "\n📦 GESTION STOCKS:\n";
try { echo "- Stock Movements: " . StockMovement::count() . "\n"; } catch(Exception $e) { echo "- Stock Movements: Non créé\n"; }
try { echo "- Order Items: " . FranchiseOrderItem::count() . "\n"; } catch(Exception $e) { echo "- Order Items: Non créé\n"; }

echo "\n🔧 CONFIGURATION:\n";
echo "- Base de données: " . env('DB_CONNECTION') . "\n";
echo "- Stripe configuré: " . (env('STRIPE_SECRET') ? 'Oui' : 'Non') . "\n";
echo "- Mail configuré: " . env('MAIL_MAILER') . "\n";
echo "- Queue configuré: " . env('QUEUE_CONNECTION') . "\n";

echo "\n📋 TABLES EXISTANTES (via migrations):\n";
$migrations = DB::select("SHOW TABLES");
$tableColumn = 'Tables_in_' . env('DB_DATABASE');
foreach($migrations as $migration) {
    echo "- " . $migration->$tableColumn . "\n";
}

echo "\n🎯 MISSIONS RÉALISÉES:\n";
$mission1 = (class_exists('App\Models\Warehouse') && class_exists('App\Models\Product'));
$paiement = (class_exists('App\Models\Transaction') && class_exists('App\Models\FranchiseContract'));
echo "- Mission 1 (Gestion Franchisés): " . ($mission1 ? '✅ FAIT' : '❌ À FAIRE') . "\n";
echo "- Système Paiement: " . ($paiement ? '✅ FAIT' : '❌ À FAIRE') . "\n";
echo "- Mission 3 (Réseau): ❌ À FAIRE\n";

exit

## 11. COMMANDE POUR TESTER LES APIs (optionnel)
# Démarrer le serveur de développement
php artisan serve

# Dans un autre terminal, tester une route API
curl -H "Accept: application/json" http://localhost:8000/api/products

## 12. VOIR LES LOGS D'ERREUR
tail -f storage/logs/laravel.log

## 13. NETTOYER ET RÉGÉNÉRER TOUT (si besoin)
# Nettoyer le cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Régénérer les données de test
php artisan migrate:fresh --seed
