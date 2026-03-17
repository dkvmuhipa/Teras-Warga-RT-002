import React, { createContext, useContext, useState, useMemo } from 'react';
import { House, CashFlow, Bill, PaymentStatus } from '../types';

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
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{
  children: React.ReactNode;
  houses: House[];
  iuranPayments: any[];
  cashFlow: CashFlow[];
  bills: Bill[];
}> = ({ children, houses, iuranPayments, cashFlow, bills }) => {
  const getIndonesianMonthYear = (date: Date) => {
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthsId[date.getMonth()]} ${date.getFullYear()}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getIndonesianMonthYear(new Date()));

  const isMonthMatch = (monthA: string, monthB: string) => {
    if (!monthA || !monthB) return false;
    const cleanA = monthA.trim().toLowerCase();
    const cleanB = monthB.trim().toLowerCase();
    if (cleanA === cleanB) return true;

    const monthsId = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    const monthsEn = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

    const normalize = (m: string) => {
      const parts = m.trim().toLowerCase().split(/\s+/);
      if (parts.length < 1) return null;
      const name = parts[0];
      const year = parts.length > 1 ? parts[1] : null;
      let index = monthsId.indexOf(name);
      if (index === -1) index = monthsEn.indexOf(name);
      if (index === -1) return null;
      return year ? `${index}-${year}` : `${index}`;
    };

    const normA = normalize(cleanA);
    const normB = normalize(cleanB);
    if (!normA || !normB) return false;
    if (normA.includes('-') && normB.includes('-')) return normA === normB;
    return normA.split('-')[0] === normB.split('-')[0];
  };

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
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    
    const arrears: string[] = [];
    
    // Determine start month based on joiningDate (if available)
    let startMonth = 0;
    let startYear = currentYear;
    
    if (house.joiningDate) {
      const joinDate = new Date(house.joiningDate);
      if (joinDate.getFullYear() === currentYear) {
        startMonth = joinDate.getMonth();
      } else if (joinDate.getFullYear() > currentYear) {
        return [];
      }
    }

    for (let i = startMonth; i <= currentMonthIndex; i++) {
      const monthStrId = `${monthsId[i]} ${currentYear}`;
      
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
    const estimatedReceivables = unpaidHousesCount * 20000;

    const totalArrearsMonths = occupiedHousesList.reduce((acc, h) => acc + getArrearsForHouse(h).length, 0);
    const totalArrearsAmount = totalArrearsMonths * 10000; // Since each month has 2 components, but getArrearsForHouse(h) returns months where *any* is missing. This is tricky.

    // Better calculation for arrears
    const airArrearsMonths = occupiedHousesList.reduce((acc, h) => acc + getArrearsForHouse(h, 'Air').length, 0);
    const airArrearsAmount = airArrearsMonths * 10000;
    const airArrearsHouseCount = occupiedHousesList.filter(h => getArrearsForHouse(h, 'Air').length > 0).length;

    const sampahArrearsMonths = occupiedHousesList.reduce((acc, h) => acc + getArrearsForHouse(h, 'Sampah').length, 0);
    const sampahArrearsAmount = sampahArrearsMonths * 10000;
    const sampahArrearsHouseCount = occupiedHousesList.filter(h => getArrearsForHouse(h, 'Sampah').length > 0).length;

    const combinedTotalArrearsAmount = airArrearsAmount + sampahArrearsAmount;
    const totalArrearsHouseCount = occupiedHousesList.filter(h => getArrearsForHouse(h).length > 0).length;

    // Air specific
    const airPayments = currentMonthPayments.filter(p => p.type === 'Air' || p.type === 'Both');
    const airCollected = airPayments.reduce((acc, p) => acc + (p.type === 'Both' ? p.amount / 2 : p.amount), 0);
    const airPaidHouses = new Set(airPayments.map(p => p.houseId)).size;
    const airUnpaidCount = occupiedHousesList.length - airPaidHouses;
    const airEstimatedReceivables = airUnpaidCount * 10000;

    // Sampah specific
    const sampahPayments = currentMonthPayments.filter(p => p.type === 'Sampah' || p.type === 'Both');
    const sampahCollected = sampahPayments.reduce((acc, p) => acc + (p.type === 'Both' ? p.amount / 2 : p.amount), 0);
    const sampahPaidHouses = new Set(sampahPayments.map(p => p.houseId)).size;
    const sampahUnpaidCount = occupiedHousesList.length - sampahPaidHouses;
    const sampahEstimatedReceivables = sampahUnpaidCount * 10000;

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
      summaries
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
