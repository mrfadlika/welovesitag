// Dummy retase data for the application
export const TRUCK_TYPES = [
  { value: 'dyna', label: 'Dyna', capacity: '5 Ton' },
  { value: 'fuso', label: 'Fuso', capacity: '8 Ton' },
];

export const PIT_OWNERS = [
  { value: 'pt_mandiri', label: 'PT Mandiri Jaya' },
  { value: 'pt_berkah', label: 'PT Berkah Sejahtera' },
  { value: 'pt_abadi', label: 'PT Abadi Makmur' },
  { value: 'pt_sentosa', label: 'PT Sentosa Mining' },
];

// Generate realistic dummy retase data
export const generateDummyRetase = () => {
  const data = [];
  const today = new Date();
  
  const truckNumbers = [
    'DD 1234 AB', 'DD 5678 CD', 'DD 9012 EF', 'DD 3456 GH',
    'DD 7890 IJ', 'DD 2345 KL', 'DD 6789 MN', 'DD 0123 OP',
    'DD 4567 QR', 'DD 8901 ST', 'DD 1357 UV', 'DD 2468 WX',
  ];

  const excaIds = ['EXC-001', 'EXC-002', 'EXC-003', 'EXC-004', 'EXC-005'];
  const excaOperators = ['Hasan Maulana', 'Irfan Setiawan', 'Joko Prasetyo', 'Karim Fadillah', 'Lukman Hakim'];
  
  for (let i = 0; i < 35; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    date.setHours(6 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));
    
    const truckType = Math.random() > 0.5 ? 'dyna' : 'fuso';
    const truckNumber = truckNumbers[Math.floor(Math.random() * truckNumbers.length)];
    const pitOwner = PIT_OWNERS[Math.floor(Math.random() * PIT_OWNERS.length)];
    const excaIdx = Math.floor(Math.random() * excaIds.length);
    
    data.push({
      id: `RET-${String(i + 1).padStart(4, '0')}`,
      truckNumber,
      truckType,
      truckTypeLabel: truckType === 'dyna' ? 'Dyna' : 'Fuso',
      pitOwner: pitOwner.label,
      excaId: excaIds[excaIdx],
      excaOperator: excaOperators[excaIdx],
      timestamp: date.toISOString(),
      date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      inputBy: Math.random() > 0.5 ? 'Budi Santoso' : 'Dedi Kurniawan',
      inputRole: Math.random() > 0.5 ? 'Staff Pos' : 'Checker',
      photo: null,
      status: Math.random() > 0.2 ? 'verified' : 'pending',
    });
  }
  
  return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const DUMMY_RETASE = generateDummyRetase();

// Dashboard stats
export const getDashboardStats = () => {
  const today = new Date().toDateString();
  const todayData = DUMMY_RETASE.filter(r => new Date(r.timestamp).toDateString() === today);
  
  return {
    totalRetaseToday: todayData.length,
    totalRetaseWeek: DUMMY_RETASE.length,
    dynaCount: DUMMY_RETASE.filter(r => r.truckType === 'dyna').length,
    fusoCount: DUMMY_RETASE.filter(r => r.truckType === 'fuso').length,
    verifiedCount: DUMMY_RETASE.filter(r => r.status === 'verified').length,
    pendingCount: DUMMY_RETASE.filter(r => r.status === 'pending').length,
    uniqueTrucks: [...new Set(DUMMY_RETASE.map(r => r.truckNumber))].length,
  };
};
