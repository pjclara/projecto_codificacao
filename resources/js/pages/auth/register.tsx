import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController'
import { login } from '@/routes'
import { Form, Head } from '@inertiajs/react'
import { LoaderCircle, User, Mail, Lock } from 'lucide-react'

import InputError from '@/components/input-error'
import TextLink from '@/components/text-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/auth-layout'

export default function Register() {
    return (
        <AuthLayout
            title="Crie sua conta"
            description="Preencha os dados abaixo para começar"
        >
            <Head title="Registrar" />

            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* Nome */}
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome completo</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="name"
                                        name="name"
                                        placeholder="Ex: Maria Silva"
                                        className="pl-10"
                                    />
                                </div>
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            {/* Email */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        tabIndex={2}
                                        autoComplete="email"
                                        name="email"
                                        placeholder="email@exemplo.com"
                                        className="pl-10"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </div>

                            {/* Senha */}
                            <div className="grid gap-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        tabIndex={3}
                                        autoComplete="new-password"
                                        name="password"
                                        placeholder="********"
                                        className="pl-10"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            {/* Confirmar Senha */}
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirmar senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        required
                                        tabIndex={4}
                                        autoComplete="new-password"
                                        name="password_confirmation"
                                        placeholder="********"
                                        className="pl-10"
                                    />
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>

                            {/* Botão criar conta */}
                            <Button type="submit" className="mt-2 w-full" tabIndex={5}>
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Criar conta
                            </Button>
                        </div>

                        {/* Link para login */}
                        <div className="text-center text-sm text-muted-foreground">
                            Já tem uma conta?{' '}
                            <TextLink href={login()} tabIndex={6}>
                                Entrar
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    )
}
