import React, { createContext, useContext, useState, useMemo } from 'react';
import { House, CashFlow, Bill, PaymentStatus } from '../types';
import { getIndonesianMonthYear, isMonthMatch } from '../src/utils/dateUtils';

interface FinancialContextType {
  iuranPayments: any[];
  cashFlow: CashFlow[];
  bills: Bill[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  getPaymentStatus: (house: House, type: 'Air' | 'Sampah', month?: string) => PaymentStatus;
  getArrearsForHouse: (house: House, type?: 'Air' | 'Sampah') => string[];
  summaries: {
    totalCollected: number;
    participationRate: number;
    paidHousesCount: number;
    unpaidHousesCount: number;
    estimatedReceivables: number;
    totalArrearsAmount: number;
    totalArrearsMonths: number;
    totalArrearsHouseCount: number;
    air: {
      totalCollected: number;
      unpaidCount: number;
      estimatedReceivables: number;
      totalArrearsAmount: number;
      arrearsUnits: number;
      arrearsHouseCount: number;
    };
    sampah: {
      totalCollected: number;
      unpaidCount: number;
      estimatedReceivables: number;
      totalArrearsAmount: number;
      arrearsUnits: number;
      arrearsHouseCount: number;
    };
  };
  isMonthMatch: (monthA: string, monthB: string) => boolean;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{
  children: React.ReactNode;
  houses: House[];
  iuranPayments: any[];
  cashFlow: CashFlow[];
  bills: Bill[];
  settings: { airFee: number; sampahFee: number };
}> = ({ children, houses, iuranPayments, cashFlow, bills, settings }) => {
  const [selectedMonth, setSelectedMonth] = useState(getIndonesianMonthYear(new Date()));

  const airFee = settings?.airFee || 10000;
  const sampahFee = settings?.sampahFee || 10000;
  const combinedFee = airFee + sampahFee;

  const getPaymentStatus = (house: House, type: 'Air' | 'Sampah', month: string = selectedMonth) => {
    const payment = iuranPayments.find(p => {
      const idMatch = String(p.houseId) === String(house.id) || 
                      String(p.houseId) === `${house.block}-${house.number}` ||
                      (p.block === house.block && p.number === house.number);
      return idMatch && isMonthMatch(p.month, month) && (p.type === type || p.type === 'Both');
    });
    
    if (payment) return PaymentStatus.PAID;

    const isCurrentMonth = isMonthMatch(getIndonesianMonthYear(new Date()), month);
    const isDateMatch = house.paymentDate && isMonthMatch(getIndonesianMonthYear(new Date(house.paymentDate)), month);
    
    if (isCurrentMonth || isDateMatch) {
      if (type === 'Air' && house.paymentStatusAir === PaymentStatus.PAID) return PaymentStatus.PAID;
      if (type === 'Sampah' && house.paymentStatusSampah === PaymentStatus.PAID) return PaymentStatus.PAID;
    }
    
    return PaymentStatus.PENDING;
  };

  const getArrearsForHouse = (house: House, type?: 'Air' | 'Sampah') => {
    const now = new Date();
    
    const arrears: string[] = [];
    
    // Check months in current year (tahun berjalan)
    const currentMonthIndex = now.getMonth();
    for (let i = currentMonthIndex; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStrId = getIndonesianMonthYear(d);
      
      // Skip if before joining date (waktu menempati hunian)
      if (house.joiningDate) {
        const joinDate = new Date(house.joiningDate);
        if (d.getFullYear() < joinDate.getFullYear() || (d.getFullYear() === joinDate.getFullYear() && d.getMonth() < joinDate.getMonth())) {
          continue;
        }
      }

      const hasPaid = iuranPayments.some(p => {
        const idMatch = String(p.houseId) === String(house.id) || 
                        String(p.houseId) === `${house.block}-${house.number}` ||
                        (p.block === house.block && p.number === house.number);
        const typeMatch = !type || p.type === type || p.type === 'Both';
        return idMatch && isMonthMatch(p.month, monthStrId) && typeMatch;
      });
      
      const houseRecordPaid = house.paymentDate && 
                             isMonthMatch(getIndonesianMonthYear(new Date(house.paymentDate)), monthStrId) &&
                             (!type || (type === 'Air' ? house.paymentStatusAir === PaymentStatus.PAID : house.paymentStatusSampah === PaymentStatus.PAID) || (house.paymentStatusAir === PaymentStatus.PAID && house.paymentStatusSampah === PaymentStatus.PAID));

      if (!hasPaid && !houseRecordPaid) {
        arrears.push(monthStrId);
      }
    }
    return arrears;
  };

  const summaries = useMemo(() => {
    const currentMonthPayments = iuranPayments.filter(p => isMonthMatch(p.month, selectedMonth));
    const totalCollected = currentMonthPayments.reduce((acc, p) => acc + p.amount, 0);
    const occupiedHousesList = houses.filter(h => h.status === 'Occupied');
    const paidHousesCount = new Set(currentMonthPayments.map(p => p.houseId)).size;
    const participationRate = occupiedHousesList.length > 0 ? Math.round((paidHousesCount / occupiedHousesList.length) * 100) : 0;
    const unpaidHousesCount = occupiedHousesList.length - paidHousesCount;
    const estimatedReceivables = unpaidHousesCount * combinedFee;

    const totalArrearsMonths = occupiedHousesList.reduce((acc, h) => acc + getArrearsForHouse(h).length, 0);
    const totalArrearsAmount = totalArrearsMonths * (combinedFee / 2); // This is still a bit tricky if only one is unpaid, but let's use the combined logic below
    
    // Better calculation for arrears
    const airArrearsMonths = occupiedHousesList.reduce((acc, h) => acc + getArrearsForHouse(h, 'Air').length, 0);
    const airArrearsAmount = airArrearsMonths * airFee;
    const airArrearsHouseCount = occupiedHousesList.filter(h => getArrearsForHouse(h, 'Air').length > 0).length;

    const sampahArrearsMonths = occupiedHousesList.reduce((acc, h) => acc + getArrearsForHouse(h, 'Sampah').length, 0);
    const sampahArrearsAmount = sampahArrearsMonths * sampahFee;
    const sampahArrearsHouseCount = occupiedHousesList.filter(h => getArrearsForHouse(h, 'Sampah').length > 0).length;

    const combinedTotalArrearsAmount = airArrearsAmount + sampahArrearsAmount;
    const totalArrearsHouseCount = occupiedHousesList.filter(h => getArrearsForHouse(h).length > 0).length;

    // Air specific
    const airPayments = currentMonthPayments.filter(p => p.type === 'Air' || p.type === 'Both');
    const airCollected = airPayments.reduce((acc, p) => acc + (p.type === 'Both' ? (p.amount * (airFee / combinedFee)) : p.amount), 0);
    const airPaidHouses = new Set(airPayments.map(p => p.houseId)).size;
    const airUnpaidCount = occupiedHousesList.length - airPaidHouses;
    const airEstimatedReceivables = airUnpaidCount * airFee;

    // Sampah specific
    const sampahPayments = currentMonthPayments.filter(p => p.type === 'Sampah' || p.type === 'Both');
    const sampahCollected = sampahPayments.reduce((acc, p) => acc + (p.type === 'Both' ? (p.amount * (sampahFee / combinedFee)) : p.amount), 0);
    const sampahPaidHouses = new Set(sampahPayments.map(p => p.houseId)).size;
    const sampahUnpaidCount = occupiedHousesList.length - sampahPaidHouses;
    const sampahEstimatedReceivables = sampahUnpaidCount * sampahFee;

    return {
      totalCollected,
      participationRate,
      paidHousesCount,
      unpaidHousesCount,
      estimatedReceivables,
      totalArrearsAmount: combinedTotalArrearsAmount,
      totalArrearsMonths: airArrearsMonths + sampahArrearsMonths,
      totalArrearsHouseCount,
      air: {
        totalCollected: airCollected,
        unpaidCount: airUnpaidCount,
        estimatedReceivables: airEstimatedReceivables,
        totalArrearsAmount: airArrearsAmount,
        arrearsUnits: airArrearsMonths,
        arrearsHouseCount: airArrearsHouseCount
      },
      sampah: {
        totalCollected: sampahCollected,
        unpaidCount: sampahUnpaidCount,
        estimatedReceivables: sampahEstimatedReceivables,
        totalArrearsAmount: sampahArrearsAmount,
        arrearsUnits: sampahArrearsMonths,
        arrearsHouseCount: sampahArrearsHouseCount
      }
    };
  }, [houses, iuranPayments, selectedMonth]);

  return (
    <FinancialContext.Provider value={{
      iuranPayments,
      cashFlow,
      bills,
      selectedMonth,
      setSelectedMonth,
      getPaymentStatus,
      getArrearsForHouse,
      summaries,
      isMonthMatch
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
