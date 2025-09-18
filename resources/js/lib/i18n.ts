import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            Platform: 'Platform',
            Settings: 'Settings',
            Dashboard: 'Dashboard',
            Users: 'Users',
            Roles: 'Roles',
            Permissions: 'Permissions',
            'Log out': 'Log out',
            'Name': 'Name',
            'Email': 'Email',
            'Creation Date': 'Creation Date',
            'Edit': 'Edit',
            'Delete': 'Delete',
            'Creating...': 'Creating...',
            'Create': 'Create',
            'Update': 'Update',
            'Cancel': 'Cancel',
            'user': 'User',
            'New User': 'New User',
            'Fill in the details to create a new user.': 'Fill in the details to create a new user.',
            'Edit User': 'Edit User',
            'Update user details.': 'Update user details.',
            'Actions': 'Actions',
            'Role': 'Role',
            'New Role': 'New Role',
            'Fill in the details to create a new role.': 'Fill in the details to create a new role.',
            'Edit Role': 'Edit Role',
            'Update role details.': 'Update role details.',
            'Update role and click "Save".': 'Update role and click "Save".',
            'Save': 'Save'

        },
    },
    pt: {
        translation: {
            Platform: 'Plataforma',
            Settings: 'Configurações',
            Dashboard: 'Painel',
            Users: 'Utilizadores',
            Roles: 'Funções',
            Permissions: 'Permissões',
            'Log out': 'Sair',
            permissions: 'permissões',
            'Name': 'Nome',
            'Email': 'Email',
            'Creation Date': 'Data de Criação',
            'Edit': 'Editar',
            'Delete': 'Apagar',
            'Creating...': 'A criar...',
            'Create': 'Criar',
            'Update': 'Atualizar',
            'Cancel': 'Cancelar',
            'user': 'Utilizador',
            'New User': 'Novo Utilizador',
            'Fill in the details to create a new user.': 'Preencha os detalhes para criar um novo utilizador.',
            'Edit User': 'Editar Utilizador',
            'Update user details.': 'Atualizar detalhes do utilizador.',
            'Actions': 'Ações',
            'Role': 'Função',
            'New Role': 'Nova Função',
            'Fill in the details to create a new role.': 'Preencha os detalhes para criar uma nova função.',
            'Edit Role': 'Editar Função',
            'Update role details.': 'Atualizar detalhes da função.',
            'Update role and click "Save".': 'Atualizar função e clique em "Guardar".',
            'Save': 'Guardar',
            'Update the permission name.': 'Atualize o nome da permissão.',
            'New Permission': 'Nova Permissão',
            'Edit Permission': 'Editar Permissão',
            'Fill in the permission name.': 'Preencha o nome da permissão.',
            'Permission': 'Permissão',
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'pt',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
