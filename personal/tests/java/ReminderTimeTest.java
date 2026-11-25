import vn.moc.personal.ReminderTime;
import java.time.ZoneId;
import java.time.Instant;
public class ReminderTimeTest {
 private static void reject(String value,String zone){try{ReminderTime.epoch(value,ZoneId.of(zone));throw new AssertionError("Accepted invalid time: "+value);}catch(IllegalArgumentException|java.time.DateTimeException expected){}}
 public static void main(String[] args){
  long expected=Instant.parse("2026-11-26T02:30:00Z").toEpochMilli();
  if(ReminderTime.epoch("2026-11-26T09:30",ZoneId.of("Asia/Ho_Chi_Minh"))!=expected)throw new AssertionError("Vietnam zone");
  reject("2026-02-30T09:00","UTC");reject("2026-11-26T25:00","UTC");reject("2026-11-26","UTC");reject("2026-03-08T02:30","America/New_York");
  if(ReminderTime.epoch("2026-11-01T01:30",ZoneId.of("America/New_York"))!=Instant.parse("2026-11-01T05:30:00Z").toEpochMilli())throw new AssertionError("DST overlap");
  System.out.println("PASS: 6 native reminder time cases (JVM; not Android alarm delivery)");
 }
}
