package vn.moc.personal;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Locale;

/** Offline shell. The JavaScript bridge is restricted to the bundled local origin. */
@SuppressWarnings("deprecation")
public final class MainActivity extends Activity {
 private static final String HOST = "appassets.androidplatform.net";
 private static final int PICK_FILE = 10, SAVE_FILE = 11, AUDIO_PERMISSION = 12;
 private WebView web;
 private ValueCallback<Uri[]> fileCallback;
 private PermissionRequest microphoneRequest;
 private String documentText;
 private Uri cameraUri;
 private volatile boolean backCanExit = true;
 private String notificationEntry = "";

 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  notificationEntry = getIntent().getStringExtra("entryId");
  web = new WebView(this);
  WebSettings settings = web.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setDatabaseEnabled(true);
  settings.setAllowFileAccess(false);
  settings.setAllowContentAccess(true);
  settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  settings.setMediaPlaybackRequiresUserGesture(true);
  settings.setSupportMultipleWindows(false);
  web.addJavascriptInterface(new LocalBridge(), "MocNative");
  web.setWebViewClient(new WebViewClient() {
   @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
    Uri uri = request.getUrl();
    if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost())) return denied();
    String path = uri.getPath();
    if (path == null || path.equals("/")) path = "/index.html";
    if (path.contains("..") || path.contains("\\")) return denied();
    try {
     WebResourceResponse response = new WebResourceResponse(mime(path), "UTF-8", getAssets().open("web" + path));
     response.setResponseHeaders(Collections.singletonMap("Cache-Control", "no-cache"));
     return response;
    } catch (IOException error) { return denied(); }
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
    Uri uri = request.getUrl();
    if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
    if (("https".equals(uri.getScheme()) || "http".equals(uri.getScheme())) && request.isForMainFrame()) {
     try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
     catch (android.content.ActivityNotFoundException error) { message("Không thể mở liên kết / Cannot open link"); }
    }
    return true;
   }
  });
  web.setWebChromeClient(new WebChromeClient() {
   @Override public void onPermissionRequest(PermissionRequest request) {
    runOnUiThread(() -> {
     if (!request.getOrigin().toString().startsWith("https://" + HOST)) { request.deny(); return; }
     boolean audio = false;
     for (String resource : request.getResources()) if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) audio = true;
     if (!audio) { request.deny(); return; }
     if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
     else { if (microphoneRequest != null) microphoneRequest.deny(); microphoneRequest = request; requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION); }
    });
   }
   @Override public void onPermissionRequestCanceled(PermissionRequest request) { if (microphoneRequest == request) microphoneRequest = null; }
   @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
    if (fileCallback != null) fileCallback.onReceiveValue(null);
    fileCallback = callback;
    cameraUri = null;
    Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
    pick.addCategory(Intent.CATEGORY_OPENABLE);
    String[] accepted = params.getAcceptTypes();
    String type = accepted.length > 0 && accepted[0] != null && !accepted[0].isEmpty() ? accepted[0] : "*/*";
    if (type.startsWith("image/")) type = "image/*";
    pick.setType(type.startsWith(".") ? "*/*" : type);
    pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
    Intent chooser = Intent.createChooser(pick, "Mốc");
    if (type.startsWith("image/")) {
     Intent camera = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
     cameraUri = Uri.parse("content://vn.moc.personal.camera/camera.jpg");
     File old = new File(getCacheDir(), "camera.jpg");
     if (old.exists() && !old.delete()) { message("Không thể chuẩn bị ảnh / Cannot prepare photo"); }
     camera.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
     camera.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
     chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
    }
    try { startActivityForResult(chooser, PICK_FILE); }
    catch (android.content.ActivityNotFoundException error) { callback.onReceiveValue(null); fileCallback = null; }
    return true;
   }
  });
  setContentView(web);
  web.loadUrl("https://" + HOST + "/index.html");
 }
 private WebResourceResponse denied() { return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), new ByteArrayInputStream(new byte[0])); }
 private String mime(String path) {
  String lower = path.toLowerCase(Locale.ROOT);
  if (lower.endsWith(".html")) return "text/html";
  if (lower.endsWith(".js")) return "application/javascript";
  if (lower.endsWith(".css")) return "text/css";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".woff2")) return "font/woff2";
  if (lower.endsWith(".woff")) return "font/woff";
  return "application/json";
 }
 private void message(String text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }
 @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
  super.onRequestPermissionsResult(code, permissions, results);
  if (code == AUDIO_PERMISSION && microphoneRequest != null) {
   if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) microphoneRequest.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
   else microphoneRequest.deny();
   microphoneRequest = null;
  }
  if(code==13){ReminderStore.rearm(this);reminderStateChanged();}
 }
 @Override protected void onActivityResult(int code, int result, Intent data) {
  super.onActivityResult(code, result, data);
  if (code == PICK_FILE && fileCallback != null) {
   Uri[] chosen = null;
   if (result == RESULT_OK) {
    chosen = WebChromeClient.FileChooserParams.parseResult(result, data);
    if ((chosen == null || chosen.length == 0) && cameraUri != null && new File(getCacheDir(), "camera.jpg").length() > 0) chosen = new Uri[]{cameraUri};
   }
   fileCallback.onReceiveValue(chosen); fileCallback = null; cameraUri = null;
  }
  if (code == SAVE_FILE && documentText != null) {
   String content = documentText; documentText = null;
   if (result != RESULT_OK || data == null || data.getData() == null) return;
   Uri target = data.getData();
   new Thread(() -> {
    try (OutputStream output = getContentResolver().openOutputStream(target)) {
     if (output == null) throw new IOException("No document stream");
     output.write(content.getBytes(StandardCharsets.UTF_8));
     runOnUiThread(() -> message("Đã xuất file / File exported"));
    } catch (IOException error) { runOnUiThread(() -> message("Không thể xuất file / Export failed")); }
   }, "moc-document-export").start();
  }
 }
 private final class LocalBridge {
  @JavascriptInterface public boolean syncReminders(String json) { boolean result=ReminderStore.sync(MainActivity.this,json);reminderStateChanged();return result; }
  @JavascriptInterface public String reminderStatus() { return ReminderStore.status(MainActivity.this); }
  @JavascriptInterface public void setRemindersEnabled(boolean enabled) { runOnUiThread(()->{ReminderStore.enable(MainActivity.this,enabled);if(enabled&&Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},13);reminderStateChanged();}); }
  @JavascriptInterface public void testReminder() { ReminderStore.test(MainActivity.this); }
  @JavascriptInterface public void setBackCanExit(boolean value) { backCanExit=value; }
  @JavascriptInterface public String notificationTarget() { synchronized(MainActivity.this){String id=notificationEntry;notificationEntry="";return id==null?"":id;} }
  @JavascriptInterface public void saveText(String name, String content, String mime) {
   if (content == null || content.length() > 80000000 || name == null || !name.matches("[A-Za-z0-9._-]{1,150}") || !("application/json".equals(mime) || "text/plain".equals(mime))) return;
   runOnUiThread(() -> {
    if (documentText != null) return;
    documentText = content;
    Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType(mime); intent.putExtra(Intent.EXTRA_TITLE, name);
    try { startActivityForResult(intent, SAVE_FILE); }
    catch (android.content.ActivityNotFoundException error) { documentText = null; message("Không thể xuất file / Export unavailable"); }
   });
  }
  @JavascriptInterface public void vibrate() {
   runOnUiThread(() -> { Vibrator vibrator = (Vibrator)getSystemService(VIBRATOR_SERVICE); if (vibrator != null && vibrator.hasVibrator()) vibrator.vibrate(VibrationEffect.createOneShot(8, VibrationEffect.DEFAULT_AMPLITUDE)); });
  }
 }
 private void reminderStateChanged() { runOnUiThread(()->{if(web!=null&&!isFinishing())web.evaluateJavascript("window.dispatchEvent(new Event('moc-reminders'))",null);}); }
 @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent);setIntent(intent);synchronized(this){notificationEntry=intent.getStringExtra("entryId");}web.evaluateJavascript("window.dispatchEvent(new Event('moc-notification'))",null); }
 @Override public void onBackPressed() { if(backCanExit)finish();else web.evaluateJavascript("window.dispatchEvent(new Event('moc-back'))", null); }
 @Override protected void onPause() { super.onPause(); web.onPause(); }
 @Override protected void onResume() { super.onResume(); if (web != null) {web.onResume();ReminderStore.rearm(this);reminderStateChanged();} }
 @Override protected void onDestroy() { if (fileCallback != null) fileCallback.onReceiveValue(null); if (microphoneRequest != null) microphoneRequest.deny(); web.removeJavascriptInterface("MocNative"); web.destroy(); super.onDestroy(); }
}
