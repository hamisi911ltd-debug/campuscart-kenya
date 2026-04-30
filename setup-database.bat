@echo off
REM CampusMart Database Setup Script for Windows
REM This script helps you set up the D1 database for production

echo.
echo ========================================
echo   CampusMart Database Setup
echo ========================================
echo.

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Wrangler CLI is not installed
    echo.
    echo Install it with:
    echo   npm install -g wrangler
    echo.
    pause
    exit /b 1
)

echo [OK] Wrangler CLI found
echo.

REM Step 1: List existing databases
echo ========================================
echo Step 1: Checking existing D1 databases
echo ========================================
echo.
call wrangler d1 list
echo.

set /p db_exists="Does 'campusmart' database exist in the list above? (y/n): "

if /i NOT "%db_exists%"=="y" (
    echo.
    echo Creating new D1 database 'campusmart'...
    call wrangler d1 create campusmart
    echo.
    echo WARNING: Copy the database_id from above and update it in wrangler.toml
    echo.
    pause
)

REM Step 2: Run the schema
echo.
echo ========================================
echo Step 2: Running database schema
echo ========================================
echo.
echo This will create all tables (users, products, orders, etc.)
echo.
pause

call wrangler d1 execute campusmart --file=./DATABASE_SCHEMA.sql --remote

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Database schema executed successfully!
) else (
    echo.
    echo [ERROR] Failed to execute schema. Check the error message above.
    pause
    exit /b 1
)

REM Step 3: Verify tables were created
echo.
echo ========================================
echo Step 3: Verifying tables were created
echo ========================================
echo.
call wrangler d1 execute campusmart --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" --remote

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Verify R2 bucket exists: wrangler r2 bucket list
echo 2. If not, create it: wrangler r2 bucket create campusmart-storage
echo 3. Deploy your site: npm run build
echo 4. Test the API using test-api.html
echo.
pause
