Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Define paths for both PCs
laptopPath = "d:\My projects\Note taking app\notes-app-1.0\windsurf-project\note-taking-app\electron\quick-start.bat"
newPcPath = "d:\windsurf-project\note-taking-app\electron\quick-start.bat"

' Check which path exists and use it
If fso.FileExists(laptopPath) Then
    ' Start batch file without waiting (True -> False) so script can continue to verify
    WshShell.Run "cmd /k """ & laptopPath & """", 1, False
ElseIf fso.FileExists(newPcPath) Then
    WshShell.Run "cmd /k """ & newPcPath & """", 1, False
Else
    MsgBox "Error: Could not find quick-start.bat on either laptop or new PC path!", vbCritical, "Path Not Found"
    WScript.Quit
End If

' Verification Loop for AI Learning Engine - DISABLED FOR FASTER LAUNCH
' This provides a "Premium" confirmation that the intelligence loop is connected
' Set xmlHttp = CreateObject("MSXML2.XMLHTTP")
' On Error Resume Next
' ready = False
' For i = 1 To 15
'     WScript.Sleep 1000 ' Wait 1 second
'     xmlHttp.Open "GET", "http://localhost:3001/api/ai/learning-data", False
'     xmlHttp.Send
'     If xmlHttp.Status = 200 Then
'         ready = True
'         Exit For
'     End If
' Next
' 
' If ready Then
'     MsgBox "Intelligence Loop Connected!" & vbCrLf & "AI Learning Engine: ONLINE" & vbCrLf & "Adaptive Difficulty: ACTIVE", vbInformation, "AI Evolution"
' End If

Set fso = Nothing
Set WshShell = Nothing 
