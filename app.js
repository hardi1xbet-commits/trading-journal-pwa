const { useState, useEffect, useMemo } = React;

const Download = () => React.createElement('svg', { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' })
);

const Save = () => React.createElement('svg', { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' })
);

const Upload = () => React.createElement('svg', { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
  React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12' })
);

const TradingJournal2026 = () => {
  const [entries, setEntries] = useState({});

  const holidays = [
    '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
    '2026-05-25', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25'
  ];

  const tradingDays = useMemo(() => {
    const days = [];
    const start = new Date('2026-01-05');
    const end = new Date('2026-12-31');
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = d.toISOString().split('T')[0];
        const isHoliday = holidays.includes(dateStr);
        days.push({
          date: dateStr,
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
          status: isHoliday ? 'OFF - USA HOLIDAY' : 'Trading Day',
          isHoliday
        });
      }
    }
    return days;
  }, []);

  useEffect(() => {
    const data = localStorage.getItem('trading-journal-2026');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setEntries(parsed.entries || {});
      } catch (e) {
        console.log('No saved data');
      }
    }
  }, []);

  const calculateRow = (initialDeposit, dailyPL) => {
    const deposit = parseFloat(initialDeposit) || 0;
    const pl = parseFloat(dailyPL) || 0;
    
    if (pl > 0) {
      return {
        allocation10: pl * 0.10,
        allocation40: pl * 0.40,
        allocation50: pl * 0.50,
        netResult: deposit + pl
      };
    }
    return {
      allocation10: 0,
      allocation40: 0,
      allocation50: 0,
      netResult: deposit + pl
    };
  };

  const getWeekNumber = (dateStr) => {
    const d = new Date(dateStr);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const calculateTotals = () => {
    const weeks = {};
    
    tradingDays.forEach(day => {
      if (day.isHoliday) return;
      
      const entry = entries[day.date] || {};
      const deposit = parseFloat(entry.initialDeposit) || 0;
      const pl = parseFloat(entry.dailyPL) || 0;
      const calc = calculateRow(entry.initialDeposit, entry.dailyPL);
      
      const weekKey = `${new Date(day.date).getFullYear()}-W${getWeekNumber(day.date)}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { pl: 0, deposit: 0, alloc10: 0, alloc40: 0, alloc50: 0, netResult: 0 };
      }
      
      weeks[weekKey].pl += pl;
      weeks[weekKey].deposit += deposit;
      weeks[weekKey].alloc10 += calc.allocation10;
      weeks[weekKey].alloc40 += calc.allocation40;
      weeks[weekKey].alloc50 += calc.allocation50;
      weeks[weekKey].netResult += calc.netResult;
    });
    
    return weeks;
  };

  const weeks = calculateTotals();

  const saveToStorage = () => {
    try {
      localStorage.setItem('trading-journal-2026', JSON.stringify({
        entries,
        lastUpdated: new Date().toISOString()
      }));
      alert('✅ Saved successfully!');
    } catch (error) {
      alert('⚠️ Could not save');
    }
  };

  const loadFromStorage = () => {
    try {
      const data = localStorage.getItem('trading-journal-2026');
      if (data) {
        const parsed = JSON.parse(data);
        setEntries(parsed.entries || {});
        alert('✅ Loaded successfully!');
      } else {
        alert('ℹ️ No saved data found');
      }
    } catch (error) {
      alert('ℹ️ No saved data found');
    }
  };

  const updateEntry = (date, field, value) => {
    setEntries(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value
      }
    }));
  };

  const exportCSV = () => {
    let csv = 'Date,Day,Status,Deposit,P/L,10%,40%,50%,Net\n';
    
    tradingDays.forEach(day => {
      const entry = entries[day.date] || {};
      const deposit = entry.initialDeposit || '';
      const pl = entry.dailyPL || '';
      
      if (day.isHoliday) {
        csv += `${day.date},${day.dayName},${day.status},-,-,-,-,-,-\n`;
      } else {
        const calc = calculateRow(deposit, pl);
        csv += `${day.date},${day.dayName},${day.status},${deposit},${pl},${calc.allocation10.toFixed(2)},${calc.allocation40.toFixed(2)},${calc.allocation50.toFixed(2)},${calc.netResult.toFixed(2)}\n`;
      }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Trading_Journal_2026.csv';
    a.click();
  };

  const totalTradingDays = tradingDays.filter(d => !d.isHoliday).length;

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4' },
    React.createElement('div', { className: 'max-w-7xl mx-auto' },
      React.createElement('div', { className: 'bg-slate-800 rounded-lg shadow-2xl p-4 mb-4 border border-slate-700' },
        React.createElement('h1', { className: 'text-2xl font-bold text-white mb-3' }, '📊 2026 Trading Journal'),
        React.createElement('div', { className: 'flex gap-2 flex-wrap' },
          React.createElement('button', { 
            onClick: saveToStorage, 
            className: 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2' 
          },
            React.createElement(Save),
            ' Save'
          ),
          React.createElement('button', { 
            onClick: loadFromStorage, 
            className: 'bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2' 
          },
            React.createElement(Upload),
            ' Load'
          ),
          React.createElement('button', { 
            onClick: exportCSV, 
            className: 'bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2' 
          },
            React.createElement(Download),
            ' CSV'
          )
        )
      ),
      React.createElement('div', { className: 'grid grid-cols-2 gap-3 mb-4' },
        React.createElement('div', { className: 'bg-slate-800 p-3 rounded-lg border border-slate-700' },
          React.createElement('p', { className: 'text-slate-400 text-xs' }, 'Trading Days'),
          React.createElement('p', { className: 'text-white text-xl font-bold' }, totalTradingDays)
        ),
        React.createElement('div', { className: 'bg-slate-800 p-3 rounded-lg border border-slate-700' },
          React.createElement('p', { className: 'text-slate-400 text-xs' }, 'Holidays'),
          React.createElement('p', { className: 'text-white text-xl font-bold' }, holidays.length)
        )
      ),
      React.createElement('div', { className: 'bg-slate-800 rounded-lg shadow-2xl overflow-hidden border border-slate-700' },
        React.createElement('div', { className: 'overflow-x-auto' },
          React.createElement('table', { className: 'w-full text-xs' },
            React.createElement('thead', { className: 'bg-slate-900 sticky top-0' },
              React.createElement('tr', null,
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, 'Date'),
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, 'Day'),
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, 'Deposit'),
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, 'P/L'),
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, '10%'),
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, '40%'),
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, '50%'),
                React.createElement('th', { className: 'px-2 py-2 text-left text-slate-300 font-semibold' }, 'Net')
              )
            ),
            React.createElement('tbody', null,
              tradingDays.map((day, idx) => {
                const entry = entries[day.date] || {};
                const calc = day.isHoliday ? {} : calculateRow(entry.initialDeposit, entry.dailyPL);
                const pl = parseFloat(entry.dailyPL) || 0;
                
                const currentWeek = getWeekNumber(day.date);
                const nextDay = tradingDays[idx + 1];
                const isLastDayOfWeek = !nextDay || getWeekNumber(nextDay.date) !== currentWeek;
                const weekKey = `${new Date(day.date).getFullYear()}-W${currentWeek}`;
                const weekData = weeks[weekKey];

                return React.createElement(React.Fragment, { key: day.date },
                  React.createElement('tr', { 
                    className: `border-t border-slate-700 ${
                      day.isHoliday ? 'bg-slate-700' : 
                      pl > 0 ? 'bg-green-900/20' : 
                      pl < 0 ? 'bg-red-900/20' : ''
                    }` 
                  },
                    React.createElement('td', { className: 'px-2 py-2 text-slate-300' }, day.date.substring(5)),
                    React.createElement('td', { className: 'px-2 py-2 text-slate-300' }, day.dayName),
                    React.createElement('td', { className: 'px-2 py-2' },
                      !day.isHoliday ? React.createElement('input', {
                        type: 'number',
                        value: entry.initialDeposit || '',
                        onChange: (e) => updateEntry(day.date, 'initialDeposit', e.target.value),
                        placeholder: '0',
                        className: 'bg-slate-700 text-white px-2 py-1 rounded w-20 text-xs'
                      }) : React.createElement('span', { className: 'text-slate-500' }, '-')
                    ),
                    React.createElement('td', { className: 'px-2 py-2' },
                      !day.isHoliday ? React.createElement('input', {
                        type: 'number',
                        value: entry.dailyPL || '',
                        onChange: (e) => updateEntry(day.date, 'dailyPL', e.target.value),
                        placeholder: '0',
                        className: `px-2 py-1 rounded w-20 text-xs ${
                          pl > 0 ? 'bg-green-900/40 text-green-300' :
                          pl < 0 ? 'bg-red-900/40 text-red-300' :
                          'bg-slate-700 text-white'
                        }`
                      }) : React.createElement('span', { className: 'text-slate-500' }, '-')
                    ),
                    React.createElement('td', { className: 'px-2 py-2 text-blue-300' },
                      !day.isHoliday && calc.allocation10 > 0 ? `R${calc.allocation10.toFixed(0)}` : '-'
                    ),
                    React.createElement('td', { className: 'px-2 py-2 text-purple-300' },
                      !day.isHoliday && calc.allocation40 > 0 ? `R${calc.allocation40.toFixed(0)}` : '-'
                    ),
                    React.createElement('td', { className: 'px-2 py-2 text-orange-300' },
                      !day.isHoliday && calc.allocation50 > 0 ? `R${calc.allocation50.toFixed(0)}` : '-'
                    ),
                    React.createElement('td', { 
                      className: `px-2 py-2 font-semibold ${
                        !day.isHoliday && calc.netResult !== undefined ?
                        (calc.netResult >= (parseFloat(entry.initialDeposit) || 0) ? 'text-green-400' : 'text-red-400') :
                        'text-slate-500'
                      }` 
                    },
                      !day.isHoliday && calc.netResult !== undefined ? `R${calc.netResult.toFixed(0)}` : '-'
                    )
                  ),
                  
                  isLastDayOfWeek && weekData && React.createElement('tr', { 
                    className: 'bg-blue-900/30 border-t-2 border-blue-500' 
                  },
                    React.createElement('td', { colSpan: 2, className: 'px-2 py-2 font-bold text-blue-300 text-xs' },
                      `Week ${currentWeek}`
                    ),
                    React.createElement('td', { className: 'px-2 py-2 font-bold text-blue-300 text-xs' },
                      `R${weekData.deposit.toFixed(0)}`
                    ),
                    React.createElement('td', { 
                      className: `px-2 py-2 font-bold text-xs ${weekData.pl >= 0 ? 'text-green-400' : 'text-red-400'}` 
                    },
                      `R${weekData.pl.toFixed(0)}`
                    ),
                    React.createElement('td', { className: 'px-2 py-2 font-bold text-blue-300 text-xs' },
                      `R${weekData.alloc10.toFixed(0)}`
                    ),
                    React.createElement('td', { className: 'px-2 py-2 font-bold text-purple-300 text-xs' },
                      `R${weekData.alloc40.toFixed(0)}`
                    ),
                    React.createElement('td', { className: 'px-2 py-2 font-bold text-orange-300 text-xs' },
                      `R${weekData.alloc50.toFixed(0)}`
                    ),
                    React.createElement('td', { className: 'px-2 py-2 font-bold text-green-400 text-xs' },
                      `R${weekData.netResult.toFixed(0)}`
                    )
                  )
                );
              })
            )
          )
        )
      ),
      React.createElement('div', { className: 'bg-slate-800 rounded-lg shadow-2xl p-4 mt-4 border border-slate-700' },
        React.createElement('h2', { className: 'text-lg font-bold text-white mb-2' }, '📝 How to Use'),
        React.createElement('div', { className: 'space-y-2 text-slate-300 text-sm' },
          React.createElement('p', null,
            React.createElement('strong', { className: 'text-blue-400' }, '💾 Save:'),
            ' Always save after entering data'
          ),
          React.createElement('p', null,
            React.createElement('strong', { className: 'text-green-400' }, '📈 Auto-Calc:'),
            ' Positive P/L triggers 10%, 40%, 50% allocations'
          ),
          React.createElement('p', null,
            React.createElement('strong', { className: 'text-yellow-400' }, '📊 Weekly:'),
            ' Blue rows show week totals'
          ),
          React.createElement('p', null,
            React.createElement('strong', { className: 'text-purple-400' }, '📥 CSV:'),
            ' Export to Google Sheets anytime'
          ),
          React.createElement('p', null,
            React.createElement('strong', { className: 'text-pink-400' }, '📱 Install:'),
            ' Add to home screen for app-like experience!'
          )
        )
      )
    )
  );
};

ReactDOM.render(React.createElement(TradingJournal2026), document.getElementById('root'));
