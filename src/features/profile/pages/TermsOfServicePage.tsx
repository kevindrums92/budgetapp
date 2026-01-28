import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/shared/components/layout/PageHeader';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  const { t } = useTranslation('legal');

  // Reset scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <PageHeader title={t('terms.title', 'Términos de Servicio')} />

      <div className="flex-1 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-2xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-900/30">
              <FileText className="h-8 w-8 text-[#18B7B0]" />
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
                1. {t('terms.introduction.title', 'Introducción')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.introduction.content', 'Bienvenido a SmartSpend. Al usar nuestra aplicación, aceptas estos términos de servicio. SmartSpend es una aplicación de gestión de finanzas personales diseñada para ayudarte a rastrear tus gastos, ingresos y presupuestos.')}
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                2. {t('terms.service.title', 'Descripción del Servicio')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.service.content', 'SmartSpend ofrece:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Seguimiento de transacciones (ingresos y gastos)</li>
                <li>Gestión de categorías y presupuestos</li>
                <li>Visualización de estadísticas financieras</li>
                <li>Sincronización opcional en la nube</li>
                <li>Modo invitado con almacenamiento local</li>
                <li>Respaldo y exportación de datos</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                3. {t('terms.accounts.title', 'Cuentas de Usuario')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.accounts.content', 'Puedes usar SmartSpend en dos modos:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>Modo Invitado:</strong> Tus datos se almacenan localmente en tu dispositivo. No se requiere cuenta.</li>
                <li><strong>Modo Cloud:</strong> Al crear una cuenta, tus datos se sincronizan con nuestros servidores usando Supabase. Eres responsable de mantener la confidencialidad de tu cuenta.</li>
              </ul>
            </section>

            {/* Data Ownership */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                4. {t('terms.ownership.title', 'Propiedad de Datos')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.ownership.content', 'Todos tus datos financieros son de tu propiedad. SmartSpend no comparte, vende ni utiliza tus datos para publicidad. Puedes exportar o eliminar tus datos en cualquier momento desde la configuración de la aplicación.')}
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                5. {t('terms.use.title', 'Uso Aceptable')}
              </h2>
              <p className="mb-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.use.content', 'Al usar SmartSpend, aceptas:')}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Usar la aplicación solo para fines legales y personales</li>
                <li>No intentar acceder a datos de otros usuarios</li>
                <li>No modificar, copiar o distribuir la aplicación sin autorización</li>
                <li>No usar la aplicación de manera que pueda dañar o interrumpir el servicio</li>
              </ul>
            </section>

            {/* Limitations */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                6. {t('terms.limitations.title', 'Limitación de Responsabilidad')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.limitations.content', 'SmartSpend se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de pérdidas financieras, daños o imprecisiones en los datos. Es tu responsabilidad verificar la exactitud de tus registros financieros y realizar respaldos regulares de tus datos.')}
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                7. {t('terms.availability.title', 'Disponibilidad del Servicio')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.availability.content', 'Hacemos nuestro mejor esfuerzo para mantener SmartSpend disponible, pero no garantizamos un tiempo de actividad del 100%. Podemos suspender o descontinuar el servicio en cualquier momento con previo aviso.')}
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                8. {t('terms.changes.title', 'Cambios a los Términos')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.changes.content', 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se publicarán en esta página con una fecha de actualización. Tu uso continuado de SmartSpend después de los cambios constituye tu aceptación de los nuevos términos.')}
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">
                9. {t('terms.contact.title', 'Contacto')}
              </h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                {t('terms.contact.content', 'Si tienes preguntas sobre estos términos, puedes contactarnos a través de:')}
              </p>
              <p className="mt-2 text-sm font-medium text-[#18B7B0]">
                support@smartspend.app
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
