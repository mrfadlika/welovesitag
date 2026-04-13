function parseNumericSuffix(code, prefix) {
  if (!code || !code.startsWith(`${prefix}-`)) {
    return 0;
  }

  const parsedNumber = Number.parseInt(code.slice(prefix.length + 1), 10);
  return Number.isNaN(parsedNumber) ? 0 : parsedNumber;
}

async function getNextCode(model, prefix) {
  const latestRecord = await model.findFirst({
    orderBy: { id: 'desc' },
    select: { code: true },
  });

  const nextNumber = parseNumericSuffix(latestRecord?.code, prefix) + 1;
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
}

module.exports = {
  getNextCode,
};
