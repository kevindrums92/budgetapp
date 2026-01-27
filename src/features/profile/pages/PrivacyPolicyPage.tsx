import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/shared/components/layout/PageHeader';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const { t } = useTranslation('legal');

  // Reset scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('privacy.title', 'Política de Privacidad')} />

      <div className="flex-1 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-2xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30">
              <Shield className="h-8 w-8 text-[#18B7B0]" />
            </div>
          </div>

          {/* Last Updated */}
          <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('lastUpdated', 'Última actualización')}: 26 de enero de 2026
          </p>

          {/* Content */}
          <div className="space-y-6 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">

            {/* Introduction */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                1. {t('privacy.introduction.title', 'Introducción')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.introduction.content', 'En SmartSpend, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política explica cómo recopilamos, usamos y protegemos tu información.')}
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                2. {t('privacy.collection.title', 'Información que Recopilamos')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.collection.intro', 'Dependiendo del modo que uses, recopilamos:')}
              </p>

              <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Modo Invitado (Sin Cuenta):
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Ninguna información personal</li>
                <li>Los datos se almacenan localmente en tu dispositivo</li>
                <li>No se envía información a nuestros servidores</li>
              </ul>

              <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Modo Cloud (Con Cuenta):
              </h3>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Email y nombre (proporcionados al registrarte o usar OAuth)</li>
                <li>Foto de perfil (si usas Google OAuth)</li>
                <li>Datos financieros: transacciones, categorías, presupuestos, viajes</li>
                <li>Preferencias de la app: idioma, tema, moneda</li>
                <li>Metadata de sincronización: última actualización, dispositivo</li>
              </ul>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                3. {t('privacy.usage.title', 'Cómo Usamos tu Información')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.usage.intro', 'Usamos tu información exclusivamente para:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Proporcionar y mejorar nuestros servicios</li>
                <li>Sincronizar tus datos entre dispositivos (modo cloud)</li>
                <li>Autenticar tu identidad y mantener tu cuenta segura</li>
                <li>Responder a tus consultas de soporte</li>
                <li>Cumplir con obligaciones legales</li>
              </ul>
              <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                ❌ NO vendemos, compartimos ni usamos tus datos para publicidad
              </p>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                4. {t('privacy.storage.title', 'Almacenamiento y Seguridad')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.storage.content', 'Tus datos están protegidos mediante:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>Supabase:</strong> Plataforma segura con encriptación en tránsito (HTTPS/TLS)</li>
                <li><strong>Row Level Security (RLS):</strong> Solo tú puedes acceder a tus datos</li>
                <li><strong>Autenticación OAuth:</strong> No almacenamos contraseñas en texto plano</li>
                <li><strong>Backups cifrados:</strong> Los respaldos locales usan SHA-256 checksum</li>
                <li><strong>Almacenamiento local:</strong> localStorage del navegador (modo invitado)</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                5. {t('privacy.thirdParty.title', 'Servicios de Terceros')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.thirdParty.intro', 'SmartSpend utiliza los siguientes servicios:')}
              </p>
              <ul className="ml-4 list-disc space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  <strong>Supabase:</strong> Almacenamiento de datos y autenticación.
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="ml-1 text-[#18B7B0] underline">
                    Ver política de privacidad
                  </a>
                </li>
                <li>
                  <strong>Google OAuth:</strong> Autenticación opcional con Google.
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="ml-1 text-[#18B7B0] underline">
                    Ver política de privacidad
                  </a>
                </li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                6. {t('privacy.retention.title', 'Retención de Datos')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.retention.content', 'Conservamos tus datos mientras mantengas tu cuenta activa o según sea necesario para proporcionarte servicios. Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde la configuración de la aplicación. Los datos en modo invitado solo existen en tu dispositivo y se eliminan al limpiar los datos del navegador.')}
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                7. {t('privacy.rights.title', 'Tus Derechos')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.rights.intro', 'Tienes derecho a:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>Acceder:</strong> Ver todos tus datos almacenados</li>
                <li><strong>Exportar:</strong> Descargar tus datos en formato JSON o CSV</li>
                <li><strong>Rectificar:</strong> Editar o corregir tus datos</li>
                <li><strong>Eliminar:</strong> Borrar tu cuenta y todos tus datos</li>
                <li><strong>Portabilidad:</strong> Transferir tus datos a otro servicio</li>
                <li><strong>Oponerte:</strong> Rechazar ciertos usos de tus datos</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                8. {t('privacy.cookies.title', 'Cookies y Almacenamiento Local')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.cookies.content', 'SmartSpend usa localStorage del navegador para almacenar tus preferencias (idioma, tema, moneda) y datos financieros (en modo invitado). No usamos cookies de seguimiento publicitario. La sesión de autenticación se gestiona mediante tokens seguros de Supabase.')}
              </p>
            </section>

            {/* Children */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                9. {t('privacy.children.title', 'Privacidad de Menores')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.children.content', 'SmartSpend no está dirigida a menores de 13 años. No recopilamos intencionalmente información de niños. Si descubres que un menor ha proporcionado datos personales, contacta con nosotros para eliminarlos.')}
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                10. {t('privacy.changes.title', 'Cambios a esta Política')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.changes.content', 'Podemos actualizar esta política de privacidad periódicamente. Te notificaremos de cambios significativos mediante un aviso en la aplicación. La fecha de "última actualización" al inicio de esta página indica cuándo se modificó por última vez.')}
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                11. {t('privacy.contact.title', 'Contacto')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('privacy.contact.content', 'Si tienes preguntas sobre esta política de privacidad o deseas ejercer tus derechos, contacta con nosotros:')}
              </p>
              <p className="mt-2 text-sm font-medium text-[#18B7B0]">
                privacy@smartspend.app
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
