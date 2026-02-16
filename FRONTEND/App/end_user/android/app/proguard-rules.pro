# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in D:\flutter\flutter\packages\flutter_tools\gradle\proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.

# Flutter Rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase Rules
-keep class com.google.firebase.** { *; }

# Razorpay Rules
-keep class com.razorpay.** {*;}
-dontwarn com.razorpay.**

# Standard rules to keep necessary code
-keepattributes Signature, *Annotation*, EnclosingMethod, InnerClasses
-dontwarn okio.**
-dontwarn javax.annotation.**
