Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run "cmd /c cd /d ""d:\My projects\Note taking app\notes-app-1.0\windsurf-project\note-taking-app\electron"" && npm start", 0, False
Set WshShell = Nothing 
