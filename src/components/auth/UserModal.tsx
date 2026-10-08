import React, { useState } from 'react';
import { X, UserCheck, Shield, Plus, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose }) => {
  const { db, currentUser, setCurrentUser, updateCurrentUserProfile } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    role: currentUser.role,
    roleTitle: currentUser.roleTitle,
    registrationNumber: currentUser.registrationNumber,
  });

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCurrentUserProfile(formData);
    setIsEditing(false);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle,
      registrationNumber: user.registrationNumber,
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs no-print">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600/30 border border-blue-500 rounded-lg text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Responsável Técnico & Usuário Ativo</h3>
              <p className="text-xs text-slate-400">
                Os dados aqui definidos serão impressos em todas as Ordens de Produção e laudos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active User Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3.5">
            <div className="p-2.5 bg-blue-600 text-white rounded-full mt-0.5">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-base">{currentUser.name}</span>
                <span className="text-[11px] font-semibold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                  Responsável Atual
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">{currentUser.roleTitle}</p>
              <p className="text-xs text-blue-700 font-mono mt-0.5">
                Registro Profissional: <strong>{currentUser.registrationNumber}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          {/* Toggle Edit or Switch User */}
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Trocar de Usuário Cadastrado
                </h4>
                <div className="space-y-2">
                  {db.users.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                          isCurrent
                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{u.name}</div>
                          <div className="text-xs text-slate-500">
                            {u.roleTitle} • <span className="font-mono text-slate-700">{u.registrationNumber}</span>
                          </div>
                        </div>
                        {isCurrent ? (
                          <span className="text-xs font-bold text-blue-600 flex items-center space-x-1">
                            <span>✓ Ativo</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 group-hover:text-slate-600">Selecionar</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Editar dados do Responsável atual (Nome, CREA, etc.)
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Editar Informações do Responsável Técnico
              </h4>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo do Responsável:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ex: Eng. Carlos Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Registro Profissional (CREA/CRQ/CFT):
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: CREA-SP 506.912/D"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cargo / Função:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.roleTitle}
                    onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: Responsável Técnico Mecânico"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">E-mail de Contato:</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
