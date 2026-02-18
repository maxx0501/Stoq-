import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line, ComposedChart
} from 'recharts';
import { 
    TrendingUp, PieChart as PieIcon, Clock, CreditCard, Users, 
    CalendarRange, UserCheck, TrendingDown, BarChart4, Layers 
} from 'lucide-react';

// --- UTILITÁRIOS ---
const formatMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
const formatCompact = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1).replace('.0', '') + 'k';
    return val.toString();
};
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-700 z-50">
          <p className="font-bold text-slate-300 mb-1 uppercase tracking-wider">{label}</p>
          <p className="font-black text-lg">
             {typeof payload[0].value === 'number' && payload[0].value > 100 
                ? formatMoney(payload[0].value) 
                : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
};

// --- COMPONENTES DOS GRÁFICOS (WIDGETS) ---

// 1. Pizza (Categorias)
const CategoriesWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {data?.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', color: '#64748b'}} />
        </PieChart>
    </ResponsiveContainer>
);

// 2. Barra Horizontal (Vendedores)
const SellersWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#94a3b8', fontSize: 10, formatter: (v:any) => formatCompact(v) }} />
        </BarChart>
    </ResponsiveContainer>
);

// 3. Área (Evolução 30 Dias)
const DailyEvolutionWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={6} />
            <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={formatCompact} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
        </AreaChart>
    </ResponsiveContainer>
);

// 4. Barra Vertical (Vendas por Hora)
const HourlySalesWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={3}/>
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);

// 5. Pizza (Formas de Pagamento)
const PaymentMethodsWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value">
                {data?.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', color: '#64748b'}} />
        </PieChart>
    </ResponsiveContainer>
);

// 6. Barra Vertical (Vendas por Dia da Semana)
const WeekDayWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
        </BarChart>
    </ResponsiveContainer>
);

// 7. Barra Horizontal (Top Clientes)
const CustomersWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#94a3b8', fontSize: 10, formatter: (v:any) => formatCompact(v) }} />
        </BarChart>
    </ResponsiveContainer>
);

// 8. Linha (Ticket Médio)
const TicketWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={6}/>
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="ticket" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
        </LineChart>
    </ResponsiveContainer>
);

// 9. Área (Volume de Vendas)
const VolumeWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
             <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={6}/>
            <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="step" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorCount)" />
        </AreaChart>
    </ResponsiveContainer>
);

// 10. Gráfico Misto (Faturamento vs Volume)
const MixedWidget = ({ data }: any) => (
    <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
            <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={6}/>
            <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={formatCompact}/>
            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar yAxisId="left" dataKey="total" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </ComposedChart>
    </ResponsiveContainer>
);

// --- REGISTRO MESTRE (TEM QUE SER NO FINAL DO ARQUIVO) ---
export const WIDGET_REGISTRY = [
    { 
        id: 'evolution', title: 'Evolução Financeira', description: 'Crescimento de vendas (30 dias).',
        icon: TrendingUp, color: 'text-emerald-500', component: DailyEvolutionWidget, dataKey: 'dailyHistory'
    },
    { 
        id: 'hourly', title: 'Horários de Pico', description: 'Volume de vendas por hora.',
        icon: Clock, color: 'text-amber-500', component: HourlySalesWidget, dataKey: 'salesByHour'
    },
    { 
        id: 'payments', title: 'Formas de Pagamento', description: 'Pix vs Crédito vs Dinheiro.',
        icon: CreditCard, color: 'text-blue-500', component: PaymentMethodsWidget, dataKey: 'payments'
    },
    { 
        id: 'categories', title: 'Vendas por Categoria', description: 'O que sai mais na sua loja.',
        icon: PieIcon, color: 'text-purple-500', component: CategoriesWidget, dataKey: 'categories' 
    },
    { 
        id: 'sellers', title: 'Ranking de Vendedores', description: 'Quem está vendendo mais.',
        icon: Users, color: 'text-blue-600', component: SellersWidget, dataKey: 'sellers'
    },
    { 
        id: 'weekday', title: 'Dias Movimentados', description: 'Vendas por dia da semana.',
        icon: CalendarRange, color: 'text-indigo-500', component: WeekDayWidget, dataKey: 'salesByWeekDay'
    },
    { 
        id: 'customers', title: 'Top Clientes VIP', description: 'Quem gasta mais na loja.',
        icon: UserCheck, color: 'text-cyan-500', component: CustomersWidget, dataKey: 'topCustomers'
    },
    { 
        id: 'ticket', title: 'Ticket Médio', description: 'Média de gasto por pedido.',
        icon: TrendingDown, color: 'text-rose-500', component: TicketWidget, dataKey: 'dailyHistory'
    },
    { 
        id: 'volume', title: 'Volume de Pedidos', description: 'Quantidade de vendas (unidades).',
        icon: Layers, color: 'text-violet-500', component: VolumeWidget, dataKey: 'dailyHistory'
    },
    { 
        id: 'mixed', title: 'Faturamento vs Volume', description: 'Relação Valor x Quantidade.',
        icon: BarChart4, color: 'text-orange-500', component: MixedWidget, dataKey: 'dailyHistory'
    },
];
