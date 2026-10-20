import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ChevronDown, MessageSquare, MapPin, 
  Tag, RefreshCw, LogOut, Trash2, Calendar, Clock,
  Filter, CheckCircle2, XCircle, Clock3, MessageCircle, AlertCircle
} from 'lucide-react';

// Configuração e inicialização do Firebase
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, addDoc, 
  updateDoc, deleteDoc, doc, query, orderBy 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDZeGkxjfgC7NFo_bGoapV3ghcUr9DmJJo",
  authDomain: "crm-barbosa-planejados.firebaseapp.com",
  projectId: "crm-barbosa-planejados",
  storageBucket: "crm-barbosa-planejados.firebasestorage.app",
  messagingSenderId: "650063887762",
  appId: "1:650063887762:web:6f02999fc05dcda49a954b",
  measurementId: "G-DJL14QTR6R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Definição dos Status e Etiquetas
const STATUS_OPTIONS = [
  { id: 'lead_novo', label: 'Lead Novo', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: 'em_atendimento', label: 'Em Atendimento', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { id: 'fechado', label: 'Fechado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: 'desqualificado', label: 'Desqualificado', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

const TAG_OPTIONS = [
  { id: 'venda_fechada', label: 'Venda Fechada', bg: '#10B981', text: '#FFFFFF', icon: CheckCircle2 },
  { id: 'sem_venda', label: 'Sem Venda', bg: '#EF4444', text: '#FFFFFF', icon: XCircle },
  { id: 'adiado', label: 'Deixou p/ Outro Momento', bg: '#F59E0B', text: '#FFFFFF', icon: Clock3 },
  { id: 'contato_feito', label: 'Contato Realizado', bg: '#3B82F6', text: '#FFFFFF', icon: MessageCircle },
  { id: 'aguardando', label: 'Aguardando Contato', bg: '#6B7280', text: '#FFFFFF', icon: AlertCircle },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLeadId, setExpandedLeadId] = useState(null);

  // Escuta em tempo real do Firestore
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeads(leadsList);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar do Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (usernameInput === 'barbosaplanejados' && passwordInput === 'bleadsplanejados2026') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha incorretos.');
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      await updateDoc(doc(db, "leads", leadId), { status: newStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleUpdateTag = async (leadId, newTagLabel) => {
    try {
      await updateDoc(doc(db, "leads", leadId), { tag: newTagLabel });
    } catch (error) {
      console.error("Erro ao atualizar etiqueta:", error);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm("Deseja realmente remover este lead?")) {
      try {
        await deleteDoc(doc(db, "leads", leadId));
      } catch (error) {
        console.error("Erro ao deletar lead:", error);
      }
    }
  };

  // Filtros
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.telefone || '').includes(searchTerm) ||
      (lead.cidade || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = filterTag === 'all' || lead.tag === filterTag;
    return matchesSearch && matchesTag;
  });

  // Paginação de 30
  const LEADS_PER_PAGE = 30;
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE) || 1;
  const currentLeads = filteredLeads.slice((currentPage - 1) * LEADS_PER_PAGE, currentPage * LEADS_PER_PAGE);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#232323] flex items-center justify-center p-4">
        <div className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <img 
              src="https://lh3.googleusercontent.com/d/1yjuTmSwWdcaWnig-9oLyuSYhmMbmQGLz" 
              alt="Logo Barbosa Planejados" 
              className="w-20 h-20 rounded-full mb-4 border-2 border-[#DB9C55] object-cover"
            />
            <h1 className="text-2xl font-bold text-[#DB9C55]">CRM LEADS</h1>
            <p className="text-xs text-gray-400 mt-1">Barbosa Planejados</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Usuário</label>
              <input 
                type="text" 
                value={usernameInput} 
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full bg-[#282828] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#DB9C55]"
                placeholder="Informe o usuário"
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Senha</label>
              <input 
                type="password" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#282828] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#DB9C55]"
                placeholder="Informe a senha"
                required 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#DB9C55] hover:bg-[#c68b47] text-black font-semibold py-3 rounded-xl text-sm transition duration-200"
            >
              Entrar no CRM
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#232323] text-gray-100 p-4 md:p-8">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#1c1c1c] p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-4">
          <img 
            src="https://lh3.googleusercontent.com/d/1yjuTmSwWdcaWnig-9oLyuSYhmMbmQGLz" 
            alt="Logo" 
            className="w-14 h-14 rounded-full border border-[#DB9C55] object-cover"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#DB9C55]">CRM LEADS</h1>
            <p className="text-xs text-gray-400">Barbosa Planejados</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-gray-400 block">Total de Leads</span>
            <span className="text-2xl font-bold text-[#DB9C55]">{leads.length}</span>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="p-3 bg-[#282828] hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition border border-gray-700"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome, telefone ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#DB9C55]"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-[#1c1c1c] border border-gray-800 rounded-xl pl-11 pr-8 py-3 text-sm focus:outline-none focus:border-[#DB9C55] appearance-none cursor-pointer"
            >
              <option value="all">Todas as Etiquetas</option>
              {TAG_OPTIONS.map(tag => (
                <option key={tag.id} value={tag.label}>{tag.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <RefreshCw className="animate-spin mb-4 text-[#DB9C55]" size={32} />
          <p className="text-sm">Carregando leads do banco de dados...</p>
        </div>
      ) : currentLeads.length === 0 ? (
        <div className="text-center py-20 bg-[#1c1c1c] rounded-2xl border border-gray-800">
          <p className="text-gray-400 text-sm">Nenhum lead encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentLeads.map((lead) => {
            const currentTagObj = TAG_OPTIONS.find(t => t.label === lead.tag) || TAG_OPTIONS[4];
            const isExpanded = expandedLeadId === lead.id;

            return (
              <div 
                key={lead.id}
                className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-4 hover:border-[#DB9C55]/50 transition duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Lead Main Info */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#282828] rounded-xl text-[#DB9C55]">
                      <Tag size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base text-white">{lead.nome || 'Lead sem nome'}</h3>
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ backgroundColor: currentTagObj.bg, color: currentTagObj.text }}
                        >
                          {lead.tag || 'Aguardando Contato'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                        {lead.cidade && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} className="text-[#DB9C55]" />
                            {lead.cidade}
                          </span>
                        )}
                        {lead.data && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {lead.data} {lead.hora && `às ${lead.hora}`}
                          </span>
                        )}
                        {lead.origem && (
                          <span className="bg-[#282828] px-2 py-0.5 rounded text-[10px] uppercase font-bold text-gray-300">
                            {lead.origem}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Accordion */}
                  <div className="flex items-center gap-3 self-end lg:self-center">
                    {/* WhatsApp Action */}
                    {lead.telefone && (
                      <a 
                        href={`https://wa.me/${lead.telefone}?text=Olá%20${encodeURIComponent(lead.nome || '')},%20tudo%20bem?%20Vi%20seu%20contato%20no%20anúncio%20da%20Barbosa%20Planejados!`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition border border-emerald-500/20"
                      >
                        <MessageSquare size={14} />
                        WhatsApp
                      </a>
                    )}

                    {/* Expand Details/Status Accordion Button */}
                    <button 
                      onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                      className="flex items-center gap-1.5 bg-[#282828] hover:bg-gray-700 px-3 py-2 rounded-xl text-xs text-gray-300 transition border border-gray-700"
                    >
                      Status / Etiquetas
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Delete */}
                    <button 
                      onClick={() => handleDeleteLead(lead.id)}
                      className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Excluir Lead"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Status Picker */}
                    <div>
                      <span className="block text-gray-400 font-medium mb-2">Alterar Status do Funil:</span>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => handleUpdateStatus(lead.id, opt.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                              lead.status === opt.id ? opt.color + ' ring-1 ring-[#DB9C55]' : 'bg-[#282828] text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tag Picker */}
                    <div>
                      <span className="block text-gray-400 font-medium mb-2">Etiquetar Lead:</span>
                      <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => handleUpdateTag(lead.id, tag.label)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition opacity-80 hover:opacity-100"
                            style={{ backgroundColor: tag.bg, color: tag.text }}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="md:col-span-2 bg-[#232323] p-3 rounded-xl border border-gray-800 text-gray-400 space-y-1">
                      {lead.anuncio && <p><strong className="text-gray-300">Anúncio:</strong> {lead.anuncio}</p>}
                      {lead.prazo && <p><strong className="text-gray-300">Prazo informado:</strong> {lead.prazo}</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 bg-[#1c1c1c] p-4 rounded-2xl border border-gray-800 text-xs text-gray-400">
          <span>Página {currentPage} de {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 bg-[#282828] rounded-xl border border-gray-700 hover:border-[#DB9C55] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 bg-[#282828] rounded-xl border border-gray-700 hover:border-[#DB9C55] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}