import AppLogoIcon from './app-logo-icon';
import '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

export default function AppLogo() {
    const { t } = useTranslation();

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {t('MediC@dex')}
                </span>
                <span className="text-xs text-muted-foreground">
                    {t('Version')} 1.0 {import.meta.env.VITE_APP_VERSION}
                </span>
            </div>
        </>
    );
}
