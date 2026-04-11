import React from 'react';

export default function Table({ columns = [], rows = [], emptyMessage = 'No records found' }) {
  return (
    <div className="section-shell overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="table-header">
            {columns.map((column) => (
              <th key={column.key} className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : rows}
        </tbody>
      </table>
    </div>
  );
}
