/**
 * Screen1_Language
 * Pantalla 1 de First Config: Selección de idioma
 * Por ahora solo guarda la selección, no aplica i18n
 */

import { Languages, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../../OnboardingContext';

const LANGUAGES = [
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

export default function Screen1_Language() {
  const navigate = useNavigate();
  const { state, setLanguage } = useOnboarding();
  const [selected, setSelected] = useState(state.selections.language || 'es');

  const handleContinue = () => {
    setLanguage(selected);
    navigate('/onboarding/config/2', { replace: true });
  };

  const handleSkip = () => {
    // Omitir toda la configuración → ir directo a pantalla final
    navigate('/onboarding/config/5', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50">
      {/* Progress */}
      <div className="flex gap-1.5 px-6 pt-4">
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-12 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <Languages size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
          Elige tu idioma
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600">
          Selecciona el idioma en el que prefieres usar SmartSpend. Podrás cambiarlo después desde tu perfil.
        </p>
      </div>

      {/* Language options */}
      <div className="flex-1 px-6">
        <div className="space-y-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelected(lang.code)}
              className={`flex w-full items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-all active:scale-[0.98] ${
                selected === lang.code
                  ? 'ring-2 ring-[#18B7B0]'
                  : 'ring-1 ring-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{lang.code === 'es' ? '🇨🇴' : '🇺🇸'}</div>
                <div className="text-left">
                  <p className="text-base font-semibold text-gray-900">
                    {lang.nativeName}
                  </p>
                  <p className="text-sm text-gray-500">{lang.name}</p>
                </div>
              </div>

              {selected === lang.code && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18B7B0]">
                  <Check className="h-5 w-5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Más idiomas estarán disponibles próximamente
        </p>
      </div>

      {/* Actions */}
      <div className="px-6 pb-8">
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-2xl bg-[#18B7B0] py-4 text-base font-semibold text-white shadow-lg shadow-[#18B7B0]/30 transition-all active:scale-[0.98]"
          >
            Continuar
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="flex w-full items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            Omitir configuración
          </button>
        </div>
      </div>
    </div>
  );
}
