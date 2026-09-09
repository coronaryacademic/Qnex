Option Explicit

Dim shell, fileSystem, appDirectory
Set shell = CreateObject("WScript.Shell")
Set fileSystem = CreateObject("Scripting.FileSystemObject")

appDirectory = fileSystem.BuildPath(fileSystem.GetParentFolderName(WScript.ScriptFullName), "electron")
shell.CurrentDirectory = appDirectory
shell.Run fileSystem.BuildPath(appDirectory, "node_modules\electron\dist\electron.exe") & " .", 0, False

Set fileSystem = Nothing
Set shell = Nothing
