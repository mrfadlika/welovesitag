const express = require('express');
const prisma = require('../lib/prisma');
const { getNextCode } = require('../utils/id-generator');

const router = express.Router();

function serializeContractor(ctr) {
  return {
    id: ctr.code,
    name: ctr.name,
    contactPerson: ctr.contactPerson || null,
    contactNumber: ctr.contactNumber || null,
    address: ctr.address || null,
    notes: ctr.notes || null,
    registeredBy: ctr.registeredBy,
    registeredByRole: ctr.registeredByRole,
    registeredAt: ctr.registeredAt,
    status: ctr.status,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    const contractors = await prisma.contractorData.findMany({
      where: status ? { status } : undefined,
      orderBy: { registeredAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: contractors.map(serializeContractor),
      count: contractors.length,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      contactPerson,
      contactNumber,
      address,
      notes,
      registeredBy,
      registeredByRole,
      createdBy,
      createdByRole,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama kontraktor wajib diisi',
      });
    }

    const newContractor = await prisma.contractorData.create({
      data: {
        code: await getNextCode(prisma.contractorData, 'CTR'),
        name: String(name).trim(),
        contactPerson: contactPerson ? String(contactPerson).trim() : null,
        contactNumber: contactNumber ? String(contactNumber).trim() : null,
        address: address ? String(address).trim() : null,
        notes: notes ? String(notes).trim() : null,
        registeredBy: registeredBy || createdBy || 'Unknown',
        registeredByRole: registeredByRole || createdByRole || 'Admin',
        status: 'active',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Kontraktor berhasil didaftarkan',
      data: serializeContractor(newContractor),
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const {
      name,
      contactPerson,
      contactNumber,
      address,
      notes,
    } = req.body;

    const contractor = await prisma.contractorData.findUnique({
      where: { code: req.params.id },
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: 'Kontraktor tidak ditemukan',
      });
    }

    const updatedContractor = await prisma.contractorData.update({
      where: { code: req.params.id },
      data: {
        name: name !== undefined ? (name ? String(name).trim() : null) : contractor.name,
        contactPerson: contactPerson !== undefined ? (contactPerson ? String(contactPerson).trim() : null) : contractor.contactPerson,
        contactNumber: contactNumber !== undefined ? (contactNumber ? String(contactNumber).trim() : null) : contractor.contactNumber,
        address: address !== undefined ? (address ? String(address).trim() : null) : contractor.address,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : contractor.notes,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Data kontraktor berhasil diperbarui',
      data: serializeContractor(updatedContractor),
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const contractor = await prisma.contractorData.findUnique({
      where: { code: req.params.id },
    });

    if (!contractor) {
      return res.status(404).json({
        success: false,
        message: 'Kontraktor tidak ditemukan',
      });
    }

    await prisma.contractorData.delete({
      where: { code: req.params.id },
    });

    return res.status(200).json({
      success: true,
      message: 'Kontraktor berhasil dihapus',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
