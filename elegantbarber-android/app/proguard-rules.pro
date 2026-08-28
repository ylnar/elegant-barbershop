-dontwarn javax.annotation.**
-keep class com.elegantbarber.app.data.remote.** { *; }
-keep class com.elegantbarber.app.data.local.entity.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
