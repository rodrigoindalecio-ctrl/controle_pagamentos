import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, FileText, Plus, Trash2, ChevronRight, AlertCircle, Sparkles, CheckCircle, Tag, User, MapPin, Building, CreditCard, Calendar } from 'lucide-react';
import { ContractTemplate } from '../../types';

const AVAILABLE_TAGS = [
    { label: 'Nome Noiva', tag: '{{cliente_nome}}', icon: User, group: 'Cliente' },
    { label: 'CPF Noiva', tag: '{{cliente_cpf}}', icon: CreditCard, group: 'Cliente' },
    { label: 'RG Noiva', tag: '{{cliente_rg}}', icon: CreditCard, group: 'Cliente' },
    { label: 'Endereço', tag: '{{cliente_endereco}}', icon: MapPin, group: 'Cliente' },
    { label: 'Telefone', tag: '{{cliente_telefone}}', icon: Tag, group: 'Cliente' },
    { label: 'Parceiro(a)', tag: '{{parceiro_nome}}', icon: User, group: 'Evento' },
    { label: 'Data Evento', tag: '{{data_evento}}', icon: Calendar, group: 'Evento' },
    { label: 'Valor', tag: '{{valor_contrato}}', icon: CreditCard, group: 'Evento' },
    { label: 'Empresa', tag: '{{empresa_nome}}', icon: Building, group: 'Empresa' },
    { label: 'CNPJ', tag: '{{empresa_cnpj}}', icon: CreditCard, group: 'Empresa' },
];

export const ContractTemplatesView = ({ authFetch, showAlert }: { authFetch: any, showAlert: (t: string, m: string) => void }) => {
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    const insertTag = (tag: string) => {
        if (!selectedTemplate || !textareaRef.current) return;
        
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = selectedTemplate.template_text;
        
        const newText = text.substring(0, start) + tag + text.substring(end);
        
        setSelectedTemplate({
            ...selectedTemplate,
            template_text: newText
        });

        // Devolve o foco e posiciona o cursor após a tag
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + tag.length, start + tag.length);
        }, 10);
    };

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await authFetch('/api/contract-templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
                if (data.length > 0 && !selectedTemplate) {
                    setSelectedTemplate(data[0]);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSave = async () => {
        if (!selectedTemplate) return;
        setIsSaving(true);
        try {
            const res = await authFetch(`/api/contract-templates/${selectedTemplate.id}`, {
                method: 'PUT',
                body: JSON.stringify(selectedTemplate)
            });
            if (res.ok) {
                showAlert('Sucesso', 'Modelo de contrato atualizado! ✓');
                fetchTemplates();
            } else {
                throw new Error('Erro ao salvar');
            }
        } catch (error) {
            showAlert('Erro', 'Não foi possível salvar o modelo.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = () => {
        setNewTemplateName('');
        setIsCreateModalOpen(true);
    };

    const handleConfirmCreate = async () => {
        if (!newTemplateName.trim()) return;

        try {
            const res = await authFetch('/api/contract-templates', {
                method: 'POST',
                body: JSON.stringify({ 
                    name: newTemplateName, 
                    template_text: `# ${newTemplateName}\n\nEscreva o conteúdo aqui...` 
                })
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                fetchTemplates();
            }
        } catch (error) {
            showAlert('Erro', 'Não foi possível criar o modelo.');
        }
    };

    return (
        <div className="flex h-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
            {/* Sidebar de Templates */}
            <div className="w-80 bg-slate-50/50 border-r border-slate-100 flex flex-col">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Modelos</h2>
                            <p className="text-[10px] font-black text-[#883545] uppercase tracking-widest">Contratos Autentique</p>
                        </div>
                        <button 
                            onClick={handleCreate}
                            className="p-3 bg-[#883545] text-white rounded-2xl shadow-lg shadow-[#883545]/20 hover:scale-105 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                                    selectedTemplate?.id === t.id 
                                    ? 'bg-white shadow-xl shadow-slate-200/50 scale-[1.02] border border-slate-100' 
                                    : 'hover:bg-white/50 text-slate-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${selectedTemplate?.id === t.id ? 'bg-[#883545] text-white' : 'bg-slate-200 text-slate-400'}`}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold">{t.name}</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 transition-all ${selectedTemplate?.id === t.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Editor Principal */}
            <div className="flex-1 flex flex-col">
                {selectedTemplate ? (
                    <>
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <input 
                                        className="text-xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0"
                                        value={selectedTemplate.name}
                                        onChange={e => setSelectedTemplate({...selectedTemplate, name: e.target.value})}
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Editando conteúdo do modelo</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-8 py-4 bg-[#883545] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#883545]/20 hover:-translate-y-1 active:scale-95 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSaving ? 'Salvando...' : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex-1 p-8 overflow-auto">
                            <div className="max-w-4xl mx-auto">
                                {/* Toolbar de Tags */}
                                <div className="mb-6 p-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2 sticky top-0 z-20">
                                    <div className="flex items-center gap-2 px-3 border-r border-slate-100 mr-1">
                                        <Tag className="w-3 h-3 text-[#883545]" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tags:</span>
                                    </div>
                                    {AVAILABLE_TAGS.map((t, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => insertTag(t.tag)}
                                            className="group flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-[#883545] text-slate-600 hover:text-white rounded-xl transition-all border border-slate-100 hover:border-[#883545]"
                                            title={`Inserir ${t.label}`}
                                        >
                                            <t.icon className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                            <span className="text-[10px] font-bold uppercase tracking-tight">{t.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    ref={textareaRef}
                                    className="w-full h-[600px] p-8 bg-slate-50 border-none rounded-[2rem] text-slate-700 font-medium leading-relaxed focus:ring-2 focus:ring-[#883545]/10 transition-all resize-none shadow-inner"
                                    value={selectedTemplate.template_text}
                                    onChange={e => setSelectedTemplate({...selectedTemplate, template_text: e.target.value})}
                                    placeholder="Comece a escrever seu contrato..."
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-bold">Selecione um modelo para editar</p>
                    </div>
                )}
            </div>

            {/* Modal de Criação Customizado */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-white/20"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-[#883545]/10 text-[#883545] rounded-2xl">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Novo Modelo</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina o nome do contrato</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Contrato</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleConfirmCreate()}
                                        placeholder="Ex: Assessoria Premium"
                                        className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-[#883545]/20 shadow-inner"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmCreate}
                                        className="flex-1 py-4 bg-[#883545] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#883545]/20 hover:-translate-y-1 active:scale-95 transition-all"
                                    >
                                        Criar Modelo
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
