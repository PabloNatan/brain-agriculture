import {
  PrismaClient,
  DocumentType,
  Property,
  Season,
  Producer,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in reverse order due to foreign keys)
  await prisma.crop.deleteMany();
  await prisma.season.deleteMany();
  await prisma.cultureType.deleteMany();
  await prisma.property.deleteMany();
  await prisma.producer.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create Culture Types
  const cultureTypes = await prisma.cultureType.createMany({
    data: [
      // Main grain crops
      { title: 'Soja', name: 'soja' },
      { title: 'Milho', name: 'milho' },
      { title: 'Arroz', name: 'arroz' },
      { title: 'Trigo', name: 'trigo' },
      { title: 'Feijão', name: 'feijao' },
      { title: 'Sorgo', name: 'sorgo' },

      // Fiber crops
      { title: 'Algodão', name: 'algodao' },

      // Permanent crops
      { title: 'Café', name: 'cafe' },
      { title: 'Cana-de-açúcar', name: 'cana-de-acucar' },
      { title: 'Eucalipto', name: 'eucalipto' },
      { title: 'Laranja', name: 'laranja' },
      { title: 'Banana', name: 'banana' },

      // Vegetables and other crops
      { title: 'Mandioca', name: 'mandioca' },
      { title: 'Batata', name: 'batata' },
      { title: 'Tomate', name: 'tomate' },
    ],
  });

  const allCultureTypes = await prisma.cultureType.findMany();
  console.log('🌾 Created culture types');

  // Create Producers
  const producers = [
    {
      document: '11144477735', // Valid CPF
      documentType: DocumentType.CPF,
      name: 'João Silva Santos',
    },
    {
      document: '22233344456', // Valid CPF
      documentType: DocumentType.CPF,
      name: 'Maria Oliveira Costa',
    },
    {
      document: '33322211187', // Valid CPF
      documentType: DocumentType.CPF,
      name: 'Carlos Eduardo Ferreira',
    },
    {
      document: '11222333000181', // Valid CNPJ
      documentType: DocumentType.CNPJ,
      name: 'Fazendas Reunidas Ltda',
    },
    {
      document: '22333444000195', // Valid CNPJ
      documentType: DocumentType.CNPJ,
      name: 'Agropecuária Brasil S.A.',
    },
    {
      document: '44455566678', // Valid CPF
      documentType: DocumentType.CPF,
      name: 'Ana Paula Rodrigues',
    },
    {
      document: '55566677789', // Valid CPF
      documentType: DocumentType.CPF,
      name: 'Pedro Henrique Lima',
    },
    {
      document: '33444555000123', // Valid CNPJ
      documentType: DocumentType.CNPJ,
      name: 'Cooperativa Agrícola Central',
    },
  ];

  const createdProducers: Producer[] = [];
  for (const producer of producers) {
    const created = await prisma.producer.create({ data: producer });
    createdProducers.push(created);
  }
  console.log('👨‍🌾 Created producers');

  // Create Properties with realistic area validation
  const properties = [
    // Producer 1 properties
    {
      name: 'Fazenda Santa Rita',
      city: 'Ribeirão Preto',
      state: 'SP',
      totalArea: 500.0,
      arableArea: 350.0,
      vegetationArea: 150.0,
      producerId: createdProducers[0].id,
    },
    {
      name: 'Sítio Boa Esperança',
      city: 'Campinas',
      state: 'SP',
      totalArea: 150.0,
      arableArea: 100.0,
      vegetationArea: 50.0,
      producerId: createdProducers[0].id,
    },
    // Producer 2 properties
    {
      name: 'Fazenda Três Corações',
      city: 'Uberlândia',
      state: 'MG',
      totalArea: 800.0,
      arableArea: 600.0,
      vegetationArea: 200.0,
      producerId: createdProducers[1].id,
    },
    // Producer 3 properties
    {
      name: 'Fazenda Cerrado Verde',
      city: 'Brasília',
      state: 'DF',
      totalArea: 1200.0,
      arableArea: 900.0,
      vegetationArea: 300.0,
      producerId: createdProducers[2].id,
    },
    {
      name: 'Propriedade São João',
      city: 'Goiânia',
      state: 'GO',
      totalArea: 300.0,
      arableArea: 200.0,
      vegetationArea: 100.0,
      producerId: createdProducers[2].id,
    },
    // Producer 4 properties (CNPJ - larger operations)
    {
      name: 'Complexo Agro Norte',
      city: 'Cuiabá',
      state: 'MT',
      totalArea: 2500.0,
      arableArea: 2000.0,
      vegetationArea: 500.0,
      producerId: createdProducers[3].id,
    },
    {
      name: 'Fazenda Dourada',
      city: 'Campo Grande',
      state: 'MS',
      totalArea: 1800.0,
      arableArea: 1400.0,
      vegetationArea: 400.0,
      producerId: createdProducers[3].id,
    },
    // Producer 5 properties (CNPJ)
    {
      name: 'Agro Industrial Sul',
      city: 'Londrina',
      state: 'PR',
      totalArea: 3000.0,
      arableArea: 2200.0,
      vegetationArea: 800.0,
      producerId: createdProducers[4].id,
    },
    {
      name: 'Fazenda Pioneira',
      city: 'Cascavel',
      state: 'PR',
      totalArea: 1500.0,
      arableArea: 1100.0,
      vegetationArea: 400.0,
      producerId: createdProducers[4].id,
    },
    // Producer 6 properties
    {
      name: 'Sítio Flores do Campo',
      city: 'Belo Horizonte',
      state: 'MG',
      totalArea: 200.0,
      arableArea: 140.0,
      vegetationArea: 60.0,
      producerId: createdProducers[5].id,
    },
    // Producer 7 properties
    {
      name: 'Fazenda Horizonte',
      city: 'Palmas',
      state: 'TO',
      totalArea: 600.0,
      arableArea: 450.0,
      vegetationArea: 150.0,
      producerId: createdProducers[6].id,
    },
    // Producer 8 properties (CNPJ - Cooperative)
    {
      name: 'Unidade Cooperativa A',
      city: 'Dourados',
      state: 'MS',
      totalArea: 2200.0,
      arableArea: 1800.0,
      vegetationArea: 400.0,
      producerId: createdProducers[7].id,
    },
    {
      name: 'Unidade Cooperativa B',
      city: 'Rondonópolis',
      state: 'MT',
      totalArea: 1900.0,
      arableArea: 1500.0,
      vegetationArea: 400.0,
      producerId: createdProducers[7].id,
    },
  ];

  const createdProperties: Property[] = [];
  for (const property of properties) {
    const created = await prisma.property.create({ data: property });
    createdProperties.push(created);
  }
  console.log('🏡 Created properties');

  // Create Seasons
  const seasons: Season[] = [];
  const currentYear = new Date().getFullYear();

  for (const property of createdProperties) {
    // Create seasons for last 3 years
    for (let year = currentYear - 2; year <= currentYear; year++) {
      const season = await prisma.season.create({
        data: {
          name: `Safra ${year}`,
          year: year,
          propertyId: property.id,
        },
      });
      seasons.push(season);
    }
  }
  console.log('📅 Created seasons');

  // Create Crops (realistic combinations)
  const cropCombinations = [
    // Common crop rotations and combinations
    { cultures: ['soja', 'milho'], weight: 0.35 }, // Very common rotation
    { cultures: ['soja'], weight: 0.18 }, // Soja monoculture
    { cultures: ['milho'], weight: 0.12 }, // Milho monoculture
    { cultures: ['cafe'], weight: 0.08 }, // Permanent culture
    { cultures: ['cana-de-acucar'], weight: 0.08 }, // Permanent culture
    { cultures: ['soja', 'feijao'], weight: 0.05 }, // Rotation
    { cultures: ['algodao'], weight: 0.04 }, // Cotton
    { cultures: ['arroz'], weight: 0.03 }, // Rice
    { cultures: ['eucalipto'], weight: 0.02 }, // Forestry
    { cultures: ['milho', 'feijao'], weight: 0.02 }, // Small farmer rotation
    { cultures: ['mandioca'], weight: 0.015 }, // Cassava
    { cultures: ['trigo'], weight: 0.01 }, // Wheat
    { cultures: ['sorgo'], weight: 0.005 }, // Sorghum
  ];

  for (const season of seasons) {
    // Randomly decide if this season will have crops (90% chance)
    if (Math.random() > 0.1) {
      // Select crop combination based on weights
      const random = Math.random();
      let currentWeight = 0;
      let selectedCombination = cropCombinations[0];

      for (const combination of cropCombinations) {
        currentWeight += combination.weight;
        if (random <= currentWeight) {
          selectedCombination = combination;
          break;
        }
      }

      // Create crops for selected cultures
      for (const cultureName of selectedCombination.cultures) {
        const cultureType = allCultureTypes.find(
          (ct) => ct.name === cultureName,
        );
        if (cultureType) {
          // Get property to calculate realistic planted area
          const property = createdProperties.find((p) => {
            return seasons.some(
              (s) => s.id === season.id && s.propertyId === p.id,
            );
          });

          if (property) {
            // Plant between 20% to 80% of arable area for each culture
            const maxPlantedArea =
              Number(property.arableArea) / selectedCombination.cultures.length;
            const plantedArea =
              Math.round(maxPlantedArea * (0.2 + Math.random() * 0.6) * 100) /
              100;

            await prisma.crop.create({
              data: {
                seasonId: season.id,
                cultureTypeId: cultureType.id,
                plantedArea: plantedArea,
              },
            });
          }
        }
      }
    }
  }
  console.log('🌱 Created crops');

  // Create relationships between properties and culture types
  // This creates the many-to-many relationship for cultures that have been planted
  const propertyUpdates = [];
  for (const property of createdProperties) {
    const propertySeasons = seasons.filter((s) => s.propertyId === property.id);
    const crops = await prisma.crop.findMany({
      where: {
        seasonId: { in: propertySeasons.map((s) => s.id) },
      },
      include: { cultureType: true },
    });

    const uniqueCultureTypeIds = [
      ...new Set(crops.map((c) => c.cultureTypeId)),
    ];

    if (uniqueCultureTypeIds.length > 0) {
      await prisma.property.update({
        where: { id: property.id },
        data: {
          cultures: {
            connect: uniqueCultureTypeIds.map((id) => ({ id })),
          },
        },
      });
    }
  }

  console.log('🔗 Connected properties with culture types');

  // Print summary statistics
  const totalProducers = await prisma.producer.count();
  const totalProperties = await prisma.property.count();
  const totalSeasons = await prisma.season.count();
  const totalCrops = await prisma.crop.count();
  const totalCultureTypes = await prisma.cultureType.count();

  console.log('\n📊 Seeding Summary:');
  console.log(`  Producers: ${totalProducers}`);
  console.log(`  Properties: ${totalProperties}`);
  console.log(`  Culture Types: ${totalCultureTypes}`);
  console.log(`  Seasons: ${totalSeasons}`);
  console.log(`  Crops: ${totalCrops}`);

  // Print some sample dashboard data
  const totalHectares = await prisma.property.aggregate({
    _sum: { totalArea: true },
  });

  const farmsByState = await prisma.property.groupBy({
    by: ['state'],
    _count: { id: true },
  });

  console.log(`  Total Hectares: ${totalHectares._sum.totalArea}`);
  console.log('  Farms by State:');
  farmsByState.forEach((item) => {
    console.log(`    ${item.state}: ${item._count.id} farms`);
  });

  console.log('\n✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
