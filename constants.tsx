import React from 'react';
import { Home } from 'lucide-react';
import { House, PaymentStatus, Announcement, UMKM, Report, LetterRequest, RondaSchedule, CashFlow, Official, PdfConfig, InventoryItem, Poll, RondaCheckLog, MarketItem } from './types';

export const APP_NAME = "TERAS";
export const RT_ADDRESS = "Jl. Pue Lombe Blok C10-08 Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu";

export const Logo = () => (
  <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-800">
    <div className="bg-brand-blue text-white p-1.5 rounded-lg">
      <Home size={24} />
    </div>
    <span className="flex items-center gap-1">
        {APP_NAME} <span className="text-brand-blue">RT 002</span>
    </span>
  </div>
);

export const generateHouses = (): House[] => {
  const blockConfig = [
    { code: 'C5', start: 1, end: 26 },
    { code: 'C7', start: 1, end: 18 },
    { code: 'C8', start: 1, end: 18 },
    { code: 'C9', start: 1, end: 18 },
    { code: 'C10', start: 1, end: 16 },
    { code: 'C11', start: 1, end: 18 },
    { code: 'C12', start: 1, end: 15 },
  ];

  const houses: House[] = [];
  blockConfig.forEach(config => {
    for (let i = config.start; i <= config.end; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      houses.push({
        id: `${config.code}-${number}`,
        block: config.code,
        number: number,
        headOfFamily: `Warga ${config.code}-${number}`,
        occupants: Math.floor(Math.random() * 4) + 1,
        status: 'Occupied',
        paymentStatus: PaymentStatus.PAID,
        accessCode: '1234' // Default for testing
      });
    }
  });
  return houses;
};

export const INITIAL_OFFICIALS: Official[] = [
    { id: '1', role: 'Ketua RT', name: 'Bpk. IRFAN ARIANTO', houseId: 'C10-08', phone: '0859-6119-4621' }, 
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Kerja Bakti Minggu Ini', content: 'Diharapkan warga Blok C7 berkumpul jam 7 pagi.', date: '2023-11-01', type: 'General' },
];

export const MOCK_UMKM: UMKM[] = [];
export const INITIAL_REPORTS: Report[] = [];
export const INITIAL_LETTERS: LetterRequest[] = [];
export const MOCK_RONDA: RondaSchedule[] = [
  { day: 'Senin', members: ['Pak Budi', 'Pak Asep'] },
  { day: 'Selasa', members: ['Pak Dedi', 'Pak Eko'] },
];
export const MOCK_CASHFLOW: CashFlow[] = [];
export const MOCK_INVENTORY: InventoryItem[] = [];
export const MOCK_POLLS: Poll[] = [];
export const MOCK_RONDA_LOGS: RondaCheckLog[] = [];
export const MOCK_MARKET_ITEMS: MarketItem[] = [];
export const MOCK_GALLERY: any[] = [];
export const DEFAULT_PDF_CONFIG: PdfConfig = {
  logo: "", stamp: "", signature: "", rtName: "RT.002", rtAddress: RT_ADDRESS
};
