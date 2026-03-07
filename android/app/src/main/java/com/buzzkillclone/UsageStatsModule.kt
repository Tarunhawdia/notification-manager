package com.buzzkillclone

import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.app.AppOpsManager
import android.os.Process
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import java.util.Calendar

class UsageStatsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "UsageStatsModule"
    }

    @ReactMethod
    fun checkPermission(promise: Promise) {
        val appOps = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactApplicationContext.packageName
        )
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    @ReactMethod
    fun requestPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }

    @ReactMethod
    fun getInactiveDays(packageName: String, promise: Promise) {
        val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, -30) // Look back up to 30 days
        val startTime = calendar.timeInMillis

        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
        
        var lastUsedTime = 0L
        for (stat in stats) {
            if (stat.packageName == packageName) {
                if (stat.lastTimeUsed > lastUsedTime) {
                    lastUsedTime = stat.lastTimeUsed
                }
            }
        }

        if (lastUsedTime == 0L) {
            promise.resolve(30) // Not used in last 30 days or never used
            return
        }

        val diff = System.currentTimeMillis() - lastUsedTime
        val days = (diff / (1000 * 60 * 60 * 24)).toInt()
        promise.resolve(days)
    }
}
