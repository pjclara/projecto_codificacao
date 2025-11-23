import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import ProcedimentosComponent from '@/components/procedimentos/Procedimentos';



export default function Procedimentos() {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('Procedimentos'),
            href: '/procedimentos', // Replace with the correct URL or import the missing function
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Procedimentos" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <ProcedimentosComponent />
            </div>
        </AppLayout>
    );
}
