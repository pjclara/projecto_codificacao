import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CodeImage from '../../images/code.png';
import LogoImage from '../../images/logo.png';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head title="Codificação Médica Simplificada">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                {/* Navbar */}
                <header className="w-full border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                    <nav className="mx-auto flex max-w-6xl items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <img src={LogoImage} alt="Medicodex Logo" className="h-10 w-30" />
                        </Link>
                    </nav>
                </header>

                {/* Hero */}
                <main className="flex flex-1 items-center justify-center px-6">
                    <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2">
                        {/* Texto */}
                        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                           <h1 className="mb-6 text-3xl sm:text-4xl lg:text-6xl font-extrabold leading-tight">
                                Codificação Médica <span className="text-green-600">Simplificada</span>
                            </h1>
                            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
                                Ferramenta gratuita para auxiliar profissionais de saúde na codificação de diagnósticos e procedimentos com ICD-10-CM,
                                ICD-10-PCS.
                            </p>
                            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
                                Explore códigos, grave os favoritos e crie listas personalizadas com facilidade.
                            </p>

                            <Link
                                href="/welcome-alt"
                                className="inline-flex items-center gap-2 rounded-md bg-green-500 px-6 py-3 text-white shadow-lg transition hover:bg-green-600"
                            >
                                Explorar agora <ArrowRight className="size-5" />
                            </Link>
                        </motion.div>

                        {/* Imagem */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex justify-center"
                        >
                            <img src={CodeImage} alt="Ilustração de codificação médica" className="w-full max-w-sm drop-shadow-lg lg:max-w-md" />
                        </motion.div>
                    </div>
                </main>

                {/* Sessões públicas 
                <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#141414]">
                        <h2 className="mb-4 text-2xl font-bold">Lista de Diagnósticos</h2>
                        <DiagnosticosPublicos />
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#141414]">
                        <h2 className="mb-4 text-2xl font-bold">Lista de Procedimentos</h2>
                        <ProcedimentosPublicos />
                    </div>
                </section>*/}
            </div>
        </>
    );
}
