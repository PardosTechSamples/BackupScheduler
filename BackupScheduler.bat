@echo off
del C:\BackupScheduler\logs\sessionlog.txt
set TODAY=%date:~10,4%-%date:~7,2%-%date:~4,2%
set DriveA=C:\Loc\To\DriveA\
set Days=7
set ExternLoc1=\\Server1\Backups\DriveA\%TODAY%
set ExternLoc2=\\Server2\Backups\DriveA\%TODAY%


title BackupScheduler 1.0

echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo 		Backup Start 		>> C:\BackupScheduler\logs\sessionlog.txt
echo 		Date: %date% 		>> C:\BackupScheduler\logs\sessionlog.txt
echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo 		Compressing DriveA	>> C:\BackupScheduler\logs\sessionlog.txt
echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo 		Compressing...  	>> C:\BackupScheduler\logs\sessionlog.txt
echo 		%TIME%  		>> C:\BackupScheduler\logs\sessionlog.txt
"C:\Program Files\7-Zip\7z.exe" a C:\BackupScheduler\BACKUPS\DriveA%TODAY%.zip %DriveA%  >> C:\BackupScheduler\logs\sessionlog.txt
echo 		DONE!  >> C:\BackupScheduler\logs\sessionlog.txt
echo 		%TIME%  >> C:\BackupScheduler\logs\sessionlog.txt
echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo ------------------------------------------------------------------------------- >> C:\BackupScheduler\logs\sessionlog.txt
echo 

echo Copying DriveA to Server 1, Server 2: >> C:\BackupScheduler\logs\sessionlog.txt

robocopy "C:\BackupScheduler\BACKUPS\" %ExternLoc1% DriveA%TODAY%.zip /A-:SHR >> C:\BackupScheduler\logs\sessionlog.txt
robocopy "C:\BackupScheduler\BACKUPS\" %ExternLoc2% DriveA%TODAY%.zip /A-:SHR >> C:\BackupScheduler\logs\sessionlog.txt

echo Deleting Files Older than %Days% Days.  C:\BackupScheduler\BACKUPS\ >> C:\BackupScheduler\logs\sessionlog.txt
ForFiles /p "C:\BackupScheduler\BACKUPS" /s /d -%Days% /c "cmd /c del /q @file" >> C:\BackupScheduler\logs\sessionlog.txt
echo 		Backing Up Log >> C:\BackupScheduler\logs\sessionlog.txt
copy C:\BackupScheduler\logs\sessionlog.txt C:\BackupScheduler\logs\%TODAY%.txt >> C:\BackupScheduler\logs\sessionlog.txt
