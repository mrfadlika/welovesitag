function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    email: user.email,
    avatar: user.avatar,
    pitArea: user.pitArea,
  };
}

function serializeTruck(truck) {
  return {
    id: truck.code,
    truckNumber: truck.truckNumber,
    truckType: truck.truckType,
    truckTypeLabel: truck.truckTypeLabel,
    registeredBy: truck.registeredBy,
    registeredByRole: truck.registeredByRole,
    registeredAt: truck.registeredAt,
    status: truck.status,
    photo: truck.photo,
    lastUpdatedBy: truck.lastUpdatedBy,
    lastUpdatedAt: truck.lastUpdatedAt,
  };
}

function serializeCheckout(checkout) {
  return {
    id: checkout.code,
    truckId: checkout.truckCode,
    truckNumber: checkout.truckNumber,
    truckType: checkout.truckType,
    truckTypeLabel: checkout.truckTypeLabel,
    materialType: checkout.materialType,
    pitOwner: checkout.pitOwner,
    locationOwner: checkout.pitOwner,
    excaId: checkout.excaId,
    heavyEquipment: checkout.excaId,
    excaOperator: checkout.excaOperator,
    contractor: checkout.contractor,
    createdBy: checkout.createdBy,
    checkerPit: checkout.createdBy,
    createdByRole: checkout.createdByRole,
    createdAt: checkout.createdAt,
    status: checkout.status,
    verifiedBy: checkout.verifiedBy,
    checkerGate: checkout.verifiedBy,
    verifiedAt: checkout.verifiedAt,
    photo: checkout.photo,
  };
}

module.exports = {
  serializeUser,
  serializeTruck,
  serializeCheckout,
};
