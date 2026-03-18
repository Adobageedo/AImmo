# Système d'Enrichissement de Baux avec Résolution d'Entités

## Vue d'ensemble

Ce système permet d'analyser des documents de bail et leurs annexes, de les comparer avec des données existantes, et d'enrichir progressivement une représentation JSON du bail sans dupliquer les entités.

---

## Architecture

### Services Principaux

#### 1. **LeaseEnrichmentService** (`lease_enrichment_service.py`)
Service central pour l'enrichissement des baux avec résolution d'entités.

**Fonctionnalités:**
- ✅ Résolution d'entités existantes (propriétés, propriétaires, locataires)
- ✅ Détection de conflits entre données existantes et nouvelles
- ✅ Merge intelligent des données
- ✅ Gestion des liens entre annexes et champs enrichis

**Méthodes principales:**
```python
def resolve_property_entity(extracted_property, existing_properties) -> Optional[str]
def resolve_party_entity(extracted_party, party_type, db) -> Optional[str]
def detect_conflicts(existing_data, new_data, source_existing, source_new) -> List[ConflictInfo]
def merge_data(existing_data, new_data, prefer_new=False) -> Tuple[Dict, List, List]
def enrich_lease(lease_text, existing_lease_json, parsed_lease, annexes) -> EnrichmentResult
```

#### 2. **AnnexProcessingService** (`annex_processing_service.py`)
Service pour traiter et extraire les informations des annexes.

**Types d'annexes supportés:**
- 📋 **Inventory** - États des lieux (entrée/sortie)
- ⚡ **Energy** - DPE/GES (diagnostics énergétiques)
- 💰 **Financial** - Quittances, factures, reçus
- 🔧 **Technical** - Notices techniques, manuels
- 📅 **Schedule** - Échéanciers, calendriers
- 🛡️ **Insurance** - Attestations d'assurance
- 👤 **Guarantor** - Actes de cautionnement
- ⚖️ **Legal** - Documents légaux, règlements
- 📄 **Other** - Autres types

**Méthodes principales:**
```python
def detect_annex_type(text, filename) -> str
async def extract_inventory_data(text) -> Dict[str, Any]
async def extract_energy_data(text) -> Dict[str, Any]
async def extract_financial_data(text) -> Dict[str, Any]
async def process_annex(annex_id, text, filename) -> AnnexInfo
async def process_multiple_annexes(annexes) -> List[AnnexInfo]
```

#### 3. **EntityMatchingService** (`entity_matching_service.py`)
Service pour faire correspondre les entités extraites avec les entités existantes.

**Algorithmes de matching:**

**Propriétés:**
- Adresse exacte/partielle: +0.6
- Code postal exact: +0.3, partiel: +0.15
- Ville exacte: +0.1, partielle: +0.05
- **Seuil minimum:** 0.5

**Personnes (Landlord/Tenant):**
- Nom exact: +0.7, partiel: +0.4
- Email exact: +0.2
- Téléphone exact: +0.1
- **Seuil minimum:** 0.6

---

## API Endpoints

### 1. **POST /api/v1/lease-parsing/parse-enriched**

Endpoint principal pour le parsing enrichi avec résolution d'entités et traitement des annexes.

**Request Body:**
```json
{
  "lease_text": "Texte complet du bail principal",
  "existing_lease_id": "uuid-optional",
  "annexes": [
    {
      "id": "annex_1",
      "text": "Texte de l'annexe",
      "filename": "etat_des_lieux.pdf"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lease parsed and enriched successfully",
  "data": {
    "enriched_lease": {
      "property_address": "123 Rue de la Paix",
      "monthly_rent": 1200.0,
      "start_date": "2024-01-01",
      ...
    },
    "resolved_entities": {
      "property": "property-uuid",
      "landlord": "landlord-uuid",
      "tenant": "tenant-uuid"
    },
    "conflicts": [
      {
        "field": "monthly_rent",
        "existing_value": 1200.0,
        "new_value": 1250.0,
        "existing_source": "existing_database",
        "new_source": "new_parsing",
        "confidence": 0.8,
        "recommendation": "new"
      }
    ],
    "new_fields": ["energy_class", "ges_class"],
    "updated_fields": [],
    "annex_links": {
      "energy_class": ["annex_dpe"],
      "inventory": ["annex_edl"]
    },
    "processed_annexes": [
      {
        "id": "annex_dpe",
        "type": "energy",
        "extracted_data": {
          "energy_class": "C",
          "ges_class": "B"
        }
      }
    ],
    "parsing_confidence": 0.85
  },
  "debug_info": {
    "has_existing_lease": true,
    "annexes_processed": 2,
    "entities_resolved": 3,
    "conflicts_found": 1,
    "new_fields_count": 2,
    "updated_fields_count": 0,
    "parsing_confidence": 0.85
  }
}
```

### 2. **GET /api/v1/lease-parsing/debug/entities**

Endpoint de debug pour lister toutes les entités existantes.

**Response:**
```json
{
  "success": true,
  "data": {
    "properties": [...],
    "tenants": [...],
    "landlords": [...],
    "counts": {
      "properties": 10,
      "tenants": 15,
      "landlords": 8
    }
  }
}
```

### 3. **POST /api/v1/lease-parsing/test-matching**

Endpoint de test pour le matching d'entités.

---

## Flux de Traitement

### Étape 1: Récupération du Bail Existant
```
Si existing_lease_id fourni:
  ↓
Récupérer le bail depuis la DB
  ↓
Convertir en JSON pour comparaison
```

### Étape 2: Parsing du Bail Principal
```
Texte du bail
  ↓
LLM Parsing (lease_parser_service)
  ↓
ParsedLease avec confiance
```

### Étape 3: Traitement des Annexes
```
Pour chaque annexe:
  ↓
Détection du type (inventory, energy, financial, etc.)
  ↓
Extraction spécialisée selon le type
  ↓
AnnexInfo avec données extraites
```

### Étape 4: Résolution d'Entités
```
Données extraites
  ↓
Recherche dans les entités existantes
  ↓
Calcul de scores de similarité
  ↓
Résolution si score > seuil
```

### Étape 5: Détection de Conflits
```
Si bail existant:
  ↓
Comparer chaque champ
  ↓
Détecter les différences significatives
  ↓
Créer ConflictInfo avec recommandation
```

### Étape 6: Merge Intelligent
```
Données existantes + Nouvelles données
  ↓
Ajouter nouveaux champs
  ↓
Préserver champs existants (sauf si prefer_new=True)
  ↓
Tracker new_fields et updated_fields
```

### Étape 7: Liens Annexes
```
Pour chaque champ enrichi par une annexe:
  ↓
Créer lien field -> [annex_ids]
  ↓
Traçabilité de la source des données
```

---

## Gestion des Conflits

### Structure ConflictInfo
```python
{
  "field": "monthly_rent",
  "existing_value": 1200.0,
  "new_value": 1250.0,
  "existing_source": "existing_database",
  "new_source": "annex_quittance",
  "confidence": 0.8,
  "recommendation": "new"  # ou "review"
}
```

### Règles de Recommandation
- **confidence > 0.7** → `"new"` (accepter la nouvelle valeur)
- **confidence ≤ 0.7** → `"review"` (révision manuelle requise)

### Calcul de Confiance
```python
# Base selon la source
confidence = 0.8 if "annex" in source else 0.6

# Ajustement pour les chaînes
if isinstance(value, str):
    similarity = calculate_similarity(existing, new)
    if similarity > 0.9:
        # Pas un vrai conflit
        continue
    confidence *= (1 - similarity)
```

---

## Logging et Debug

### Niveaux de Logging

**Backend:**
```python
logger.info("🚀 [ENRICHMENT] Starting lease enrichment")
logger.info("🔍 [ENRICHMENT] Step 1: Entity resolution")
logger.info("✅ [ENRICHMENT] Entities resolved: {entities}")
logger.warning("⚠️ [ENRICHMENT] Conflict detected on field 'rent'")
logger.error("❌ [ENRICHMENT] Error in enrichment: {error}")
```

**Fichiers de log:**
- Console: stdout
- Fichier: `/tmp/entity_matching.log`

### Debug Info Retourné
```json
{
  "has_existing_lease": true,
  "annexes_processed": 2,
  "entities_resolved": 3,
  "conflicts_found": 1,
  "new_fields_count": 5,
  "updated_fields_count": 2,
  "parsing_confidence": 0.85
}
```

---

## Exemples d'Utilisation

### Exemple 1: Nouveau Bail avec Annexes

**Request:**
```python
{
  "lease_text": "CONTRAT DE BAIL...",
  "existing_lease_id": null,
  "annexes": [
    {
      "id": "edl_entree",
      "text": "ÉTAT DES LIEUX D'ENTRÉE...",
      "filename": "etat_des_lieux_entree.pdf"
    },
    {
      "id": "dpe",
      "text": "DIAGNOSTIC DE PERFORMANCE ÉNERGÉTIQUE...",
      "filename": "dpe_2024.pdf"
    }
  ]
}
```

**Résultat:**
- ✅ Bail parsé avec LLM
- ✅ 2 annexes traitées (inventory + energy)
- ✅ Entités résolues: property_id, landlord_id, tenant_id
- ✅ Données enrichies avec DPE et état des lieux
- ✅ Aucun conflit (nouveau bail)

### Exemple 2: Enrichissement de Bail Existant

**Request:**
```python
{
  "lease_text": "AVENANT AU BAIL...",
  "existing_lease_id": "lease-uuid-123",
  "annexes": [
    {
      "id": "quittance_jan",
      "text": "QUITTANCE DE LOYER JANVIER 2024...",
      "filename": "quittance_01_2024.pdf"
    }
  ]
}
```

**Résultat:**
- ✅ Bail existant chargé
- ✅ Avenant parsé
- ✅ Quittance traitée (financial)
- ⚠️ Conflit détecté: loyer 1200€ → 1250€
- ✅ Recommandation: accepter nouvelle valeur (confiance 0.85)
- ✅ Champs enrichis: payment_history

### Exemple 3: Détection de Doublons

**Scénario:**
- Propriété "123 Rue de la Paix, 75001 Paris" existe déjà
- Nouveau bail pour "123 rue de la paix 75001"

**Résultat:**
- ✅ Matching détecté (score: 0.92)
- ✅ Réutilisation de property_id existant
- ✅ Pas de duplication
- ✅ Lien créé entre bail et propriété existante

---

## Bonnes Pratiques

### 1. Toujours Fournir les Annexes
Les annexes enrichissent significativement les données extraites:
- États des lieux → inventaire détaillé
- DPE → classes énergétiques précises
- Quittances → historique de paiements

### 2. Gérer les Conflits
```python
# Examiner les conflits retournés
for conflict in response["data"]["conflicts"]:
    if conflict["recommendation"] == "review":
        # Révision manuelle nécessaire
        manual_review_required(conflict)
    else:
        # Accepter automatiquement
        accept_new_value(conflict)
```

### 3. Utiliser les Entités Résolues
```python
resolved = response["data"]["resolved_entities"]

if "property" in resolved:
    # Utiliser property_id existant
    property_id = resolved["property"]
else:
    # Créer nouvelle propriété
    property_id = create_new_property(data)
```

### 4. Tracer les Sources
```python
annex_links = response["data"]["annex_links"]

# Savoir d'où vient chaque donnée
if "energy_class" in annex_links:
    source_annexes = annex_links["energy_class"]
    # ["annex_dpe"]
```

---

## Performances et Optimisations

### Temps de Traitement Estimés
- Parsing LLM: ~5-10s
- Résolution d'entités: ~1-2s
- Traitement annexe: ~3-5s par annexe
- **Total:** ~10-30s selon complexité

### Optimisations Possibles
1. **Cache des entités** - Réduire requêtes DB
2. **Parsing parallèle** - Traiter annexes en parallèle
3. **Indexation** - Index sur adresses, noms pour matching rapide
4. **Batch processing** - Traiter plusieurs baux d'un coup

---

## Limitations Connues

1. **Similarité de noms** - Peut confondre "Jean Dupont" et "Jean Dupond"
2. **Adresses variantes** - "123 Rue de la Paix" vs "123 r. de la Paix"
3. **Annexes non-structurées** - Extraction moins précise
4. **Confiance LLM** - Dépend de la qualité du texte source

---

## Évolutions Futures

### Court Terme
- [ ] Support de plus de types d'annexes
- [ ] Amélioration des algorithmes de matching
- [ ] Interface de résolution de conflits

### Moyen Terme
- [ ] Machine Learning pour le matching
- [ ] Détection automatique de fraudes
- [ ] Validation croisée entre annexes

### Long Terme
- [ ] Système de suggestions intelligentes
- [ ] Apprentissage des patterns utilisateur
- [ ] Intégration avec services externes (cadastre, etc.)

---

## Support et Debug

### En cas de problème

1. **Vérifier les logs:**
```bash
tail -f /tmp/entity_matching.log
```

2. **Utiliser l'endpoint de debug:**
```bash
GET /api/v1/lease-parsing/debug/entities
```

3. **Tester le matching:**
```bash
POST /api/v1/lease-parsing/test-matching
{
  "property_address": "123 Rue de la Paix",
  "property_zip": "75001"
}
```

4. **Examiner debug_info dans la réponse:**
```json
{
  "debug_info": {
    "has_existing_lease": true,
    "entities_resolved": 2,
    "conflicts_found": 1,
    ...
  }
}
```

---

## Conclusion

Ce système d'enrichissement de baux offre:
- ✅ **Résolution intelligente** d'entités existantes
- ✅ **Traitement avancé** des annexes
- ✅ **Détection automatique** de conflits
- ✅ **Merge intelligent** sans perte de données
- ✅ **Traçabilité complète** des sources
- ✅ **Debug détaillé** à chaque étape

Il permet d'éviter les doublons, d'enrichir progressivement les données, et de maintenir la cohérence de la base de données tout en maximisant l'extraction d'informations des documents.
