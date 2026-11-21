# Creates ter-documentation-portal.zip next to this script.
# Excludes node_modules, dist, the node compile cache and any existing ZIP.

$ErrorActionPreference = 'Stop'

$source = $PSScriptRoot
$destination = Join-Path $source 'ter-documentation-portal.zip'

Write-Host "Source : $source"
Write-Host "Output : $destination"

if (Test-Path $destination) {
  Remove-Item $destination -Force
}

$stage = Join-Path ([System.IO.Path]::GetTempPath()) ('terdoc-' + [guid]::NewGuid().ToString('N'))
$target = Join-Path $stage 'ter-documentation-portal'
New-Item -ItemType Directory -Path $target -Force | Out-Null

robocopy $source $target /E /XD node_modules .git dist node-compile-cache .node-compile-cache /XF *.zip /NFL /NDL /NJH /NJS | Out-Null
if ($LASTEXITCODE -ge 8) {
  Write-Host "ERROR: robocopy failed with exit code $LASTEXITCODE"
  Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
  exit 1
}

Compress-Archive -Path $target -DestinationPath $destination -Force
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path $destination) {
  $sizeKb = [math]::Round((Get-Item $destination).Length / 1KB, 1)
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $entries = ([System.IO.Compression.ZipFile]::OpenRead($destination)).Entries.Count
  Write-Host ""
  Write-Host "ZIP created successfully."
  Write-Host "File    : $destination"
  Write-Host "Size    : $sizeKb KB"
  Write-Host "Entries : $entries"
} else {
  Write-Host "ZIP creation failed. Try running MAKE-ZIP.bat as administrator."
  exit 1
}
