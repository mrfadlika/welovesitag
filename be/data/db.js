/**
 * In-Memory Database for SITAG
 * Data persists during server runtime
 * For production, use real database like MongoDB/PostgreSQL
 */

const db = {
  users: [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      name: 'Ahmad Rizki',
      role: 'admin',
      email: 'admin@sitag.co.id',
      avatar: null,
    },
    {
      id: 2,
      username: 'staffpos',
      password: 'staff123',
      name: 'Budi Santoso',
      role: 'staff_pos',
      email: 'budi@sitag.co.id',
      posName: 'Pos Utama A',
    },
    {
      id: 3,
      username: 'checker',
      password: 'checker123',
      name: 'Dedi Kurniawan',
      role: 'checker',
      email: 'dedi@sitag.co.id',
      pitArea: 'Pit 3 - Blok B',
    },
  ],

  // Trucks that have registered entering (from Staff POS)
  trucks: [
    {
      id: 'TRK-001',
      truckNumber: 'DD 1234 AB',
      truckType: 'dyna',
      truckTypeLabel: 'Dyna',
      registeredBy: 'Budi Santoso',
      registeredByRole: 'Staff Pos',
      registeredAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'entered', // entered, in_checkout, exited
      photo: null,
    },
    {
      id: 'TRK-002',
      truckNumber: 'DD 5678 CD',
      truckType: 'fuso',
      truckTypeLabel: 'Fuso',
      registeredBy: 'Budi Santoso',
      registeredByRole: 'Staff Pos',
      registeredAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'entered',
      photo: null,
    },
  ],

  // Checkouts - mapping of excavators to trucks (from Checker)
  checkouts: [
    {
      id: 'CHK-001',
      truckId: 'TRK-001',
      truckNumber: 'DD 1234 AB',
      pitOwner: 'PT Mandiri Jaya',
      excaId: 'EXC-001',
      excaOperator: 'Hasan Maulana',
      checkedOutBy: 'Dedi Kurniawan',
      checkedOutAt: new Date(Date.now() - 1800000).toISOString(),
      status: 'ready_for_exit', // ready_for_exit, verified, exited
      verifiedBy: null,
      verifiedAt: null,
      photo: null,
    },
  ],

  // Counter untuk generate IDs
  counters: {
    trucks: 2,
    checkouts: 1,
  },
};

module.exports = db;
