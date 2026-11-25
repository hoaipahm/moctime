package vn.moc.personal;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.time.ZoneId;
import java.time.DateTimeException;
import java.util.HashSet;
import java.util.Set;

/** Serializes plan replacement, alarm delivery and permission changes in one process. */
public final class ReminderStore {
 private static final String CHANNEL="moc-reminders", PLAN="plan", ENABLED="enabled";
 private ReminderStore() {}
 private static SharedPreferences prefs(Context c) { return c.getSharedPreferences("moc-reminders",Context.MODE_PRIVATE); }
 private static JSONArray read(Context c) { try { return new JSONArray(prefs(c).getString(PLAN,"[]")); } catch(JSONException error) { return new JSONArray(); } }
 public static boolean allowed(Context c) { NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE); if(manager==null||!manager.areNotificationsEnabled()) return false; if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED) return false; NotificationChannel channel=manager.getNotificationChannel(CHANNEL); return channel==null||channel.getImportance()!=NotificationManager.IMPORTANCE_NONE; }
 public static synchronized boolean enabled(Context c) { return prefs(c).getBoolean(ENABLED,false); }
 private static PendingIntent alarmIntent(Context c,String id) { Intent intent=new Intent(c,ReminderReceiver.class).setAction("vn.moc.personal.REMIND").setData(Uri.parse("moc://reminder/"+Uri.encode(id))).putExtra("id",id);return PendingIntent.getBroadcast(c,0,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE); }
 private static void cancel(Context c,JSONArray old) { AlarmManager manager=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);if(manager==null)return;for(int i=0;i<old.length();i++){String id=old.optJSONObject(i)==null?"":old.optJSONObject(i).optString("id");if(!id.isEmpty())manager.cancel(alarmIntent(c,id));} }
 private static void arm(Context c,JSONArray plan) {
  if(!enabled(c)||!allowed(c))return;
  AlarmManager manager=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);if(manager==null)return;
  long now=System.currentTimeMillis();
  for(int i=0;i<plan.length();i++){JSONObject item=plan.optJSONObject(i);if(item==null)continue;try{long when=ReminderTime.epoch(item.getString("local"),ZoneId.systemDefault());if(when>now)manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,alarmIntent(c,item.getString("id")));}catch(IllegalArgumentException|DateTimeException|JSONException error){android.util.Log.w("MocReminder","Skipped invalid reminder time");}}
 }
 public static synchronized boolean sync(Context c,String json) {
  if(json==null||json.length()>400000)return false;
  try {
   JSONArray incoming=new JSONArray(json);if(incoming.length()>256)return false;
   JSONArray clean=new JSONArray();Set<String> ids=new HashSet<>();
   for(int i=0;i<incoming.length();i++){JSONObject item=incoming.getJSONObject(i);String id=item.getString("id"),title=item.getString("title"),body=item.getString("body"),local=item.getString("local");if(id.isEmpty()||id.length()>200||!ids.add(id)||title.length()>200||body.length()>500)return false;ReminderTime.epoch(local,ZoneId.systemDefault());clean.put(new JSONObject().put("id",id).put("title",title).put("body",body).put("local",local));}
   JSONArray previous=read(c);
   if(previous.toString().equals(clean.toString()))return true;
   if(!prefs(c).edit().putString(PLAN,clean.toString()).commit())return false;
   cancel(c,previous);arm(c,clean);return true;
  }catch(JSONException|DateTimeException|IllegalArgumentException error){return false;}
 }
 public static synchronized void enable(Context c,boolean enabled) { JSONArray plan=read(c);prefs(c).edit().putBoolean(ENABLED,enabled).apply();cancel(c,plan);arm(c,plan); }
 public static synchronized void rearm(Context c) { JSONArray plan=read(c);cancel(c,plan);arm(c,plan); }
 public static synchronized String status(Context c) {try{JSONArray plan=read(c);int count=0;if(enabled(c)&&allowed(c))for(int i=0;i<plan.length();i++){try{if(ReminderTime.epoch(plan.getJSONObject(i).getString("local"),ZoneId.systemDefault())>System.currentTimeMillis())count++;}catch(IllegalArgumentException|DateTimeException|JSONException error){/* Corrupt rows are not scheduled. */}}return new JSONObject().put("enabled",enabled(c)).put("allowed",allowed(c)).put("count",count).toString();}catch(JSONException error){return "{}";} }
 private static void post(Context c,String id,String title,String body) {
  if(!allowed(c))return;NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);if(manager==null)return;
  manager.createNotificationChannel(new NotificationChannel(CHANNEL,"Mốc",NotificationManager.IMPORTANCE_DEFAULT));
  Intent open=new Intent(c,MainActivity.class).setAction("vn.moc.personal.OPEN_REMINDER").setData(Uri.parse("moc://open/"+Uri.encode(id))).putExtra("entryId",id).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
  PendingIntent click=PendingIntent.getActivity(c,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
  Notification notification=new Notification.Builder(c,CHANNEL).setSmallIcon(vn.moc.personal.R.drawable.notification_icon).setContentTitle(title).setContentText(body).setContentIntent(click).setAutoCancel(true).setVisibility(Notification.VISIBILITY_PRIVATE).build();
  try{manager.notify(id,0,notification);}catch(SecurityException error){android.util.Log.w("MocReminder","Notification permission changed");}
 }
 public static synchronized void fire(Context c,String id) {
  if(id==null||!enabled(c)||!allowed(c))return;JSONArray old=read(c),remaining=new JSONArray();JSONObject found=null;
  for(int i=0;i<old.length();i++){JSONObject item=old.optJSONObject(i);if(item==null)continue;if(id.equals(item.optString("id")))found=item;else remaining.put(item);}
  if(found==null)return;
  try{long when=ReminderTime.epoch(found.getString("local"),ZoneId.systemDefault());if(when>System.currentTimeMillis()){arm(c,old);return;}if(!prefs(c).edit().putString(PLAN,remaining.toString()).commit())return;post(c,id,found.getString("title"),found.getString("body"));}catch(JSONException|DateTimeException|IllegalArgumentException error){android.util.Log.w("MocReminder","Invalid reminder delivery");}
 }
 public static synchronized void test(Context c) {if(enabled(c))post(c,"moc-test","Mốc","✓");}
}
