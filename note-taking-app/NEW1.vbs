Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Define paths for both PCs
laptopPath = "d:\My projects\Note taking app\notes-app-1.0\windsurf-project\note-taking-app\electron\quick-start.bat"
newPcPath = "d:\windsurf-project\note-taking-app\electron\quick-start.bat"

' Check which path exists and use it
If fso.FileExists(laptopPath) Then
    WshShell.Run "cmd /k """ & laptopPath & """", 1, True
ElseIf fso.FileExists(newPcPath) Then
    WshShell.Run "cmd /k """ & newPcPath & """", 1, True
Else
    MsgBox "Error: Could not find quick-start.bat on either laptop or new PC path!", vbCritical, "Path Not Found"
End If

Set fso = Nothing
Set WshShell = Nothing 
