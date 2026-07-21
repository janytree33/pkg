import React from 'react';

export default function DataTable({ 
  columns = [], 
  data = [], 
  emptyMessage = '데이터가 없습니다.' 
}) {
  return (
    <div className="w-full overflow-hidden bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
      <div className="overflow-x-auto flex-1 h-full">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-slate-600 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 shadow-sm">
            <tr>
              {columns.map((col, index) => (
                <th 
                  key={col.key || index} 
                  className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors even:bg-slate-50/50 dark:even:bg-slate-800/50"
                >
                  {columns.map((col, colIndex) => (
                    <td 
                      key={col.key || colIndex} 
                      className="px-4 py-3 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800"
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-4 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
