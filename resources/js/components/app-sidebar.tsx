
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, Users, Shield } from 'lucide-react';
import AppLogo from './app-logo';
import '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';


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
                    className="ml-4 px-2 py-1 rounded text-xs border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                    style={{ float: 'right' }}
                >
                    {i18n.language === 'pt' ? 'EN' : 'PT'}
                </button>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={platformNavItems} label={t('Platform')} />
                <NavMain items={settingsNavItems} label={t('Settings')} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
