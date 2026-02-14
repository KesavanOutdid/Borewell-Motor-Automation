# Update all import statements to new structure

$libPath = "d:\1911\Borewell-Motor-Automation\FRONTEND\App\end_user\lib"

# Get all dart files
$dartFiles = Get-ChildItem -Path $libPath -Filter "*.dart" -Recurse | Where-Object { $_.FullName -notlike "*\modules\*" }

foreach ($file in $dartFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Update config imports
    $content = $content -replace "import '\.\.\/config\/", "import '../../../../../core/config/"
    $content = $content -replace "import '\.\.\/\.\.\/config\/", "import '../../../../../core/config/"
    $content = $content -replace "from '\.\.\/config\/", "from '../../../../../core/config/"
    $content = $content -replace "from '\.\.\/\.\.\/config\/", "from '../../../../../core/config/"
    
    # Update services imports
    $content = $content -replace "import '\.\.\/services\/", "import '../../../../../core/services/"
    $content = $content -replace "import '\.\.\/\.\.\/services\/", "import '../../../../../core/services/"
    
    # Update routes imports
    $content = $content -replace "import '\.\.\/routes\/", "import '../../../../../core/routes/"
    $content = $content -replace "import '\.\.\/\.\.\/routes\/", "import '../../../../../core/routes/"
    
    # Update theme controller import
    $content = $content -replace "import '\.\.\/\.\.\/modules\/settings\/theme_controller\.dart'", "import '../../../../../utils/theme/theme_controller.dart'"
    $content = $content -replace "import 'modules\/settings\/theme_controller\.dart'", "import 'utils/theme/theme_controller.dart'"
    
    # Update splash import
    $content = $content -replace "import '\.\.\/modules\/splash\/splash_view\.dart'", "import '../core/splash_screen.dart'"
    $content = $content -replace "from '\.\.\/modules\/splash\/", "from '../core/"
    
    # Update module imports to feature imports
    $content = $content -replace "import '\.\.\/modules\/login\/", "import '../feature/end_user_app/auth/presentation/"
    $content = $content -replace "import '\.\.\/\.\.\/modules\/login\/", "import '../../../../../feature/end_user_app/auth/presentation/"
    $content = $content -replace "import '\.\.\/modules\/home\/", "import '../feature/end_user_app/home/presentation/"
    $content = $content -replace "import '\.\.\/\.\.\/modules\/home\/", "import '../../../../../feature/end_user_app/home/presentation/"
    
    # Update controller paths in same directory
    $content = $content -replace "import 'login_controller\.dart'", "import '../controllers/auth_controller.dart'"
    $content = $content -replace "import 'signup_controller\.dart'", "import '../controllers/signup_controller.dart'"
    $content = $content -replace "import 'login_binding\.dart'", "import 'login_binding.dart'"
    $content = $content -replace "import 'home_controller\.dart'", "import '../controllers/home_controller.dart'"
    $content = $content -replace "import 'profile_controller\.dart'", "import '../controllers/profile_controller.dart'"
    $content = $content -replace "import 'dashboard_controller\.dart'", "import '../controllers/dashboard_controller.dart'"
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "All imports updated successfully!"
