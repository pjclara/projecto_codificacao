import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => React.Key;
  className?: string;
  headClassName?: string;
  bodyClassName?: string;
}

function Table<T>({ columns, data, rowKey, className = '', headClassName = '', bodyClassName = '' }: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-lg shadow ${className}`}>
      <table className="w-full min-w-[700px] sm:min-w-[900px] md:min-w-[1100px] leading-normal text-sm">
        <thead className={headClassName}>
          <tr className="bg-gray-100 text-sm leading-normal text-gray-700 uppercase dark:bg-gray-800 dark:text-gray-200">
            {columns.map((col, idx) => (
              <th key={idx} className={col.className || 'px-3 py-3 whitespace-nowrap text-left'}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {data.map((row, i) => (
            <tr key={rowKey(row)} className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
              {columns.map((col, idx) => (
                <td key={idx} className={col.className || 'px-3 py-3 whitespace-nowrap break-words max-w-[180px]'}>
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
