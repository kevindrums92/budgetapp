/**
 * Screen3_Currency
 * Pantalla 3 de First Config: Selección de moneda
 * Por ahora solo guarda la selección, no aplica multi-currency
 */

import { DollarSign, Check } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../../../OnboardingContext';

const CURRENCIES = [
  { code: 'COP', symbol: '$', name: 'Peso Colombiano', flag: '🇨🇴' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano', flag: '🇲🇽' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino', flag: '🇦🇷' },
];

export default function Screen3_Currency() {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { state, setCurrency } = useOnboarding();
  const [selected, setSelected] = useState(state.selections.currency || 'COP');

  const handleContinue = () => {
    setCurrency(selected);
    navigate('/onboarding/config/4', { replace: true });
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
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-[#18B7B0]" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
        <div className="h-1 flex-1 rounded-full bg-gray-200" />
      </div>

      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-12 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#18B7B0] to-[#0F8580] shadow-lg">
          <DollarSign size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="mb-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-gray-900">
          {t('currency.title')}
        </h1>

        <p className="max-w-md text-center text-base leading-relaxed text-gray-600">
          {t('currency.description')}
        </p>
      </div>

      {/* Currency options */}
      <div className="flex-1 px-6">
        <div className="space-y-2">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              type="button"
              onClick={() => setSelected(currency.code)}
              className={`flex w-full items-center justify-between rounded-xl bg-white p-3.5 shadow-sm transition-all active:scale-[0.98] ${
                selected === currency.code
                  ? 'ring-2 ring-[#18B7B0]'
                  : 'ring-1 ring-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{currency.flag}</div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {currency.code}
                  </p>
                  <p className="text-xs text-gray-500">{currency.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  {currency.symbol}
                </span>
                {selected === currency.code && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18B7B0]">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          {t('currency.note')}
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
            {t('currency.continue')}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="flex w-full items-center justify-center py-3 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            {t('currency.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
