package vn.moc.personal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
/** Device-local wall-clock semantics, also testable on the JVM. */
public final class ReminderTime {
 private ReminderTime() {}
 public static long epoch(String local, ZoneId zone) {
  if (local == null || !local.matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}")) throw new IllegalArgumentException("Invalid local time");
  LocalDateTime parsed = LocalDateTime.parse(local, DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm").withResolverStyle(ResolverStyle.STRICT));
  if (zone.getRules().getValidOffsets(parsed).isEmpty()) throw new IllegalArgumentException("Nonexistent local time");
  return parsed.atZone(zone).toInstant().toEpochMilli();
 }
}
