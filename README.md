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
sont gérées par le module `students`.

## API des élèves

```text
POST   /api/v1/students
GET    /api/v1/students
GET    /api/v1/students/:id
PATCH  /api/v1/students/:id
PUT    /api/v1/students/:id/representatives
```

Création avec représentants facultatifs :

```json
{
  "agencyId": "00000000-0000-4000-8000-000000000010",
  "firstName": "Alice",
  "lastName": "Martin",
  "email": null,
  "phone": null,
  "notes": null,
  "defaultHourlyRateCents": 2700,
  "representatives": [
    {
      "representativeId": "00000000-0000-4000-8000-000000000020",
      "relationship": "Mère",
      "isPrimary": true
    }
  ]
}
```

`representatives` est facultatif et peut être vide. Les identifiants doivent
être uniques et un seul représentant au maximum peut être principal. Les
ressources référencées doivent appartenir au même utilisateur.

Le tarif par défaut est facultatif, nullable et exprimé en centimes entiers
strictement positifs.

La liste accepte les filtres facultatifs `isActive=true|false` et
`agencyId=<uuid>`. Sans filtre, elle retourne tous les élèves de l'utilisateur,
triés par nom, prénom puis identifiant.

`PATCH /api/v1/students/:id` modifie uniquement les informations générales,
l'agence courante et l'état actif. Il ne modifie jamais les représentants.

Le remplacement complet des associations utilise :

```json
{
  "representatives": [
    {
      "representativeId": "00000000-0000-4000-8000-000000000020",
      "relationship": "Père",
      "isPrimary": true
    }
  ]
}
```

`PUT /api/v1/students/:id/representatives` est atomique. Un tableau vide retire
toutes les associations. Une erreur de validation ou une ressource inexistante
laisse les anciennes associations intactes.

Codes HTTP principaux :

- `201` : élève créé ;
- `200` : liste, consultation ou modification réussie ;
- `400` : données ou associations invalides ;
- `404` : élève, agence ou représentant absent pour l'utilisateur courant ;
- `409` : agence inactive.

Changer `Student.agencyId` ne modifie jamais les cours existants : chaque cours
conserve sa propre affectation historique dans `Lesson.agencyId`.

## API des cours

```text
POST   /api/v1/lessons
GET    /api/v1/lessons
GET    /api/v1/lessons/:id
PATCH  /api/v1/lessons/:id
```

Création :

```json
{
  "studentId": "00000000-0000-4000-8000-000000000030",
  "startsAt": "2026-08-03T14:00:00+02:00",
  "endsAt": "2026-08-03T15:30:00+02:00",
  "status": "PLANNED",
  "hourlyRateCents": 3000,
  "notes": null
}
```

Les dates doivent être ISO 8601 et inclure `Z` ou un décalage UTC explicite.
`endsAt` doit être strictement postérieur à `startsAt`. Les dates retournées
sont sérialisées en UTC.

`agencyId` et `hourlyRateCents` sont facultatifs à la création. À défaut, l'API
copie l'agence courante et le tarif par défaut de l'élève. Ces valeurs restent
des instantanés historiques du cours. Lors d'un changement d'élève par `PATCH`,
les valeurs du nouvel élève sont reprises sauf si une nouvelle agence ou un
nouveau tarif sont explicitement fournis.

Le montant est calculé en centimes à partir de la durée et du tarif horaire. Un
cours annulé (`CANCELLED`) a toujours un montant nul. L'état final d'un cours
planifié exige toujours un élève et une agence actifs, y compris lors d'une
modification partielle. Les cours terminés ou annulés peuvent conserver et
utiliser des ressources désormais inactives.

Un élève ou une agence référencé par au moins un cours planifié ne peut pas être
désactivé. Les cours concernés doivent d'abord être passés à `COMPLETED` ou
`CANCELLED`. Les cours historiques ne sont ni supprimés ni modifiés
automatiquement.

La liste accepte `from` (inclus), `to` (exclus), `studentId`, `agencyId` et
`status`. Elle est triée par date de début puis identifiant. Aucun contrôle de
chevauchement n'est appliqué à ce stade : plusieurs cours simultanés sont
volontairement autorisés.

Codes HTTP principaux :

- `201` : cours créé ;
- `200` : liste, consultation ou modification réussie ;
- `400` : données ou période invalides ;
- `404` : cours, élève ou agence absent pour l'utilisateur courant ;
- `409` : ressource inactive, tarif requis ou montant hors plage.

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
