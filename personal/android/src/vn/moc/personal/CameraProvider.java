package vn.moc.personal;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;

/** Exposes one temporary camera output file, never arbitrary app storage. */
public final class CameraProvider extends ContentProvider {
 @Override public boolean onCreate() { return true; }
 private File photo(Uri uri) throws FileNotFoundException {
  if (!"/camera.jpg".equals(uri.getPath()) || getContext() == null) throw new FileNotFoundException();
  return new File(getContext().getCacheDir(), "camera.jpg");
 }
 @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
  int flags = "r".equals(mode) ? ParcelFileDescriptor.MODE_READ_ONLY : ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_CREATE | ParcelFileDescriptor.MODE_TRUNCATE;
  return ParcelFileDescriptor.open(photo(uri), flags);
 }
 @Override public String getType(Uri uri) { return "image/jpeg"; }
 @Override public Cursor query(Uri uri, String[] projection, String selection, String[] args, String sort) {
  MatrixCursor result = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
  try { result.addRow(new Object[]{"camera.jpg", photo(uri).length()}); } catch (FileNotFoundException error) { return result; }
  return result;
 }
 @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
 @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException(); }
 @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { throw new UnsupportedOperationException(); }
}
