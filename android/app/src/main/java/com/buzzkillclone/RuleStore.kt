package com.buzzkillclone

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

/**
 * A single suppression rule for an app.
 *
 * quietStart / quietEnd are minutes-from-midnight (0..1439). A value of -1 on
 * either means "no schedule" -> the rule is active around the clock. When both
 * are set, suppression only happens while the current time is inside the window
 * (with overnight wrap-around supported).
 */
data class Rule(
    val days: Int,
    val enabled: Boolean,
    val quietStart: Int,
    val quietEnd: Int
)

/**
 * Central place for reading/writing rules and suppression stats. Shared between
 * the JS-facing NotificationModule and the background NotificationService so the
 * storage format only lives in one spot.
 *
 * Rules are stored as JSON strings. Older builds stored a bare Int (the day
 * threshold) per package, so reads transparently migrate that legacy format.
 */
object RuleStore {
    private const val RULES_PREFS = "BuzzKillRules"
    private const val STATS_PREFS = "BuzzKillStats"
    private const val KEY_TOTAL = "totalSuppressed"
    private const val COUNT_PREFIX = "count_"

    fun rulesPrefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(RULES_PREFS, Context.MODE_PRIVATE)

    fun statsPrefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(STATS_PREFS, Context.MODE_PRIVATE)

    fun parseRule(prefs: SharedPreferences, pkg: String): Rule? {
        if (!prefs.contains(pkg)) return null
        return try {
            val raw = prefs.getString(pkg, null) ?: return null
            val json = JSONObject(raw)
            Rule(
                days = json.optInt("days", 0),
                enabled = json.optBoolean("enabled", true),
                quietStart = json.optInt("quietStart", -1),
                quietEnd = json.optInt("quietEnd", -1)
            )
        } catch (e: ClassCastException) {
            // Legacy format: value was stored as a bare Int day-threshold.
            Rule(prefs.getInt(pkg, 0), true, -1, -1)
        } catch (e: Exception) {
            null
        }
    }

    fun writeRule(prefs: SharedPreferences, pkg: String, rule: Rule) {
        val json = JSONObject()
            .put("days", rule.days)
            .put("enabled", rule.enabled)
            .put("quietStart", rule.quietStart)
            .put("quietEnd", rule.quietEnd)
        prefs.edit().putString(pkg, json.toString()).apply()
    }

    fun isWithinSchedule(rule: Rule, nowMinutes: Int): Boolean {
        if (rule.quietStart < 0 || rule.quietEnd < 0 || rule.quietStart == rule.quietEnd) {
            return true
        }
        return if (rule.quietStart < rule.quietEnd) {
            nowMinutes >= rule.quietStart && nowMinutes < rule.quietEnd
        } else {
            // Overnight window, e.g. 22:00 -> 07:00
            nowMinutes >= rule.quietStart || nowMinutes < rule.quietEnd
        }
    }

    fun incrementSuppressed(ctx: Context, pkg: String) {
        val prefs = statsPrefs(ctx)
        val total = prefs.getInt(KEY_TOTAL, 0) + 1
        val per = prefs.getInt(COUNT_PREFIX + pkg, 0) + 1
        prefs.edit()
            .putInt(KEY_TOTAL, total)
            .putInt(COUNT_PREFIX + pkg, per)
            .apply()
    }

    fun totalSuppressed(ctx: Context): Int = statsPrefs(ctx).getInt(KEY_TOTAL, 0)

    fun perAppCounts(ctx: Context): Map<String, Int> {
        val out = HashMap<String, Int>()
        for ((key, value) in statsPrefs(ctx).all) {
            if (key.startsWith(COUNT_PREFIX) && value is Int) {
                out[key.removePrefix(COUNT_PREFIX)] = value
            }
        }
        return out
    }

    fun resetStats(ctx: Context) {
        statsPrefs(ctx).edit().clear().apply()
    }
}
