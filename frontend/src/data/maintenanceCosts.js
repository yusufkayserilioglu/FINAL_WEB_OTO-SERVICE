const costs = {
  bmw: {
    'Yağ Değişimi':     { min: 2200,  max: 3500  },
    'Periyodik Bakım':  { min: 6000,  max: 14000 },
    'Fren Balataları':  { min: 4000,  max: 9000  },
    'Şanzıman Servisi': { min: 8000,  max: 20000 },
    'Motor Revizyonu':  { min: 30000, max: 80000 },
  },
  porsche: {
    'Yağ Değişimi':     { min: 3500,  max: 6000   },
    'Periyodik Bakım':  { min: 10000, max: 25000  },
    'Fren Balataları':  { min: 8000,  max: 18000  },
    'Şanzıman Servisi': { min: 15000, max: 40000  },
    'Motor Revizyonu':  { min: 60000, max: 150000 },
  },
  audi: {
    'Yağ Değişimi':     { min: 2000,  max: 3200  },
    'Periyodik Bakım':  { min: 5500,  max: 13000 },
    'Fren Balataları':  { min: 3500,  max: 8000  },
    'Şanzıman Servisi': { min: 7000,  max: 18000 },
    'Motor Revizyonu':  { min: 28000, max: 70000 },
  },
  mercedes: {
    'Yağ Değişimi':     { min: 2500,  max: 4000  },
    'Periyodik Bakım':  { min: 7000,  max: 16000 },
    'Fren Balataları':  { min: 4500,  max: 10000 },
    'Şanzıman Servisi': { min: 9000,  max: 22000 },
    'Motor Revizyonu':  { min: 35000, max: 90000 },
  },
  rangerover: {
    'Yağ Değişimi':     { min: 3000,  max: 5000   },
    'Periyodik Bakım':  { min: 8000,  max: 18000  },
    'Fren Balataları':  { min: 5000,  max: 12000  },
    'Şanzıman Servisi': { min: 10000, max: 25000  },
    'Motor Revizyonu':  { min: 40000, max: 100000 },
  },
  volkswagen: {
    'Yağ Değişimi':     { min: 1500,  max: 2800  },
    'Periyodik Bakım':  { min: 4000,  max: 9000  },
    'Fren Balataları':  { min: 2500,  max: 6000  },
    'Şanzıman Servisi': { min: 5000,  max: 14000 },
    'Motor Revizyonu':  { min: 18000, max: 50000 },
  },
  default: {
    'Yağ Değişimi':     { min: 800,   max: 1800  },
    'Periyodik Bakım':  { min: 2000,  max: 5000  },
    'Fren Balataları':  { min: 1200,  max: 3500  },
    'Şanzıman Servisi': { min: 3000,  max: 8000  },
    'Motor Revizyonu':  { min: 10000, max: 30000 },
  },
}

export function getCostsForBrand(brandId) {
  return costs[brandId] ?? costs.default
}

export default costs
