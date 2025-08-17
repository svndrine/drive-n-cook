<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('franchise_contracts', function (Blueprint $table) {
            $table->string('pdf_url')->nullable()->after('contract_pdf_path');
        });
    }

    public function down()
    {
        Schema::table('franchise_contracts', function (Blueprint $table) {
            $table->dropColumn('pdf_url');
        });
    }
};
