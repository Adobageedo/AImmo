# 🔧 Guide de Dépannage - UUID Error

## 🐛 Problème

Vous rencontrez l'erreur :
```
invalid input syntax for type uuid: "org-1"
```

## ✅ Solution Rapide

Le problème est que le frontend utilise des IDs mock comme `"org-1"` mais le backend attend des UUID valides.

### 1. **Redémarrer le serveur backend** (important !)
```bash
cd backend
uvicorn app.main:app --reload
```

### 2. **Le frontend utilise maintenant des UUID valides**
Le hook `use-chat-mvp.ts` utilise maintenant :
```typescript
const organizationId = "00000000-0000-0000-0000-000000000001" // UUID valide
```

### 3. **Vérifier dans la console du navigateur**
Ouvrez les outils de développement et vérifiez que vous voyez :
```
✅ Valid organization_id: "00000000-0000-0000-0000-000000000001"
```

## 🧪 Test

1. **Ouvrez** `http://localhost:3001` (frontend)
2. **Vérifiez la console** - plus d'erreurs UUID
3. **Testez** les endpoints :
   - Charger les conversations
   - Créer une nouvelle conversation
   - Envoyer un message

## 📋 Si l'erreur persiste

### Option 1: Utiliser le composant de test
```typescript
import { getTestOrganizationId } from "@/lib/config/test-config"

const organizationId = getTestOrganizationId()
console.log("Using test org ID:", organizationId)
```

### Option 2: Créer vos propres données
```sql
-- Dans Supabase SQL Editor
INSERT INTO organizations (id, name, created_at, updated_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Org', NOW(), NOW());

INSERT INTO users (id, email, name, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000002', 'test@example.com', 'Test User', NOW(), NOW());

INSERT INTO organization_users (id, organization_id, user_id, role, created_at, updated_at)
VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'owner', NOW(), NOW());
```

## 🔍 Validation

Le backend valide maintenant les UUID avec des messages clairs :

**Avant :**
```
invalid input syntax for type uuid: "org-1"
```

**Maintenant :**
```
Invalid organization_id format. Expected UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), got: org-1
```

## 🚀 Résultat

✅ Plus d'erreurs 500  
✅ Messages d'erreur clairs  
✅ Frontend utilise des UUID valides  
✅ Backend valide les entrées  

---

**L'infrastructure est maintenant prête pour les tests !** 🎉
