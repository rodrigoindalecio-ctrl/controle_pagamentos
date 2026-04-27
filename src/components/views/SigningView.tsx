import React, { useState, useEffect } from "react";
import { ShieldCheck, Download, RefreshCw, FileText } from "lucide-react";
import { generateContractPDF } from "../../App"; // or wherever generateContractPDF is

// --- Signature Pad Component ---
const SignaturePad = ({ onSave, title, heightClass = "aspect-[2/1]" }: { onSave: (data: string) => void, title?: string, heightClass?: string }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [hasDrawn, setHasDrawn] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#2563eb'; // blue signature line 
  }, []);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(x, y);
    ctx?.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) onSave(canvas.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSave('');
      setHasDrawn(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className={`relative w-full ${heightClass} bg-[#f9fafb] border-2 border-dashed border-slate-200 rounded-lg overflow-hidden cursor-crosshair group flex items-center justify-center`}>
        {!hasDrawn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none select-none z-0">
             <span className="font-[cursive] text-4xl opacity-50">{title || "Assine aqui"}</span>
          </div>
        )}
        <div className="absolute bottom-6 left-10 right-10 flex items-end gap-2 pointer-events-none z-0 opacity-50">
           <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
           <div className="h-px bg-blue-600 flex-1 mb-1"></div>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none z-10"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {hasDrawn && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button onClick={clear} className="px-3 py-1 bg-white text-slate-500 rounded-md text-[10px] font-bold shadow hover:bg-slate-50 transition-colors uppercase tracking-widest border border-slate-200">
              Limpar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SigningView Component (Portal Público de Assinatura) ---
// Simula a exata UI e passos de confirmação do ZapSign (Reading -> Identity -> Signature -> Initials -> Success)
const SigningView = ({ settings, contract, token, onSigned }: any) => {
  const [step, setStep] = useState<'auth' | 'document' | 'identity' | 'signature' | 'initials' | 'success'>('auth');
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState('');
  const [signature, setSignature] = useState('');
  const [initials, setInitials] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [location, setLocation] = useState<string>("Localização não autorizada");
  const [identity, setIdentity] = useState({
    name: contract?.bride_name || '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
        (err) => console.log("Localização recusada:", err)
      );
    }
  }, []);

  const handleSign = async () => {
    if (!signature || !initials) return alert("Por favor, conclua sua assinatura e visto.");
    
    try {
      const res = await fetch(`/api/public/contract/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          signature_image: signature,
          signer_name: identity.name,
          signer_email: identity.email,
          signer_phone: identity.phone,
          initials_image: initials,
          ip_address: "Capturado pelo Servidor",
          user_agent: navigator.userAgent,
          location: location
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStep('success');
        if (onSigned) onSigned();
      } else {
        // Mostra o erro real retornado pelo servidor para facilitar o diagnóstico
        const errorMsg = data.detail 
          ? `${data.error}\n\nDetalhe: ${data.detail} (${data.code})`
          : data.error || "Erro ao salvar assinatura. Por favor, tente novamente.";
        alert(errorMsg);
      }
    } catch (e) {
      alert("Erro de conexão.");
    }
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando Contrato...</p>
        </div>
      </div>
    );
  }

  const TopBar = () => (
    <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-2">
         <div className="flex items-center gap-2 text-blue-600">
           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
           <span className="text-xl font-black text-slate-800 tracking-tight">ZapSign<span className="text-[9px] text-slate-400 font-normal ml-1 align-top relative top-1">by you</span></span>
         </div>
      </div>
      <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
         <span className="hidden md:inline">Assinaturas 0/2</span>
         <button className="text-slate-400 hover:text-blue-600 transition-colors"><Download className="w-5 h-5"/></button>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans">
      <TopBar />

      {step === 'auth' && (
        <main className="flex-1 w-full max-w-md mx-auto py-24 px-4 flex flex-col items-center">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 w-full text-center">
                <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-black text-slate-800 mb-2">Acesso Seguro</h2>
                <p className="text-sm text-slate-500 mb-6">Para visualizar e assinar este documento, confirme seu e-mail de acesso.</p>
                
                <input 
                  type="email" 
                  autoFocus
                  placeholder="Seu e-mail" 
                  value={authEmail} 
                  onChange={e => setAuthEmail(e.target.value)} 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-blue-200 outline-none font-bold mb-3 text-center" 
                />
                
                {authError && <p className="text-xs text-red-500 font-bold mb-4">{authError}</p>}
                
                <button 
                  onClick={() => {
                      if (!authEmail || !authEmail.includes('@')) {
                          setAuthError("Digite um e-mail válido.");
                          return;
                      }
                      // Simula validação. Na prática, você pode checar contra um dado do banco
                      setAuthError("");
                      setStep('document');
                  }}
                  className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm py-4 rounded-xl transition-colors shadow-sm"
                >
                  Acessar Documento
                </button>
            </div>
        </main>
      )}
      
      {step === 'document' && (
        <main className="flex-1 w-full max-w-4xl mx-auto py-8 px-4 flex flex-col relative pb-32">
           <div className="bg-white shadow-sm mx-auto w-full p-8 md:p-20 min-h-screen select-text font-serif text-justify text-slate-800 text-[15px] leading-relaxed border border-slate-200" dangerouslySetInnerHTML={{ __html: (contract.generated_text || "").replace(/\n/g, '<br/>') }} />
           
           <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-20">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                <ShieldCheck className="w-4 h-4" /> Seguro e Criptografado
              </div>
              <button 
                onClick={() => setStep('identity')}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm py-3 px-12 rounded-md transition-colors shadow-sm"
              >
                Continuar
              </button>
           </div>
        </main>
      )}

      {step === 'identity' && (
        <main className="flex-1 w-full max-w-2xl mx-auto py-16 px-4 flex flex-col items-center pb-32 relative">
            <h2 className="text-xl md:text-2xl font-black text-center text-slate-800 mb-8 tracking-tight">
               Confirme sua identidade para assinar o documento
            </h2>
            
            <div className="w-full max-w-xl space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Nome completo</label>
                  <input type="text" value={identity.name} onChange={e => setIdentity({...identity, name: e.target.value})} className="w-full p-4 bg-slate-100 border-none rounded-lg text-slate-700 text-sm shadow-inner focus:ring-2 focus:ring-blue-200 outline-none font-bold" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">E-mail</label>
                  <input type="email" value={identity.email} onChange={e => setIdentity({...identity, email: e.target.value})} className="w-full p-4 bg-slate-100 border-none rounded-lg text-slate-700 text-sm shadow-inner focus:ring-2 focus:ring-blue-200 outline-none font-bold" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-1">Celular</label>
                  <div className="flex bg-slate-100 rounded-lg overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-blue-200">
                    <div className="px-4 py-4 bg-slate-200/50 flex items-center gap-2 border-r border-slate-200 text-sm font-black text-slate-600">
                      <span className="text-lg leading-none">🇧🇷</span> +55
                    </div>
                    <input type="text" placeholder="DDD e número" value={identity.phone} onChange={e => setIdentity({...identity, phone: e.target.value})} className="w-full p-4 bg-transparent border-none text-slate-700 text-sm font-bold focus:ring-0 outline-none" />
                  </div>
               </div>

               <p className="text-[10px] text-center text-slate-500 font-medium mt-10 max-w-sm mx-auto leading-relaxed">
                 Ao continuar, aceito o tratamento dos meus dados pessoais de acordo com a <a href="#" className="underline font-bold">política de privacidade</a>
               </p>
            </div>

           <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-20">
              <button 
                onClick={() => setStep('document')}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2"
                title="Voltar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </button>
              <button 
                onClick={() => {
                  if(!identity.name || !identity.email || !identity.phone) return alert("Preencha todos os campos para continuar.");
                  setStep('signature');
                }}
                className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-sm py-3 px-12 rounded-md transition-colors shadow-sm"
              >
                Continuar
              </button>
           </div>
        </main>
      )}

      {step === 'signature' && (
        <main className="flex-1 w-full max-w-2xl mx-auto py-16 px-4 flex flex-col items-center pb-32">
            <h2 className="text-xl md:text-2xl font-black text-center text-slate-800 mb-6 tracking-tight">
               Por favor, assine abaixo
            </h2>

            <div className="flex gap-6 border-b border-slate-200 mb-6 w-full max-w-lg justify-center relative">
               <button className="pb-3 text-xs font-black text-blue-600 uppercase tracking-widest relative">
                 <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                 Desenhar
                 <div className="absolute -bottom-[2px] left-0 right-0 h-0.5 bg-blue-600" />
               </button>
               <button className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Aa Digitar</button>
               <button className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">↑ Upload</button>
            </div>
            
            <div className="w-full max-w-lg space-y-6">
                <SignaturePad onSave={setSignature} title="Assine aqui" heightClass="aspect-[2/1]" />
                <div className="flex items-center justify-center gap-3">
                   <div className="w-10 h-5 bg-slate-200 rounded-full relative shadow-inner"><div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"></div></div>
                   <span className="text-xs font-bold text-slate-700">Salvar assinatura para assinar documentos futuros.</span>
                </div>
            </div>

           <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-20">
              <button onClick={() => setStep('identity')} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </button>
              <button 
                onClick={() => {
                  if(!signature) return alert("Desenhe sua assinatura");
                  setStep('initials');
                }}
                disabled={!signature}
                className={`font-bold text-sm py-3 px-10 rounded-md transition-colors shadow-sm cursor-pointer ${signature ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                Finalizar
              </button>
           </div>
        </main>
      )}

      {step === 'initials' && (
        <main className="flex-1 w-full max-w-2xl mx-auto py-16 px-4 flex flex-col items-center pb-32">
            <h2 className="text-xl md:text-2xl font-black text-center text-slate-800 mb-6 tracking-tight">
               Muito bem! Agora faça seu visto.
            </h2>

            <div className="flex gap-6 border-b border-slate-200 mb-6 w-full max-w-md justify-center relative">
               <button className="pb-3 text-xs font-black text-blue-600 uppercase tracking-widest relative">
                 <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                 Desenhar
                 <div className="absolute -bottom-[2px] left-0 right-0 h-0.5 bg-blue-600" />
               </button>
               <button className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Aa Digitar</button>
               <button className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">↑ Upload</button>
            </div>
            
            <div className="w-full max-w-md space-y-6">
                <SignaturePad onSave={setInitials} title="Visto" heightClass="aspect-square max-w-[320px] mx-auto" />
                <div className="flex items-center justify-center gap-3">
                   <div className="w-10 h-5 bg-slate-200 rounded-full relative shadow-inner"><div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full"></div></div>
                   <span className="text-xs font-bold text-slate-700">Salvar visto para assinar documentos futuros.</span>
                </div>
            </div>

           <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-20">
              <button onClick={() => setStep('signature')} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </button>
              <button 
                onClick={handleSign}
                disabled={!initials}
                className={`font-bold text-sm py-3 px-10 rounded-md transition-colors shadow-sm cursor-pointer ${initials ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                Finalizar
              </button>
           </div>
        </main>
      )}

      {step === 'success' && (
        <main className="flex-1 w-full max-w-3xl mx-auto py-16 px-4 flex flex-col items-center">
             <div className="size-16 bg-[#22c55e] text-white rounded-full flex items-center justify-center mb-6 shadow-lg">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
             </div>
             
             <h1 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Sua assinatura foi concluída!</h1>
             <div className="text-sm font-bold text-slate-600 text-center mb-10 space-y-1">
               <p>Você receberá uma cópia do documento por e-mail assim que todos tiverem finalizado sua assinatura.</p>
               <p>Uma cópia do documento foi enviada para seu e-mail <span className="text-slate-800">{identity.email.replace(/(.{2})(.*)(?=@)/, '$1***')}</span></p>
             </div>

             <div className="w-full max-w-2xl space-y-4">
                 <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                    <div className="flex items-start gap-4 text-center md:text-left">
                       <FileText className="w-6 h-6 text-slate-400 mt-1 hidden md:block" />
                       <div>
                          <h4 className="font-black text-slate-800">Ver meus documentos</h4>
                          <p className="text-xs font-bold text-slate-500 mt-1">Seus documentos estão seguros e acessíveis em um só lugar.</p>
                       </div>
                    </div>
                    <button className="bg-[#1d4ed8] text-white font-bold text-xs py-3 px-6 rounded-md hover:bg-[#1e40af] transition-colors w-full md:w-auto text-nowrap shadow-sm">
                      Acessar documentos assinados
                    </button>
                 </div>

                 <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm group hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3">
                       <FileText className="w-5 h-5 text-slate-400" />
                       <span className="text-xs font-black text-slate-700 uppercase tracking-widest truncate max-w-[200px] md:max-w-md">CONTRATO DE PRESTAÇAO DE SERVIÇOS DE {contract.service_type || "ASSESSORIA"}.pdf</span>
                    </div>
                    <button 
                      disabled={isDownloading}
                      onClick={async () => {
                         setIsDownloading(true);
                         try {
                           const fakeSignature = { 
                             signer_name: identity.name, 
                             signature_image: signature,
                             signer_email: identity.email,
                             signer_phone: identity.phone,
                             signer_location: location,
                             ip_address: "Capturado pelo Servidor",
                             user_agent: navigator.userAgent,
                             signed_at: new Date().toISOString(),
                             signer_type: contract.signer_type || "noiva"
                           };
                           await generateContractPDF(contract.bride_name, contract.generated_text, [fakeSignature], token, settings);
                         } catch(e) {}
                         setIsDownloading(false);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      {isDownloading ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Download className="w-5 h-5"/>}
                    </button>
                 </div>
             </div>

          </main>
      )}
    </div>
  );
};

export { SigningView, SignaturePad };
