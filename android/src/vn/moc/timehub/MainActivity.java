package vn.moc.timehub;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int REQ_FILE_CHOOSER = 1001;
    private static final int REQ_NOTIF_PERM = 1002;
    private static final String CHANNEL_ID = "moc_time_alerts";

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private int notifSeq = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setupNotificationChannel();
        requestNotificationPermissionIfNeeded();

        applySystemBars("#FFEBD9", false);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#FFEBD9"));
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setTextZoom(100);

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidHost");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return false;
                String scheme = uri.getScheme();
                if ("file".equalsIgnoreCase(scheme)) {
                    return false;
                }
                if ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme)
                        || "mailto".equalsIgnoreCase(scheme) || "tel".equalsIgnoreCase(scheme)) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                    } catch (Exception ignored) {
                    }
                    return true;
                }
                return false;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> filePathCb,
                    FileChooserParams fileChooserParams) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = filePathCb;
                try {
                    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("*/*");
                    if (fileChooserParams != null && fileChooserParams.getAcceptTypes() != null) {
                        String[] types = fileChooserParams.getAcceptTypes();
                        if (types.length > 0 && types[0] != null && !types[0].isEmpty()) {
                            intent.setType(types[0].contains("json") ? "*/*" : types[0]);
                        }
                    }
                    startActivityForResult(Intent.createChooser(intent, "Chọn tệp"), REQ_FILE_CHOOSER);
                    return true;
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE_CHOOSER) {
            if (filePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
                    results = new Uri[]{data.getData()};
                }
                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript("window.__mocBack ? window.__mocBack() : false", value -> {
                if (!"true".equals(value)) {
                    MainActivity.super.onBackPressed();
                }
            });
        } else {
            super.onBackPressed();
        }
    }

    private void applySystemBars(String hexColor, boolean isDark) {
        try {
            int color = Color.parseColor(hexColor);
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(color);
            window.setNavigationBarColor(color);

            View decor = window.getDecorView();
            int flags = decor.getSystemUiVisibility();
            if (!isDark) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            } else {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
            }
            decor.setSystemUiVisibility(flags);
        } catch (Exception ignored) {
        }
    }

    private void setupNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Mốc – Hẹn giờ & Đếm ngược",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.enableVibration(true);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33) {
            String perm = "android.permission.POST_NOTIFICATIONS";
            if (checkSelfPermission(perm) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{perm}, REQ_NOTIF_PERM);
            }
        }
    }

    private void postSystemNotification(String title, String body) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getActivity(this, 0, intent, pFlags);

            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new Notification.Builder(this, CHANNEL_ID)
                    : new Notification.Builder(this);

            builder.setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title == null || title.isEmpty() ? "Mốc" : title)
                    .setContentText(body == null || body.isEmpty() ? "Đã đến mốc thời gian bạn đặt!" : body)
                    .setAutoCancel(true)
                    .setContentIntent(pi);

            nm.notify(notifSeq++, builder.build());
        } catch (Exception ignored) {
        }
    }

    public final class AndroidBridge {
        @JavascriptInterface
        public void postMessage(String rawJson) {
            try {
                JSONObject obj = new JSONObject(rawJson);
                String type = obj.optString("type", "");
                if ("theme".equals(type)) {
                    final String bg = obj.optString("bg", "#FFEBD9");
                    final boolean dark = obj.optBoolean("dark", false);
                    runOnUiThread(() -> {
                        applySystemBars(bg, dark);
                        if (webView != null) {
                            try {
                                webView.setBackgroundColor(Color.parseColor(bg));
                            } catch (Exception ignored) {
                            }
                        }
                    });
                } else if ("notify".equals(type)) {
                    final String title = obj.optString("title", "Mốc");
                    final String body = obj.optString("body", "");
                    runOnUiThread(() -> postSystemNotification(title, body));
                }
            } catch (Exception ignored) {
            }
        }

        @JavascriptInterface
        public void haptic(int ms) {
            runOnUiThread(() -> {
                try {
                    if (webView != null) {
                        webView.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                    }
                    if (ms >= 40) {
                        Vibrator vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                        if (vib != null && vib.hasVibrator()) {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                vib.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
                            } else {
                                vib.vibrate(ms);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            });
        }

        @JavascriptInterface
        public void saveFile(String fileName, String mimeType, String content) {
            runOnUiThread(() -> {
                try {
                    byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
                    String safeMime = (mimeType == null || mimeType.isEmpty()) ? "application/octet-stream" : mimeType.split(";")[0];

                    if (Build.VERSION.SDK_INT >= 29) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                        values.put(MediaStore.Downloads.MIME_TYPE, safeMime);
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                        if (uri != null) {
                            try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                                if (os != null) os.write(bytes);
                            }
                            Toast.makeText(MainActivity.this, "Đã lưu vào thư mục Download: " + fileName, Toast.LENGTH_LONG).show();
                            return;
                        }
                    }

                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir != null) {
                        if (!dir.exists()) dir.mkdirs();
                        File outFile = new File(dir, fileName);
                        try (FileOutputStream fos = new FileOutputStream(outFile)) {
                            fos.write(bytes);
                        }
                        Toast.makeText(MainActivity.this, "Đã lưu tệp: " + outFile.getAbsolutePath(), Toast.LENGTH_LONG).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Không thể lưu tệp: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
