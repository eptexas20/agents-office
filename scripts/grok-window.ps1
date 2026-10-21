Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public static class GrokWin {
  const int WM_SYSCOMMAND = 0x0112;
  const int SC_MINIMIZE = 0xF020;
  const uint SWP_NOSIZE = 0x0001;
  const uint SWP_NOZORDER = 0x0004;
  const uint SWP_NOACTIVATE = 0x0010;

  delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool PostMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
  [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern bool CreateProcess(string lpApplicationName, StringBuilder lpCommandLine, IntPtr lpProcessAttributes, IntPtr lpThreadAttributes, bool bInheritHandles, uint dwCreationFlags, IntPtr lpEnvironment, string lpCurrentDirectory, ref STARTUPINFO lpStartupInfo, out PROCESS_INFORMATION lpProcessInformation);
  [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr hObject);
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern IntPtr CreateDesktop(string lpszDesktop, IntPtr lpszDevice, IntPtr pDevmode, uint dwFlags, uint dwDesiredAccess, IntPtr lpsa);
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
  [DllImport("user32.dll", SetLastError = true)]
  static extern bool CloseDesktop(IntPtr hDesktop);

  const uint DESKTOP_ALL = 0x01FF;

  const int SW_HIDE = 0;
  const int SW_SHOWMINNOACTIVE = 7;
  const int STARTF_USESHOWWINDOW = 0x00000001;

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct STARTUPINFO {
    public int cb;
    public IntPtr lpReserved;
    public IntPtr lpDesktop;
    public IntPtr lpTitle;
    public int dwX;
    public int dwY;
    public int dwXSize;
    public int dwYSize;
    public int dwXCountChars;
    public int dwYCountChars;
    public int dwFillAttribute;
    public int dwFlags;
    public short wShowWindow;
    public short cbReserved2;
    public IntPtr lpReserved2;
    public IntPtr hStdInput;
    public IntPtr hStdOutput;
    public IntPtr hStdError;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct PROCESS_INFORMATION {
    public IntPtr hProcess;
    public IntPtr hThread;
    public int dwProcessId;
    public int dwThreadId;
  }

  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left, Top, Right, Bottom; }

  static IntPtr rememberedOther = IntPtr.Zero;

  static bool IsGrok(uint pid) {
    try {
      var process = Process.GetProcessById((int)pid);
      return process.ProcessName.Equals("Grok Bot", StringComparison.OrdinalIgnoreCase);
    } catch {
      return false;
    }
  }

  static List<IntPtr> Windows() {
    return TopLevel(false);
  }

  static List<IntPtr> TopLevel(bool includeHidden) {
    var found = new List<IntPtr>();
    EnumWindows((hwnd, param) => {
      uint pid;
      GetWindowThreadProcessId(hwnd, out pid);
      if (!IsGrok(pid)) return true;
      if (!includeHidden && !IsWindowVisible(hwnd) && !IsIconic(hwnd)) return true;
      found.Add(hwnd);
      return true;
    }, IntPtr.Zero);
    return found;
  }

  public static string Launch(string exe, string mode, string extraArgs) {
    short show = mode == "minimized" ? (short)SW_SHOWMINNOACTIVE : (short)SW_HIDE;
    IntPtr desktop = IntPtr.Zero;
    var si = new STARTUPINFO();
    si.cb = Marshal.SizeOf(typeof(STARTUPINFO));
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = show;
    try {
      if (mode == "desktop") {
        desktop = OpenDesktop("GrokSilentDesktop", 0, false, DESKTOP_ALL);
        if (desktop == IntPtr.Zero) return "{\"error\":\"open-desktop\",\"code\":" + Marshal.GetLastWin32Error() + "}";
        si.lpDesktop = Marshal.StringToHGlobalUni("GrokSilentDesktop");
      }
      var cmd = new StringBuilder(2048);
      cmd.Append('"').Append(exe).Append('"');
      if (!string.IsNullOrEmpty(extraArgs)) {
        cmd.Append(' ').Append(extraArgs);
      }
      PROCESS_INFORMATION pi;
      bool ok = CreateProcess(exe, cmd, IntPtr.Zero, IntPtr.Zero, false, 0, IntPtr.Zero, null, ref si, out pi);
      if (!ok) return "{\"error\":\"create-process\",\"code\":" + Marshal.GetLastWin32Error() + "}";
      int pid = pi.dwProcessId;
      if (pi.hProcess != IntPtr.Zero) CloseHandle(pi.hProcess);
      if (pi.hThread != IntPtr.Zero) CloseHandle(pi.hThread);
      return "{\"pid\":" + pid + ",\"mode\":\"" + mode + "\"}";
    } finally {
      if (si.lpDesktop != IntPtr.Zero) Marshal.FreeHGlobal(si.lpDesktop);
      if (desktop != IntPtr.Zero) CloseDesktop(desktop);
    }
  }

  public static void Watch(string mode, int durationMs, string reportPath) {
    IntPtr desktop = IntPtr.Zero;
    if (mode == "desktop") {
      desktop = OpenDesktop("GrokSilentDesktop", 0, false, DESKTOP_ALL);
      if (desktop == IntPtr.Zero) desktop = CreateDesktop("GrokSilentDesktop", IntPtr.Zero, IntPtr.Zero, 0, DESKTOP_ALL, IntPtr.Zero);
      if (desktop == IntPtr.Zero) {
        WriteReport(reportPath, mode, false, false, false, 0, 0, 0);
        return;
      }
    }
    try {
    bool everVisible = false;
    bool everForeground = false;
    int samples = 0;
    int visibleSamples = 0;
    int foregroundSamples = 0;
    var start = DateTime.UtcNow;
    IntPtr initialForeground = GetForegroundWindow();
    uint initialPid;
    GetWindowThreadProcessId(initialForeground, out initialPid);
    if (initialForeground != IntPtr.Zero && !IsGrok(initialPid)) rememberedOther = initialForeground;
    while ((DateTime.UtcNow - start).TotalMilliseconds < durationMs) {
      samples++;
      IntPtr foreground = GetForegroundWindow();
      uint foregroundPid;
      GetWindowThreadProcessId(foreground, out foregroundPid);
      bool foregroundIsGrok = IsGrok(foregroundPid);
      if (!foregroundIsGrok && foreground != IntPtr.Zero) rememberedOther = foreground;
      if (foregroundIsGrok) {
        everForeground = true;
        foregroundSamples++;
      }
      foreach (IntPtr hwnd in TopLevel(true)) {
        bool shown = IsWindowVisible(hwnd) && !IsIconic(hwnd);
        if (shown) {
          everVisible = true;
          visibleSamples++;
        }
        if (mode == "preempt") {
          ShowWindowAsync(hwnd, SW_SHOWMINNOACTIVE);
          PostMessage(hwnd, WM_SYSCOMMAND, (IntPtr)SC_MINIMIZE, IntPtr.Zero);
        } else if (mode == "hide") {
          ShowWindowAsync(hwnd, SW_HIDE);
        }
      }
      if ((mode == "preempt" || mode == "hide") && foregroundIsGrok && rememberedOther != IntPtr.Zero) {
        SetForegroundWindow(rememberedOther);
      }
      if (samples == 1 || samples % 5 == 0 || everVisible || everForeground) {
        WriteReport(reportPath, mode, true, everVisible, everForeground, samples, visibleSamples, foregroundSamples);
      }
      Thread.Sleep(20);
    }
    WriteReport(reportPath, mode, true, everVisible, everForeground, samples, visibleSamples, foregroundSamples);
    } finally {
      if (desktop != IntPtr.Zero) CloseDesktop(desktop);
    }
  }

  static void WriteReport(string reportPath, string mode, bool ready, bool everVisible, bool everForeground, int samples, int visibleSamples, int foregroundSamples) {
    try {
      string json = "{\"ready\":" + (ready ? "true" : "false") + ",\"mode\":\"" + mode + "\",\"everVisible\":" + (everVisible ? "true" : "false") + ",\"everForeground\":" + (everForeground ? "true" : "false") + ",\"samples\":" + samples + ",\"visibleSamples\":" + visibleSamples + ",\"foregroundSamples\":" + foregroundSamples + "}";
      string temp = reportPath + ".tmp";
      File.WriteAllText(temp, json);
      if (File.Exists(reportPath)) File.Delete(reportPath);
      File.Move(temp, reportPath);
    } catch {
    }
  }

  public static void HoldDesktop(string reportPath) {
    IntPtr desktop = OpenDesktop("GrokSilentDesktop", 0, false, DESKTOP_ALL);
    if (desktop == IntPtr.Zero) desktop = CreateDesktop("GrokSilentDesktop", IntPtr.Zero, IntPtr.Zero, 0, DESKTOP_ALL, IntPtr.Zero);
    if (desktop == IntPtr.Zero) {
      WriteReport(reportPath, "desktop", false, false, false, 0, 0, 0);
      return;
    }
    try {
      WriteReport(reportPath, "desktop", true, false, false, 0, 0, 0);
      Thread.Sleep(System.Threading.Timeout.Infinite);
    } finally {
      CloseDesktop(desktop);
    }
  }

  public static string Status() {
    IntPtr foreground = GetForegroundWindow();
    uint foregroundPid;
    GetWindowThreadProcessId(foreground, out foregroundPid);
    bool foregroundIsGrok = IsGrok(foregroundPid);
    if (!foregroundIsGrok && foreground != IntPtr.Zero) rememberedOther = foreground;
    var parts = new List<string>();
    foreach (IntPtr hwnd in Windows()) {
      RECT rect;
      GetWindowRect(hwnd, out rect);
      parts.Add("{\"hwnd\":\"" + hwnd.ToInt64() + "\",\"iconic\":" + (IsIconic(hwnd) ? "true" : "false") + ",\"visible\":" + (IsWindowVisible(hwnd) ? "true" : "false") + ",\"left\":" + rect.Left + ",\"top\":" + rect.Top + ",\"foreground\":" + (hwnd == foreground ? "true" : "false") + "}");
    }
    return "{\"foregroundIsGrok\":" + (foregroundIsGrok ? "true" : "false") + ",\"windows\":[" + string.Join(",", parts) + "]}";
  }

  public static string Minimize() {
    int count = 0;
    foreach (IntPtr hwnd in Windows()) {
      PostMessage(hwnd, WM_SYSCOMMAND, (IntPtr)SC_MINIMIZE, IntPtr.Zero);
      count++;
    }
    if (rememberedOther != IntPtr.Zero) SetForegroundWindow(rememberedOther);
    return "{\"action\":\"minimize\",\"touched\":" + count + "}";
  }

  public static string Offscreen() {
    int count = 0;
    foreach (IntPtr hwnd in Windows()) {
      SetWindowPos(hwnd, IntPtr.Zero, -4000, -4000, 0, 0, SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE);
      count++;
    }
    if (rememberedOther != IntPtr.Zero) SetForegroundWindow(rememberedOther);
    return "{\"action\":\"offscreen\",\"touched\":" + count + "}";
  }
}
"@

$command = $args[0]
if (-not $command) { $command = "status" }
switch ($command) {
  "status" { Write-Output ([GrokWin]::Status()) }
  "minimize" { Write-Output ([GrokWin]::Minimize()) }
  "offscreen" { Write-Output ([GrokWin]::Offscreen()) }
  "launch" {
    $mode = $args[1]
    $exe = $args[2]
    $extra = ""
    if ($args.Length -gt 3) { $extra = ($args[3..($args.Length - 1)] -join " ") }
    Write-Output ([GrokWin]::Launch($exe, $mode, $extra))
  }
  "watch" { [GrokWin]::Watch($args[1], [int]$args[2], $args[3]) }
  "hold-desktop" { [GrokWin]::HoldDesktop($args[1]) }
  default { Write-Output '{"error":"unknown command"}' }
}
