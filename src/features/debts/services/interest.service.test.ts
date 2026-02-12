import { describe, it, expect } from "vitest";
import {
  calculateMonthlyInterest,
  projectCompoundPayoff,
  calculateFixedPayment,
  projectFrenchAmortization,
  calculateRemainingInstallments,
  isUnpayable,
  getMonthlyRate,
} from "./interest.service";

describe("interest.service", () => {
  describe("getMonthlyRate", () => {
    it("convierte EA a tasa mensual correctamente", () => {
      const monthly = getMonthlyRate(28.5);
      // (1 + 0.285)^(1/12) - 1 ≈ 0.02112
      expect(monthly).toBeCloseTo(0.02112, 4);
    });

    it("retorna 0 para tasa 0%", () => {
      expect(getMonthlyRate(0)).toBe(0);
    });
  });

  describe("calculateMonthlyInterest", () => {
    it("calcula interes mensual correcto para tarjeta con 28% EA y saldo $5M", () => {
      const interest = calculateMonthlyInterest(5_000_000, 28);
      // Tasa mensual ≈ 2.08%, interes ≈ $104,000
      expect(interest).toBeGreaterThan(90_000);
      expect(interest).toBeLessThan(120_000);
    });

    it("retorna 0 para tasa 0%", () => {
      expect(calculateMonthlyInterest(5_000_000, 0)).toBe(0);
    });

    it("retorna 0 para saldo 0", () => {
      expect(calculateMonthlyInterest(0, 28)).toBe(0);
    });
  });

  describe("isUnpayable", () => {
    it("detecta deuda impagable cuando pago < interes", () => {
      // Con 28% EA y saldo $5M, interes mensual ≈ $104K
      expect(isUnpayable(5_000_000, 28, 50_000)).toBe(true);
    });

    it("retorna false cuando pago > interes", () => {
      expect(isUnpayable(5_000_000, 28, 200_000)).toBe(false);
    });

    it("retorna false para tasa 0%", () => {
      expect(isUnpayable(5_000_000, 0, 100)).toBe(false);
    });
  });

  describe("projectCompoundPayoff", () => {
    it("tarjeta con 28% EA, saldo $5M, pago $150K - eventualmente se paga", () => {
      const rows = projectCompoundPayoff(5_000_000, 28, 150_000);
      expect(rows.length).toBeGreaterThan(0);
      const lastRow = rows[rows.length - 1];
      expect(lastRow.balance).toBe(0);
    });

    it("tarjeta con 28% EA, saldo $5M, pago $150K - interes mes 1 es correcto", () => {
      const rows = projectCompoundPayoff(5_000_000, 28, 150_000);
      expect(rows[0].interest).toBeGreaterThan(80_000);
      expect(rows[0].interest).toBeLessThan(120_000);
      expect(rows[0].principal).toBe(rows[0].payment - rows[0].interest);
    });

    it("retorna tabla vacia si pago < interes mensual (deuda impagable)", () => {
      const rows = projectCompoundPayoff(5_000_000, 28, 50_000);
      expect(rows).toHaveLength(0);
    });

    it("tasa 0% - cuota = saldo / meses", () => {
      const rows = projectCompoundPayoff(1_200_000, 0, 100_000);
      expect(rows).toHaveLength(12);
      expect(rows[0].interest).toBe(0);
      expect(rows[0].principal).toBe(100_000);
      expect(rows[rows.length - 1].balance).toBe(0);
    });

    it("respeta maxMonths", () => {
      // Use a payable scenario that takes >12 months, but cap at 12
      const rows = projectCompoundPayoff(5_000_000, 28, 200_000, 12);
      expect(rows).toHaveLength(12);
      // Balance should still be > 0 since we capped early
      expect(rows[rows.length - 1].balance).toBeGreaterThan(0);
    });
  });

  describe("calculateFixedPayment", () => {
    it("prestamo $10M, 18% EA, 36 cuotas - cuota fija razonable", () => {
      const payment = calculateFixedPayment(10_000_000, 18, 36);
      // Cuota fija debe ser entre $300K y $400K
      expect(payment).toBeGreaterThan(300_000);
      expect(payment).toBeLessThan(400_000);
    });

    it("tasa 0% - cuota = principal / meses", () => {
      const payment = calculateFixedPayment(1_200_000, 0, 12);
      expect(payment).toBe(100_000);
    });
  });

  describe("projectFrenchAmortization", () => {
    it("prestamo $10M, 18% EA, 36 cuotas - todas las cuotas son iguales (aprox)", () => {
      const rows = projectFrenchAmortization(10_000_000, 18, 36);
      expect(rows).toHaveLength(36);

      const fixedPayment = calculateFixedPayment(10_000_000, 18, 36);
      // Todas las cuotas deben estar dentro de ±50 del pago fijo (rounding on large amounts)
      rows.forEach((row) => {
        expect(Math.abs(row.payment - fixedPayment)).toBeLessThanOrEqual(50);
      });
    });

    it("suma de pagos de capital = principal original (±rounding)", () => {
      const principal = 10_000_000;
      const rows = projectFrenchAmortization(principal, 18, 36);
      const totalPrincipal = rows.reduce((sum, r) => sum + r.principal, 0);
      expect(Math.abs(totalPrincipal - principal)).toBeLessThanOrEqual(rows.length);
    });

    it("interes decrece y capital crece mes a mes", () => {
      const rows = projectFrenchAmortization(10_000_000, 18, 36);
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].interest).toBeLessThanOrEqual(rows[i - 1].interest);
        expect(rows[i].principal).toBeGreaterThanOrEqual(rows[i - 1].principal - 1); // ±1 rounding
      }
    });

    it("ultimo saldo es 0", () => {
      const rows = projectFrenchAmortization(10_000_000, 18, 36);
      expect(rows[rows.length - 1].balance).toBe(0);
    });

    it("tasa 0% - cuota = principal / meses, sin interes", () => {
      const rows = projectFrenchAmortization(1_200_000, 0, 12);
      expect(rows).toHaveLength(12);
      rows.forEach((row) => {
        expect(row.interest).toBe(0);
        expect(row.payment).toBe(100_000);
      });
      expect(rows[rows.length - 1].balance).toBe(0);
    });
  });

  describe("calculateRemainingInstallments", () => {
    it("calcula cuotas restantes para prestamo con cuota fija", () => {
      // $552,125 saldo, 10.69% EA, cuota $106,000
      const remaining = calculateRemainingInstallments(552_125, 10.69, 106_000);
      expect(remaining).not.toBeNull();
      expect(remaining!).toBeGreaterThan(4);
      expect(remaining!).toBeLessThan(8);
    });

    it("retorna null para saldo 0", () => {
      expect(calculateRemainingInstallments(0, 10, 100_000)).toBeNull();
    });

    it("retorna null para pago 0", () => {
      expect(calculateRemainingInstallments(1_000_000, 10, 0)).toBeNull();
    });

    it("retorna null si pago no cubre interes (impagable)", () => {
      // $5M at 28% EA, interest ≈ $104K, payment $50K
      expect(calculateRemainingInstallments(5_000_000, 28, 50_000)).toBeNull();
    });

    it("tasa 0% - cuotas = saldo / pago redondeado arriba", () => {
      expect(calculateRemainingInstallments(1_000_000, 0, 300_000)).toBe(4);
    });

    it("es consistente con projectFrenchAmortization", () => {
      // Crear un prestamo, calcular cuota, luego verificar que remaining = total
      const principal = 10_000_000;
      const rate = 18;
      const months = 36;
      const payment = calculateFixedPayment(principal, rate, months);
      const remaining = calculateRemainingInstallments(principal, rate, payment);
      expect(remaining).toBe(months);
    });
  });
});
