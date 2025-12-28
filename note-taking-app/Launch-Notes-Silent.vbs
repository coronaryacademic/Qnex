Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Define paths for both PCs
laptopPath = "d:\My projects\Note taking app\notes-app-1.0\windsurf-project\note-taking-app\electron"
newPcPath = "d:\windsurf-project\note-taking-app\electron"

' Check which path exists and use it
If fso.FolderExists(laptopPath) Then
    WshShell.Run "cmd /c cd /d """ & laptopPath & """ && npm start", 0, False
Else
    WshShell.Run "cmd /c cd /d """ & newPcPath & """ && npm start", 0, False
End If

Set fso = Nothing
Set WshShell = Nothing 
