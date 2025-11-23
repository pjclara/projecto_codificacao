import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import '@/lib/i18n';
import i18n from '@/lib/i18n';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, ClipboardPlus, LayoutGrid, Shield, Users, PocketKnife, ListCheck, Folder, Star, FolderTree } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { t } = useTranslation();

    const handleChangeLanguage = () => {
        const newLang = i18n.language === 'pt' ? 'en' : 'pt';
        i18n.changeLanguage(newLang);
    };

    const platformNavItems: NavItem[] = [
        {
            title: t('Dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    const settingsNavItems: NavItem[] = [
        {
            title: t('Users'),
            href: '/users',
            icon: Users,
        },
        {
            title: t('Roles'),
            href: '/roles',
            icon: Shield,
        },
        {
            title: t('Permissions'),
            href: '/permissions',
            icon: BookOpen,
        },
    ];

    const cmsNavItems: NavItem[] = [
        {
            title: t('CMS ICD-10'),
            href: '/cms',
            icon: BookOpen,
        },
        {
            title: t('Categorias'),
            href: '/categories',
            icon: Folder,
        },
        {
            title: t('Secções'),
            href: '/sections',
            icon: FolderTree,
        },
    ];

    const pcsNavItems: NavItem[] = [
        {
            title: t('PCS ICD-10'),
            href: '/pcs',
            icon: BookOpen,
        },
    ];

    const commonNavItems: NavItem[] = [
        {
            title: t('Diagnósticos'),
            href: '/diagnosticos',
            icon: ClipboardPlus,
        },
        {
            title: t('Procedimentos'),
            href: '/procedimentos',
            icon: PocketKnife,
        },
        {
            title: t('Favoritos'),
            href: '/favoritos',
            icon: Star,
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: t('Public Codes'),
            href: '/welcome-alt',
            icon: ListCheck,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {/* Botão para alternar idioma */}
                <button
                    onClick={handleChangeLanguage}
                    className="ml-4 rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    style={{ float: 'right' }}
                >
                    {i18n.language === 'pt' ? 'EN' : 'PT'}
                </button>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={platformNavItems} label={t('Platform')} />
                <NavMain items={settingsNavItems} label={t('Settings')} />
                <NavMain items={cmsNavItems} label={t('CMS')} />
                <NavMain items={pcsNavItems} label={t('PCS')} />
                <NavMain items={commonNavItems} label={t('Common')} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
