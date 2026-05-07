$f = "src\components\views\BridesView.tsx"
$l = Get-Content $f
$out = $l[0..711] + $l[916..($l.Count-1)]
Set-Content $f $out
Write-Host "Done. Lines: $($out.Count)"
