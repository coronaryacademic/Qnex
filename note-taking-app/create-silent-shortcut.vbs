Set WshShell = CreateObject("WScript.Shell")
Set oShellLink = WshShell.CreateShortcut("d:\My projects\Note taking app\CascadeProjects\windsurf-project\note-taking-app\Qnex (Silent).lnk")
oShellLink.TargetPath = "d:\My projects\Note taking app\CascadeProjects\windsurf-project\note-taking-app\Launch-Notes-App-Silent.vbs"
oShellLink.WorkingDirectory = "d:\My projects\Note taking app\CascadeProjects\windsurf-project\note-taking-app"
oShellLink.Description = "Qnex - No Command Window"
oShellLink.Save

WScript.Echo "Silent shortcut created in project folder: Qnex (Silent).lnk"
