import React, { useState } from 'react';
import {
    Moon,
    Sun,
    LogOut,
    ChevronDown,
    ChevronUp,
    Wallet,
    CreditCard,
    TrendingUp,
    DollarSign,
    PieChart as PieChartIcon,
    Plus,
    Minus,
    Save,
    Shield,
    Coins,
    Banknote,
    ShoppingBag,
    Lock,
    Eye,
    EyeOff,
    BarChart3,
    Edit2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// --- Mock Data ---
const MOCK_TRANSACTIONS = [
    { id: 1, category: 'Food & Beverage', amount: 125.00, date: '2026-02-13', color: '#10B981' },
    { id: 2, category: 'Food & Beverage', amount: 30.00, date: '2026-02-13', color: '#10B981' },
    { id: 3, category: 'Transport', amount: 70.00, date: '2026-02-11', color: '#3B82F6' },
    { id: 4, category: 'Shopping', amount: 264.00, date: '2026-02-10', color: '#F59E0B' },
    { id: 5, category: 'Bills', amount: 1010.00, date: '2026-02-09', color: '#EF4444' },
];

const MOCK_CHART_DATA = [
    { name: 'Feb 8', amt: 0 },
    { name: 'Feb 9', amt: 107 },
    { name: 'Feb 10', amt: 1010 },
    { name: 'Feb 11', amt: 264 },
    { name: 'Feb 12', amt: 70 },
    { name: 'Feb 13', amt: 155 },
    { name: 'Feb 14', amt: 0 },
];

const MOCK_PIE_DATA = [
    { name: 'Food & Beverage', value: 2846, color: '#10B981' },
    { name: 'Bills', value: 1010, color: '#EF4444' },
    { name: 'Transport', value: 450, color: '#3B82F6' },
    { name: 'Shopping', value: 800, color: '#F59E0B' },
];

const DENOMINATIONS_CONFIG = [
    { label: 'NT$1000', value: 1000, type: 'bill' },
    { label: 'NT$500', value: 500, type: 'bill' },
    { label: 'NT$200', value: 200, type: 'bill' },
    { label: 'NT$100', value: 100, type: 'bill' },
    { label: 'NT$50', value: 50, type: 'coin' },
    { label: 'NT$10', value: 10, type: 'coin' },
    { label: 'NT$5', value: 5, type: 'coin' },
    { label: 'NT$1', value: 1, type: 'coin' },
];

// --- Reusable Components ---

const CounterInput = ({ value, onChange, darkMode }) => (
    <div className="flex items-center gap-0.5">
        <button
            onClick={() => onChange(Math.max(0, (parseInt(value) || 0) - 1))}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
            <Minus size={14} />
        </button>
        <input
            type="number"
            min="0"
            placeholder="0"
            value={value || ''}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className={`w-10 text-center p-1 rounded-md text-sm outline-none bg-transparent font-bold ${darkMode ? 'text-white' : 'text-neutral-900'}`}
        />
        <button
            onClick={() => onChange((parseInt(value) || 0) + 1)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors active:scale-95 ${darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
            <Plus size={14} />
        </button>
    </div>
);

export default function MoneyTracker() {
    const [darkMode, setDarkMode] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState('February 2026');

    // Section Visibility States
    const [showMonthly, setShowMonthly] = useState(true);
    const [showWallet, setShowWallet] = useState(true);
    const [showDenominations, setShowDenominations] = useState(false);
    const [showSecurity, setShowSecurity] = useState(true);
    const [showCashBreakdown, setShowCashBreakdown] = useState(false);

    // Chart States
    const [showCharts, setShowCharts] = useState(true);
    const [chartRange, setChartRange] = useState('7 days');
    const [customDays, setCustomDays] = useState('');

    // Form States
    const [incomeAmount, setIncomeAmount] = useState('');
    const [incomeNote, setIncomeNote] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseCategory, setExpenseCategory] = useState('Food & Beverage');
    const [expenseDate, setExpenseDate] = useState('2026-02-14');
    const [expenseNote, setExpenseNote] = useState('');
    const [deductWallet, setDeductWallet] = useState(true);

    // Security Form States
    const [showPassword, setShowPassword] = useState(false);

    // Denomination State
    const [denomCounts, setDenomCounts] = useState(
        DENOMINATIONS_CONFIG.reduce((acc, curr) => ({ ...acc, [curr.value]: 0 }), {})
    );

    const handleDenomChange = (value, count) => {
        setDenomCounts(prev => ({ ...prev, [value]: Math.max(0, parseInt(count) || 0) }));
    };

    const calculateCashTotal = () => {
        return Object.entries(denomCounts).reduce((total, [val, count]) => {
            return total + (parseInt(val) * count);
        }, 0);
    };

    const toggleTheme = () => setDarkMode(!darkMode);

    const themeClasses = darkMode
        ? "bg-black text-white"
        : "bg-gray-100 text-neutral-900"; // Changed slightly for better contrast in light mode

    // Optimized card classes for mobile (full width, no radius) vs desktop (rounded)
    const cardClasses = darkMode
        ? "bg-neutral-900 border-y sm:border border-neutral-800"
        : "bg-white border-y sm:border border-gray-200 shadow-sm";

    const inputClasses = darkMode
        ? "bg-black border-neutral-800 text-white placeholder-neutral-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        : "bg-white border-gray-300 text-neutral-900 placeholder-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

    const primaryBtn = "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20";
    const secondaryBtn = darkMode
        ? "bg-neutral-800 hover:bg-neutral-700 text-white"
        : "bg-gray-200 hover:bg-gray-300 text-neutral-800";

    return (
        <div className={`min-h-screen w-full transition-colors duration-200 font-sans ${themeClasses} pb-20`}>

            {/* --- Header --- */}
            <header className={`sticky top-0 z-50 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center ${darkMode ? 'bg-black/80 border-neutral-800' : 'bg-white/80 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Wallet className="text-white h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-base leading-tight">Money Tracker</h1>
                        <p className={`text-[10px] sm:text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>hizkia.jonathanb@gmail.com</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-neutral-800 text-yellow-400' : 'hover:bg-gray-100 text-orange-500'}`}>
                        {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${darkMode ? 'border-neutral-800 hover:bg-neutral-800 text-neutral-300' : 'border-gray-300 hover:bg-gray-100 text-neutral-600'}`}>
                        <LogOut size={14} />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Main Container - Removed padding on mobile to allow edge-to-edge cards */}
            <main className="max-w-6xl mx-auto sm:p-6 space-y-0 sm:space-y-6">

                {/* --- Monthly Summary Section --- */}
                <section className={`sm:rounded-xl p-4 sm:p-6 mb-2 sm:mb-0 ${cardClasses}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <PieChartIcon className="text-blue-500" size={20} />
                            Summary
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className={`appearance-none pl-3 pr-8 py-1 rounded-lg text-xs font-medium outline-none cursor-pointer ${darkMode ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-neutral-900'}`}
                                >
                                    <option>Feb 2026</option>
                                    <option>Jan 2026</option>
                                </select>
                                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`} size={12} />
                            </div>
                            <button onClick={() => setShowMonthly(!showMonthly)} className={`p-1 rounded-md ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}>
                                {showMonthly ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                        </div>
                    </div>

                    {showMonthly && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            {[
                                { label: 'Spending', val: '$3,114', sub: '+12%', icon: DollarSign, col: 'text-emerald-500' },
                                { label: 'Daily Avg', val: '$111', sub: 'Target: $100', icon: TrendingUp, col: 'text-blue-500' },
                                { label: 'Big Expense', val: '$1,010', sub: 'Bills', icon: CreditCard, col: 'text-violet-500' },
                                { label: 'Top Cat', val: 'Food', sub: '$2,846', icon: ShoppingBag, col: 'text-orange-500' },
                            ].map((item, idx) => (
                                <div key={idx} className={`p-3 rounded-xl flex flex-col justify-between h-24 sm:h-32 ${darkMode ? 'bg-black/40 border border-neutral-800' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>{item.label}</span>
                                        <item.icon size={16} className={item.col} />
                                    </div>
                                    <div>
                                        <div className={`text-lg sm:text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-neutral-900'}`}>{item.val}</div>
                                        <div className={`text-[10px] mt-0.5 ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>{item.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 sm:gap-6">

                    {/* --- Left Column: Wallet & Denominations --- */}
                    <div className="space-y-0 sm:space-y-6">

                        {/* Wallet Summary */}
                        <section className={`sm:rounded-xl p-4 sm:p-6 mb-2 sm:mb-0 ${cardClasses}`}>
                            <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowWallet(!showWallet)}>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Wallet className="text-blue-500" size={20} />
                                    Wallet
                                </h2>
                                {showWallet ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>

                            {showWallet && (
                                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-900/20">
                                        <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Current Balance</p>
                                        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">$ 12,450.00</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Add Income</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                placeholder="$"
                                                value={incomeAmount}
                                                onChange={(e) => setIncomeAmount(e.target.value)}
                                                className={`w-1/3 p-2.5 rounded-lg text-sm outline-none border transition-all ${inputClasses}`}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Note"
                                                value={incomeNote}
                                                onChange={(e) => setIncomeNote(e.target.value)}
                                                className={`flex-1 p-2.5 rounded-lg text-sm outline-none border transition-all ${inputClasses}`}
                                            />
                                        </div>
                                        <button className={`w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 ${primaryBtn}`}>
                                            <Plus size={16} /> Add Funds
                                        </button>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Denominations / Cash Counter */}
                        <section className={`sm:rounded-xl p-4 sm:p-6 mb-2 sm:mb-0 ${cardClasses}`}>
                            <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setShowDenominations(!showDenominations)}>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Coins className="text-yellow-500" size={20} />
                                    Cash Drawer
                                </h2>
                                {showDenominations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>

                            {showDenominations && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-2">
                                    <div className="flex justify-between items-end p-4 rounded-lg bg-emerald-900/10 border border-emerald-500/20">
                                        <div>
                                            <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>Physical Cash</p>
                                            <p className={`text-xl sm:text-2xl font-mono font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>
                                                NT$ {calculateCashTotal().toLocaleString()}
                                            </p>
                                        </div>
                                        <button className="text-xs font-bold text-emerald-500 hover:text-emerald-400 underline">Sync</button>
                                    </div>

                                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                        {DENOMINATIONS_CONFIG.map((denom) => (
                                            <div key={denom.value} className={`flex items-center justify-between p-2 rounded-lg ${darkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border-b border-gray-100 last:border-0'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${denom.type === 'bill'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {denom.type === 'bill' ? <Banknote size={12} /> : <span className="text-[10px]">$</span>}
                                                    </div>
                                                    <span className={`text-sm font-medium ${darkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>{denom.label}</span>
                                                </div>

                                                <CounterInput
                                                    value={denomCounts[denom.value]}
                                                    onChange={(val) => handleDenomChange(denom.value, val)}
                                                    darkMode={darkMode}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <button className={`w-full mt-2 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${secondaryBtn}`}>
                                        <Save size={16} /> Save Drawer
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* --- Right Column: Add Expense & Feed --- */}
                    <div className="lg:col-span-2 space-y-0 sm:space-y-6">

                        {/* Add Expense Form */}
                        <section className={`sm:rounded-xl p-5 sm:p-6 mb-2 sm:mb-0 ${cardClasses} relative overflow-hidden`}>
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                            <h2 className="text-xl font-bold mb-6 pl-2">New Expense</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Amount</label>
                                    <div className="relative">
                                        <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>$</span>
                                        <input
                                            type="number"
                                            value={expenseAmount}
                                            onChange={(e) => setExpenseAmount(e.target.value)}
                                            className={`w-full pl-8 pr-4 py-3 rounded-xl text-lg font-bold outline-none border transition-all ${inputClasses}`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Category</label>
                                    <div className="relative">
                                        <select
                                            value={expenseCategory}
                                            onChange={(e) => setExpenseCategory(e.target.value)}
                                            className={`w-full pl-4 pr-10 py-3.5 rounded-xl text-sm font-medium outline-none border appearance-none cursor-pointer ${inputClasses}`}
                                        >
                                            <option>Food & Beverage</option>
                                            <option>Shopping</option>
                                            <option>Transport</option>
                                            <option>Bills</option>
                                            <option>Other</option>
                                        </select>
                                        <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`} size={16} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Date</label>
                                    <input
                                        type="date"
                                        value={expenseDate}
                                        onChange={(e) => setExpenseDate(e.target.value)}
                                        className={`w-full px-4 py-3 rounded-xl text-sm outline-none border ${inputClasses}`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-neutral-500' : 'text-neutral-500'}`}>Notes</label>
                                    <input
                                        type="text"
                                        value={expenseNote}
                                        onChange={(e) => setExpenseNote(e.target.value)}
                                        placeholder="Optional description..."
                                        className={`w-full px-4 py-3 rounded-xl text-sm outline-none border ${inputClasses}`}
                                    />
                                </div>
                            </div>

                            {/* Advanced Options Toggle */}
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowCashBreakdown(!showCashBreakdown)}
                                    className={`text-xs font-bold flex items-center gap-1 mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                                >
                                    {showCashBreakdown ? 'Hide Cash Breakdown' : 'Show Cash Breakdown'}
                                </button>

                                {showCashBreakdown && (
                                    <div className={`p-4 rounded-xl border mb-4 animate-in fade-in slide-in-from-top-2 ${darkMode ? 'bg-neutral-900/50 border-neutral-800' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className={`text-xs mb-3 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Select denominations used:</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {['1000', '500', '100', '50'].map(val => (
                                                <div key={val} className={`flex flex-col items-center justify-between p-2 rounded border ${darkMode ? 'border-neutral-800 bg-black' : 'border-gray-200 bg-white'}`}>
                                                    <span className="text-[10px] font-mono mb-1 text-neutral-500">NT${val}</span>
                                                    <div className="flex items-center">
                                                        <button className="w-6 h-6 flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">-</button>
                                                        <input type="text" placeholder="0" className="w-8 text-center bg-transparent text-sm outline-none" />
                                                        <button className="w-6 h-6 flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200">+</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setDeductWallet(!deductWallet)}>
                                    <div className={`w-11 h-6 rounded-full p-1 transition-colors ${deductWallet ? 'bg-blue-600' : 'bg-neutral-600'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${deductWallet ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                    <span className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>Deduct from wallet balance</span>
                                </div>
                            </div>

                            <button className={`w-full py-4 rounded-xl font-bold text-base shadow-lg shadow-blue-900/20 transform transition-all active:scale-[0.98] ${primaryBtn}`}>
                                Add Expense
                            </button>
                        </section>

                        {/* Recent Transactions List */}
                        <section className={`sm:rounded-xl overflow-hidden flex flex-col mb-2 sm:mb-0 ${cardClasses}`}>
                            <div className="p-4 sm:p-5 border-b border-inherit flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-wider">Recent Expenses</h3>
                                <button className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>View All</button>
                            </div>
                            <div className="flex-1">
                                {MOCK_TRANSACTIONS.map((tx) => (
                                    <div key={tx.id} className={`p-4 flex items-center justify-between border-b last:border-0 hover:opacity-80 transition-opacity cursor-pointer ${darkMode ? 'border-neutral-800' : 'border-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-neutral-800' : 'bg-gray-100'}`}>
                                                {/* Category Color Dot */}
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tx.color }} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>{tx.category}</p>
                                                <p className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>{tx.date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`font-mono font-medium ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                                                -${tx.amount.toFixed(2)}
                                            </div>
                                            <div className={`p-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors`}>
                                                <ChevronDown size={14} className="text-neutral-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 text-center">
                                <button className={`w-full py-2 text-xs font-medium rounded-lg border ${darkMode ? 'border-neutral-800 text-neutral-400 hover:text-white' : 'border-gray-200 text-neutral-500 hover:text-black'}`}>
                                    Load More
                                </button>
                            </div>
                        </section>

                        {/* Charts Section - Re-designed to match Screenshot */}
                        <section className={`sm:rounded-xl p-4 sm:p-6 mb-2 sm:mb-0 ${cardClasses}`}>
                            {/* Header Bar */}
                            <div className={`flex justify-between items-center pb-4 mb-4 border-b ${darkMode ? 'border-neutral-800' : 'border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                    <BarChart3 size={20} className={darkMode ? 'text-white' : 'text-black'} />
                                    <h2 className="text-lg font-bold">Spending Charts</h2>
                                </div>
                                <button onClick={() => setShowCharts(!showCharts)} className="text-neutral-500 hover:text-neutral-300">
                                    {showCharts ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {showCharts && (
                                <div className="animate-in fade-in slide-in-from-top-4">
                                    {/* Dashboard Header & Controls */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-bold leading-tight">Spending Dashboard</h2>
                                            <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Showing the last {chartRange}.</p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {['7 days', '14 days', '30 days'].map((range) => (
                                                <button
                                                    key={range}
                                                    onClick={() => setChartRange(range)}
                                                    className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${chartRange === range
                                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                                                            : (darkMode ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-gray-200 text-neutral-600 hover:text-black')
                                                        }`}
                                                >
                                                    {range}
                                                </button>
                                            ))}
                                            <button className={`px-4 py-2 text-xs font-bold rounded-full border transition-all flex items-center gap-1 ${darkMode ? 'border-neutral-700 text-neutral-300 hover:bg-neutral-800' : 'border-gray-300 text-neutral-600 hover:bg-gray-100'
                                                }`}>
                                                Edit buttons
                                            </button>
                                        </div>
                                    </div>

                                    {/* Custom Range Input */}
                                    <div className="flex gap-2 mb-6">
                                        <input
                                            type="text"
                                            placeholder="Custom days"
                                            value={customDays}
                                            onChange={(e) => setCustomDays(e.target.value)}
                                            className={`flex-1 sm:max-w-xs px-4 py-3 rounded-xl text-sm outline-none border ${darkMode ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-gray-50 border-gray-200 text-neutral-900'}`}
                                        />
                                        <button className={`px-6 py-3 rounded-xl text-sm font-bold border ${darkMode ? 'border-neutral-700 text-white hover:bg-neutral-800' : 'border-gray-300 text-neutral-900 hover:bg-gray-100'}`}>
                                            Apply custom range
                                        </button>
                                    </div>

                                    {/* Charts Grid - New Design Style */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                        {/* Daily Spending Area Chart */}
                                        <div className={`rounded-2xl p-4 sm:p-6 flex flex-col ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200/50'}`}>
                                            <div className="text-center mb-4">
                                                <h3 className={`text-lg font-bold ${darkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>Daily Spending</h3>
                                                <p className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Tip: Use scroll or pinch to zoom, drag to pan.</p>
                                            </div>

                                            <div className="flex-1 w-full min-h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={MOCK_CHART_DATA}>
                                                        <defs>
                                                            <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5} />
                                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        {/* Improved Grid Styling */}
                                                        <CartesianGrid strokeDasharray="0" vertical={true} horizontal={true} stroke={darkMode ? '#404040' : '#d1d5db'} />
                                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#4b5563' }} axisLine={false} tickLine={false} dy={15} />
                                                        <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#4b5563' }} axisLine={false} tickLine={false} dx={-10} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: darkMode ? '#171717' : '#fff', borderColor: darkMode ? '#404040' : '#e5e5e5', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                            itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="amt"
                                                            stroke="#3B82F6"
                                                            strokeWidth={4}
                                                            fillOpacity={1}
                                                            fill="url(#colorAmt)"
                                                            activeDot={{ r: 8, strokeWidth: 0, fill: '#60A5FA' }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Category Pie Chart */}
                                        <div className={`rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center ${darkMode ? 'bg-neutral-800' : 'bg-neutral-200/50'}`}>
                                            <h3 className={`text-lg font-bold mb-6 ${darkMode ? 'text-neutral-200' : 'text-neutral-700'}`}>Spending by Category</h3>

                                            {/* Legend Pill */}
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 ${darkMode ? 'bg-neutral-700' : 'bg-white'}`}>
                                                <div className="w-8 h-4 bg-emerald-500 rounded-sm"></div>
                                                <span className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>Food & Beverage</span>
                                            </div>

                                            <div className="w-full h-[250px] relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={MOCK_PIE_DATA}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={0}
                                                            outerRadius={100}
                                                            dataKey="value"
                                                            stroke={darkMode ? '#262626' : '#fff'}
                                                            strokeWidth={2}
                                                        >
                                                            {MOCK_PIE_DATA.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white font-bold drop-shadow-md">
                                                    {/* Only visible if there's a hole, but with full pie we rely on segments */}
                                                </div>
                                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none">
                                                    <span className="text-white font-bold text-lg drop-shadow-md">100.0%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Security Section - Updated to "Change Password" UI */}
                        <section className={`sm:rounded-xl p-5 sm:p-6 mb-2 sm:mb-0 ${cardClasses}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    Security
                                </h2>
                                <button
                                    onClick={() => setShowSecurity(!showSecurity)}
                                    className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 ${darkMode ? 'border-neutral-700 text-neutral-300' : 'border-gray-300 text-neutral-600'}`}
                                >
                                    {showSecurity ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {showSecurity ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            {showSecurity && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-start gap-3 mb-6">
                                        <Lock size={20} className={darkMode ? 'text-white' : 'text-black'} />
                                        <div>
                                            <h3 className="text-base font-bold">Change Password</h3>
                                            <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Update your password anytime. You will need your current password.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-w-lg">
                                        <div className="space-y-1">
                                            <label className={`text-xs font-medium ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Current password</label>
                                            <input
                                                type="password"
                                                className={`w-full px-4 py-3 rounded-lg text-sm outline-none border transition-all ${inputClasses}`}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className={`text-xs font-medium ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>New password</label>
                                            <input
                                                type="password"
                                                className={`w-full px-4 py-3 rounded-lg text-sm outline-none border transition-all ${inputClasses}`}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className={`text-xs font-medium ${darkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>Confirm new password</label>
                                            <input
                                                type="password"
                                                className={`w-full px-4 py-3 rounded-lg text-sm outline-none border transition-all ${inputClasses}`}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button className={`w-full py-3 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20`}>
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        <div className={`text-center py-6 text-[10px] font-medium tracking-widest uppercase opacity-40 ${darkMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            Money Tracker MVP © 2026
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}