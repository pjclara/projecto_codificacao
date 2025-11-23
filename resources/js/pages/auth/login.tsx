import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController'
import InputError from '@/components/input-error'
import TextLink from '@/components/text-link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/auth-layout'
import { register } from '@/routes'
import { request } from '@/routes/password'
import { Form, Head } from '@inertiajs/react'
import { LoaderCircle, Mail, Lock } from 'lucide-react'

// Imagem ilustrativa
import loginImage from '../../../images/logo.png';

interface LoginProps {
    status?: string
    canResetPassword: boolean
}
export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout
            title="Acesse sua conta"
            description="Introduzir o e-mail e a senha para entrar"
        >
            <Head title="Login" />

            <div className="flex items-center justify-center bg-gray-50 px-4 py-2">
                <div className="grid overflow-hidden rounded-2xl bg-white shadow-lg lg:grid-cols-2">

                    {/* Coluna esquerda – Formulário */}
                    <div className="flex flex-col justify-center px-8 py-12 md:px-14">
                        {status && (
                            <div className="mb-4 text-center text-sm font-medium text-green-600">
                                {status}
                            </div>
                        )}

                        <div className="mb-8 text-center md:text-left">
                            <h1 className="text-3xl font-semibold text-gray-900">
                                Bem-vindo de volta 👋
                            </h1>
                            <p className="mt-2 text-gray-500">
                                Faça login para continuar usando o Medicodex
                            </p>
                        </div>

                        <Form
                            {...AuthenticatedSessionController.store.form()}
                            resetOnSuccess={['password']}
                            className="flex flex-col gap-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* E-mail */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">E-mail</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                autoComplete="email"
                                                placeholder="email@exemplo.com"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    {/* Senha */}
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Senha</Label>
                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="text-sm"
                                                >
                                                    Esqueceu a senha?
                                                </TextLink>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                autoComplete="current-password"
                                                placeholder="********"
                                                className="pl-10"
                                            />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    {/* Checkbox */}
                                    <div className="flex items-center space-x-3">
                                        <Checkbox id="remember" name="remember" />
                                        <Label htmlFor="remember">Lembrar de mim</Label>
                                    </div>

                                    {/* Botão */}
                                    <Button
                                        type="submit"
                                        className="mt-4 w-full"
                                        disabled={processing}
                                    >
                                        {processing && (
                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Entrar
                                    </Button>


                                </>
                            )}
                        </Form>
                    </div>

                    {/* Coluna direita – Imagem */}
                    <div className="hidden lg:flex items-center justify-center bg-gray-100 p-8">
                        <img
                            src={loginImage}
                            alt="Ilustração médica"
                            className="max-h-[200px] w-auto object-contain"
                        />
                    </div>
                </div>
            </div>
        </AuthLayout>
    )
}