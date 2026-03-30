# Migrate all files to new structure

$basePath = "d:\1911\Borewell-Motor-Automation\FRONTEND\App\end_user\lib"

# Device files
Copy-Item "$basePath\modules\device\add_device_controller.dart" "$basePath\feature\end_user_app\device\presentation\controllers\" -Force
Copy-Item "$basePath\modules\device\device_controller.dart" "$basePath\feature\end_user_app\device\presentation\controllers\" -Force
Copy-Item "$basePath\modules\device\device_details_controller.dart" "$basePath\feature\end_user_app\device\presentation\controllers\" -Force
Copy-Item "$basePath\modules\device\device_history_controller.dart" "$basePath\feature\end_user_app\device\presentation\controllers\" -Force

Copy-Item "$basePath\modules\device\add_device_view.dart" "$basePath\feature\end_user_app\device\presentation\pages\add_device_page.dart" -Force
Copy-Item "$basePath\modules\device\device_view.dart" "$basePath\feature\end_user_app\device\presentation\pages\device_page.dart" -Force
Copy-Item "$basePath\modules\device\device_details_view.dart" "$basePath\feature\end_user_app\device\presentation\pages\device_details_page.dart" -Force
Copy-Item "$basePath\modules\device\device_history_view.dart" "$basePath\feature\end_user_app\device\presentation\pages\device_history_page.dart" -Force
Copy-Item "$basePath\modules\device\device_live_data_view.dart" "$basePath\feature\end_user_app\device\presentation\pages\device_live_data_page.dart" -Force
Copy-Item "$basePath\modules\device\map_picker_view.dart" "$basePath\feature\end_user_app\device\presentation\pages\map_picker_page.dart" -Force
Copy-Item "$basePath\modules\device\device_binding.dart" "$basePath\feature\end_user_app\device\presentation\pages\" -Force

# Settings files
Copy-Item "$basePath\modules\settings\settings_view.dart" "$basePath\feature\end_user_app\settings\presentation\pages\settings_page.dart" -Force
Copy-Item "$basePath\modules\settings\settings_binding.dart" "$basePath\feature\end_user_app\settings\presentation\pages\" -Force

# Profile files
Copy-Item "$basePath\modules\profile\profile_controller.dart" "$basePath\feature\end_user_app\profile\presentation\controllers\" -Force
Copy-Item "$basePath\modules\profile\profile_view.dart" "$basePath\feature\end_user_app\profile\presentation\pages\profile_page.dart" -Force
Copy-Item "$basePath\modules\profile\edit_profile_view.dart" "$basePath\feature\end_user_app\profile\presentation\pages\edit_profile_page.dart" -Force
Copy-Item "$basePath\modules\profile\privacy_policy_view.dart" "$basePath\feature\end_user_app\profile\presentation\pages\privacy_policy_page.dart" -Force
Copy-Item "$basePath\modules\profile\profile_binding.dart" "$basePath\feature\end_user_app\profile\presentation\pages\" -Force

# Dashboard files
Copy-Item "$basePath\modules\dashboard\dashboard_controller.dart" "$basePath\feature\end_user_app\dashboard\presentation\controllers\" -Force
Copy-Item "$basePath\modules\dashboard\dashboard_view.dart" "$basePath\feature\end_user_app\dashboard\presentation\pages\dashboard_page.dart" -Force
Copy-Item "$basePath\modules\dashboard\dashboard_binding.dart" "$basePath\feature\end_user_app\dashboard\presentation\pages\" -Force

# Contact files
Copy-Item "$basePath\modules\contact\contact_view.dart" "$basePath\feature\end_user_app\contact\presentation\pages\contact_page.dart" -Force

Write-Host "All files copied successfully!"
