import os
import re

# Dictionary mapping English text to translation keys
translations_map = {
    'Choose Language': 'choose_language',
    'Continue': 'continue',
    'Welcome': 'welcome',
    'Login to continue': 'login_to_continue',
    'Please enter email': 'please_enter_email',
    'Please enter valid email': 'invalid_email',
    'Please enter 6-digit password': 'please_enter_6_digit_password',
    'Enter your email': 'email_hint',
    'Enter 6-digit PIN': 'pin_hint',
    'Forgot Password?': 'forgot_password',
    'Login': 'login',
    "Don't have an account? ": 'dont_have_account',
    'Signup': 'signup',
    'Home': 'home',
    'Devices': 'devices',
    'Settings': 'settings',
    'Shop': 'shop',
    'Orders': 'orders',
    'Profile': 'profile',
    'Create Account': 'create_account',
    'Join AgriPlus today': 'join_agriplus',
    'Sign up to get started': 'signup_to_get_started',
    'Enter your full name': 'full_name_hint',
    'Enter phone number': 'phone_hint',
    'Already have an account? ': 'already_have_account',
    'Forgot Password': 'forgot_password_title',
    'Enter your email to receive a reset code': 'enter_email_to_receive_reset_code',
    'Enter Email': 'enter_email_label',
    'Change Email': 'change_email_tooltip',
    'Send OTP': 'send_otp',
    'Verify OTP': 'verify_otp',
    'Verify your email': 'verify_your_email',
    'Enter the 4-digit code sent to': 'enter_otp_sent_to',
    'Resend OTP in': 'resend_otp_in',
    'Resend OTP': 'resend_otp',
    'Verify & Continue': 'verify_and_continue',
    'Reset Password': 'reset_password_title',
    'Create your new 6-digit PIN': 'create_new_pin',
    'New 6-digit PIN': 'new_pin_hint',
    'Confirm 6-digit PIN': 'confirm_pin_hint',
    'Please enter new password': 'enter_new_password_error',
    'Password must be 6 numbers': 'password_must_be_6_numbers_error',
    'Please confirm password': 'confirm_password_error',
    'Passwords do not match': 'passwords_do_not_match_error',
    'Success!': 'success_title',
    'Your password has been reset successfully.': 'password_reset_success_message',
    'Login Now': 'login_now',
    'Exit App': 'exit_app',
    'Are you sure you want to exit?': 'exit_confirmation',
    'No': 'no',
    'Yes': 'yes',
    'Logout': 'logout',
    'Are you sure you want to logout?': 'logout_confirmation',
    'Theme': 'theme',
    'Light': 'light',
    'Dark': 'dark',
    'System Default': 'system_default',
    'Privacy Policy': 'privacy_policy',
    'Choose Theme': 'choose_theme',
    'Light, Dark, or System Default': 'theme_subtitle',
    'Notification': 'notification',
    'Contact Us': 'contact_us',
    'All Orders': 'all_orders',
    'Vouchers': 'vouchers',
    'Address': 'address',
    'My Addresses': 'my_addresses',
    'Add Address': 'add_address',
    'Edit': 'edit',
    'Delete': 'delete',
    'Delete Address': 'delete_address_title',
    'Are you sure you want to delete this address?': 'delete_address_confirmation',
    'Remove': 'remove',
    'Cancel': 'cancel',
    'Save': 'save',
    'Full Name': 'full_name',
    'Phone Number': 'phone_number',
    'Street Address': 'street_address',
    'Pincode': 'pincode',
    'City': 'city',
    'State': 'state',
    'Cart is empty': 'cart_empty',
    'Checkout': 'checkout',
    'Shipping Address': 'shipping_address',
    'Select from saved addresses': 'select_from_saved_addresses',
    'Payment Method': 'payment_method',
    'PLACE ORDER': 'place_order',
    'Please enter full name': 'please_enter_full_name',
    'Please enter phone number': 'please_enter_phone_number',
    'Phone number must be 10 digits': 'phone_number_must_be_10_digits',
    'Please enter street address': 'please_enter_street_address',
    'Enter valid pincode': 'enter_valid_pincode',
    'Enter valid city name': 'enter_valid_city',
    'Enter valid state name': 'enter_valid_state',
    'Razorpay': 'razorpay',
    'Credit/Debit Card, UPI, NetBanking': 'razorpay_subtitle',
    'Order Summary': 'order_summary',
    'Order Details': 'order_details',
    'Order not found': 'order_not_found',
    'Shopping Cart': 'shopping_cart',
    'Continue Shopping': 'continue_shopping',
    'Remove Item': 'remove_item',
    'Are you sure you want to remove this item from your cart?': 'remove_item_confirmation',
    'Clear Cart': 'clear_cart',
    'Are you sure you want to remove all items from your cart?': 'clear_cart_confirmation',
    'Search motors, controllers...': 'search_hint',
    'Search for products': 'search_products',
    'No products found': 'no_products_found',
    'GST': 'gst',
    'GST Amount': 'gst_amount',
    'Shipping': 'shipping',
    'Description': 'description',
    'View Product Brochure (PDF)': 'view_pdf_brochure',
    'Box Size': 'box_size',
    'Product Details': 'product_details',
    'OUT OF STOCK': 'out_of_stock',
    'Total Price': 'total_price',
    'Add to Cart': 'add_to_cart',
    'Update Cart': 'update_cart',
    'Quantity': 'quantity',
    'Available Offers': 'available_offers',
    'Use Code': 'use_code',
    'Copied!': 'copied',
    'Voucher code copied to clipboard': 'voucher_copied',
    'left': 'left',
    'OFF': 'off',
    'No products available': 'no_products_available',
    'Error': 'error',
    'PDF not available': 'pdf_not_available',
    'Cannot open PDF': 'cannot_open_pdf',
    'Failed to share product': 'failed_to_share_product',
    'View Cart': 'view_cart',
    'Clear All': 'clear_all',
    'Items': 'items',
    'Item': 'item',
    'Price Summary': 'price_summary',
    'Enter Voucher Code': 'enter_voucher_code',
    'Apply': 'apply',
    'Subtotal': 'subtotal',
    'Discount': 'discount',
    'Grand Total': 'grand_total',
    'Total Amount': 'total_amount',
    'Total': 'total',
    'Voucher applied!': 'voucher_applied',
    'Your cart is empty': 'your_cart_is_empty',
    'Add items to get started': 'add_items_to_get_started',
    'Cart Updated!': 'cart_updated',
    'Added to Cart!': 'added_to_cart',
    'Product quantity updated in cart': 'cart_updated_desc',
    'Product successfully added': 'added_to_cart_desc',
    'Available Stock': 'available_stock',
    'Currently Unavailable': 'currently_unavailable',
    'This product is currently out of stock. Please check back later.': 'out_of_stock_desc',
    'Live Device Data': 'device_live_data',
    'Reconnect': 'reconnect',
    'Scan QR Code': 'scan_qr_code',
    'Open Settings': 'open_settings',
    'Location permission not available': 'location_permission_not_available',
    'Location updated': 'location_updated',
    'Please select a location on the map': 'select_location_on_map',
    'Permission Required': 'permission_required',
    'Location copied to clipboard': 'location_copied',
    'Device History': 'device_history',
    'Device Access': 'device_access',
    'Add': 'add',
    'Remove Access': 'remove_access',
    'Configure Device': 'configure_device',
    'Device Name': 'device_name',
    'Device Location (Optional)': 'device_location_optional',
    'Pick from map': 'pick_from_map',
    'Motor Capacity (HP) (Optional)': 'motor_capacity_hp_optional',
    'Configuration Guide': 'configuration_guide',
    'Validation Error': 'validation_error',
    'Please check the IMEI and other fields': 'check_imei_error',
    'CONFIGURE DEVICE': 'configure_device_caps',
    'Camera': 'camera',
    'Gallery': 'gallery',
    'Remove Photo': 'remove_photo',
    'Are you sure you want to remove your profile photo?': 'remove_photo_confirmation',
    'About AgriPlus': 'about_agriplus',
    'MENU': 'menu',
    'MORE': 'more',
    'Recently': 'recently',
    'All': 'all',
    'Running': 'running',
    'Stopped': 'stopped',
    'Online': 'online',
    'Offline': 'offline',
    'Access': 'access',
    'Not Configured': 'not_configured',
    'No devices assigned': 'no_devices_assigned',
    'Contact admin to assign devices': 'contact_admin_to_assign_devices',
    'No devices found': 'no_devices_found',
    'AgriPlus User': 'agriplus_user',
    'Smart Motor Automation': 'smart_motor_automation',
    'Idle': 'idle',
    'SN': 'sn_label',
    'Starts at': 'starts_at',
    'Stops at': 'stops_at',
    'Accept': 'accept',
    'Reject': 'reject',
    'Device assigned successfully': 'device_assigned_success',
    'Device not found': 'device_not_found',
    'Invalid request': 'invalid_request',
    'Failed to assign device': 'failed_to_assign_device',
    'Session expired. Please login again': 'session_expired',
    'Please wait a moment': 'please_wait_moment',
    'Motor is already running': 'motor_already_running',
    'Motor is already stopped': 'motor_already_stopped',
    'Smart Automation for Smart Farming': 'smart_farming_subtitle',
    'Our Mission': 'our_mission',
    'Key Features': 'key_features',
    'Remote Motor Control': 'remote_motor_control',
    'Manage your Smart motors from anywhere.': 'remote_motor_desc',
    'Automated Scheduling': 'automated_scheduling',
    'Set timers and schedules for efficient irrigation.': 'scheduling_desc',
    'Power Monitoring': 'power_monitoring',
    'Real-time updates on power status and voltage.': 'power_monitoring_desc',
    'Instant Alerts': 'instant_alerts',
    'Get notified about faults and issues immediately.': 'instant_alerts_desc',
    '© 2024 AgriPlus Smart Automation': 'copyright'
}

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return

    # First regex pass: Remove `const` before widgets that will get `.tr`
    content = re.sub(
        r'const\s+(Text|Expanded|Center|Padding|Align|SizedBox|Column|Row|Container)\s*(?=\()',
        lambda m: m.group(1),
        content
    )

    original = content
    for text, key in translations_map.items():
        # Match Text('Something') or label: "Something" or hintText: 'Something'
        # We need to be careful with quotes.
        # Single quotes escape
        t_single = text.replace("'", "\\'")
        # Escape for regex
        esc_t_single = re.escape(t_single)
        esc_text = re.escape(text)

        # Replace 'Text' constructor
        content = re.sub(
            rf"Text\(\s*'{esc_t_single}'",
            f"Text('{key}'.tr",
            content
        )
        content = re.sub(
            rf'Text\(\s*"{esc_text}"',
            f"Text('{key}'.tr",
            content
        )

        content = re.sub(
            rf"label:\s*'{esc_t_single}'",
            f"label: '{key}'.tr",
            content
        )
        content = re.sub(
            rf'label:\s*"{esc_text}"',
            f"label: '{key}'.tr",
            content
        )

        content = re.sub(
            rf"hintText:\s*'{esc_t_single}'",
            f"hintText: '{key}'.tr",
            content
        )
        content = re.sub(
            rf'hintText:\s*"{esc_text}"',
            f"hintText: '{key}'.tr",
            content
        )

        content = re.sub(
            rf"title:\s*'{esc_t_single}'",
            f"title: '{key}'.tr",
            content
        )
        content = re.sub(
            rf'title:\s*"{esc_text}"',
            f"title: '{key}'.tr",
            content
        )

        content = re.sub(
            rf"return\s+'{esc_t_single}'",
            f"return '{key}'.tr",
            content
        )
        content = re.sub(
            rf'return\s+"{esc_text}"',
            f"return '{key}'.tr",
            content
        )

        # Catch UIUtils.showErrorDialog("error") or similar
        content = re.sub(
            rf"message:\s*'{esc_t_single}'",
            f"message: '{key}'.tr",
            content
        )
        content = re.sub(
            rf'message:\s*"{esc_text}"',
            f"message: '{key}'.tr",
            content
        )


    if original != content:
        # Also clean up remaining const Text widgets correctly if they don't have .tr
        # This isn't strictly necessary but helpful if we messed up const
        # Actually it's better to just ensure we import get
        if "'package:get/get.dart'" not in content:
            content = "import 'package:get/get.dart';\n" + content
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")

directory = r"d:\1911\Borewell-Motor-Automation\FRONTEND\App\end_user\lib\feature"
for root, dirs, files in os.walk(directory):
    for filename in files:
        if filename.endswith(".dart"):
            replace_in_file(os.path.join(root, filename))

