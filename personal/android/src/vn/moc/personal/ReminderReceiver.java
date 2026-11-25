package vn.moc.personal;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
public final class ReminderReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context context, Intent intent) {
  if ("vn.moc.personal.REMIND".equals(intent.getAction())) ReminderStore.fire(context, intent.getStringExtra("id"));
  else ReminderStore.rearm(context);
 }
}
