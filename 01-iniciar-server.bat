@echo off
:: Muda o diretório para onde este arquivo está salvo
cd /d "%~dp0"

:: Executa o comando
npm run dev

:: Impede que a janela feche se houver erro (opcional)
cmd /k