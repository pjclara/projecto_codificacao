import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';


import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import Diagnosticos from '@/components/diagnosticos/Diagnosticos';



export default function Diagnósticos() {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Diagnósticos'),
            href: '/diagnosticos',
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Diagnósticos" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Diagnosticos />
            </div>
        </AppLayout>
    );
}
