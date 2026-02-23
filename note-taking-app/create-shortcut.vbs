Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut(WshShell.SpecialFolders("Desktop") & "\Qnex.lnk")
oShellLink.TargetPath = "d:\My projects\Note taking app\CascadeProjects\windsurf-project\note-taking-app\Launch-Notes-App.bat"
oShellLink.WorkingDirectory = "d:\My projects\Note taking app\CascadeProjects\windsurf-project\note-taking-app"
oShellLink.Description = "Qnex with File System Storage"
oShellLink.Save

WScript.Echo "Desktop shortcut created: Qnex.lnk"
