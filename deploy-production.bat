@echo off
REM CampusMart Production Deployment Script for Windows
REM This script prepares and deploys your application to Cloudflare Pages

echo.
echo ========================================
echo   CampusMart Production Deployment
echo ========================================
echo.

REM Step 1: Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Are you in the project root?
    exit /b 1
)
echo [OK] Step 1: Project directory verified
echo.

REM Step 2: Check for uncommitted changes
git status --porcelain > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] You may have uncommitted changes
    git status --short
    echo.
    set /p commit_choice="Do you want to commit these changes? (y/n): "
    if /i "%commit_choice%"=="y" (
        set /p commit_msg="Enter commit message: "
        git add .
        git commit -m "%commit_msg%"
        echo [OK] Changes committed
    ) else (
        echo [WARNING] Proceeding with uncommitted changes
    )
) else (
    echo [OK] Step 2: No uncommitted changes
)
echo.

REM Step 3: Build the project
echo [BUILD] Step 3: Building production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed. Fix build errors before deploying.
    exit /b 1
)
echo [OK] Step 3: Build successful
echo.

REM Step 4: Verify database schema
echo [DATABASE] Step 4: Checking database schema...
if exist "DATABASE_SCHEMA.sql" (
    echo Database schema file found.
    set /p schema_choice="Do you want to apply the schema to production database? (y/n): "
    if /i "%schema_choice%"=="y" (
        echo Applying schema to production database...
        call npx wrangler d1 execute campusmart --remote --file=DATABASE_SCHEMA.sql
        if %ERRORLEVEL% NEQ 0 (
            echo [WARNING] Schema application failed. This might be okay if tables already exist.
        ) else (
            echo [OK] Schema applied
        )
    ) else (
        echo [WARNING] Skipping schema application
    )
) else (
    echo [WARNING] DATABASE_SCHEMA.sql not found
)
echo.

REM Step 5: Push to GitHub
echo [GIT] Step 5: Pushing to GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git push failed. Check your git configuration.
    exit /b 1
)
echo [OK] Step 5: Pushed to GitHub
echo.

REM Step 6: Deployment instructions
echo ========================================
echo   Step 6: Final Deployment Steps
echo ========================================
echo.
echo IMPORTANT: Complete these steps in Cloudflare Dashboard:
echo.
echo 1. Go to: https://dash.cloudflare.com/
echo 2. Navigate to: Workers ^& Pages -^> campusmart-kenya
echo 3. Go to: Settings -^> Functions
echo.
echo 4. Add D1 Database Binding:
echo    - Variable name: DB
echo    - D1 database: campusmart
echo.
echo 5. Add R2 Bucket Binding:
echo    - Variable name: STORAGE
echo    - R2 bucket: campusmart-storage
echo.
echo 6. Go to: Settings -^> Environment variables
echo 7. Add Production variables:
echo    - VITE_ADMIN_EMAIL=campusmart.care@gmail.com
echo    - VITE_ADMIN_PASSWORD=^<your-secure-password^>
echo.
echo 8. Go to: Deployments -^> Retry deployment (or wait for auto-deploy)
echo.
echo 9. After deployment, test these URLs:
echo    - https://campusmart-kenya.pages.dev/
echo    - https://campusmart-kenya.pages.dev/api/debug
echo    - https://campusmart-kenya.pages.dev/api/products
echo.
echo [OK] Deployment preparation complete!
echo.
echo For detailed instructions, see: PRODUCTION_READINESS_CHECKLIST.md
echo For deployment troubleshooting, see: DEPLOYMENT_FIX_GUIDE.md
echo.
echo Good luck with your launch!
echo.
pause
