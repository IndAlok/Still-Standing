@echo off
echo Applying CORS configuration to Firebase Storage...

REM Make sure you have gsutil installed and configured
REM You can install it from: https://cloud.google.com/storage/docs/gsutil_install

REM Replace 'crewconnect00.firebasestorage.app' with your actual Firebase Storage bucket name
set BUCKET_NAME=crewconnect00.firebasestorage.app

echo Applying CORS policy to gs://%BUCKET_NAME%...
gsutil cors set cors.json gs://%BUCKET_NAME%

if %errorlevel% equ 0 (
    echo CORS configuration applied successfully!
    echo You can verify the CORS configuration with:
    echo gsutil cors get gs://%BUCKET_NAME%
) else (
    echo Failed to apply CORS configuration.
    echo Make sure you have:
    echo 1. gsutil installed and configured
    echo 2. Correct permissions for the Firebase Storage bucket
    echo 3. The correct bucket name in this script
)

pause
