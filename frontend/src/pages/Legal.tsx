import { ArrowLeft, ShieldCheck, FileText, Lock } from 'lucide-react';

interface LegalProps {
  type: 'terms' | 'privacy' | 'lgpd';
  onBack: () => void;
}

export const Legal = ({ type, onBack }: LegalProps) => {
  
  const content = {
    terms: {
      title: "Termos de Uso",
      icon: <FileText className="text-blue-600" size={32} />,
      text: (
        <div className="space-y-6 text-slate-600">
          <p><strong>Última atualização: Fevereiro de 2026</strong></p>
          
          <h3 className="text-slate-900 font-bold text-lg">1. Aceite dos Termos</h3>
          <p>Ao criar uma conta no Stoq+, você concorda em cumprir estes termos de serviço. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site.</p>

          <h3 className="text-slate-900 font-bold text-lg">2. Licença de Uso</h3>
          <p>O Stoq+ concede a você uma licença limitada, não exclusiva e revogável para usar nosso software de gestão (SaaS) exclusivamente para fins comerciais internos da sua empresa.</p>

          <h3 className="text-slate-900 font-bold text-lg">3. Pagamentos e Assinaturas</h3>
          <p>O serviço é oferecido mediante pagamento (mensal ou anual). O cancelamento pode ser feito a qualquer momento, interrompendo a renovação automática. Não oferecemos reembolso para períodos parciais não utilizados, exceto se exigido por lei.</p>

          <h3 className="text-slate-900 font-bold text-lg">4. Responsabilidades</h3>
          <p>O Stoq+ não se responsabiliza por lucros cessantes, perda de dados decorrente de mau uso da ferramenta ou falhas de conexão do usuário. Nós realizamos backups diários, mas recomendamos que você também mantenha cópias de segurança de dados críticos.</p>
        </div>
      )
    },
    privacy: {
      title: "Política de Privacidade",
      icon: <Lock className="text-blue-600" size={32} />,
      text: (
        <div className="space-y-6 text-slate-600">
          <p><strong>Sua privacidade é nossa prioridade.</strong></p>
          
          <h3 className="text-slate-900 font-bold text-lg">1. Informações que Coletamos</h3>
          <p>Coletamos informações que você nos fornece diretamente: nome, e-mail, nome da empresa e dados de pagamento (processados de forma segura pelo Mercado Pago). Também armazenamos os dados que você insere no sistema (produtos, clientes, vendas) para o funcionamento da ferramenta.</p>

          <h3 className="text-slate-900 font-bold text-lg">2. Como Usamos seus Dados</h3>
          <p>Usamos as informações para operar, manter e fornecer os recursos do Stoq+. Não vendemos seus dados para terceiros em hipótese alguma.</p>

          <h3 className="text-slate-900 font-bold text-lg">3. Segurança</h3>
          <p>Implementamos medidas de segurança robustas (criptografia, HTTPS, servidores seguros) para proteger suas informações contra acesso não autorizado.</p>
        </div>
      )
    },
    lgpd: {
      title: "LGPD e Seus Direitos",
      icon: <ShieldCheck className="text-blue-600" size={32} />,
      text: (
        <div className="space-y-6 text-slate-600">
          <p>O Stoq+ está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p>

          <h3 className="text-slate-900 font-bold text-lg">1. Seus Direitos</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Confirmação e Acesso:</strong> Você pode solicitar uma cópia de todos os dados que temos sobre você.</li>
            <li><strong>Correção:</strong> Você pode corrigir dados incompletos ou desatualizados diretamente no painel.</li>
            <li><strong>Exclusão:</strong> Você pode solicitar a exclusão da sua conta e de todos os dados associados a qualquer momento.</li>
          </ul>

          <h3 className="text-slate-900 font-bold text-lg">2. Encarregado de Dados (DPO)</h3>
          <p>Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato com nosso time de suporte através do e-mail: privacidade@stoqplus.com.br</p>
        </div>
      )
    }
  };

  const current = content[type];

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans">
      <div className="max-w-3xl mx-auto p-6 md:p-12">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-bold mb-8"
        >
          <ArrowLeft size={20} /> Voltar
        </button>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              {current.icon}
            </div>
            <h1 className="text-3xl font-black text-slate-900">{current.title}</h1>
          </div>

          <div className="leading-relaxed">
            {current.text}
          </div>
        </div>

        <div className="mt-8 text-center text-slate-400 text-sm">
          &copy; 2026 Stoq+ Sistemas. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
};