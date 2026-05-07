import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AppSettings, Bride, Payment, Expense, DEFAULT_SETTINGS } from "../../types";
import { Save, AlertCircle, User, Award, CheckCircle, Clock, Plus, Trash2, Users, Calendar, Wallet, LayoutDashboard, Sparkles, LogOut, XCircle, Heart, MapPin, ChevronRight, Eye, EyeOff, TrendingUp, ShieldCheck, Settings, Edit, Lock, Download, RefreshCw } from "lucide-react";
import { Header } from "../../App";

const SettingsView = ({ settings, setSettings, data, userProfile, setUserProfile, authToken, onSaveSettings, onSaveProfile, initialTab = 'profile', showAlert, showConfirm }: { settings: AppSettings, setSettings: (s: AppSettings) => void, data: { brides: Bride[], payments: Payment[], expenses: Expense[] }, userProfile: any, setUserProfile: (u: any) => void, authToken: string | null, key?: string, onSaveSettings: (s: AppSettings) => Promise<boolean>, onSaveProfile: (p: any) => Promise<boolean>, initialTab?: 'profile' | 'services' | 'goals' | 'system', showAlert: (t: string, m: string) => void, showConfirm: (t: string, m: string, cb: () => void) => void }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'goals' | 'system'>(initialTab as any);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isEmailBackupLoading, setIsEmailBackupLoading] = useState(false);


  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      const s1 = await onSaveSettings(settings);
      const s2 = await onSaveProfile(userProfile);
      if (s1 && s2) {
        localStorage.setItem('wedding_settings', JSON.stringify(settings));
        localStorage.setItem('wedding_user_profile', JSON.stringify(userProfile));
        showAlert('Sucesso', 'Configurações salvas com sucesso! ✓');
      } else {
        showAlert('Erro ao Salvar', 'Houve um erro ao salvar algumas informações. Verifique sua conexão.');
      }
    } catch (e) {
      console.error(e);
      showAlert('Erro Inesperado', 'Erro inesperado ao salvar.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleExport = () => {
    const backup = {
      settings,
      data,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wedding_adviser_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);

        if (!backup.settings || !backup.data) {
          showAlert('Erro no Backup', 'O arquivo selecionado não parece ser um backup válido deste sistema.');
          return;
        }

        showConfirm(
          "Restaurar Backup?",
          "Isso irá substituir todas as suas configurações atuais pelos dados do arquivo. Deseja continuar?",
          async () => {
            setSettings(backup.settings);
            // O salvamento no banco ocorrerá quando o usuário clicar em "Salvar Tudo"
            showAlert('Backup Carregado', 'Os dados do arquivo foram carregados com sucesso! Clique em "SALVAR TUDO" no final da página para persistir as alterações.');
          }
        );
      } catch (err) {
        showAlert('Erro ao Importar', 'Não foi possível ler o arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleEmailBackup = async () => {
    setIsEmailBackupLoading(true);
    try {
      const res = await fetch('/api/admin/backup/email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        showAlert('Sucesso!', 'O backup completo foi enviado para o seu e-mail (rodrigoindalecio@hotmail.com). Verifique sua caixa de entrada.');
      } else {
        const err = await res.json();
        showAlert('Erro no Backup', err.error || 'Não foi possível enviar o backup por e-mail.');
      }
    } catch (e) {
      showAlert('Erro de Conexão', 'Erro ao tentar se comunicar com o servidor de backup.');
    } finally {
      setIsEmailBackupLoading(false);
    }
  };

  const addItem = (list: 'services' | 'partners' | 'locations', value: string | { name: string; address: string }) => {
    if (!value) return;
    const currentList = settings[list] || [];
    setSettings({ ...settings, [list]: [...currentList, value] });
  };

  const removeItem = (list: 'services' | 'partners' | 'locations', index: number) => {
    const currentList = settings[list] || [];
    const newList = [...currentList];
    newList.splice(index, 1);
    setSettings({ ...settings, [list]: newList });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-20 lg:pb-0"
    >
      <Header title="Configurações" subtitle="Gerencie as preferências da sua conta e do sistema." />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="lg:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <Users className="w-5 h-5" /> Perfil
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'services' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <Plus className="w-5 h-5" /> Serviços & Parceiros
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'goals' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <TrendingUp className="w-5 h-5" /> Metas & Regras
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'system' ? 'bg-[#883545] text-white shadow-lg' : 'bg-white text-slate-600 border border-[#883545]/5 hover:bg-slate-50'}`}
          >
            <Settings className="w-5 h-5" /> Sistema
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white p-6 lg:p-10 rounded-3xl border border-[#883545]/10 shadow-sm min-h-[500px]">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Informações Gerais</h3>

              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 flex items-center gap-6">
                <div className="size-20 bg-white rounded-2xl shadow-inner border border-slate-100 flex items-center justify-center overflow-hidden relative group">
                  {settings.profile.logo ? (
                    <img src={settings.profile.logo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Heart className="w-8 h-8 text-slate-200" />
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Plus className="w-5 h-5" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 200;
                              const MAX_HEIGHT = 200;
                              let width = img.width;
                              let height = img.height;

                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }
                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                              setSettings({ ...settings, profile: { ...settings.profile, logo: compressedBase64 } });
                            };
                            img.src = reader.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col">
                    <p className="text-sm font-black text-slate-700">Logo da Assessoria</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recomendado: PNG ou JPG (quadrado)</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black text-[#883545] uppercase tracking-widest">Link da Imagem (Opção Recomendada):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://exemplo.com/logo.png"
                        className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-[#883545]/20 outline-none"
                        value={settings.profile.logo || ''}
                        onChange={(e) => setSettings({ ...settings, profile: { ...settings.profile, logo: e.target.value } })}
                      />
                      {settings.profile.logo && (
                        <button
                          onClick={() => setSettings({ ...settings, profile: { ...settings.profile, logo: '' } })}
                          className="px-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                          title="Remover Logo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Assessoria</label>
                  <input
                    type="text"
                    value={settings.profile.name}
                    onChange={e => setSettings({ ...settings, profile: { ...settings.profile, name: e.target.value } })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Slogan / Descrição Curta</label>
                  <input
                    type="text"
                    value={settings.profile.description}
                    onChange={e => setSettings({ ...settings, profile: { ...settings.profile, description: e.target.value } })}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                  <User className="text-[#883545] w-6 h-6" />
                  Perfil do Usuário
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail de Acesso</label>
                    <input
                      type="email"
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-6 lg:p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-[#883545]/10 rounded-xl flex items-center justify-center text-[#883545]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Segurança da Conta</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altere sua senha de acesso ao portal</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nova Senha</label>
                      <div className="relative group">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          className="w-full p-4 pr-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#883545]/20 group-hover:border-[#883545]/20 transition-all outline-none"
                          placeholder="Min. 8 caracteres"
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#883545] transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        disabled={isChangingPass}
                        onClick={async () => {
                          if (newPass.length < 8) {
                            setPassMessage({ type: 'error', text: 'A senha deve ter pelo menos 8 caracteres!' });
                            return;
                          }
                          setIsChangingPass(true);
                          setPassMessage(null);
                          try {
                            const res = await fetch('/api/auth/change-password', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                              },
                              body: JSON.stringify({ new_password: newPass })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              setPassMessage({ type: 'success', text: 'Senha alterada com sucesso no Supabase! ✓' });
                              setNewPass('');
                              setShowNewPassword(false);
                            } else {
                              setPassMessage({ type: 'error', text: data.error || 'Erro ao alterar senha.' });
                            }
                          } catch (_) {
                            setPassMessage({ type: 'error', text: 'Erro de conexão. Tente novamente.' });
                          } finally {
                            setIsChangingPass(false);
                          }
                        }}
                        className="w-full h-14 bg-[#883545] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-[#883545]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {isChangingPass ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        {isChangingPass ? 'Atualizando...' : 'Atualizar Senha'}
                      </button>
                    </div>
                  </div>
                  {passMessage && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs font-bold mt-2 px-1 ${passMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}
                    >
                      {passMessage.text}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-10">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Serviços & Parceiros</h3>
              <section className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="p-1.5 bg-[#883545]/10 rounded-lg text-[#883545]">
                    <Plus className="w-4 h-4" />
                  </span>
                  Serviços Oferecidos
                </h3>
                <div className="flex gap-2">
                  <input
                    id="new-service"
                    type="text"
                    placeholder="Ex: Cerimonial Completo"
                    className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('services', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-service') as HTMLInputElement;
                      addItem('services', input.value);
                      input.value = '';
                    }}
                    className="px-6 bg-[#883545] text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(settings.services || []).map((service, idx) => (
                    <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                      {service}
                      <button onClick={() => removeItem('services', idx)} className="hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                    <Users className="w-4 h-4" />
                  </span>
                  Parceiros Recorrentes (BV)
                </h3>
                <div className="flex gap-2">
                  <input
                    id="new-partner"
                    type="text"
                    placeholder="Ex: Floricultura Modelo"
                    className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addItem('partners', (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('new-partner') as HTMLInputElement;
                      addItem('partners', input.value);
                      input.value = '';
                    }}
                    className="px-6 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {(settings.partners || []).map((partner, idx) => (
                    <span key={idx} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                      {partner}
                      <button onClick={() => removeItem('partners', idx)} className="hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                    <Calendar className="w-4 h-4" />
                  </span>
                  Locais de Evento
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      id="new-location-name"
                      type="text"
                      placeholder="Nome do Local (Ex: Villa Lobos)"
                      className="flex-1 p-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner"
                    />
                    <input
                      id="new-location-address"
                      type="text"
                      placeholder="Endereço Completo"
                      className="flex-[2] p-3 bg-slate-50 border-none rounded-xl text-sm font-bold shadow-inner"
                    />
                    <button
                      onClick={() => {
                        const nameInput = document.getElementById('new-location-name') as HTMLInputElement;
                        const addrInput = document.getElementById('new-location-address') as HTMLInputElement;
                        if (nameInput.value) {
                          addItem('locations', { name: nameInput.value, address: addrInput.value });
                          nameInput.value = '';
                          addrInput.value = '';
                        }
                      }}
                      className="px-6 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {(settings.locations || []).map((loc, idx) => (
                    <div key={idx} className="flex flex-col p-4 bg-indigo-50 border border-indigo-100 rounded-2xl relative group">
                      <span className="text-sm font-black text-indigo-900">{typeof loc === 'string' ? loc : loc.name}</span>
                      {typeof loc !== 'string' && loc.address && (
                        <span className="text-[10px] font-bold text-indigo-700/60 mt-1 line-clamp-1">{loc.address}</span>
                      )}
                      <button
                        onClick={() => removeItem('locations', idx)}
                        className="absolute top-2 right-2 p-1.5 bg-white text-rose-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-8">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Metas & Regras Financeiras</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta de Faturamento Anual (R$)</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#883545]" />
                    <input
                      type="number"
                      value={settings.goals.annualRevenue}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, annualRevenue: Number(e.target.value) } })}
                      className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                </div>
                {/* Removido Multa Geral Padrão pois a Regra de Escalonamento já cobre tudo */}
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Regra de Escalonamento (Sugestão Inteligente)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo Crítico (Dias)</label>
                    <input
                      type="number"
                      value={settings.goals.fineThresholdDays}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, fineThresholdDays: Number(e.target.value) } })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">% Longe do Evento</label>
                    <input
                      type="number"
                      value={settings.goals.fineEarlyPercent}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, fineEarlyPercent: Number(e.target.value) } })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">% Próximo ao Evento</label>
                    <input
                      type="number"
                      value={settings.goals.fineLatePercent}
                      onChange={e => setSettings({ ...settings, goals: { ...settings.goals, fineLatePercent: Number(e.target.value) } })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner"
                    />
                  </div>
                </div>
                <p className="text-[10px] font-medium text-slate-400 italic">
                  * Atualmente: {settings.goals.fineEarlyPercent}% se faltar mais de {settings.goals.fineThresholdDays} dias, senão {settings.goals.fineLatePercent}%.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-10">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Preferências do Sistema</h3>

              <section className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <LayoutDashboard className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-700">Modo Compacto</p>
                      <p className="text-[10px] font-bold text-slate-400">Ver mais dados na mesma visualização</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, ui: { ...settings.ui, compactMode: !settings.ui.compactMode } })}
                    className={`w-12 h-6 rounded-full transition-all relative ${settings.ui.compactMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.ui.compactMode ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </section>

              <section className="space-y-6 pt-6 border-t border-slate-100">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Integração Autentique</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Token (Autentique)</label>
                    <input
                      type="password"
                      placeholder="Cole seu token do Autentique aqui..."
                      value={settings.autentiqueToken || ''}
                      onChange={e => setSettings({ ...settings, autentiqueToken: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#883545]/20 outline-none"
                    />
                  </div>
                </div>
              </section>


              <section className="space-y-6 pt-6 border-t border-slate-100">
                <h3 className="text-lg font-black text-rose-800 uppercase tracking-widest">Backup & Segurança</h3>
                <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 space-y-4">
                  <p className="text-xs font-bold text-rose-900/60 leading-relaxed">
                    Exporte todos os seus dados (clientes, pagamentos, despesas e configurações) para um arquivo JSON. Recomendamos fazer um backup externo uma vez por mês.
                  </p>
                  <button
                    onClick={handleExport}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-rose-700 border border-rose-200 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-rose-100 transition-all"
                  >
                    <Download className="w-4 h-4" /> Exportar Backup (Download)
                  </button>

                  <label className="w-full flex items-center justify-center gap-3 py-4 bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-rose-200 transition-all cursor-pointer">
                    <RefreshCw className="w-4 h-4" /> Restaurar Backup (Upload)
                    <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                  </label>

                  <div className="pt-4 border-t border-rose-100">
                    <button
                      onClick={handleEmailBackup}
                      disabled={isEmailBackupLoading}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-[#883545] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#883545]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isEmailBackupLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enviando Backup...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Enviar Backup Completo p/ meu E-mail
                        </>
                      )}
                    </button>
                    <p className="text-[10px] font-bold text-center text-slate-400 mt-3 uppercase tracking-widest">
                      Agendamento automático: Todas as segundas às 08:00
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Botão Salvar Flutuante */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 50 }}
          className="fixed bottom-24 lg:bottom-12 right-6 lg:right-12 z-[100]"
        >
          <button
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="group flex items-center gap-4 px-10 py-5 bg-[#883545] text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-[#883545]/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSavingAll ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            )}
            {isSavingAll ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export const BrideModal = ({ isOpen, onClose, onSave, brideToEdit, serviceTypes, locations, onGoToSettings, isContractFlow }: { isOpen: boolean, onClose: () => void, onSave: (bride: any) => Promise<boolean>, brideToEdit?: Bride | null, serviceTypes: string[], locations: { name: string; address: string }[], onGoToSettings: () => void, isContractFlow?: boolean }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    event_date: '',
    service_type: '',
    event_location: '',
    contract_value: '',
    original_value: '',
    cpf: '',
    rg: '',
    birth_date: '',
    address: '',
    phone_number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    spouse_name: '',
    event_start_time: '',
    event_end_time: '',
    signer_type: 'noiva' as 'noiva' | 'noivo' | 'ambos',
    marital_status: 'Solteiro(a)',
    profession: '',
    nationality: 'Brasileiro(a)',
    couple_type: 'tradicional' as 'tradicional' | 'noivas' | 'noivos',
    spouse_cpf: '',
    spouse_rg: '',
    event_address: '',
    has_different_locations: false,
    reception_location: '',
    reception_address: '',
    guest_count: '',
    address_number: '',
    address_complement: '',
    extra_hour_value: 300,
    created_at: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (brideToEdit) {
      setFormData({
        name: brideToEdit.name || '',
        email: brideToEdit.email || '',
        event_date: brideToEdit.event_date ? brideToEdit.event_date.split('T')[0] : '',
        service_type: brideToEdit.service_type || '',
        event_location: brideToEdit.event_location || '',
        contract_value: brideToEdit.contract_value?.toString() || '',
        original_value: brideToEdit.original_value?.toString() || '',
        cpf: brideToEdit.cpf || '',
        rg: brideToEdit.rg || '',
        birth_date: brideToEdit.birth_date ? brideToEdit.birth_date.split('T')[0] : '',
        address: brideToEdit.address || '',
        phone_number: brideToEdit.phone_number || '',
        neighborhood: brideToEdit.neighborhood || '',
        city: brideToEdit.city || '',
        state: brideToEdit.state || '',
        zip_code: brideToEdit.zip_code || '',
        spouse_name: brideToEdit.spouse_name || '',
        event_start_time: brideToEdit.event_start_time || '',
        event_end_time: brideToEdit.event_end_time || '',
        signer_type: (brideToEdit as any).signer_type || 'noiva',
        marital_status: (brideToEdit as any).marital_status || 'Solteiro(a)',
        profession: (brideToEdit as any).profession || '',
        nationality: (brideToEdit as any).nationality || 'Brasileiro(a)',
        couple_type: (brideToEdit as any).couple_type || 'tradicional',
        spouse_cpf: (brideToEdit as any).spouse_cpf || '',
        spouse_rg: (brideToEdit as any).spouse_rg || '',
        event_address: (brideToEdit as any).event_address || '',
        has_different_locations: (brideToEdit as any).has_different_locations || false,
        reception_location: (brideToEdit as any).reception_location || '',
        reception_address: (brideToEdit as any).reception_address || '',
        guest_count: (brideToEdit as any).guest_count || '',
        address_number: (brideToEdit as any).address_number || '',
        address_complement: (brideToEdit as any).address_complement || '',
        extra_hour_value: (brideToEdit as any).extra_hour_value || 350,
        created_at: brideToEdit.created_at ? brideToEdit.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        name: '',
        email: '',
        event_date: '',
        service_type: '',
        event_location: '',
        contract_value: '',
        original_value: '',
        cpf: '',
        rg: '',
        birth_date: '',
        address: '',
        phone_number: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        spouse_name: '',
        event_start_time: '',
        event_end_time: '',
        signer_type: 'noiva',
        marital_status: 'Solteiro(a)',
        profession: '',
        nationality: 'Brasileiro(a)',
        couple_type: 'tradicional',
        spouse_cpf: '',
        spouse_rg: '',
        event_address: '',
        has_different_locations: false,
        reception_location: '',
        reception_address: '',
        guest_count: '',
        address_number: '',
        address_complement: '',
        extra_hour_value: 350,
        created_at: new Date().toISOString().split('T')[0]
      });
    }
  }, [brideToEdit, isOpen]);

  const maskCPF = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const maskRG = (v: string) => {
    // Permite números e a letra X (maiúscula ou minúscula)
    const d = v.replace(/[^0-9xX]/g, '').slice(0, 9);
    if (d.length <= 2) return d;
    if (d.length <= 5) return d.replace(/(\d{2})([0-9xX]+)/, '$1.$2');
    if (d.length <= 8) return d.replace(/(\d{2})(\d{3})([0-9xX]+)/, '$1.$2.$3');
    return d.replace(/(\d{2})(\d{3})(\d{3})([0-9xX])/, '$1.$2.$3-$4');
  };

  const maskPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  };

  const maskCEP = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
  };

  const handleCepChange = async (cep: string) => {
    const masked = maskCEP(cep);
    const cleanCep = masked.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, zip_code: masked }));

    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#883545]/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-[#883545] p-6 text-white text-center relative flex-shrink-0">
          <button onClick={onClose} className="absolute right-4 top-4 p-2 hover:bg-white/10 rounded-full transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <h2 className="text-2xl font-black uppercase tracking-widest">
            {isContractFlow ? 'Dados do Contrato' : (brideToEdit ? 'Editar Evento' : 'Novo Evento')}
          </h2>
        </div>

        <form className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4 lg:space-y-6" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const success = await onSave(formData);
            if (success) {
              onClose();
            }
          } catch (error) {
            console.error("Erro ao salvar:", error);
          }
        }}>
          <div className="space-y-6">
            {/* Seletor de Data de Inclusão */}
            <div className={`p-4 rounded-3xl border transition-all ${isContractFlow ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-[#883545]/5 border-[#883545]/10 shadow-sm'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-2xl flex items-center justify-center shadow-sm ${isContractFlow ? 'bg-slate-200 text-slate-400' : 'bg-white text-[#883545]'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Data de Inclusão no Sistema</p>
                    <h4 className="text-sm font-black text-slate-700 mt-1">
                      {isContractFlow ? 'Definida automaticamente para hoje' : 'Quando este registro foi criado?'}
                    </h4>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 w-full lg:w-48">
                  <input
                    type="date"
                    disabled={isContractFlow}
                    className="w-full rounded-xl border-slate-100 bg-white p-3 text-sm font-black text-[#883545] shadow-sm focus:ring-[#883545] border disabled:cursor-not-allowed"
                    value={formData.created_at}
                    onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                  />
                  {isContractFlow && (
                    <span className="text-[9px] font-bold text-slate-400 italic text-center">Travado para Contratos</span>
                  )}
                </div>
              </div>
            </div>

            {/* Escolha do Casal e Signatário */}
            <div className="p-4 bg-slate-50 rounded-3xl border border-[#883545]/10 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">Configuração do Casal</label>
                <div className="flex p-1 bg-white rounded-2xl border border-slate-100 shadow-inner">
                  {[
                    { id: 'tradicional', label: 'Noiva & Noivo', icon: Sparkles },
                    { id: 'noivas', label: 'Noiva & Noiva', icon: Heart },
                    { id: 'noivos', label: 'Noivo & Noivo', icon: Heart }
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, couple_type: type.id as any, signer_type: type.id === 'noivos' ? 'noivo' : 'noiva' })}
                      className={`flex-1 py-2.5 px-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center gap-1 ${formData.couple_type === type.id ? 'bg-[#883545] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <type.icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`space-y-2 ${isContractFlow ? 'border-t border-slate-200/50 pt-4' : ''}`}>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center">
                  {isContractFlow ? 'Quem assinará o contrato?' : 'Quem é o cliente principal?'}
                </label>
                <div className="flex p-1 bg-white rounded-2xl border border-slate-100 shadow-inner">
                  {formData.couple_type === 'tradicional' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, signer_type: 'noiva' })}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.signer_type === 'noiva' ? 'bg-[#883545] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Noiva
                      </button>
                      {isContractFlow && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, signer_type: 'ambos' })}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.signer_type === 'ambos' ? 'bg-[#883545] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Ambos
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, signer_type: 'noivo' })}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.signer_type === 'noivo' ? 'bg-[#883545] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Noivo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, signer_type: (formData.couple_type === 'noivas' ? 'noiva' : 'noivo') })}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.signer_type !== 'ambos' ? 'bg-[#883545] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Contratante
                      </button>
                      {isContractFlow && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, signer_type: 'ambos' })}
                          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.signer_type === 'ambos' ? 'bg-[#883545] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          Ambos
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Identificação Principal (Signatário) */}
              <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-6 bg-[#883545]/10 rounded-lg flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[#883545]" />
                  </div>
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                    {formData.couple_type === 'tradicional' ? (formData.signer_type === 'noiva' ? 'Contratante (Noiva)' : 'Contratante (Noivo)') : 'Contratante (Signatário)'}
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase">
                    {formData.couple_type === 'tradicional' ? (formData.signer_type === 'noiva' ? 'Nome da Noiva' : 'Nome do Noivo') : 'Nome Completo'}
                  </label>
                  <input
                    required
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold focus:ring-[#883545] border shadow-inner"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">CPF</label>
                    <input
                      required
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-sm font-bold shadow-inner"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">RG</label>
                    <input
                      required
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-sm font-bold shadow-inner"
                      placeholder="00.000.000-0"
                      maxLength={12}
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: maskRG(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Nacionalidade</label>
                    <select
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    >
                      <option value={formData.couple_type === 'noivas' || (formData.couple_type === 'tradicional' && formData.signer_type === 'noiva') ? 'Brasileira' : 'Brasileiro'}>
                        {formData.couple_type === 'noivas' || (formData.couple_type === 'tradicional' && formData.signer_type === 'noiva') ? 'Brasileira' : 'Brasileiro'}
                      </option>
                      <option value="Estrangeiro(a)">Estrangeiro(a)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Estado Civil</label>
                    <select
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold"
                      value={formData.marital_status}
                      onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                    >
                      {formData.couple_type === 'noivas' || (formData.couple_type === 'tradicional' && formData.signer_type === 'noiva') ? (
                        <>
                          <option value="Solteira">Solteira</option>
                          <option value="Casada">Casada</option>
                          <option value="Divorciada">Divorciada</option>
                          <option value="Viúva">Viúva</option>
                        </>
                      ) : (
                        <>
                          <option value="Solteiro">Solteiro</option>
                          <option value="Casado">Casado</option>
                          <option value="Divorciado">Divorciado</option>
                          <option value="Viúvo">Viúvo</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Profissão</label>
                    <input
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-sm font-bold shadow-inner"
                      placeholder="Ex: Advogada, Arquiteto..."
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Data de Nascimento</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-sm font-bold shadow-inner"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="p-4 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-6 bg-[#883545]/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5 text-[#883545]" />
                  </div>
                  <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Endereço de Residência</label>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-[#883545] uppercase">CEP</label>
                    <input
                      className="w-full rounded-xl border-[#883545]/20 bg-white p-3 text-xs font-black shadow-sm focus:ring-[#883545] border"
                      placeholder="00000-000"
                      value={formData.zip_code}
                      onChange={(e) => handleCepChange(e.target.value)}
                    />
                  </div>
                  <div className="col-span-3 flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Rua / Logradouro</label>
                    <input
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold shadow-inner"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Número</label>
                    <input
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold shadow-inner"
                      placeholder="Ex: 123"
                      value={formData.address_number}
                      onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Complemento / Apto</label>
                    <input
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold shadow-inner"
                      placeholder="Ex: Apto 12 Bloco B"
                      value={formData.address_complement}
                      onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Bairro</label>
                    <input
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold shadow-inner"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Cidade</label>
                    <input
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold shadow-inner"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase">UF</label>
                    <input
                      maxLength={2}
                      className="w-full rounded-xl border-slate-100 bg-slate-50 p-3 text-xs font-bold shadow-inner text-center uppercase"
                      placeholder="SP"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Parceiro */}
              <div className="p-4 bg-[#883545]/5 border border-[#883545]/10 rounded-3xl space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-[#883545] uppercase tracking-widest">
                    {formData.couple_type === 'tradicional' ? (formData.signer_type === 'noiva' ? 'Nome do Noivo' : 'Nome da Noiva') :
                      (formData.couple_type === 'noivas' ? 'Nome da Noiva 2' : 'Nome do Noivo 2')}
                  </label>
                  <input
                    className="w-full rounded-xl border-[#883545]/10 bg-white p-3 lg:p-4 text-sm font-bold focus:ring-[#883545] border shadow-sm"
                    value={formData.spouse_name}
                    onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                  />
                </div>

                {formData.signer_type === 'ambos' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 gap-3 pt-2"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">CPF (Parceiro 2)</label>
                      <input
                        className="w-full rounded-xl border-slate-100 bg-white p-3 text-xs font-bold shadow-sm"
                        placeholder="000.000.000-00"
                        value={formData.spouse_cpf}
                        onChange={(e) => setFormData({ ...formData, spouse_cpf: maskCPF(e.target.value) })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">RG (Parceiro 2)</label>
                      <input
                        className="w-full rounded-xl border-slate-100 bg-white p-3 text-xs font-bold shadow-sm"
                        maxLength={12}
                        value={formData.spouse_rg}
                        onChange={(e) => setFormData({ ...formData, spouse_rg: maskRG(e.target.value) })}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail para assinatura</label>
                  <input
                    type="email"
                    required={isContractFlow}
                    placeholder="email@exemplo.com"
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm focus:ring-[#883545] border shadow-inner transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp (Contrato)</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm focus:ring-[#883545] border shadow-inner transition-all"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: maskPhone(e.target.value) })}
                  />
                </div>
              </div>

              {/* Detalhes do Evento */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Evento</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold shadow-inner"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Serviço</label>
                  <select
                    required
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold shadow-inner"
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  >
                    <option value="">Selecione o serviço...</option>
                    {([...(serviceTypes || [])].sort((a, b) => a.localeCompare(b))).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Local do Evento / Cerimônia</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold shadow-inner"
                    value={formData.event_location}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'NEW_LOCATION') {
                        onGoToSettings();
                      } else {
                        const matchedLoc = locations.find(l => l.name === val);
                        setFormData(prev => ({
                          ...prev,
                          event_location: val,
                          event_address: matchedLoc?.address || prev.event_address
                        }));
                      }
                    }}
                  >
                    <option value="">Selecione o local...</option>
                    {(locations || [])
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((l) => (
                        <option key={l.name} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    <option value="NEW_LOCATION" className="font-black text-[#883545] bg-rose-50 italic">➕ Cadastrar Novo Local...</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Local Manual (Editável)</label>
                  <span className="text-[8px] font-bold text-[#883545]/50 italic">Pode alterar o nome aqui caso não queira cadastrar</span>
                </div>
                <input
                  placeholder="Nome do Local..."
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-bold shadow-inner"
                  value={formData.event_location}
                  onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Endereço do Local</label>
                <input
                  placeholder="Rua, Número, Cidade..."
                  className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm shadow-inner"
                  value={formData.event_address}
                  onChange={(e) => setFormData({ ...formData, event_address: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#883545]" />
                  <span className="text-[10px] font-black text-slate-600 uppercase">Cerimônia e Recepção em locais diferentes?</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, has_different_locations: !formData.has_different_locations })}
                  className={`w-10 h-5 rounded-full transition-all relative ${formData.has_different_locations ? 'bg-[#883545]' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.has_different_locations ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {formData.has_different_locations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 p-4 bg-[#883545]/5 rounded-3xl border border-[#883545]/10"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-[#883545] uppercase tracking-widest">Local da Recepção</label>
                    <select
                      className="w-full rounded-xl border-[#883545]/10 bg-white p-3 lg:p-4 text-sm font-bold shadow-sm"
                      value={formData.reception_location}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'NEW_LOCATION') {
                          onGoToSettings();
                        } else {
                          const matchedLoc = locations.find(l => l.name === val);
                          setFormData(prev => ({
                            ...prev,
                            reception_location: val,
                            reception_address: matchedLoc?.address || prev.reception_address
                          }));
                        }
                      }}
                    >
                      <option value="">Selecione o local...</option>
                      {(locations || [])
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((l) => (
                          <option key={l.name} value={l.name}>
                            {l.name}
                          </option>
                        ))}
                      <option value="NEW_LOCATION" className="font-black text-[#883545] bg-rose-50 italic">➕ Cadastrar Novo Local...</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-[#883545] uppercase tracking-widest">Nome do Local (Editável)</label>
                    </div>
                    <input
                      placeholder="Nome do buffet, bistro, etc..."
                      className="w-full rounded-xl border-[#883545]/10 bg-white p-3 lg:p-4 text-sm shadow-sm font-bold"
                      value={formData.reception_location}
                      onChange={(e) => setFormData({ ...formData, reception_location: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-[#883545] uppercase tracking-widest">Endereço da Recepção</label>
                    <input
                      placeholder="Rua, Número, Cidade..."
                      className="w-full rounded-xl border-[#883545]/10 bg-white p-3 lg:p-4 text-sm shadow-sm"
                      value={formData.reception_address}
                      onChange={(e) => setFormData({ ...formData, reception_address: e.target.value })}
                    />
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Convidados</label>
                  <input
                    type="number"
                    placeholder="Qtd"
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-black shadow-inner"
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hora Extra (R$)</label>
                  <input
                    type="number"
                    placeholder="350"
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-black shadow-inner"
                    value={formData.extra_hour_value}
                    onChange={(e) => setFormData({ ...formData, extra_hour_value: Number(e.target.value) })}
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor do Contrato (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full rounded-xl border-[#883545]/10 bg-slate-50 p-3 lg:p-4 text-sm font-black text-[#883545] shadow-inner"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Horários do Evento</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário Início</label>
                    <input type="time" className="w-full p-3 lg:p-4 bg-white border border-slate-100 rounded-xl text-sm font-bold shadow-sm" value={formData.event_start_time} onChange={(e) => setFormData({ ...formData, event_start_time: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário Fim</label>
                    <input type="time" className="w-full p-3 lg:p-4 bg-white border border-slate-100 rounded-xl text-sm font-bold shadow-sm" value={formData.event_end_time} onChange={(e) => setFormData({ ...formData, event_end_time: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-[#883545] text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-[#883545]/25 hover:bg-[#883545]/90 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
            {isContractFlow ? (
              <>
                Próximo: Revisar Contrato
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              brideToEdit ? 'Atualizar Cliente' : 'Salvar Cadastro'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'confirm' }: { isOpen: boolean, onClose: () => void, onConfirm?: () => void, title: string, message: string, type?: 'confirm' | 'alert' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#883545]/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className={`size-16 mx-auto mb-6 rounded-2xl flex items-center justify-center ${type === 'confirm' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {type === 'confirm' ? <AlertCircle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8 px-4">{message}</p>
          <div className="flex gap-3">
            {type === 'confirm' ? (
              <>
                <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button onClick={() => { onConfirm?.(); onClose(); }} className="flex-1 py-4 bg-[#883545] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#883545]/90 shadow-lg shadow-[#883545]/20 transition-all">Confirmar</button>
              </>
            ) : (
              <button onClick={onClose} className="w-full py-4 bg-[#883545] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#883545]/90 shadow-lg shadow-[#883545]/20 transition-all">Entendido</button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---


export { SettingsView };
