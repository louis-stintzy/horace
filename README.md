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
npm run lint
npm run lint:fix
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

## Utilisateur local provisoire

Le seed crée uniquement :

- l'utilisateur `dev@horace.local`, avec l'identifiant
  `00000000-0000-4000-8000-000000000001` ;
- les cinq agences de développement prévues.

Le seed est idempotent et ne crée aucun élève ni représentant fictif.

`DEV_USER_ID` identifie provisoirement cet utilisateur dans les requêtes métier.
Un middleware de développement place cet identifiant dans le contexte de
requête. Les controllers et services ne connaissent pas sa valeur ; le futur
middleware d'authentification pourra remplacer ce fournisseur de contexte.

La configuration refuse explicitement `NODE_ENV=production` tant que ce
mécanisme provisoire est actif.

## API des agences

Toutes les réponses nominales enveloppent leur contenu dans `data`.

```text
POST   /api/v1/agencies
GET    /api/v1/agencies
GET    /api/v1/agencies/:id
PATCH  /api/v1/agencies/:id
```

Création :

```json
{
  "name": "Nouvelle agence",
  "notes": "Note facultative"
}
```

Modification partielle :

```json
{
  "name": "Nouveau nom",
  "notes": null,
  "isActive": false
}
```

Au moins un champ doit être fourni à `PATCH`. `notes: null` efface les notes.
La liste accepte le filtre facultatif `isActive=true` ou `isActive=false`.
Sans filtre, toutes les agences de l'utilisateur sont retournées.

Codes HTTP principaux :

- `201` : agence créée ;
- `200` : liste, consultation ou modification réussie ;
- `400` : données invalides ;
- `404` : agence absente pour l'utilisateur courant ;
- `409` : nom déjà utilisé par cet utilisateur.

## API des représentants

```text
POST   /api/v1/representatives
GET    /api/v1/representatives
GET    /api/v1/representatives/:id
PATCH  /api/v1/representatives/:id
```

Création :

```json
{
  "firstName": "Camille",
  "lastName": "Martin",
  "email": "camille@example.com",
  "phone": "06 12 34 56 78",
  "notes": "Responsable légal"
}
```

`email`, `phone` et `notes` sont facultatifs et peuvent être remis à `null`
avec `PATCH`. Au moins un champ doit être fourni lors d'une modification.

La liste retourne tous les représentants de l'utilisateur, triés par nom,
prénom puis identifiant. Elle ne possède pas encore de pagination ou de
recherche.

Codes HTTP principaux :

- `201` : représentant créé ;
- `200` : liste, consultation ou modification réussie ;
- `400` : données invalides ;
- `404` : représentant absent pour l'utilisateur courant.

Les associations entre représentants et élèves via `StudentRepresentative`
seront ajoutées dans le futur module `students`.

## Avertissement de sécurité

L'API ne possède encore aucune authentification. Le modèle est multi-utilisateur,
mais l'identité courante provient uniquement de `DEV_USER_ID`.

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
