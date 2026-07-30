# Contrat HTTP de l'API

[`openapi.yaml`](./openapi.yaml) est la source contractuelle de l'API Horace.
Il décrit les routes effectivement exposées, leurs entrées, leurs réponses et
les principales règles métier observables par un client.

Les agents travaillant sur le frontend ou un autre client HTTP doivent le lire
avant d'inspecter les fichiers internes du backend. Le code et les tests
d'intégration servent à vérifier sa fidélité.

Le contrat utilise OpenAPI 3.1. Il ne déclare aucun schéma de sécurité tant que
l'authentification n'existe pas. Le fournisseur local basé sur `DEV_USER_ID`
reste un détail serveur et l'API ne doit pas être exposée publiquement.

Toute modification d'un endpoint doit mettre à jour ce fichier dans la même
tâche. Le contrat doit rester cohérent avec les tests d'intégration.
