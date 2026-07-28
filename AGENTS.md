# Conventions durables de Horace

## Architecture

- Le dépôt utilise les workspaces npm, sans Nx ni Turborepo.
- L'API vit dans `apps/api`; le futur frontend vivra dans `apps/web`.
- TypeScript est strict et le projet utilise les modules ESM.
- L'API est préfixée par `/api/v1`.
- Le code métier est organisé par domaine.
- Chaque domaine sépare controller, service et repository.
- Les controllers gèrent HTTP.
- Les services portent les règles métier et traduisent les erreurs typées des
  repositories en erreurs applicatives.
- Toutes les requêtes repository sont filtrées par propriétaire.
- Lorsqu'une règle de cohérence entre plusieurs ressources doit être garantie
  dans la même transaction que l'écriture, le service peut déléguer au
  repository une opération transactionnelle explicite.
- Les repositories isolent Prisma, utilisent `ownerId`, retournent des
  résultats ou erreurs typés et n'exposent jamais directement une erreur
  Prisma.
- Ne pas ajouter de bibliothèque d'injection de dépendances. Utiliser des
  constructeurs ou fonctions explicites.
- Ne pas créer d'abstraction générique de repository sans besoin concret.

## Modèle métier

- Le modèle est multi-utilisateur dès le premier schéma.
- Toute donnée métier appartient à un utilisateur et toute requête future doit
  être filtrée par propriétaire.
- Vérifier que l'utilisateur, l'agence, l'élève, le représentant et le cours
  ont le même propriétaire, dans le service ou dans l'opération
  transactionnelle explicite du repository selon la cohérence à garantir.
- `Lesson.agencyId` représente l'affectation historique du cours à une agence.
  Une modification ultérieure de `Student.agencyId` ne modifie jamais les
  anciens cours.
- Une correction ou amélioration du nom d'une même agence reste volontairement
  visible dans les anciens rapports.
- Lorsqu'un changement d'agence représente une nouvelle identité métier, créer
  une nouvelle agence et désactiver l'ancienne.
- Les statistiques par agence utilisent toujours `Lesson.agencyId`, jamais
  l'agence actuelle de l'élève.
- Le tarif enregistré sur un cours est un instantané historique.
- Une agence ou un élève possédant un historique est désactivé, pas supprimé.
- Tout cours dont l'état final est `PLANNED` référence un élève actif et une
  agence active.
- Un élève ou une agence référencé par un cours `PLANNED` ne peut pas être
  désactivé. Terminer ou annuler d'abord les cours concernés, sans les modifier
  ou les supprimer automatiquement lors de la désactivation.
- Les dates sont stockées en UTC et interprétées dans le fuseau
  `Europe/Paris`.
- Les semaines métier suivent ISO 8601, du lundi au dimanche.
- La devise initiale est EUR.
- Les tarifs et montants sont des centimes entiers, jamais des flottants.

## Validation et erreurs

- Valider toutes les entrées externes et variables d'environnement avec Zod.
- Centraliser la traduction des erreurs en réponses HTTP.
- Ne jamais exposer une erreur Prisma, une stack trace ou un secret au client.

## Sécurité

- Ne jamais versionner un fichier `.env` ni le client Prisma généré.
- L'API ne doit pas être déployée publiquement avant l'implémentation de
  l'authentification et de l'autorisation.
- Ne pas ajouter de mot de passe, JWT ou middleware d'authentification avant le
  chantier dédié.

## Dépendances et qualité

- Préférer la plateforme Node.js et des dépendances déjà installées.
- Toute nouvelle dépendance doit répondre à un besoin concret.
- Après une modification de code, exécuter au minimum `npm run lint` et
  `npm run typecheck`.
- Ajouter ou adapter les tests d'intégration lors d'une modification de règle
  métier et exécuter la suite pertinente avant la fin de la tâche.
- Les tests automatisés utilisent exclusivement la base dédiée `horace_test`.
  Ne jamais les exécuter ni nettoyer leurs données dans la base de
  développement `horace`.
- Lors d'un changement Prisma, générer le client et créer ou appliquer la
  migration appropriée.
- Ne pas implémenter de CRUD hors de l'étape explicitement demandée.

## Compte rendu de fin de tâche

- À la fin de chaque tâche, lister chronologiquement les commandes exécutées.
- Pour chaque commande, indiquer son résultat.
- Signaler les erreurs rencontrées dans leur ordre d'apparition.
- Décrire les corrections apportées en réponse à ces erreurs.
