package com.buzzkillclone

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import android.content.Context
import android.app.usage.UsageStatsManager

class NotificationService : NotificationListenerService() {
    companion object {
        const val TAG = "NotificationService"
        var instance: NotificationService? = null
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "Notification Listener connected")
        instance = this
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "Notification Listener disconnected")
        instance = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        sbn?.let {
            val packageName = it.packageName
            val prefs = getSharedPreferences("BuzzKillRules", Context.MODE_PRIVATE)
            if (prefs.contains(packageName)) {
                val thresholdDays = prefs.getInt(packageName, -1)
                if (thresholdDays > 0) {
                    val inactiveDays = getInactiveDays(packageName)
                    Log.d(TAG, "Notification from $packageName. Inactive for $inactiveDays days. Threshold: $thresholdDays")
                    if (inactiveDays >= thresholdDays) {
                        Log.d(TAG, "Dismissing notification for $packageName")
                        cancelNotification(it.key)
                    }
                }
            }
        }
    }

    private fun getInactiveDays(packageName: String): Int {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val calendar = java.util.Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.add(java.util.Calendar.DAY_OF_YEAR, -30)
        val startTime = calendar.timeInMillis
        
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
        var lastUsedTime = 0L
        for (stat in stats) {
            if (stat.packageName == packageName && stat.lastTimeUsed > lastUsedTime) {
                lastUsedTime = stat.lastTimeUsed
            }
        }
        if (lastUsedTime == 0L) return 30
        
        val diff = System.currentTimeMillis() - lastUsedTime
        return (diff / (1000 * 60 * 60 * 24)).toInt()
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
        sbn?.let {
            Log.d(TAG, "Notification removed: ${it.packageName}")
        }
    }
}
