import React from 'react';
import { User, Phone } from 'lucide-react';
import { ResidentRegistration, PaymentStatus, House } from '../../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../../context/ConfirmContext';
import { formatHouseId, handleFirestoreError, OperationType } from '../../../services/databaseService';

interface ResidentRegistrationListProps {
  residentRegistrations: ResidentRegistration[];
  searchTerm: string;
  updateResidentRegistrationInDb: (id: string, data: Partial<ResidentRegistration>) => Promise<void>;
  addHouse: (house: Omit<House, 'id'>) => Promise<void>;
  addPopulationLogToDb?: (log: any) => Promise<void>;
}

export const ResidentRegistrationList: React.FC<ResidentRegistrationListProps> = ({
  residentRegistrations,
  searchTerm,
  updateResidentRegistrationInDb,
  addHouse,
  addPopulationLogToDb,
}) => {
  const confirm = useConfirm();
  const searchLower = searchTerm.toLowerCase();
  const filteredRegistrations = residentRegistrations.filter(reg => {
    return reg.headOfFamily.toLowerCase().includes(searchLower) ||
           reg.block.toLowerCase().includes(searchLower) ||
           reg.number.toLowerCase().includes(searchLower) ||
           (reg.ownerName && reg.ownerName.toLowerCase().includes(searchLower)) ||
           reg.phone.toLowerCase().includes(searchLower) ||
           (reg.familyMembers && reg.familyMembers.some(m => m.name.toLowerCase().includes(searchLower)));
  });

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="mb-8">
        <h3 className="text-xl font-black text-slate-800">Permohonan Warga Baru</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          {filteredRegistrations.filter(r => r.approvalStatus === 'Pending').length} Menunggu Persetujuan
        </p>
      </div>

      <div className="space-y-4">
        {filteredRegistrations.length > 0 ? (
          filteredRegistrations.map((reg) => (
            <div key={reg.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                  <User size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-800">{reg.headOfFamily}</h4>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      reg.approvalStatus === 'Pending' ? 'bg-amber-100 text-amber-600' :
                      reg.approvalStatus === 'Approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {reg.approvalStatus}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    Blok {reg.block} No. {reg.number} • {reg.residenceType} • {reg.occupants} Jiwa
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(reg.date).toLocaleString('id-ID')}</p>
                  <div className="flex gap-2 mt-2">
                    {reg.ktpUrl && (
                      <a href={reg.ktpUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">Lihat KTP</a>
                    )}
                    {reg.kkUrl && (
                      <a href={reg.kkUrl} target="_blank" rel="noreferrer" className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Lihat KK</a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <a 
                  href={`https://wa.me/${reg.phone.replace(/^0/, '62')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Phone size={14} /> Hubungi
                </a>
                
                {reg.approvalStatus === 'Pending' && (
                  <>
                    <button 
                      onClick={async () => {
                      const isConfirmed = await confirm({
                        title: 'Tolak Pendaftaran',
                        message: 'Apakah Anda yakin ingin menolak pendaftaran ini?',
                        confirmLabel: 'Tolak',
                        isDanger: true
                      });

                      if (isConfirmed) {
                        try {
                          await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Rejected' });
                          toast.success('Pendaftaran ditolak.');
                        } catch (error) {
                          handleFirestoreError(error, OperationType.UPDATE, `residentRegistrations/${reg.id}`);
                          toast.error('Gagal menolak pendaftaran.');
                        }
                      }
                    }}
                      className="flex-1 md:flex-none px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
                    >
                      Tolak
                    </button>
                    <button 
                      onClick={async () => {
                      const isConfirmed = await confirm({
                        title: 'Setujui Pendaftaran',
                        message: 'Apakah Anda yakin ingin menyetujui pendaftaran ini? Data warga akan otomatis ditambahkan ke sistem.',
                        confirmLabel: 'Setujui',
                      });

                      if (isConfirmed) {
                        try {
                          // 1. Add to houses
                            await addHouse({
                              headOfFamily: reg.headOfFamily,
                              gender: reg.gender,
                              birthDate: reg.birthDate,
                              ownerName: reg.ownerName || reg.headOfFamily,
                              block: reg.block,
                              number: reg.number,
                              phone: reg.phone,
                              status: reg.status,
                              residenceType: reg.residenceType,
                              occupants: reg.occupants,
                              education: reg.education,
                              jobCategory: reg.jobCategory,
                              vehicleCount: reg.vehicleCount,
                              pregnantCount: reg.pregnantCount,
                              babyCount: reg.babyCount,
                              toddlerCount: reg.toddlerCount,
                              teenagerCount: reg.teenagerCount,
                              adultCount: reg.adultCount,
                              elderlyCount: reg.elderlyCount,
                              widowCount: reg.widowCount,
                              ktpUrl: reg.ktpUrl,
                              kkUrl: reg.kkUrl,
                              familyMembers: reg.familyMembers || [],
                              paymentStatusAir: PaymentStatus.PENDING,
                              paymentStatusSampah: PaymentStatus.PENDING,
                              isVerified: true,
                              joiningDate: reg.date || new Date().toISOString(),
                              religion: reg.religion,
                              kkNumber: reg.kkNumber,
                              isPKH: reg.isPKH,
                              isBLT: reg.isBLT,
                              isBansosLain: reg.isBansosLain,
                              bansosLainName: reg.bansosLainName,
                              childCount: reg.childCount,
                            } as any); // Use any to bypass strict type check if needed, but better to match House type
                            
                            // 2. Update registration status
                            await updateResidentRegistrationInDb(reg.id, { approvalStatus: 'Approved' });
                            
                            // 3. Add to population logs (Log Mutasi)
                            if (addPopulationLogToDb) {
                              await addPopulationLogToDb({
                                id: Date.now().toString(),
                                type: 'Newcomer',
                                name: reg.headOfFamily,
                                phone: reg.phone,
                                houseId: formatHouseId(`${reg.block}-${reg.number}`),
                                date: new Date().toISOString().split('T')[0],
                                description: 'Registrasi Awal (Aplikasi)',
                                isGenerated: true, // Mark as generated to exclude from reports
                                details: {
                                  previousAddress: '-',
                                  reasonForMoving: 'Registrasi Awal',
                                  familyCount: reg.occupants || 1,
                                  familyMembers: reg.familyMembers || [],
                                  residenceType: reg.residenceType || 'Tetap',
                                  religion: reg.religion || '-',
                                  kkNumber: '-',
                                  jobCategory: reg.jobCategory || '-',
                                  education: reg.education || '-'
                                }
                              });
                            }
                            
                            toast.success('Pendaftaran disetujui dan data warga telah ditambahkan!');
                          } catch (error) {
                            handleFirestoreError(error, OperationType.WRITE, `residentRegistrations/${reg.id}`);
                            toast.error('Gagal menyetujui pendaftaran.');
                          }
                        }
                      }}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      Setujui
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic">Belum ada permohonan pendaftaran warga baru.</p>
          </div>
        )}
      </div>
    </div>
  );
};
