# Horace

Horace est une application de planification et de suivi des cours particuliers,
des heures réalisées et des montants associés.

Le dépôt est un monorepo npm. Seule l'API existe pour le moment.

## Prérequis

- Node.js LTS
- npm
- Docker avec Docker Compose

## Installation

```bash
npm install
cp apps/api/.env.example apps/api/.env
docker compose up -d db
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

L'API écoute par défaut sur `http://localhost:3000`. Sa route de santé est :

```text
GET /api/v1/health
```

## Commandes

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm run prisma:generate
npm run prisma:migrate -- --name <migration>
npm run prisma:migrate:deploy
npm run prisma:seed
npm run prisma:studio
```

## Configuration

La configuration locale se trouve dans `apps/api/.env`. Ce fichier et le client
Prisma généré ne sont jamais versionnés. `apps/api/.env.example` documente les
variables attendues.

- Les dates sont enregistrées en UTC.
- Le fuseau métier est `Europe/Paris`.
- Les semaines sont des semaines ISO, du lundi au dimanche.
- La devise initiale est l'euro.
- Les montants et tarifs sont enregistrés en centimes entiers.

## Utilisateur local

Le seed crée uniquement :

- l'utilisateur `dev@horace.local`, avec l'identifiant
  `00000000-0000-4000-8000-000000000001` ;
- les cinq agences de développement prévues.

Le seed est idempotent et ne crée aucun élève ni représentant fictif.

## Avertissement de sécurité

L'API ne possède encore aucune authentification. Le modèle est multi-utilisateur,
mais aucune requête n'est actuellement protégée.

**Ne pas déployer Horace publiquement avant l'ajout de l'authentification et des
contrôles d'autorisation.**

## Structure

```text
apps/api/
├── prisma/
└── src/
    ├── config/
    ├── infrastructure/
    └── shared/
```

Les futurs domaines suivront une structure controller / service / repository.
L'étape actuelle expose uniquement la route de santé.
