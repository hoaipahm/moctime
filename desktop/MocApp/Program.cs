using System.Diagnostics;
using System.Drawing.Drawing2D;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

namespace MocApp;

internal static class Program
{
    public const string AppId = "MocTimeHub";
    public const string AppDisplayName = "Mốc – Trung tâm thời gian";
    public const string AppVersion = "2.1.0";
    public const string ShowEventName = @"Local\MocTimeHub_ActivateWindow";
    public const string MutexName = @"Local\MocTimeHub_InstanceMutex";

    public static string DataRoot =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), AppId);

    public static string InstallDir =>
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Moc");

    public static string InstalledExePath => Path.Combine(InstallDir, "Moc.exe");

    [STAThread]
    private static void Main(string[] args)
    {
        if (args.Length >= 2 && args[0] == "--test-shortcut")
        {
            string lnk = Path.Combine(args[1], "Mốc.lnk");
            InstallerOps.CreateShortcut(lnk, Environment.ProcessPath ?? Application.ExecutablePath, AppDisplayName);
            Console.WriteLine("SHORTCUT_OK:" + new FileInfo(lnk).Length);
            return;
        }

        ApplicationConfiguration.Initialize();

        string exePath = Environment.ProcessPath ?? Application.ExecutablePath;
        string exeName = Path.GetFileNameWithoutExtension(exePath);

        bool isUninstall = args.Any(a => a.Equals("--uninstall", StringComparison.OrdinalIgnoreCase));
        bool isInstall = !isUninstall && (
            args.Any(a => a.Equals("--install", StringComparison.OrdinalIgnoreCase)) ||
            exeName.Contains("Setup", StringComparison.OrdinalIgnoreCase) ||
            exeName.Contains("Install", StringComparison.OrdinalIgnoreCase));
        bool startMinimized = args.Any(a => a.Equals("--minimized", StringComparison.OrdinalIgnoreCase));

        if (isUninstall)
        {
            InstallerOps.RunUninstaller(exePath);
            return;
        }

        if (isInstall)
        {
            Application.Run(new InstallerForm(exePath));
            return;
        }

        using var mutex = new Mutex(true, MutexName, out bool createdNew);
        if (!createdNew)
        {
            try
            {
                using var evt = EventWaitHandle.OpenExisting(ShowEventName);
                evt.Set();
            }
            catch { }
            return;
        }

        Application.Run(new MainForm(startMinimized));
    }

    public static Icon LoadEmbeddedIcon()
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("moc.ico");
        if (stream != null)
            return new Icon(stream);
        return SystemIcons.Application;
    }

    public static byte[] ReadEmbeddedBytes(string logicalName)
    {
        using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(logicalName)
            ?? throw new InvalidOperationException($"Missing embedded resource: {logicalName}");
        using var ms = new MemoryStream();
        stream.CopyTo(ms);
        return ms.ToArray();
    }
}

internal sealed class AppSettings
{
    public int Width { get; set; } = 1240;
    public int Height { get; set; } = 820;
    public int? Left { get; set; }
    public int? Top { get; set; }
    public bool Maximized { get; set; }
    public bool AlwaysOnTop { get; set; }
    public bool KeepInTrayOnClose { get; set; } = false;
    public bool ShownTrayHint { get; set; }
    public string LastBg { get; set; } = "#FFEBD9";
    public bool LastDark { get; set; }

    private static string SettingsPath => Path.Combine(Program.DataRoot, "window-settings.json");

    public static AppSettings Load()
    {
        try
        {
            if (File.Exists(SettingsPath))
                return JsonSerializer.Deserialize<AppSettings>(File.ReadAllText(SettingsPath)) ?? new AppSettings();
        }
        catch { }
        return new AppSettings();
    }

    public void Save()
    {
        try
        {
            Directory.CreateDirectory(Program.DataRoot);
            File.WriteAllText(SettingsPath, JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true }));
        }
        catch { }
    }
}

internal static class NativeDwm
{
    private const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20;
    private const int DWMWA_CAPTION_COLOR = 35;
    public const int SW_RESTORE = 9;
    public const int SW_MAXIMIZE = 3;

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    public static void ApplyWindowChrome(IntPtr hwnd, string hexBg, bool dark)
    {
        if (hwnd == IntPtr.Zero) return;
        try
        {
            int useDark = dark ? 1 : 0;
            _ = DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, ref useDark, sizeof(int));

            Color c = ColorTranslator.FromHtml(hexBg);
            int colorRef = c.R | (c.G << 8) | (c.B << 16);
            _ = DwmSetWindowAttribute(hwnd, DWMWA_CAPTION_COLOR, ref colorRef, sizeof(int));
        }
        catch { }
    }
}

internal sealed class MainForm : Form
{
    private readonly WebView2 _webView;
    private readonly NotifyIcon _tray;
    private readonly AppSettings _settings;
    private readonly Icon _appIcon;
    private readonly EventWaitHandle _activateEvent;
    private bool _reallyExit;
    private bool _timerActive;
    private bool _isFullScreen;
    private FormWindowState _prevWindowState;
    private FormBorderStyle _prevBorderStyle;
    private Rectangle _prevBounds;

    private string Mp3CachePath => Path.Combine(Program.DataRoot, "custom-alert.json");

    public MainForm(bool startMinimized)
    {
        _settings = AppSettings.Load();
        _appIcon = Program.LoadEmbeddedIcon();

        Text = Program.AppDisplayName;
        Icon = _appIcon;
        ShowInTaskbar = true;
        MinimumSize = new Size(420, 560);
        BackColor = ParseColor(_settings.LastBg, Color.FromArgb(255, 235, 217));
        TopMost = _settings.AlwaysOnTop;

        ApplySavedBounds();

        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = BackColor
        };
        Controls.Add(_webView);

        _tray = BuildTrayIcon();

        _activateEvent = new EventWaitHandle(false, EventResetMode.AutoReset, Program.ShowEventName);
        ThreadPool.RegisterWaitForSingleObject(_activateEvent, (_, _) =>
        {
            if (!IsDisposed)
                BeginInvoke(RestoreFromTray);
        }, null, -1, false);

        Shown += async (_, _) =>
        {
            NativeDwm.ApplyWindowChrome(Handle, _settings.LastBg, _settings.LastDark);
            await InitWebViewAsync();
            if (startMinimized)
            {
                Hide();
            }
        };

        FormClosing += OnMainFormClosing;
    }

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        NativeDwm.ApplyWindowChrome(Handle, _settings.LastBg, _settings.LastDark);
    }

    private void ApplySavedBounds()
    {
        Size = new Size(Math.Max(420, _settings.Width), Math.Max(560, _settings.Height));
        if (_settings.Left.HasValue && _settings.Top.HasValue)
        {
            var candidate = new Rectangle(_settings.Left.Value, _settings.Top.Value, Width, Height);
            bool visible = Screen.AllScreens.Any(s => s.WorkingArea.IntersectsWith(candidate));
            if (visible)
            {
                StartPosition = FormStartPosition.Manual;
                Location = new Point(_settings.Left.Value, _settings.Top.Value);
            }
            else
            {
                StartPosition = FormStartPosition.CenterScreen;
            }
        }
        else
        {
            StartPosition = FormStartPosition.CenterScreen;
        }

        if (_settings.Maximized)
            WindowState = FormWindowState.Maximized;
    }

    private NotifyIcon BuildTrayIcon()
    {
        var menu = new ContextMenuStrip();

        var openItem = new ToolStripMenuItem("Mở Mốc", null, (_, _) => RestoreFromTray())
        {
            Font = new Font(SystemFonts.MenuFont ?? Font, FontStyle.Bold)
        };
        menu.Items.Add(openItem);
        menu.Items.Add(new ToolStripSeparator());

        menu.Items.Add(new ToolStripMenuItem("Hôm nay", null, (_, _) => NavigateTab("today")));
        menu.Items.Add(new ToolStripMenuItem("Hồ sơ cá nhân", null, (_, _) => NavigateTab("me")));
        menu.Items.Add(new ToolStripMenuItem("Hẹn giờ tập trung", null, (_, _) => NavigateTab("tm")));
        menu.Items.Add(new ToolStripMenuItem("Đếm ngược", null, (_, _) => NavigateTab("cd")));
        menu.Items.Add(new ToolStripMenuItem("Lịch âm – dương", null, (_, _) => NavigateTab("cal")));
        menu.Items.Add(new ToolStripSeparator());

        var topItem = new ToolStripMenuItem("Luôn nổi trên cùng (Always on Top)")
        {
            Checked = _settings.AlwaysOnTop,
            CheckOnClick = true
        };
        topItem.CheckedChanged += (_, _) =>
        {
            TopMost = topItem.Checked;
            _settings.AlwaysOnTop = topItem.Checked;
            _settings.Save();
        };
        menu.Items.Add(topItem);

        var closeTrayItem = new ToolStripMenuItem("Chạy ngầm dưới khay hệ thống khi bấm Đóng (X)")
        {
            Checked = _settings.KeepInTrayOnClose,
            CheckOnClick = true
        };
        closeTrayItem.CheckedChanged += (_, _) =>
        {
            _settings.KeepInTrayOnClose = closeTrayItem.Checked;
            _settings.Save();
        };
        menu.Items.Add(closeTrayItem);

        var autoStartItem = new ToolStripMenuItem("Khởi động cùng Windows")
        {
            Checked = InstallerOps.IsAutoStartEnabled(),
            CheckOnClick = true
        };
        autoStartItem.CheckedChanged += (_, _) =>
        {
            string targetExe = File.Exists(Program.InstalledExePath)
                ? Program.InstalledExePath
                : (Environment.ProcessPath ?? Application.ExecutablePath);
            InstallerOps.SetAutoStart(autoStartItem.Checked, targetExe);
        };
        menu.Items.Add(autoStartItem);

        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(new ToolStripMenuItem("Thoát hẳn Mốc", null, (_, _) => ExitApplication()));

        var tray = new NotifyIcon
        {
            Icon = _appIcon,
            Text = Program.AppDisplayName,
            ContextMenuStrip = menu,
            Visible = true
        };
        tray.MouseClick += (_, e) =>
        {
            if (e.Button == MouseButtons.Left)
                RestoreFromTray();
        };
        tray.BalloonTipClicked += (_, _) => RestoreFromTray();
        return tray;
    }

    private async Task InitWebViewAsync()
    {
        try
        {
            string appAssetsDir = PrepareEmbeddedWebAssets();
            string userDataDir = Path.Combine(Program.DataRoot, "WebView2Data");
            Directory.CreateDirectory(userDataDir);

            var env = await CoreWebView2Environment.CreateAsync(null, userDataDir);
            await _webView.EnsureCoreWebView2Async(env);

            var core = _webView.CoreWebView2;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.AreBrowserAcceleratorKeysEnabled = true;
            core.Settings.AreDefaultContextMenusEnabled = true;
            core.Settings.IsZoomControlEnabled = true;

            core.SetVirtualHostNameToFolderMapping(
                "moc.app",
                appAssetsDir,
                CoreWebView2HostResourceAccessKind.Allow);

            core.DocumentTitleChanged += (_, _) =>
            {
                string t = core.DocumentTitle;
                if (!string.IsNullOrWhiteSpace(t))
                    Text = t;
            };

            core.NewWindowRequested += (_, e) =>
            {
                e.Handled = true;
                OpenExternalUrl(e.Uri);
            };

            core.NavigationStarting += (_, e) =>
            {
                if (!e.Uri.StartsWith("https://moc.app", StringComparison.OrdinalIgnoreCase))
                {
                    e.Cancel = true;
                    OpenExternalUrl(e.Uri);
                }
            };

            core.WebMessageReceived += OnWebMessageReceived;

            core.NavigationCompleted += async (_, _) =>
            {
                if (File.Exists(Mp3CachePath))
                {
                    try
                    {
                        string json = await File.ReadAllTextAsync(Mp3CachePath);
                        await core.ExecuteScriptAsync($"window.__mocLoadMp3 && window.__mocLoadMp3({json});");
                    }
                    catch { }
                }
            };

            _webView.KeyDown += (_, e) =>
            {
                if (e.KeyCode == Keys.F11)
                {
                    ToggleFullScreen();
                    e.Handled = true;
                }
            };

            core.Navigate("https://moc.app/index.html");
        }
        catch (WebView2RuntimeNotFoundException)
        {
            var res = MessageBox.Show(
                "Máy tính của bạn chưa cài đặt Microsoft Edge WebView2 Runtime.\nBạn có muốn mở trang tải chính thức của Microsoft ngay bây giờ không?",
                Program.AppDisplayName,
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning);
            if (res == DialogResult.Yes)
                OpenExternalUrl("https://go.microsoft.com/fwlink/p/?LinkId=2124703");
            ExitApplication();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "Không thể khởi tạo giao diện ứng dụng:\n" + ex.Message,
                Program.AppDisplayName,
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }

    private static string PrepareEmbeddedWebAssets()
    {
        string assetsDir = Path.Combine(Program.DataRoot, "app");
        Directory.CreateDirectory(assetsDir);

        foreach (string name in new[] { "index.html", "icon.svg", "manifest.webmanifest" })
        {
            byte[] data = Program.ReadEmbeddedBytes(name);
            string target = Path.Combine(assetsDir, name);
            bool write = true;
            if (File.Exists(target))
            {
                byte[] existing = File.ReadAllBytes(target);
                if (CryptographicOperations.FixedTimeEquals(
                    SHA256.HashData(data),
                    SHA256.HashData(existing)))
                {
                    write = false;
                }
            }
            if (write)
                File.WriteAllBytes(target, data);
        }
        return assetsDir;
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            string raw = e.TryGetWebMessageAsString();
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            string type = root.GetProperty("type").GetString() ?? "";

            switch (type)
            {
                case "theme":
                {
                    string bg = root.GetProperty("bg").GetString() ?? "#FFEBD9";
                    bool dark = root.GetProperty("dark").GetBoolean();
                    _settings.LastBg = bg;
                    _settings.LastDark = dark;
                    _settings.Save();

                    Color c = ParseColor(bg, BackColor);
                    BackColor = c;
                    _webView.DefaultBackgroundColor = c;
                    NativeDwm.ApplyWindowChrome(Handle, bg, dark);
                    break;
                }
                case "notify":
                {
                    string title = root.GetProperty("title").GetString() ?? Program.AppDisplayName;
                    string body = root.TryGetProperty("body", out var b) ? (b.GetString() ?? "") : "";
                    _tray.ShowBalloonTip(
                        5000,
                        title,
                        string.IsNullOrWhiteSpace(body) ? "Đã đến mốc thời gian bạn đặt!" : body,
                        ToolTipIcon.Info);
                    break;
                }
                case "saveMp3":
                {
                    string name = root.GetProperty("name").GetString() ?? "alert.mp3";
                    string data = root.GetProperty("data").GetString() ?? "";
                    Directory.CreateDirectory(Program.DataRoot);
                    File.WriteAllText(Mp3CachePath, JsonSerializer.Serialize(new { name, data }));
                    break;
                }
                case "clearMp3":
                {
                    if (File.Exists(Mp3CachePath))
                        File.Delete(Mp3CachePath);
                    break;
                }
                case "timer":
                {
                    _timerActive = root.TryGetProperty("active", out var a) && a.GetBoolean();
                    break;
                }
            }
        }
        catch { }
    }

    private void NavigateTab(string tabId)
    {
        RestoreFromTray();
        if (_webView.CoreWebView2 != null)
            _ = _webView.CoreWebView2.ExecuteScriptAsync($"window.__mocGo && window.__mocGo('{tabId}');");
    }

    private void RestoreFromTray()
    {
        if (!Visible)
            Show();
        if (WindowState == FormWindowState.Minimized)
        {
            NativeDwm.ShowWindow(Handle, _settings.Maximized ? NativeDwm.SW_MAXIMIZE : NativeDwm.SW_RESTORE);
            WindowState = _settings.Maximized ? FormWindowState.Maximized : FormWindowState.Normal;
        }
        NativeDwm.SetForegroundWindow(Handle);
        Activate();
        BringToFront();
        _webView.Focus();
    }

    private void ToggleFullScreen()
    {
        if (!_isFullScreen)
        {
            _prevWindowState = WindowState;
            _prevBorderStyle = FormBorderStyle;
            _prevBounds = Bounds;
            FormBorderStyle = FormBorderStyle.None;
            WindowState = FormWindowState.Normal;
            Bounds = Screen.FromControl(this).Bounds;
            _isFullScreen = true;
        }
        else
        {
            FormBorderStyle = _prevBorderStyle;
            WindowState = _prevWindowState;
            if (_prevWindowState == FormWindowState.Normal)
                Bounds = _prevBounds;
            _isFullScreen = false;
        }
    }

    private void SaveWindowBounds()
    {
        if (_isFullScreen) return;
        _settings.Maximized = WindowState == FormWindowState.Maximized;
        Rectangle b = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
        if (b.Width >= 420 && b.Height >= 560)
        {
            _settings.Width = b.Width;
            _settings.Height = b.Height;
            _settings.Left = b.Left;
            _settings.Top = b.Top;
        }
        _settings.Save();
    }

    private void OnMainFormClosing(object? sender, FormClosingEventArgs e)
    {
        SaveWindowBounds();

        if (!_reallyExit && e.CloseReason == CloseReason.UserClosing && (_settings.KeepInTrayOnClose || _timerActive))
        {
            e.Cancel = true;
            Hide();

            if (!_settings.ShownTrayHint)
            {
                _settings.ShownTrayHint = true;
                _settings.Save();
                _tray.ShowBalloonTip(
                    4000,
                    "Mốc đang chạy dưới khay hệ thống",
                    "Hẹn giờ vẫn tiếp tục đếm ngầm. Nhấn vào biểu tượng Mốc dưới góc phải màn hình để mở lại hoặc thoát hẳn.",
                    ToolTipIcon.Info);
            }
            return;
        }

        _tray.Visible = false;
        _tray.Dispose();
    }

    private void ExitApplication()
    {
        _reallyExit = true;
        SaveWindowBounds();
        _tray.Visible = false;
        Application.Exit();
    }

    private static void OpenExternalUrl(string uri)
    {
        try
        {
            if (uri.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                uri.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
                uri.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase))
            {
                Process.Start(new ProcessStartInfo(uri) { UseShellExecute = true });
            }
        }
        catch { }
    }

    private static Color ParseColor(string hex, Color fallback)
    {
        try { return ColorTranslator.FromHtml(hex); }
        catch { return fallback; }
    }
}

[ComImport]
[Guid("00021401-0000-0000-C000-000000000046")]
internal class ShellLinkCoClass { }

[ComImport]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
[Guid("000214F9-0000-0000-C000-000000000046")]
internal interface IShellLinkW
{
    void GetPath([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszFile, int cchMaxPath, IntPtr pfd, int fFlags);
    void GetIDList(out IntPtr ppidl);
    void SetIDList(IntPtr pidl);
    void GetDescription([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszName, int cchMaxName);
    void SetDescription([MarshalAs(UnmanagedType.LPWStr)] string pszName);
    void GetWorkingDirectory([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszDir, int cchMaxPath);
    void SetWorkingDirectory([MarshalAs(UnmanagedType.LPWStr)] string pszDir);
    void GetArguments([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszArgs, int cchMaxPath);
    void SetArguments([MarshalAs(UnmanagedType.LPWStr)] string pszArgs);
    void GetHotkey(out short pwHotkey);
    void SetHotkey(short wHotkey);
    void GetShowCmd(out int piShowCmd);
    void SetShowCmd(int iShowCmd);
    void GetIconLocation([Out, MarshalAs(UnmanagedType.LPWStr)] StringBuilder pszIconPath, int cchIconPath, out int piIcon);
    void SetIconLocation([MarshalAs(UnmanagedType.LPWStr)] string pszIconPath, int iIcon);
    void SetRelativePath([MarshalAs(UnmanagedType.LPWStr)] string pszPathRel, int dwReserved);
    void Resolve(IntPtr hwnd, int fFlags);
    void SetPath([MarshalAs(UnmanagedType.LPWStr)] string pszFile);
}

internal static class InstallerOps
{
    private const string RunRegKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string UninstallRegKey = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\MocTimeHub";

    public static bool IsAutoStartEnabled()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(RunRegKey, false);
            return key?.GetValue(Program.AppId) is string s && !string.IsNullOrWhiteSpace(s);
        }
        catch { return false; }
    }

    public static void SetAutoStart(bool enable, string exePath)
    {
        try
        {
            using var key = Registry.CurrentUser.CreateSubKey(RunRegKey);
            if (enable)
                key.SetValue(Program.AppId, $"\"{exePath}\" --minimized");
            else
                key.DeleteValue(Program.AppId, false);
        }
        catch { }
    }

    public static void StopRunningInstances()
    {
        foreach (string procName in new[] { "Moc", "Mốc" })
        {
            foreach (var p in Process.GetProcessesByName(procName))
            {
                if (p.Id != Environment.ProcessId)
                {
                    try { p.Kill(); p.WaitForExit(2500); } catch { }
                }
            }
        }
    }

    public static void CreateShortcut(string lnkPath, string targetPath, string description)
    {
        string? dir = Path.GetDirectoryName(lnkPath);
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);

        var link = (IShellLinkW)new ShellLinkCoClass();
        try
        {
            link.SetPath(targetPath);
            link.SetWorkingDirectory(Path.GetDirectoryName(targetPath) ?? "");
            link.SetDescription(description);
            link.SetIconLocation(targetPath, 0);
            ((IPersistFile)link).Save(lnkPath, false);
        }
        finally
        {
            Marshal.FinalReleaseComObject(link);
        }
    }

    public static void RegisterUninstaller(string installedExe)
    {
        using var key = Registry.CurrentUser.CreateSubKey(UninstallRegKey);
        key.SetValue("DisplayName", Program.AppDisplayName);
        key.SetValue("DisplayVersion", Program.AppVersion);
        key.SetValue("Publisher", "Mốc Personal Hub");
        key.SetValue("DisplayIcon", $"{installedExe},0");
        key.SetValue("InstallLocation", Path.GetDirectoryName(installedExe)!);
        key.SetValue("UninstallString", $"\"{installedExe}\" --uninstall");
        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
        long sizeKb = new FileInfo(installedExe).Length / 1024;
        key.SetValue("EstimatedSize", (int)sizeKb, RegistryValueKind.DWord);
    }

    public static void RunUninstaller(string currentExe)
    {
        var confirm = MessageBox.Show(
            "Bạn có chắc chắn muốn gỡ cài đặt ứng dụng Mốc khỏi máy tính Windows không?\n\n(Dữ liệu ghi chú & đếm ngược cá nhân của bạn sẽ được giữ an toàn nếu bạn không chọn xóa.)",
            "Gỡ cài đặt Mốc",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Question);
        if (confirm != DialogResult.Yes) return;

        var removeData = MessageBox.Show(
            "Bạn có muốn xóa luôn dữ liệu cá nhân (ghi chú, đếm ngược, thói quen) đã lưu trên máy này không?",
            "Dữ liệu cá nhân Mốc",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Question);

        StopRunningInstances();
        SetAutoStart(false, "");
        try { Registry.CurrentUser.DeleteSubKeyTree(UninstallRegKey, false); } catch { }

        string desktopLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "Mốc.lnk");
        string startLnk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "Mốc.lnk");
        try { if (File.Exists(desktopLnk)) File.Delete(desktopLnk); } catch { }
        try { if (File.Exists(startLnk)) File.Delete(startLnk); } catch { }

        if (removeData == DialogResult.Yes)
        {
            try { if (Directory.Exists(Program.DataRoot)) Directory.Delete(Program.DataRoot, true); } catch { }
        }

        string installDir = Program.InstallDir;
        if (Directory.Exists(installDir))
        {
            Process.Start(new ProcessStartInfo("cmd.exe", $"/C ping 127.0.0.1 -n 3 > nul & rmdir /s /q \"{installDir}\"")
            {
                CreateNoWindow = true,
                UseShellExecute = false
            });
        }

        MessageBox.Show("Đã gỡ cài đặt Mốc hoàn tất.", "Gỡ cài đặt Mốc", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
}

internal sealed class InstallerForm : Form
{
    private readonly string _sourceExe;
    private readonly CheckBox _chkDesktop;
    private readonly CheckBox _chkStartMenu;
    private readonly CheckBox _chkAutoStart;
    private readonly CheckBox _chkLaunch;
    private readonly Button _btnInstall;
    private readonly Label _lblStatus;

    public InstallerForm(string sourceExe)
    {
        _sourceExe = sourceExe;
        AutoScaleDimensions = new SizeF(96F, 96F);
        AutoScaleMode = AutoScaleMode.Dpi;
        Icon = Program.LoadEmbeddedIcon();
        Text = "Cài đặt Mốc – Trung tâm thời gian cho Windows";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        AutoSize = true;
        AutoSizeMode = AutoSizeMode.GrowAndShrink;
        Padding = new Padding(22, 20, 26, 26);
        BackColor = Color.FromArgb(255, 235, 217); // #FFEBD9 Coral Cream
        Font = new Font("Segoe UI", 9.75F, FontStyle.Regular);

        NativeDwm.ApplyWindowChrome(Handle, "#FFEBD9", false);

        var card = new TableLayoutPanel
        {
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            ColumnCount = 1,
            BackColor = Color.FromArgb(255, 244, 232), // #FFF4E8
            Padding = new Padding(24, 20, 24, 22),
            MinimumSize = new Size(490, 0)
        };
        card.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));
        card.Paint += (_, e) =>
        {
            using var pen = new Pen(Color.FromArgb(22, 22, 22), 3);
            e.Graphics.DrawRectangle(pen, 1, 1, card.Width - 3, card.Height - 3);
        };

        // Header row (Icon + Title + Subtitle)
        var header = new TableLayoutPanel
        {
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            ColumnCount = 2,
            Dock = DockStyle.Fill,
            Margin = new Padding(0, 0, 0, 12)
        };
        header.ColumnStyles.Add(new ColumnStyle(SizeType.AutoSize));
        header.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100F));

        var pic = new PictureBox
        {
            Size = new Size(60, 60),
            SizeMode = PictureBoxSizeMode.Zoom,
            Image = new Icon(Program.LoadEmbeddedIcon(), new Size(64, 64)).ToBitmap(),
            Margin = new Padding(0, 2, 14, 0)
        };
        header.Controls.Add(pic, 0, 0);

        var titleStack = new FlowLayoutPanel
        {
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            FlowDirection = FlowDirection.TopDown,
            WrapContents = false,
            Dock = DockStyle.Fill,
            Margin = new Padding(0)
        };
        titleStack.Controls.Add(new Label
        {
            Text = "Mốc – Trung tâm thời gian",
            Font = new Font("Segoe UI", 15.5F, FontStyle.Bold),
            ForeColor = Color.FromArgb(22, 22, 22),
            AutoSize = true,
            Margin = new Padding(0, 0, 0, 4)
        });
        titleStack.Controls.Add(new Label
        {
            Text = "Ứng dụng Windows Desktop 2.1 · Chạy offline · Nhắc hẹn giờ khay hệ thống",
            Font = new Font("Segoe UI", 9.2F, FontStyle.Regular),
            ForeColor = Color.FromArgb(65, 55, 50),
            AutoSize = true,
            MaximumSize = new Size(400, 0),
            Margin = new Padding(0)
        });
        header.Controls.Add(titleStack, 1, 0);
        card.Controls.Add(header);

        card.Controls.Add(new Label
        {
            Text = "Thư mục cài đặt: " + Program.InstallDir,
            Font = new Font("Segoe UI", 8.8F, FontStyle.Regular),
            ForeColor = Color.FromArgb(85, 75, 70),
            AutoSize = true,
            MaximumSize = new Size(470, 0),
            Margin = new Padding(2, 0, 0, 12)
        });

        _chkDesktop = MakeCheck("Tạo biểu tượng Mốc ngoài Màn hình chính (Desktop)", true);
        _chkStartMenu = MakeCheck("Thêm vào Start Menu & danh sách Ứng dụng Windows", true);
        _chkAutoStart = MakeCheck("Khởi động ẩn cùng Windows để nhắc đếm ngược", false);
        _chkLaunch = MakeCheck("Mở ứng dụng Mốc ngay sau khi cài đặt xong", true);

        card.Controls.Add(_chkDesktop);
        card.Controls.Add(_chkStartMenu);
        card.Controls.Add(_chkAutoStart);
        card.Controls.Add(_chkLaunch);

        _lblStatus = new Label
        {
            Text = "Không cần quyền Quản trị viên (Admin). Cài đặt chỉ mất 2 giây.",
            Font = new Font("Segoe UI", 9F, FontStyle.Italic),
            ForeColor = Color.FromArgb(70, 60, 55),
            AutoSize = true,
            Margin = new Padding(2, 10, 0, 14)
        };
        card.Controls.Add(_lblStatus);

        var btnRow = new FlowLayoutPanel
        {
            AutoSize = true,
            AutoSizeMode = AutoSizeMode.GrowAndShrink,
            FlowDirection = FlowDirection.LeftToRight,
            WrapContents = false,
            Margin = new Padding(0)
        };

        _btnInstall = new Button
        {
            Text = "Cài đặt Mốc vào máy tính",
            Font = new Font("Segoe UI", 10.5F, FontStyle.Bold),
            BackColor = Color.FromArgb(243, 168, 38), // #F3A826
            ForeColor = Color.FromArgb(22, 22, 22),
            FlatStyle = FlatStyle.Flat,
            AutoSize = true,
            MinimumSize = new Size(270, 44),
            Padding = new Padding(14, 6, 14, 6),
            Margin = new Padding(0, 0, 12, 0),
            Cursor = Cursors.Hand
        };
        _btnInstall.FlatAppearance.BorderColor = Color.FromArgb(22, 22, 22);
        _btnInstall.FlatAppearance.BorderSize = 2;
        _btnInstall.Click += (_, _) => RunInstall();
        btnRow.Controls.Add(_btnInstall);

        var btnCancel = new Button
        {
            Text = "Đóng",
            Font = new Font("Segoe UI", 10F, FontStyle.Bold),
            BackColor = Color.White,
            ForeColor = Color.FromArgb(22, 22, 22),
            FlatStyle = FlatStyle.Flat,
            AutoSize = true,
            MinimumSize = new Size(120, 44),
            Padding = new Padding(14, 6, 14, 6),
            Margin = new Padding(0),
            Cursor = Cursors.Hand
        };
        btnCancel.FlatAppearance.BorderColor = Color.FromArgb(22, 22, 22);
        btnCancel.FlatAppearance.BorderSize = 2;
        btnCancel.Click += (_, _) => Close();
        btnRow.Controls.Add(btnCancel);

        card.Controls.Add(btnRow);
        Controls.Add(card);

        Paint += (_, e) =>
        {
            using var b = new SolidBrush(Color.FromArgb(22, 22, 22));
            e.Graphics.FillRectangle(b, card.Left + 5, card.Top + 5, card.Width, card.Height);
        };
    }

    private static CheckBox MakeCheck(string text, bool isChecked) => new()
    {
        Text = text,
        Checked = isChecked,
        Font = new Font("Segoe UI", 9.8F, FontStyle.Bold),
        ForeColor = Color.FromArgb(22, 22, 22),
        AutoSize = true,
        Margin = new Padding(2, 3, 0, 5),
        Cursor = Cursors.Hand
    };

    private void RunInstall()
    {
        _btnInstall.Enabled = false;
        _lblStatus.Text = "Đang cài đặt Mốc...";
        Application.DoEvents();

        try
        {
            InstallerOps.StopRunningInstances();

            Directory.CreateDirectory(Program.InstallDir);
            string targetExe = Program.InstalledExePath;

            if (!string.Equals(Path.GetFullPath(_sourceExe), Path.GetFullPath(targetExe), StringComparison.OrdinalIgnoreCase))
            {
                Exception? copyErr = null;
                for (int attempt = 0; attempt < 6; attempt++)
                {
                    try
                    {
                        File.Copy(_sourceExe, targetExe, overwrite: true);
                        copyErr = null;
                        break;
                    }
                    catch (IOException ex)
                    {
                        copyErr = ex;
                        Thread.Sleep(300);
                    }
                }
                if (copyErr != null)
                    throw copyErr;
            }

            // Remove old Unicode-named exe if present from earlier version
            string legacyExe = Path.Combine(Program.InstallDir, "Mốc.exe");
            if (File.Exists(legacyExe))
            {
                try { File.Delete(legacyExe); } catch { }
            }

            if (_chkDesktop.Checked)
            {
                string desktopLnk = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                    "Mốc.lnk");
                try { InstallerOps.CreateShortcut(desktopLnk, targetExe, Program.AppDisplayName); }
                catch
                {
                    string fallbackLnk = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),
                        "Moc.lnk");
                    InstallerOps.CreateShortcut(fallbackLnk, targetExe, Program.AppDisplayName);
                }
            }

            if (_chkStartMenu.Checked)
            {
                string startLnk = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.Programs),
                    "Mốc.lnk");
                try { InstallerOps.CreateShortcut(startLnk, targetExe, Program.AppDisplayName); }
                catch
                {
                    string fallbackLnk = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.Programs),
                        "Moc.lnk");
                    InstallerOps.CreateShortcut(fallbackLnk, targetExe, Program.AppDisplayName);
                }
            }

            InstallerOps.RegisterUninstaller(targetExe);
            InstallerOps.SetAutoStart(_chkAutoStart.Checked, targetExe);

            _lblStatus.Text = "Cài đặt hoàn tất!";

            if (_chkLaunch.Checked)
            {
                Process.Start(new ProcessStartInfo(targetExe) { UseShellExecute = true });
            }
            else
            {
                MessageBox.Show(
                    "Đã cài đặt Mốc thành công! Bạn có thể mở Mốc từ Màn hình chính hoặc Start Menu.",
                    Program.AppDisplayName,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }

            Close();
        }
        catch (Exception ex)
        {
            _btnInstall.Enabled = true;
            _lblStatus.Text = "Có lỗi khi cài đặt.";
            Exception root = ex is TargetInvocationException tie && tie.InnerException != null ? tie.InnerException : ex;
            MessageBox.Show(
                "Không thể hoàn tất cài đặt:\n" + root.Message,
                "Lỗi cài đặt Mốc",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
        }
    }
}
