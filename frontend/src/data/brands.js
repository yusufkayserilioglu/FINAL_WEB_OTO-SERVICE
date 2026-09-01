export const brands = [
  { id: 'bmw',        name: 'BMW',         logo: '/logos/bmw.svg',         specialty: true  },
  { id: 'porsche',    name: 'Porsche',      logo: '/logos/porsche.svg',     specialty: true  },
  { id: 'audi',       name: 'Audi',         logo: '/logos/audi.svg',        specialty: true  },
  { id: 'mercedes',   name: 'Mercedes',     logo: '/logos/mercedes.svg',    specialty: false },
  { id: 'rangerover', name: 'Range Rover',  logo: '/logos/rangerover.svg',  specialty: true  },
  { id: 'volkswagen', name: 'Volkswagen',   logo: '/logos/volkswagen.svg',  specialty: false },
  { id: 'toyota',     name: 'Toyota',       logo: '/logos/toyota.svg',      specialty: false },
  { id: 'honda',      name: 'Honda',        logo: '/logos/honda.svg',       specialty: false },
  { id: 'ford',       name: 'Ford',         logo: '/logos/ford.svg',        specialty: false },
  { id: 'renault',    name: 'Renault',      logo: '/logos/renault.svg',     specialty: false },
  { id: 'fiat',       name: 'Fiat',         logo: '/logos/fiat.svg',        specialty: false },
  { id: 'minicooper', name: 'Mini Cooper',  logo: '/logos/minicooper.svg',  specialty: false },
  { id: 'other',      name: 'Diğer',        logo: null,                     specialty: false },
]

export const brandOptions = brands.map(b => ({ value: b.id, label: b.name }))
