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
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray

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
    fun saveRule(packageName: String, days: Int) {
        val prefs = reactApplicationContext.getSharedPreferences("BuzzKillRules", Context.MODE_PRIVATE)
        prefs.edit().putInt(packageName, days).apply()
    }

    @ReactMethod
    fun removeRule(packageName: String) {
        val prefs = reactApplicationContext.getSharedPreferences("BuzzKillRules", Context.MODE_PRIVATE)
        prefs.edit().remove(packageName).apply()
    }

    @ReactMethod
    fun getRules(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences("BuzzKillRules", Context.MODE_PRIVATE)
        val all = prefs.all
        val map = com.facebook.react.bridge.Arguments.createMap()
        for ((key, value) in all) {
            map.putInt(key, value as Int)
        }
        promise.resolve(map)
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        val pm = reactApplicationContext.packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        val list = Arguments.createArray()

        for (appInfo in packages) {
            // Filter out system apps mostly, keep those that have a launcher intent or reasonable use
            val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName)
            
            if (launchIntent != null) {
                val appMap = Arguments.createMap()
                appMap.putString("label", pm.getApplicationLabel(appInfo).toString())
                appMap.putString("packageName", appInfo.packageName)
                list.pushMap(appMap)
            }
        }
        promise.resolve(list)
    }
}
