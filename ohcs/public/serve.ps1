# serve.ps1 — Only Humans Can Score: zero-install local web server.
# Serves the folder this script lives in over http://localhost:<port>/ and opens your browser.
# Pure PowerShell (raw TCP) — needs nothing installed and no administrator rights.
# Stop it by closing this window or pressing Ctrl+C.

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
if (-not $root) { $root = Split-Path -Parent $MyInvocation.MyCommand.Path }

if (-not (Test-Path (Join-Path $root 'index.html'))) {
  Write-Host "Could not find index.html next to serve.ps1." -ForegroundColor Red
  Write-Host "Put this script in the folder that contains index.html, then run it again."
  return
}

# extension -> Content-Type (text types carry charset so the browser reads them correctly)
$mime = @{
  '.html'='text/html; charset=utf-8'; '.htm'='text/html; charset=utf-8';
  '.css'='text/css; charset=utf-8';  '.js'='text/javascript; charset=utf-8';
  '.mjs'='text/javascript; charset=utf-8'; '.json'='application/json; charset=utf-8';
  '.svg'='image/svg+xml'; '.woff2'='font/woff2'; '.woff'='font/woff';
  '.txt'='text/plain; charset=utf-8'; '.xml'='application/xml; charset=utf-8';
  '.ico'='image/x-icon'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg';
  '.gif'='image/gif'; '.webp'='image/webp'; '.map'='application/json; charset=utf-8';
  '.webmanifest'='application/manifest+json'
}

# pick the first free port starting at 8000
$port = 0
foreach ($p in 8000..8020) {
  try {
    $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $p)
    $probe.Start(); $probe.Stop(); $port = $p; break
  } catch { }
}
if ($port -eq 0) { Write-Host "No free port in 8000-8020." -ForegroundColor Red; return }

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
$url = "http://localhost:$port/"

Write-Host ""
Write-Host "  Only Humans Can Score - serving locally" -ForegroundColor Yellow
Write-Host "  $url" -ForegroundColor Cyan
Write-Host "  (close this window or press Ctrl+C to stop)"
Write-Host ""
try { Start-Process $url } catch { Write-Host "  Open your browser to $url" }

$enc = [System.Text.Encoding]::ASCII
try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) { $client.Close(); continue }

      $parts = $requestLine.Split(' ')
      $rawPath = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
      $rawPath = $rawPath.Split('?')[0]
      $rel = [System.Uri]::UnescapeDataString($rawPath)
      if ($rel.EndsWith('/')) { $rel += 'index.html' }
      $rel = $rel.TrimStart('/')

      # resolve and confine to root (block ../ traversal)
      $full = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
      $rootFull = [System.IO.Path]::GetFullPath($root)
      $status = '200 OK'; $body = $null; $ctype = 'application/octet-stream'

      if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
        $status = '403 Forbidden'; $body = $enc.GetBytes('403 Forbidden'); $ctype = 'text/plain; charset=utf-8'
      } elseif (Test-Path $full -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        if ($mime.ContainsKey($ext)) { $ctype = $mime[$ext] }
        $body = [System.IO.File]::ReadAllBytes($full)
      } else {
        $status = '404 Not Found'
        $body = $enc.GetBytes("404 Not Found: $rel"); $ctype = 'text/plain; charset=utf-8'
      }

      $header  = "HTTP/1.1 $status`r`n"
      $header += "Content-Type: $ctype`r`n"
      $header += "Content-Length: $($body.Length)`r`n"
      $header += "Cache-Control: no-cache`r`n"
      $header += "Connection: close`r`n`r`n"
      $hbytes = $enc.GetBytes($header)
      $stream.Write($hbytes, 0, $hbytes.Length)
      $stream.Write($body, 0, $body.Length)
      $stream.Flush()
    } catch {
      # one bad request shouldn't take the server down
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
  Write-Host "`n  Server stopped." -ForegroundColor Yellow
}
