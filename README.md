# Brain Agriculture API

A RESTful API for managing agricultural producers, properties, and crop data. Built with NestJS, Prisma, and PostgreSQL.

## Description

Brain Agriculture is a comprehensive agricultural management system that allows tracking of:
- **Producers**: Individual farmers and agricultural companies (CPF/CNPJ)
- **Properties**: Farm properties with location and area information
- **Crops**: Seasonal crop plantings by culture type
- **Culture Types**: Different crop varieties (Soja, Milho, Café, etc.)
- **Seasons**: Agricultural seasons for crop planning

## Live Application

🌐 **Production URL**: [https://brain-agriculture-production-9ba9.up.railway.app/](https://brain-agriculture-production-9ba9.up.railway.app/)

The API documentation is available at the `/docs` endpoint when running the application.

## Features

- ✅ **Producer Management**: CRUD operations for agricultural producers with CPF/CNPJ validation
- ✅ **Property Management**: Track farm properties with area calculations and location data
- ✅ **Crop Management**: Manage seasonal crops with culture type associations
- ✅ **Culture Types**: Predefined and custom crop varieties
- ✅ **Seasons**: Agricultural season management
- ✅ **Data Validation**: Comprehensive input validation using Zod schemas
- ✅ **API Documentation**: Swagger/OpenAPI documentation
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **Testing**: Unit and E2E test coverage

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod with nestjs-zod
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Deployment**: Railway

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd brain-agriculture

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Update .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npm run db:seed
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The application will be available at `http://localhost:3000`

API documentation is available at `http://localhost:3000/docs`

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## API Endpoints

### Producers
- `GET /producers` - List all producers
- `POST /producers` - Create a new producer
- `GET /producers/:id` - Get producer by ID
- `PATCH /producers/:id` - Update producer
- `DELETE /producers/:id` - Delete producer

### Properties
- `GET /properties` - List all properties
- `POST /properties` - Create a new property
- `GET /properties/:id` - Get property by ID
- `PATCH /properties/:id` - Update property
- `DELETE /properties/:id` - Delete property
- `POST /properties/:id/cultures` - Attach culture types to property

### Culture Types
- `GET /culture-types` - List all culture types
- `POST /culture-types` - Create a new culture type
- `GET /culture-types/:id` - Get culture type by ID
- `PATCH /culture-types/:id` - Update culture type
- `DELETE /culture-types/:id` - Delete culture type

### Seasons
- `GET /seasons` - List all seasons
- `POST /seasons` - Create a new season
- `GET /seasons/:id` - Get season by ID
- `PATCH /seasons/:id` - Update season
- `DELETE /seasons/:id` - Delete season

### Crops
- `GET /crops` - List all crops
- `POST /crops` - Create a new crop
- `GET /crops/:id` - Get crop by ID
- `PATCH /crops/:id` - Update crop
- `DELETE /crops/:id` - Delete crop

## Database Schema

The application uses the following main entities:

- **Producer**: Agricultural producer with CPF/CNPJ validation
- **Property**: Farm property with area management
- **Season**: Agricultural seasons
- **CultureType**: Crop varieties (Soja, Milho, Café, etc.)
- **Crop**: Junction table linking seasons with culture types

## Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/brain_agriculture"
NODE_ENV="development"
PORT=3000
```

## Development Commands

```bash
# Lint and fix code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Reset and reseed database
npx prisma migrate reset
npm run db:seed
```

## Deployment

The application is deployed on Railway and automatically deploys from the main branch.

Production URL: [https://brain-agriculture-production-9ba9.up.railway.app/](https://brain-agriculture-production-9ba9.up.railway.app/)

## License

This project is licensed under the UNLICENSED license.
