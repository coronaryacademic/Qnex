Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Define paths for both PCs
laptopPath = "d:\My projects\Note taking app\CascadeProjects\windsurf-project\note-taking-app\electron"
newPcPath = "d:\windsurf-project\note-taking-app\electron"

' Check which path exists and use it
If fso.FolderExists(laptopPath) Then
    WshShell.CurrentDirectory = laptopPath
Else
    WshShell.CurrentDirectory = newPcPath
End If

' Run npm start without showing command window (0 = hidden, False = don't wait)
WshShell.Run "npm start", 0, False

Set fso = Nothing
Set WshShell = Nothing
