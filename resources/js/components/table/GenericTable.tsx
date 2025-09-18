import { Button } from '@/components/ui/button';
import '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

interface Column<T> {
    key: keyof T | string; // field name
    label: string; // column header
    render?: (item: T) => React.ReactNode; // custom renderer
}

interface Action<T> {
    label: string;
    onClick: (item: T) => void;
    className?: string;
}

interface GenericTableProps<T> {
    data: T[];
    columns: Column<T>[];
    actions?: Action<T>[];
}

export default function GenericTable<T>({ data, columns, actions = [] }: GenericTableProps<T>) {
    const { t } = useTranslation();

    return (
        <table className="w-full min-w-[700px] sm:min-w-[900px] md:min-w-[1100px] leading-normal text-sm">
            <thead>
                <tr className="bg-gray-100 text-sm leading-normal text-gray-700 uppercase">
                    {columns.map((col) => (
                        <th key={col.key as string} className="px-6 py-3 text-left">
                            {col.label}
                        </th>
                    ))}
                    {actions.length > 0 && <th className="px-6 py-3 text-center">{t('Actions')}</th>}
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 transition hover:bg-gray-50">
                        {columns.map((col) => (
                            <td key={col.key as string} className="px-6 py-3 whitespace-nowrap">
                                {col.render ? col.render(item) : (item as any)[col.key]}
                            </td>
                        ))}
                        {actions.length > 0 && (
                            <td className="px-6 py-3 text-center">
                                {actions.map((action, i) => {
                                    let variant = "default";
                                    if (action.label === "delete") {
                                        variant = "destructive";
                                    } else if (action.label === "edit") {
                                        variant = "secondary";
                                    }
                                    return (
                                        <Button
                                            key={i}
                                            onClick={() => action.onClick(item)}
                                            variant={variant.toLowerCase() as any}
                                            size="sm"
                                            className="mx-1"
                                        >
                                            {t(action.label)}
                                        </Button>
                                    );
                                })}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
