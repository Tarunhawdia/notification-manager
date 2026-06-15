package com.buzzkillclone

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import android.provider.Settings
import android.content.Intent
import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.content.pm.ApplicationInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import java.io.ByteArrayOutputStream
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.ReadableArray

class NotificationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NotificationModule"
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val context = reactApplicationContext
        val cn = ComponentName(context, NotificationService::class.java)
        val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
        val hasPermission = flat != null && flat.contains(cn.flattenToString())
        promise.resolve(hasPermission)
    }

    @ReactMethod
    fun requestPermission() {
        val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun saveRule(packageName: String, days: Int, enabled: Boolean, quietStart: Int, quietEnd: Int) {
        val prefs = RuleStore.rulesPrefs(reactApplicationContext)
        RuleStore.writeRule(prefs, packageName, Rule(days, enabled, quietStart, quietEnd))
    }

    @ReactMethod
    fun setRuleEnabled(packageName: String, enabled: Boolean) {
        val prefs = RuleStore.rulesPrefs(reactApplicationContext)
        val existing = RuleStore.parseRule(prefs, packageName) ?: return
        RuleStore.writeRule(prefs, packageName, existing.copy(enabled = enabled))
    }

    @ReactMethod
    fun removeRule(packageName: String) {
        val prefs = RuleStore.rulesPrefs(reactApplicationContext)
        prefs.edit().remove(packageName).apply()
    }

    @ReactMethod
    fun getRules(promise: Promise) {
        val prefs = RuleStore.rulesPrefs(reactApplicationContext)
        val map = Arguments.createMap()
        for (key in prefs.all.keys) {
            val rule = RuleStore.parseRule(prefs, key) ?: continue
            val ruleMap = Arguments.createMap()
            ruleMap.putInt("days", rule.days)
            ruleMap.putBoolean("enabled", rule.enabled)
            ruleMap.putInt("quietStart", rule.quietStart)
            ruleMap.putInt("quietEnd", rule.quietEnd)
            map.putMap(key, ruleMap)
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun getStats(promise: Promise) {
        val result = Arguments.createMap()
        result.putInt("total", RuleStore.totalSuppressed(reactApplicationContext))
        val perApp = Arguments.createMap()
        for ((pkg, count) in RuleStore.perAppCounts(reactApplicationContext)) {
            perApp.putInt(pkg, count)
        }
        result.putMap("perApp", perApp)
        promise.resolve(result)
    }

    @ReactMethod
    fun resetStats() {
        RuleStore.resetStats(reactApplicationContext)
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val pm = reactApplicationContext.packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        val list = Arguments.createArray()

        for (appInfo in packages) {
            val launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName)
            
            if (launchIntent != null) {
                val appMap = Arguments.createMap()
                appMap.putString("label", pm.getApplicationLabel(appInfo).toString())
                appMap.putString("packageName", appInfo.packageName)
                
                // Get app icon and convert to Base64
                try {
                    val icon = pm.getApplicationIcon(appInfo)
                    val base64Icon = drawableToBase64(icon)
                    appMap.putString("icon", base64Icon)
                } catch (e: Exception) {
                    appMap.putString("icon", null)
                }
                
                list.pushMap(appMap)
            }
        }
        promise.resolve(list)
    }

    @ReactMethod
    fun saveRules(packageNames: ReadableArray, days: Int, enabled: Boolean, quietStart: Int, quietEnd: Int) {
        val prefs = RuleStore.rulesPrefs(reactApplicationContext)
        for (i in 0 until packageNames.size()) {
            val pkg = packageNames.getString(i) ?: continue
            RuleStore.writeRule(prefs, pkg, Rule(days, enabled, quietStart, quietEnd))
        }
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable) {
            drawable.bitmap
        } else {
            val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 1
            val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 1
            val b = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(b)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            b
        }

        // Scale down if too large to avoid memory issues with bridge
        val scaledBitmap = if (bitmap.width > 200 || bitmap.height > 200) {
            Bitmap.createScaledBitmap(bitmap, 128, 128, true)
        } else {
            bitmap
        }

        val outputStream = ByteArrayOutputStream()
        scaledBitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        val bytes = outputStream.toByteArray()
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }
}
