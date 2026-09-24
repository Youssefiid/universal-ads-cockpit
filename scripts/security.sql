-- Rôle applicatif : celui que l'application web utilise réellement (voir
-- lib/prisma.ts, APP_DATABASE_URL). Sans lui, l'application tournerait comme
-- propriétaire de la base — un rôle qui peut être superutilisateur sur
-- certaines bases gérées, avec un accès total sans aucune restriction.
--
-- La portée par client (admin voit tout, traffic manager voit ClientAssignment)
-- est appliquée au niveau applicatif dans lib/queries.ts, pas par des
-- politiques RLS PostgreSQL : tout accès passe par getSession() côté
-- serveur, jamais par une requête SQL construite depuis le client. Pas de
-- politiques par ligne pour l'instant ; le jour où un accès direct à la base
-- serait nécessaire, elles viendront s'ajouter ici, sur le modèle
-- d'ads-dashboard.
--
-- Les mots de passe sont substitués par scripts/apply-security.ts avant
-- exécution, jamais écrits en clair dans ce fichier suivi par Git.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rw') THEN
    CREATE ROLE app_rw LOGIN PASSWORD '__APP_RW_PASSWORD__';
  ELSE
    ALTER ROLE app_rw PASSWORD '__APP_RW_PASSWORD__';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO app_rw;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw;
